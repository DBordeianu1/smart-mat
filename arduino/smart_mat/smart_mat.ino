// Smart Mat – ESP32 Prototype 2
//
// Pressure sensors:
//   Sensor 1 -> GPIO 34 -> Yellow
//   Sensor 2 -> GPIO 35 -> Red
//   Sensor 3 -> GPIO 33 -> Green
//   Sensor 4 -> GPIO 32 -> Blue
//
// Outputs:
//   WS2812 LED strip DIN -> GPIO 18
//   Speaker amplifier IN -> GPIO 25
//   Treat mechanism      -> GPIO 27
//
// secrets.h must contain:
//
// const char *WIFI_SSID = "your wifi name";
// const char *WIFI_PASSWORD = "your wifi password";

#include <WiFi.h>
#include <ESPmDNS.h>
#include <WebSocketsServer.h>
#include <Adafruit_NeoPixel.h>
#include "secrets.h"

// --------------------------------------------------
// Configuration
// --------------------------------------------------

const char MAT_ID[] = "PU-2101";
const char HOSTNAME[] = "smartmat";

const int LED_PIN = 18;

// Keep this equal to the number that currently lights
// your entire LED strip.
const int LED_COUNT = 300;

const int SPEAKER_PIN = 25;
const int TREAT_PIN = 27;

const int SENSOR_COUNT = 4;

const int PRESSURE_PINS[SENSOR_COUNT] = {
  34, // Sensor 1
  35, // Sensor 2
  33, // Sensor 3
  32  // Sensor 4
};

// Change these only if the Serial Monitor readings require it.
const int PRESSURE_ON_THRESHOLD = 900;
const int PRESSURE_OFF_THRESHOLD = 600;

const unsigned long PRESSURE_DEBOUNCE_MS = 80;

Adafruit_NeoPixel strip(
  LED_COUNT,
  LED_PIN,
  NEO_GRB + NEO_KHZ800
);

WebSocketsServer webSocket(8080);

// --------------------------------------------------
// State
// --------------------------------------------------

bool lightsOn = false;
bool calmOn = false;

int brightness = 80;

// Volume remains unchanged.
int volume = 60;

bool sensorPressed[SENSOR_COUNT] = {
  false,
  false,
  false,
  false
};

bool sensorCandidate[SENSOR_COUNT] = {
  false,
  false,
  false,
  false
};

unsigned long sensorCandidateSince[SENSOR_COUNT] = {
  0,
  0,
  0,
  0
};

// 0 = no sensor
// 1–4 = active pressure sensor
int activeSensor = 0;

// --------------------------------------------------
// Speaker
// --------------------------------------------------

void stopSpeaker() {
  // Keep the DAC silent while no sound is playing.
  // This helps reduce idle static from the amplifier.
  dacWrite(SPEAKER_PIN, 0);
}

void playToneWithVolume(int frequency, int durationMs) {
  if (volume <= 0 || frequency <= 0 || durationMs <= 0) {
    stopSpeaker();
    return;
  }

  int outputLevel = map(volume, 0, 100, 0, 255);
  outputLevel = constrain(outputLevel, 0, 255);

  unsigned long halfPeriodUs = 500000UL / frequency;
  unsigned long startTime = millis();

  while (millis() - startTime < (unsigned long)durationMs) {
    dacWrite(SPEAKER_PIN, outputLevel);
    delayMicroseconds(halfPeriodUs);

    dacWrite(SPEAKER_PIN, 0);
    delayMicroseconds(halfPeriodUs);
  }

  stopSpeaker();
}

// Sensor 1: gentle rising chime.
void playSensor1Sound() {
  playToneWithVolume(600, 120);
  delay(40);
  playToneWithVolume(800, 160);
}

// Sensor 2: friendly double beep.
void playSensor2Sound() {
  playToneWithVolume(700, 140);
  delay(90);
  playToneWithVolume(700, 140);
}

// Sensor 3: low-high-low pattern.
void playSensor3Sound() {
  playToneWithVolume(550, 100);
  delay(40);
  playToneWithVolume(750, 130);
  delay(40);
  playToneWithVolume(550, 100);
}

// Sensor 4: three short beeps.
void playSensor4Sound() {
  playToneWithVolume(650, 90);
  delay(60);
  playToneWithVolume(650, 90);
  delay(60);
  playToneWithVolume(650, 90);
}

void playSensorSound(int sensorNumber) {
  switch (sensorNumber) {
    case 1:
      playSensor1Sound();
      break;

    case 2:
      playSensor2Sound();
      break;

    case 3:
      playSensor3Sound();
      break;

    case 4:
      playSensor4Sound();
      break;
  }
}

// --------------------------------------------------
// LEDs
// --------------------------------------------------

