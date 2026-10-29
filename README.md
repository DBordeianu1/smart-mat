# Smart Mat App

An interactive mat companion application with WiFi connectivity. Control and monitor your smart mat through a responsive web interface.

This app enables two-way communication with a smart mat device via WiFi, allowing real-time control and data reporting. Accessibility is central to the design, which is universal and works across all screen sizes.

---

## The App

Three screens, switched with the tab bar at the bottom. Each one adapts to desktop, phone and small phone widths.

- **Home:** the mat's control plane. Lights, Sound, Treat, Calm mode, Whistle and All off.
- **Settings:** connect or disconnect the mat, set sound volume and light brightness, and open app settings (daily play goal, clear play data).
- **Analytics:** connected devices, battery level and hours played today. This data is saved only in the browser on this device.

**Demo Mode** (in Settings) lets you try every screen without the mat, with sample analytics data.

---

## Mat Protocol

The app communicates with the smart mat via WiFi using WebSocket. Each message is one line of text.

| App → mat | Meaning |
| --- | --- |
| `L1` / `L0` | Lights on / off |
| `C1` / `C0` | Calm mode on / off |
| `S` | Play a friendly sound |
| `W` | Play recall whistle |
| `T` | Release one treat |
| `X` | All off |
| `V<0-100>` | Sound volume |
| `B<0-100>` | Light brightness |
| `?` | Report status |

| Mat → app | Meaning |
| --- | --- |
| `ID:<id>` | Mat ID shown in Settings |
| `BAT:<0-100>` | Battery level |
| `VOL:<0-100>` | Volume changed with the device buttons |
| `PLAY:1` / `PLAY:0` | User interaction with mat, used for hours played |

## Wiring (Arduino Uno)

| Pin | Part |
| --- | --- |
| 9 (PWM) | Mat lights (LED through a resistor) |
| 8 | Piezo buzzer |
| 7 | Treat dispenser, or an LED stand-in |
| 2 / 3 | Volume down / up buttons to GND |
| 4 | Pressure pad or switch to GND |
| A0 | Battery through a voltage divider (set `HAS_BATTERY = true` in the sketch) |

---

## Getting Started

1. Ensure your smart mat is running and connected to the same WiFi network.
2. Install dependencies and start the app:
   ```bash
   npm install
   npm run dev
   ```
3. Open the app at http://localhost:5173/ in your browser, click **Connect via WiFi**, and enter the mat's IP address.

---

<div align="center">
    Built as part of <b>GNG2101 (Product Development for Engineers and Computer Scientists)</b>, Fall 2026
</div>
