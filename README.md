# Omni Power Flow Card

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Tarjeta personalizada para **Home Assistant** que visualiza el flujo de energía en tiempo real con soporte dinámico para múltiples dispositivos (hasta 8 o más). Inspirada en la tarjeta nativa de Energía y en `power-flow-card-plus`, pero con una arquitectura completamente nueva.

![Preview](https://via.placeholder.com/800x400/1c1c1c/00bcd4?text=Omni+Power+Flow+Card+Preview)

## ✨ Características

- **🔌 Dispositivos dinámicos**: Configura un array `devices[]` sin límite rígido.
- **📐 Layout inteligente**: Distribución automática en arco semicircular según cantidad de dispositivos.
- **⚡ Animaciones SVG nativas**: Velocidad de flujo proporcional a la potencia (W/kW).
- **🔋 Soporte batería**: Incluye porcentaje de carga (SOC).
- **🎨 Temas compatibles**: Respeta variables CSS de Home Assistant.
- **📦 Sin dependencias**: Solo requiere `lit` (ya incluido en HA).

## 📥 Instalación

### HACS (Recomendado)

1. Ve a **HACS → Frontend → Menú (⋮) → Repositorios personalizados**
2. Añade la URL de este repositorio y selecciona categoría **Lovelace**
3. Busca "Omni Power Flow Card" e instálalo
4. Añade el recurso en **Configuración → Panel de control → Recursos**:
   ```
   /hacsfiles/omni-power-flow-card/omni-power-flow-card.js
   ```

### Manual

1. Descarga `omni-power-flow-card.js` desde la última [Release](https://github.com/tu-usuario/omni-power-flow-card/releases)
2. Copia el archivo a `<config>/www/omni-power-flow-card/`
3. Ve a **Configuración → Panel de control → Recursos → Añadir recurso**
4. Introduce la URL:
   ```
   /local/omni-power-flow-card/omni-power-flow-card.js
   ```
5. Recarga la interfaz (Ctrl+Shift+R)

## ⚙️ Configuración

### YAML

```yaml
type: custom:omni-power-flow-card
title: Mi Energía
grid:
  entity: sensor.grid_consumption_power
  name: Red Eléctrica
  color: "#ff9800"
  invert_state: false
solar:
  entity: sensor.solar_production_power
  name: Solar
  color: "#4caf50"
battery:
  entity: sensor.battery_power
  name: Batería
  color: "#2196f3"
  state_of_charge: sensor.battery_state_of_charge
  invert_state: true
home:
  entity: sensor.home_power
  name: Casa
  color: "#00bcd4"
devices:
  - entity_id: sensor.hvac_power
    name: Aire Acond.
    icon: mdi:air-conditioner
    color: "#e91e63"
  - entity_id: sensor.water_heater_power
    name: Termo
    icon: mdi:water-boiler
    color: "#ff5722"
  - entity_id: sensor.ev_charger_power
    name: Coche EV
    icon: mdi:car-electric
    color: "#673ab7"
  - entity_id: sensor.kitchen_power
    name: Cocina
    icon: mdi:fridge
    color: "#795548"
  - entity_id: sensor.living_room_power
    name: Salón
    icon: mdi:television
    color: "#607d8b"
  - entity_id: sensor.office_power
    name: Oficina
    icon: mdi:desktop-classic
    color: "#3f51b5"
  - entity_id: sensor.laundry_power
    name: Lavandería
    icon: mdi:washing-machine
    color: "#009688"
  - entity_id: sensor.pool_pump_power
    name: Piscina
    icon: mdi:pump
    color: "#03a9f4"
show_watts: false
animation_multiplier: 1.0
layout:
  radius: 190
```

### Editor Visual (UI)

Si instalas el editor asociado (próximamente), podrás configurar todo desde la interfaz visual de Lovelace.

## 📐 Opciones de configuración

| Opción | Tipo | Requerido | Descripción |
|--------|------|-----------|-------------|
| `type` | string | ✅ | `custom:omni-power-flow-card` |
| `title` | string | ❌ | Título de la tarjeta |
| `grid` | object | ❌ | Configuración de red eléctrica |
| `solar` | object | ❌ | Configuración de paneles solares |
| `battery` | object | ❌ | Configuración de batería |
| `home` | object | ❌ | Configuración del nodo central |
| `devices` | array | ❌ | Array dinámico de dispositivos |
| `show_watts` | boolean | ❌ | Mostrar valores en W en vez de kW |
| `animation_multiplier` | number | ❌ | Multiplicador de velocidad de animación |
| `layout.radius` | number | ❌ | Radio del arco de dispositivos (px) |

### Estructura de `devices[]`

Cada objeto del array acepta:

| Opción | Tipo | Requerido | Descripción |
|--------|------|-----------|-------------|
| `entity_id` | string | ✅ | Sensor de potencia (W) |
| `name` | string | ✅ | Nombre visible |
| `icon` | string | ❌ | Icono MDI (ej: `mdi:flash`) |
| `color` | string | ❌ | Color HEX del nodo y flujo |

## 🧪 Desarrollo

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/omni-power-flow-card.git
cd omni-power-flow-card

# Instalar dependencias (para futuras mejoras con build)
npm install

# La tarjeta es 100% standalone, no requiere compilación para funcionar.
# Para desarrollo, copia omni-power-flow-card.js a tu instancia de HA
# en config/www/ y recarga el navegador.
```

## 🐛 Solución de problemas

**La tarjeta no aparece en el selector de tarjetas:**
- Asegúrate de que el recurso JS está cargado en **Panel de control → Recursos**
- Limpia la caché del navegador (Ctrl+Shift+R)

**Los iconos no se ven:**
- La tarjeta usa emojis como fallback. Para iconos MDI reales, asegúrate de que Home Assistant los carga globalmente.

**Las animaciones no funcionan:**
- Verifica que los sensores devuelven valores numéricos en vatios (W).
- Si el valor es menor a 5W, la animación se oculta automáticamente.

## 📄 Licencia

MIT © 2026
