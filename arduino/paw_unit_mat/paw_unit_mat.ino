// Paw Unit — Prototype 2
// ESP32 DevKit V1
//
// Hardware:
// - WS2812/NeoPixel strip on GPIO 25
// - Speaker amplifier input on GPIO 26
// - Optional treat mechanism on GPIO 27
// - One FSR pressure sensor on GPIO 34
//
// Required Arduino libraries:
// - WebSockets by Markus Sattler
// - Adafruit NeoPixel

#include <WiFi.h>
#include <ESPmDNS.h>
#include <WebSocketsServer.h>
#include <Adafruit_NeoPixel.h>
#include "secrets.h"

// --------------------------------------------------
// Device configuration
// --------------------------------------------------

const char MAT_ID[] = "PU-2048";
const char MAT_HOSTNAME[] = "pawunit";

const uint16_t WS_PORT = 8080;

// --------------------------------------------------
// Pin configuration
// --------------------------------------------------

const int LED_PIN = 25;
const int SPEAKER_PIN = 26;
const int TREAT_PIN = 27;

const int FSR_PIN = 34;

// Update this if your strip has a different number of LEDs.
const int LED_COUNT = 8;

// --------------------------------------------------
// Pressure configuration
// --------------------------------------------------

// These values will probably need calibration.
//
// Wiring assumption:
//
// 3.3V → FSR → analog pin → 10kΩ resistor → GND
//
// With this wiring, pressure should increase the analog reading.

const int PRESS_ON_THRESHOLD = 900;
const int PRESS_OFF_THRESHOLD = 600;

const unsigned long PRESS_DEBOUNCE_MS = 100;
const unsigned long PRESSURE_PRINT_INTERVAL_MS = 1000;

// Set to false after calibrating the sensors.
const bool PRINT_PRESSURE_VALUES = true;

// --------------------------------------------------
// LED strip
// --------------------------------------------------

Adafruit_NeoPixel strip(
  LED_COUNT,
  LED_PIN,
  NEO_GRB + NEO_KHZ800
);

// --------------------------------------------------
// WebSocket
// --------------------------------------------------

WebSocketsServer webSocket(WS_PORT);

// --------------------------------------------------
// Mat state
// --------------------------------------------------

bool lightsOn = false;
bool calmOn = false;
bool playing = false;

int volume = 60;
int brightness = 80;

unsigned long lastPadMs = 0;
unsigned long lastWifiAttemptMs = 0;
unsigned long lastPressurePrintMs = 0;

// --------------------------------------------------
// Function declarations
// --------------------------------------------------

bool connectWifi();
void startMdns();

void applyLights();
void updatePressureSensor();

void sendLine(uint8_t client, const String &line);
void reportStatus(uint8_t client);
void handleCommand(String command);

void onWifiEvent(
  WiFiEvent_t event,
  WiFiEventInfo_t info
);

void onWebSocketEvent(
  uint8_t client,
  WStype_t type,
  uint8_t *payload,
  size_t length
);

// --------------------------------------------------
// Wi-Fi event handler
// --------------------------------------------------

void onWifiEvent(
  WiFiEvent_t event,
  WiFiEventInfo_t info
) {
  if (event == ARDUINO_EVENT_WIFI_STA_CONNECTED) {
    Serial.println();
    Serial.println(
      "ESP32 connected to the Wi-Fi access point."
    );
  }

  if (event == ARDUINO_EVENT_WIFI_STA_GOT_IP) {
    Serial.println(
      "ESP32 received an IP address."
    );
  }

  if (event == ARDUINO_EVENT_WIFI_STA_DISCONNECTED) {
    Serial.printf(
      "Wi-Fi disconnected. Reason code: %d\n",
      info.wifi_sta_disconnected.reason
    );
  }
}

// --------------------------------------------------
// mDNS
// --------------------------------------------------

