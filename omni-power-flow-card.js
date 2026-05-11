/**
 * Omni Power Flow Card
 * Custom card for Home Assistant with dynamic multi-device support.
 * Version: 1.0.0
 * License: MIT
 */

import { LitElement, html, svg, css } from "lit";

// ==========================================
// CONFIGURACIÓN Y CONSTANTES
// ==========================================
const VIEWBOX = { W: 800, H: 500 };
const CENTER = { X: 280, Y: 250 };
const MAIN_RADIUS = 28;

const MAIN_NODES = {
  grid: { x: 80, y: 250 },
  solar: { x: 280, y: 80 },
  battery: { x: 280, y: 420 },
  home: { x: CENTER.X, y: CENTER.Y },
};

// ==========================================
// UTILIDADES
// ==========================================
function parseWatts(state) {
  if (!state) return 0;
  const val = parseFloat(state.state);
  return isNaN(val) ? 0 : val;
}

function formatPower(watts, showWatts = false) {
  if (Math.abs(watts) >= 1000) return `${(watts / 1000).toFixed(2)} kW`;
  return showWatts ? `${Math.round(watts)} W` : `${(watts / 1000).toFixed(2)} kW`;
}

function calculateDevicePositions(count, radius = 180, center = CENTER) {
  if (count === 0) return [];
  const maxAngle = count <= 3 ? 40 : count <= 6 ? 70 : 110;
  const minAngle = -maxAngle;
  const step = count > 1 ? (maxAngle - minAngle) / (count - 1) : 0;
  const positions = [];
  for (let i = 0; i < count; i++) {
    const angleDeg = count === 1 ? 0 : minAngle + step * i;
    const angleRad = (angleDeg * Math.PI) / 180;
    positions.push({
      x: center.X + radius * Math.cos(angleRad),
      y: center.Y + radius * Math.sin(angleRad),
      angle: angleDeg,
    });
  }
  return positions;
}

function generatePath(x1, y1, x2, y2, curvature = 0.5) {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const cpX = midX + (y2 - y1) * curvature * 0.3;
  const cpY = midY - (x2 - x1) * curvature * 0.3;
  return `M ${x1} ${y1} Q ${cpX} ${cpY} ${x2} ${y2}`;
}

function calculateAnimationDuration(watts, multiplier = 1.0) {
  const absW = Math.abs(watts);
  if (absW < 5) return 0;
  const baseMs = 300000 / (absW + 100);
  return Math.max(400, Math.min(8000, baseMs * multiplier));
}

// ==========================================
// CLASE PRINCIPAL
// ==========================================
class OmniPowerFlowCard extends LitElement {
  static get properties() {
    return {
      _config: { state: true },
      _hass: { state: true },
      _nodes: { state: true },
      _paths: { state: true },
    };
  }

  constructor() {
    super();
    this._nodes = [];
    this._paths = [];
  }

  static getConfigElement() {
    return document.createElement("omni-power-flow-card-editor");
  }

  static getStubConfig() {
    return {
      type: "custom:omni-power-flow-card",
      grid: { entity: "sensor.grid_power", name: "Grid", color: "#ff9800" },
      solar: { entity: "sensor.solar_power", name: "Solar", color: "#4caf50" },
      battery: { entity: "sensor.battery_power", name: "Battery", color: "#2196f3" },
      devices: [],
    };
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    this._config = {
      show_watts: false,
      threshold_watts: 0,
      animation_multiplier: 1.0,
      layout: { radius: 180 },
      ...config,
    };
  }

  set hass(hass) {
    const oldHass = this._hass;
    this._hass = hass;
    if (oldHass !== hass) {
      this._computeLayout();
    }
  }

  getCardSize() {
    return 5;
  }

