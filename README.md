<p align="center">
  <img src="frontend/public/detailed-logo.png" alt="The Paw Unit logo" width="250">
</p>

<h1 align="center">The Software Subteam presents Your Smart Mat</h1>

> Project proposal: [MakerRepo](https://makerepo.com/project_proposals/620.interactive-dog-mat)

This term, we are building a smart mat and companion app for a client, improving communication between dogs and their owners. Accessibility is central to the project, but the design is universal.

This web application enables two-way communication with a smart mat device via Wi-Fi, allowing real-time control and data reporting.

---

## The App

Four screens, switched with the tab bar at the bottom. Each one adapts to desktop, phone and small phone widths.

- **Home:** the mat's control plane
- **Settings:** handles connectivity as well as lights and sounds. Includes a button, which can open the device's settings (Android Chrome only; other browsers show a notice right away)
- **Analytics:** displays connected devices, battery level and hours played on a given day
- **Profile:** account information of the user

**Demo Mode** (in Settings) lets you try every screen without the mat.

---

## Mat Protocol

The app communicates with the smart mat via Wi-Fi using WebSockets. Each message is one line of text.

| App -> mat | Meaning |
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

| Mat -> app | Meaning |
| --- | --- |
| `ID:<id>` | Mat ID shown in Settings |
| `VOL:<0-100>` | Current volume (sent on connect and after a `V` command) |
| `PLAY:1` / `PLAY:0` | A pressure pad is pressed / none pressed, used for hours played |
| `PAD<1-4>:1` / `PAD<1-4>:0` | Pressure pad 1 to 4 pressed / released |
| `ACTIVE:<0-4>` | Which pad is active (the highest-numbered pressed pad), 0 for none |

The app also understands `BAT:<0-100>` (battery level), but the current firmware doesn't send it.

The mat listens on port 8080 and announces itself as `smartmat.local`.

## Wiring (ESP32)

| Pin | Part |
| --- | --- |
| GPIO 18 | WS2812 LED strip (data in) |
| GPIO 25 | Speaker amplifier (in) |
| GPIO 27 | Treat mechanism |
| GPIO 34 | Pressure pad 1 (yellow) |
| GPIO 35 | Pressure pad 2 (red) |
| GPIO 33 | Pressure pad 3 (green) |
| GPIO 32 | Pressure pad 4 (blue) |

---

## Getting Started

1. Ensure your smart mat is running and connected to the same Wi-Fi network.
2. Navigate to the frontend subfolder:
   ```
   cd frontend
   ```

3. (Only do this once) Install dependencies and start the app:
   ```
   npm install
   ```

4. Run the application:
   ```
   npm run dev
   ```
5. Open the app at http://localhost:5173/ in your browser, click **Connect via Wi-Fi**, and enter the mat's IP address.

---

<div align="center">
    Built as part of <b>GNG2101 (Product Development for Engineers and Computer Scientists)</b>, Fall 2026
</div>