void setStripColor(
  uint8_t red,
  uint8_t green,
  uint8_t blue
) {
  int adjustedRed =
    (red * brightness) / 100;

  int adjustedGreen =
    (green * brightness) / 100;

  int adjustedBlue =
    (blue * brightness) / 100;

  uint32_t color = strip.Color(
    adjustedRed,
    adjustedGreen,
    adjustedBlue
  );

  for (int i = 0; i < LED_COUNT; i++) {
    strip.setPixelColor(i, color);
  }

  strip.show();
}

void turnLightsOff() {
  strip.clear();
  strip.show();
}

void showNormalLights() {
  if (!lightsOn && !calmOn) {
    turnLightsOff();
    return;
  }

  if (calmOn) {
    // Soft warm light.
    setStripColor(80, 45, 5);
  } else {
    // Normal warm-yellow light.
    setStripColor(255, 170, 25);
  }
}

void showSensorColor(int sensorNumber) {
  switch (sensorNumber) {
    case 1:
      // Sensor 1: yellow.
      setStripColor(255, 170, 20);
      break;

    case 2:
      // Sensor 2: red.
      setStripColor(255, 0, 0);
      break;

    case 3:
      // Sensor 3: green.
      setStripColor(0, 255, 40);
      break;

    case 4:
      // Sensor 4: blue.
      setStripColor(0, 70, 255);
      break;

    default:
      showNormalLights();
      break;
  }
}

// --------------------------------------------------
// Pressure sensors
// --------------------------------------------------

bool updateDebouncedSensor(
  int rawValue,
  bool currentState,
  bool &candidateState,
  unsigned long &candidateSince
) {
  bool requestedState = currentState;

  if (
    !currentState &&
    rawValue >= PRESSURE_ON_THRESHOLD
  ) {
    requestedState = true;
  } else if (
    currentState &&
    rawValue <= PRESSURE_OFF_THRESHOLD
  ) {
    requestedState = false;
  }

  if (requestedState != candidateState) {
    candidateState = requestedState;
    candidateSince = millis();
  }

  if (
    candidateState != currentState &&
    millis() - candidateSince >= PRESSURE_DEBOUNCE_MS
  ) {
    return candidateState;
  }

  return currentState;
}

void reportPressureState() {
  for (int i = 0; i < SENSOR_COUNT; i++) {
    String message =
      String("PAD") +
      String(i + 1) +
      ":" +
      String(sensorPressed[i] ? 1 : 0);

    webSocket.broadcastTXT(message);
  }

  webSocket.broadcastTXT(
    String("PLAY:") +
    String(activeSensor != 0 ? 1 : 0)
  );

  webSocket.broadcastTXT(
    String("ACTIVE:") +
    String(activeSensor)
  );
}

void printSensorChange(
  int sensorIndex,
  int rawValue
) {
  Serial.print("Sensor ");
  Serial.print(sensorIndex + 1);
  Serial.print(" on GPIO ");
  Serial.print(PRESSURE_PINS[sensorIndex]);
  Serial.print(": ");
  Serial.print(rawValue);

  if (sensorPressed[sensorIndex]) {
    Serial.println(" PRESSED");
  } else {
    Serial.println(" released");
  }
}

void updatePressureSensors() {
  bool stateChanged = false;

  for (int i = 0; i < SENSOR_COUNT; i++) {
    int rawValue = analogRead(PRESSURE_PINS[i]);
    bool oldState = sensorPressed[i];

    sensorPressed[i] = updateDebouncedSensor(
      rawValue,
      sensorPressed[i],
      sensorCandidate[i],
      sensorCandidateSince[i]
    );

    if (sensorPressed[i] != oldState) {
      stateChanged = true;
      printSensorChange(i, rawValue);
    }
  }

  if (!stateChanged) {
    return;
  }

  int newActiveSensor = 0;

  // Check from sensor 4 down to sensor 1.
  // The highest-numbered pressed sensor has priority.
  for (int i = SENSOR_COUNT - 1; i >= 0; i--) {
    if (sensorPressed[i]) {
      newActiveSensor = i + 1;
      break;
    }
  }

  bool activeSensorChanged =
    newActiveSensor != activeSensor;

  activeSensor = newActiveSensor;

  if (activeSensorChanged) {
    if (activeSensor == 0) {
      Serial.println("All pressure sensors released.");
      showNormalLights();
    } else {
      Serial.print("Active pressure sensor: ");
      Serial.println(activeSensor);

      showSensorColor(activeSensor);
      playSensorSound(activeSensor);
    }
  }

  reportPressureState();
}

// --------------------------------------------------
// Treat mechanism
// --------------------------------------------------

void releaseTreat() {
  digitalWrite(TREAT_PIN, HIGH);
  delay(300);
  digitalWrite(TREAT_PIN, LOW);
}

// --------------------------------------------------
// WebSocket status
// --------------------------------------------------