  _computeLayout() {
    if (!this._hass || !this._config) return;

    const hass = this._hass;
    const cfg = this._config;
    const nodes = [];
    const homeEntity = cfg.home?.entity;
    const homeValue = homeEntity ? parseWatts(hass.states[homeEntity]) : 0;

    if (cfg.grid) {
      const val = parseWatts(hass.states[cfg.grid.entity]);
      nodes.push({
        id: "grid",
        type: "main",
        label: cfg.grid.name || "Grid",
        icon: cfg.grid.icon || "mdi:transmission-tower",
        color: cfg.grid.color || "#ff9800",
        entity: cfg.grid.entity,
        value: cfg.grid.invert_state ? -val : val,
        position: MAIN_NODES.grid,
      });
    }
    if (cfg.solar) {
      const val = parseWatts(hass.states[cfg.solar.entity]);
      nodes.push({
        id: "solar",
        type: "main",
        label: cfg.solar.name || "Solar",
        icon: cfg.solar.icon || "mdi:solar-power",
        color: cfg.solar.color || "#4caf50",
        entity: cfg.solar.entity,
        value: val,
        position: MAIN_NODES.solar,
      });
    }
    if (cfg.battery) {
      const val = parseWatts(hass.states[cfg.battery.entity]);
      const soc = cfg.battery.state_of_charge
        ? parseFloat(hass.states[cfg.battery.state_of_charge]?.state || "0")
        : undefined;
      nodes.push({
        id: "battery",
        type: "main",
        label: cfg.battery.name || "Battery",
        icon: cfg.battery.icon || "mdi:battery",
        color: cfg.battery.color || "#2196f3",
        entity: cfg.battery.entity,
        value: cfg.battery.invert_state ? -val : val,
        position: MAIN_NODES.battery,
        soc,
      });
    }
    nodes.push({
      id: "home",
      type: "main",
      label: cfg.home?.name || "Home",
      icon: cfg.home?.icon || "mdi:home",
      color: cfg.home?.color || "#00bcd4",
      entity: cfg.home?.entity || "",
      value: homeValue,
      position: MAIN_NODES.home,
    });

    const devices = cfg.devices || [];
    const devicePositions = calculateDevicePositions(
      devices.length,
      cfg.layout?.radius || 180,
      { X: CENTER.X, Y: CENTER.Y }
    );
    devices.forEach((dev, idx) => {
      const val = parseWatts(hass.states[dev.entity_id]);
      nodes.push({
        id: `device-${idx}`,
        type: "device",
        label: dev.name || `Device ${idx + 1}`,
        icon: dev.icon || "mdi:flash",
        color: dev.color || "#9c27b0",
        entity: dev.entity_id,
        value: val,
        position: devicePositions[idx],
      });
    });

    this._nodes = nodes;
    const homeNode = nodes.find((n) => n.id === "home");
    const newPaths = [];

    ["grid", "solar", "battery"].forEach((key) => {
      const node = nodes.find((n) => n.id === key);
      if (!node) return;
      const dur = calculateAnimationDuration(node.value, cfg.animation_multiplier);
      newPaths.push({
        id: `path-${key}`,
        d: generatePath(
          node.position.x,
          node.position.y,
          homeNode.position.x,
          homeNode.position.y,
          0.4
        ),
        color: node.color,
        duration: dur,
        active: dur > 0,
        reverse: !(node.value > 0),
        watts: node.value,
      });
    });

    devices.forEach((dev, idx) => {
      const node = nodes.find((n) => n.id === `device-${idx}`);
      const dur = calculateAnimationDuration(node.value, cfg.animation_multiplier);
      newPaths.push({
        id: `path-device-${idx}`,
        d: generatePath(
          node.position.x,
          node.position.y,
          homeNode.position.x,
          homeNode.position.y,
          0.25
        ),
        color: node.color,
        duration: dur,
        active: dur > 0,
        reverse: !(node.value > 0),
        watts: node.value,
      });
    });

    this._paths = newPaths;
  }

  render() {
    if (!this._config || !this._hass) {
      return html`<div class="omni-card">Loading...</div>`;
    }

    return html`
      <ha-card class="omni-card">
        ${this._config.title
          ? html`<div class="card-header">${this._config.title}</div>`
          : ""}
        <div class="card-content">
          <svg
            viewBox="0 0 ${VIEWBOX.W} ${VIEWBOX.H}"
            preserveAspectRatio="xMidYMid meet"
            class="omni-svg"
          >
            <defs>
              ${this._paths.map(
                (p) => svg`
                  <path id="${p.id}" d="${p.d}" fill="none" />
                  <filter id="glow-${p.id}">
                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                `
              )}
            </defs>

            ${this._paths.map(
              (p) => svg`
                <use
                  href="#${p.id}"
                  class="connection-line"
                  stroke="${p.color}"
                  stroke-opacity="0.25"
                  stroke-width="3"
                />
              `
            )}

            ${this._paths.map((p) => this._renderFlowAnimation(p))}
            ${this._nodes.map((node) => this._renderNode(node))}
          </svg>
        </div>
      </ha-card>
    `;
  }

  _renderFlowAnimation(p) {
    if (!p.active) return svg``;
    const keyPoints = p.reverse ? "1;0" : "0;1";
    const durSec = (p.duration / 1000).toFixed(2);
    const offsetSec = (p.duration / 2000).toFixed(2);
    return svg`
      <circle r="4" fill="${p.color}" filter="url(#glow-${p.id})">
        <animateMotion
          dur="${durSec}s"
          repeatCount="indefinite"
          keyPoints="${keyPoints}"
          keyTimes="0;1"
          calcMode="linear"
        >
          <mpath href="#${p.id}" />
        </animateMotion>
      </circle>
      <circle r="3" fill="${p.color}" opacity="0.6">
        <animateMotion
          dur="${durSec}s"
          begin="${offsetSec}s"
          repeatCount="indefinite"
          keyPoints="${keyPoints}"
          keyTimes="0;1"
          calcMode="linear"
        >
          <mpath href="#${p.id}" />
        </animateMotion>
      </circle>
    `;
  }