void startMdns() {
  MDNS.end();

  if (MDNS.begin(MAT_HOSTNAME)) {
    MDNS.addService(
      "ws",
      "tcp",
      WS_PORT
    );

    Serial.printf(
      "Mat hostname: %s.local\n",
      MAT_HOSTNAME
    );
  } else {
    Serial.println(
      "mDNS failed. Use the IP address as a fallback."
    );
  }
}

// --------------------------------------------------
// Wi-Fi connection
// --------------------------------------------------

bool connectWifi() {
  Serial.printf(
    "Connecting to \"%s\"",
    WIFI_SSID
  );

  WiFi.disconnect();
  delay(300);

  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);

  WiFi.begin(
    WIFI_SSID,
    WIFI_PASSWORD
  );

  unsigned long started = millis();

  while (
    WiFi.status() != WL_CONNECTED &&
    millis() - started < 30000
  ) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println(
      "Wi-Fi connection failed. Retrying later."
    );

    return false;
  }

  Serial.println(
    "Wi-Fi connection successful!"
  );

  startMdns();

  Serial.printf(
    "SSID: %s\n",
    WiFi.SSID().c_str()
  );

  Serial.printf(
    "Signal: %d dBm\n",
    WiFi.RSSI()
  );

  Serial.printf(
    "IP address: %s\n",
    WiFi.localIP().toString().c_str()
  );

  Serial.printf(
    "WebSocket: ws://%s:%u\n",
    WiFi.localIP().toString().c_str(),
    WS_PORT
  );

  Serial.printf(
    "Permanent WebSocket name: ws://%s.local:%u\n",
    MAT_HOSTNAME,
    WS_PORT
  );

  return true;
}

// --------------------------------------------------
// LED functions
// --------------------------------------------------

void applyLights() {
  int level = 0;

  if (lightsOn) {
    level = brightness;
  }

  if (calmOn) {
    level = brightness / 3;
  }

  uint8_t outputLevel = map(
    level,
    0,
    100,
    0,
    255
  );

  for (int i = 0; i < LED_COUNT; i++) {
    uint32_t color;

    if (calmOn) {
      // Dim blue calm-mode color.
      color = strip.Color(
        0,
        outputLevel / 3,
        outputLevel
      );
    } else {
      // Warm yellow normal-light color.
      color = strip.Color(
        outputLevel,
        outputLevel / 2,
        0
      );
    }

    strip.setPixelColor(i, color);
  }

  strip.show();
}

// --------------------------------------------------
// Pressure sensor
// --------------------------------------------------

void updatePressureSensor() {
  int pressure = analogRead(FSR_PIN);

  if (
    PRINT_PRESSURE_VALUES &&
    millis() - lastPressurePrintMs >=
      PRESSURE_PRINT_INTERVAL_MS
  ) {
    lastPressurePrintMs = millis();
    Serial.printf("FSR GPIO 34: %d\n", pressure);
  }

  bool nextPlaying = playing;

  if (
    !playing &&
    pressure >= PRESS_ON_THRESHOLD
  ) {
    nextPlaying = true;
  }

  if (
    playing &&
    pressure <= PRESS_OFF_THRESHOLD
  ) {
    nextPlaying = false;
  }

  if (
    nextPlaying != playing &&
    millis() - lastPadMs >= PRESS_DEBOUNCE_MS
  ) {
    lastPadMs = millis();
    playing = nextPlaying;

    Serial.printf(
      "Pressure state: %s\n",
      playing ? "ON MAT" : "OFF MAT"
    );

    sendLine(
      255,
      "PLAY:" + String(playing ? 1 : 0)
    );
  }
}

// --------------------------------------------------
// WebSocket communication
// --------------------------------------------------

void sendLine(
  uint8_t client,
  const String &line
) {
  String message = line + "\n";

  if (client == 255) {
    webSocket.broadcastTXT(message);
  } else {
    webSocket.sendTXT(
      client,
      message
    );
  }

  Serial.println(line);
}

void reportStatus(uint8_t client) {
  sendLine(
    client,
    "ID:" + String(MAT_ID)
  );

  sendLine(
    client,
    "VOL:" + String(volume)
  );

  sendLine(
    client,
    "PLAY:" + String(playing ? 1 : 0)
  );
}