void reportStatus(uint8_t clientNumber) {
  webSocket.sendTXT(
    clientNumber,
    String("ID:") + MAT_ID
  );

  webSocket.sendTXT(
    clientNumber,
    String("VOL:") + String(volume)
  );

  webSocket.sendTXT(
    clientNumber,
    String("PLAY:") +
    String(activeSensor != 0 ? 1 : 0)
  );

  webSocket.sendTXT(
    clientNumber,
    String("ACTIVE:") +
    String(activeSensor)
  );

  for (int i = 0; i < SENSOR_COUNT; i++) {
    String message =
      String("PAD") +
      String(i + 1) +
      ":" +
      String(sensorPressed[i] ? 1 : 0);

    webSocket.sendTXT(clientNumber, message);
  }
}

// --------------------------------------------------
// WebSocket commands
// --------------------------------------------------

void handleCommand(
  uint8_t clientNumber,
  String command
) {
  command.trim();

  if (command.length() == 0) {
    return;
  }

  Serial.print("WebSocket command: ");
  Serial.println(command);

  char commandType = command.charAt(0);

  switch (commandType) {
    case 'L':
      lightsOn =
        command.length() > 1 &&
        command.charAt(1) == '1';

      if (activeSensor == 0) {
        showNormalLights();
      }
      break;

    case 'C':
      calmOn =
        command.length() > 1 &&
        command.charAt(1) == '1';

      if (activeSensor == 0) {
        showNormalLights();
      }
      break;

    case 'S':
      playSensor1Sound();
      break;

    case 'W':
      playSensor2Sound();
      break;

    case 'T':
      releaseTreat();
      break;

    case 'X':
      lightsOn = false;
      calmOn = false;
      stopSpeaker();

      if (activeSensor == 0) {
        turnLightsOff();
      }
      break;

    case 'V':
      if (command.length() > 1) {
        volume = constrain(
          command.substring(1).toInt(),
          0,
          100
        );

        webSocket.broadcastTXT(
          String("VOL:") + String(volume)
        );
      }
      break;

    case 'B':
      if (command.length() > 1) {
        brightness = constrain(
          command.substring(1).toInt(),
          0,
          100
        );

        if (activeSensor != 0) {
          showSensorColor(activeSensor);
        } else {
          showNormalLights();
        }
      }
      break;

    case '?':
      reportStatus(clientNumber);
      break;
  }
}

void webSocketEvent(
  uint8_t clientNumber,
  WStype_t type,
  uint8_t *payload,
  size_t length
) {
  switch (type) {
    case WStype_CONNECTED: {
      IPAddress clientIP =
        webSocket.remoteIP(clientNumber);

      Serial.print("Website connected from ");
      Serial.println(clientIP);

      reportStatus(clientNumber);
      break;
    }

    case WStype_DISCONNECTED:
      Serial.println("Website disconnected.");
      break;

    case WStype_TEXT: {
      String command;

      for (size_t i = 0; i < length; i++) {
        command += (char)payload[i];
      }

      handleCommand(clientNumber, command);
      break;
    }

    default:
      break;
  }
}

// --------------------------------------------------
// Wi-Fi
// --------------------------------------------------

void connectToWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.setHostname(HOSTNAME);

  Serial.print("Connecting to \"");
  Serial.print(WIFI_SSID);
  Serial.println("\"");

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("Wi-Fi connection successful!");

  Serial.print("SSID: ");
  Serial.println(WiFi.SSID());

  Serial.print("Signal: ");
  Serial.print(WiFi.RSSI());
  Serial.println(" dBm");

  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  if (MDNS.begin(HOSTNAME)) {
    MDNS.addService("ws", "tcp", 8080);

    Serial.print("Mat hostname: ");
    Serial.print(HOSTNAME);
    Serial.println(".local");

    Serial.print(
      "Permanent WebSocket name: ws://"
    );
    Serial.print(HOSTNAME);
    Serial.println(".local:8080");
  } else {
    Serial.println("Could not start mDNS.");
  }
}

// --------------------------------------------------
// Setup
// --------------------------------------------------

void setup() {
  Serial.begin(115200);
  delay(500);

  pinMode(TREAT_PIN, OUTPUT);
  digitalWrite(TREAT_PIN, LOW);

  for (int i = 0; i < SENSOR_COUNT; i++) {
    pinMode(PRESSURE_PINS[i], INPUT);
  }

  analogReadResolution(12);

  strip.begin();
  strip.clear();
  strip.show();

  stopSpeaker();

  connectToWiFi();

  webSocket.begin();
  webSocket.onEvent(webSocketEvent);

  Serial.println(
    "WebSocket server started on port 8080."
  );

  Serial.println("Pressure sensor assignments:");
  Serial.println("Sensor 1: GPIO 34, yellow");
  Serial.println("Sensor 2: GPIO 35, red");
  Serial.println("Sensor 3: GPIO 33, green");
  Serial.println("Sensor 4: GPIO 32, blue");
  Serial.println("Smart Mat is ready.");
}

// --------------------------------------------------
// Main loop
// --------------------------------------------------

void loop() {
  webSocket.loop();
  updatePressureSensors();

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println(
      "Wi-Fi disconnected. Reconnecting..."
    );

    WiFi.disconnect();
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    delay(1000);
  }

  delay(5);
}