  _renderNode(node) {
    const r = node.type === "main" ? MAIN_RADIUS : 22;
    const isHome = node.id === "home";
    const displayValue = formatPower(node.value, this._config.show_watts);
    return svg`
      <g
        class="node-group"
        transform="translate(${node.position.x}, ${node.position.y})"
      >
        ${isHome
          ? svg`
              <circle
                r="${r + 6}"
                fill="none"
                stroke="${node.color}"
                stroke-opacity="0.15"
                stroke-width="2"
              >
                <animate
                  attributeName="r"
                  values="${r + 6};${r + 12};${r + 6}"
                  dur="3s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="stroke-opacity"
                  values="0.15;0.05;0.15"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </circle>
            `
          : ""}
        <circle
          class="node-circle ${node.type}"
          r="${r}"
          fill="var(--card-background-color, #1c1c1c)"
          stroke="${node.color}"
          stroke-width="3"
        />
        <text
          class="node-icon"
          y="1"
          text-anchor="middle"
          dominant-baseline="middle"
          fill="${node.color}"
          font-size="${node.type === "main" ? "20" : "16"}"
        >
          ${node.icon?.startsWith("mdi:")
            ? this._mdiMap[node.icon] || "⚡"
            : "⚡"}
        </text>
        <text
          class="node-label"
          y="${r + 16}"
          text-anchor="middle"
          fill="var(--primary-text-color, #e0e0e0)"
          font-size="12"
          font-weight="500"
        >
          ${node.label}
        </text>
        <text
          class="node-value"
          y="${r + 30}"
          text-anchor="middle"
          fill="${node.color}"
          font-size="11"
          font-weight="600"
        >
          ${displayValue}
        </text>
        ${node.soc !== undefined
          ? svg`
              <text
                y="${-r - 10}"
                text-anchor="middle"
                fill="${node.color}"
                font-size="11"
                font-weight="bold"
              >
                ${Math.round(node.soc)}%
              </text>
            `
          : ""}
      </g>
    `;
  }

  get _mdiMap() {
    return {
      "mdi:home": "🏠",
      "mdi:solar-power": "☀️",
      "mdi:transmission-tower": "⚡",
      "mdi:battery": "🔋",
      "mdi:battery-charging": "🔌",
      "mdi:flash": "⚡",
      "mdi:lightning-bolt": "⚡",
      "mdi:fridge": "❄️",
      "mdi:washing-machine": "🌀",
      "mdi:air-conditioner": "❄️",
      "mdi:television": "📺",
      "mdi:desktop-classic": "💻",
      "mdi:car-electric": "🚗",
      "mdi:water-boiler": "♨️",
      "mdi:radiator": "🔥",
      "mdi:fan": "🌬️",
      "mdi:router-wireless": "📡",
      "mdi:pump": "💧",
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }
      .omni-card {
        background: var(
          --ha-card-background,
          var(--card-background-color, #1c1c1c)
        );
        border-radius: var(--ha-card-border-radius, 12px);
        box-shadow: var(--ha-card-box-shadow, 0 2px 8px rgba(0, 0, 0, 0.3));
        color: var(--primary-text-color, #e0e0e0);
        overflow: hidden;
      }
      .card-header {
        padding: 16px 16px 0;
        font-size: 18px;
        font-weight: 500;
        color: var(--ha-card-header-color, var(--primary-text-color));
      }
      .card-content {
        padding: 16px;
      }
      .omni-svg {
        width: 100%;
        height: auto;
        display: block;
        overflow: visible;
      }
      .connection-line {
        fill: none;
        stroke-linecap: round;
        transition: stroke-opacity 0.3s ease;
      }
      .node-group {
        cursor: default;
        transition: transform 0.2s ease;
      }
      .node-group:hover {
        transform: scale(1.08);
      }
      .node-circle {
        transition: all 0.3s ease;
      }
      .node-group:hover .node-circle {
        stroke-width: 4px;
        filter: drop-shadow(0 0 6px currentColor);
      }
      .node-icon {
        font-family: "Segoe UI Emoji", "Apple Color Emoji",
          "Noto Color Emoji", sans-serif;
        pointer-events: none;
        text-anchor: middle;
        dominant-baseline: central;
      }
      .node-label,
      .node-value {
        font-family: var(
          --paper-font-body1_-_font-family,
          "Roboto",
          sans-serif
        );
        pointer-events: none;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
      }
      @keyframes nodePulse {
        0%,
        100% {
          stroke-opacity: 1;
        }
        50% {
          stroke-opacity: 0.6;
        }
      }
      .node-circle.main {
        animation: nodePulse 3s ease-in-out infinite;
      }
    `;
  }
}

customElements.define("omni-power-flow-card", OmniPowerFlowCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "omni-power-flow-card",
  name: "Omni Power Flow Card",
  description:
    "Tarjeta de flujo de energía con soporte dinámico para múltiples dispositivos",
  preview: true,
  documentationURL: "https://github.com/tu-usuario/omni-power-flow-card",
});