// --------------------------------------------------
// App commands
// --------------------------------------------------

void handleCommand(String command) {
  command.trim();

  if (command.length() == 0) {
    return;
  }

  char commandType = command[0];

  int value = constrain(
    command.substring(1).toInt(),
    0,
    100
  );

  switch (commandType) {
    // Lights
    case 'L':
      lightsOn =
        command.length() > 1 &&
        command[1] == '1';

      applyLights();
      break;

    // Calm mode
    case 'C':
      calmOn =
        command.length() > 1 &&
        command[1] == '1';

      applyLights();
      break;

    // Friendly sound
    case 'S':
      if (volume > 0) {
        tone(
          SPEAKER_PIN,
          880,
          120
        );

        delay(150);

        tone(
          SPEAKER_PIN,
          1175,
          180
        );
      }
      break;

    // Whistle
    case 'W':
      if (volume > 0) {
        tone(
          SPEAKER_PIN,
          2600,
          400
        );
      }
      break;

    // Treat mechanism
    case 'T':
      digitalWrite(
        TREAT_PIN,
        HIGH
      );

      delay(300);

      digitalWrite(
        TREAT_PIN,
        LOW
      );
      break;

    // All off
    case 'X':
      lightsOn = false;
      calmOn = false;

      noTone(SPEAKER_PIN);
      applyLights();
      break;

    // Volume
    case 'V':
      volume = value;
      break;

    // Brightness
    case 'B':
      brightness = value;
      applyLights();
      break;

    // Status request
    case '?':
      reportStatus(255);
      break;
  }
}

// --------------------------------------------------
// WebSocket event handler
// --------------------------------------------------

void onWebSocketEvent(
  uint8_t client,
  WStype_t type,
  uint8_t *payload,
  size_t length
) {
  if (type == WStype_CONNECTED) {
    Serial.printf(
      "App connected: client %u\n",
      client
    );

    reportStatus(client);
    return;
  }

  if (type == WStype_DISCONNECTED) {
    Serial.printf(
      "App disconnected: client %u\n",
      client
    );

    return;
  }

  if (type != WStype_TEXT) {
    return;
  }

  String message;
  message.reserve(length);

  for (size_t i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  int start = 0;

  while (start < message.length()) {
    int newline = message.indexOf(
      '\n',
      start
    );

    String command;

    if (newline < 0) {
      command = message.substring(start);
    } else {
      command = message.substring(
        start,
        newline
      );
    }

    handleCommand(command);

    if (newline < 0) {
      break;
    }

    start = newline + 1;
  }
}

// --------------------------------------------------
// Arduino setup
// --------------------------------------------------

void setup() {
  Serial.begin(115200);
  delay(2000);

  Serial.println();
  Serial.println(
    "================================"
  );
  Serial.println(
    "Paw Unit Prototype 2 starting"
  );
  Serial.println(
    "================================"
  );

  // LED strip
  strip.begin();
  strip.clear();
  strip.show();

  // Speaker and treat output
  pinMode(
    SPEAKER_PIN,
    OUTPUT
  );

  pinMode(
    TREAT_PIN,
    OUTPUT
  );

  digitalWrite(
    TREAT_PIN,
    LOW
  );

  // Pressure sensor
  pinMode(FSR_PIN, INPUT);

  WiFi.onEvent(onWifiEvent);

  connectWifi();

  webSocket.begin();
  webSocket.onEvent(
    onWebSocketEvent
  );

  Serial.println(
    "WebSocket server started."
  );
}

// --------------------------------------------------
// Arduino loop
// --------------------------------------------------

void loop() {
  webSocket.loop();

  updatePressureSensor();

  if (
    WiFi.status() != WL_CONNECTED &&
    millis() - lastWifiAttemptMs >= 15000
  ) {
    lastWifiAttemptMs = millis();
    connectWifi();
  }

  delay(5);
}
