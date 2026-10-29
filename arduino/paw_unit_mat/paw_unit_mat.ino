// Paw Unit mat firmware – Prototype 2
//
// The web app sends one command per line at 9600 baud:
//   L1 / L0   lights on / off        C1 / C0   calm mode on / off
//   S         play a friendly sound  W         play recall whistle
//   T         release one treat      X         all off
//   V<0-100>  sound volume           B<0-100>  light brightness
//   ?         report status
//
// The mat reports back one line per value:
//   ID:<mat id>   BAT:<0-100>   VOL:<0-100>   PLAY:1 / PLAY:0

const char MAT_ID[] = "PU-2048";

const int LIGHT_PIN = 9;     // PWM pin, so brightness can be dimmed
const int SPEAKER_PIN = 8;   // piezo buzzer
const int TREAT_PIN = 7;     // treat dispenser (or an LED stand-in)
const int VOL_DOWN_PIN = 2;  // push buttons to GND
const int VOL_UP_PIN = 3;
const int PAD_PIN = 4;       // pressure pad / switch to GND, closed while the dog is on the mat

// Set to true once a battery is wired to BATTERY_PIN through a voltage divider
const bool HAS_BATTERY = false;
const int BATTERY_PIN = A0;
const int BATTERY_EMPTY = 600;  // analogRead() value at 0%, calibrate for your battery
const int BATTERY_FULL = 860;   // analogRead() value at 100%

bool lightsOn = false;
bool calmOn = false;
int volume = 60;
int brightness = 80;
bool playing = false;

char line[16];
int lineLength = 0;

unsigned long lastButtonMs = 0;
unsigned long lastPadChangeMs = 0;
unsigned long lastBatteryMs = 0;

void setup() {
  pinMode(LIGHT_PIN, OUTPUT);
  pinMode(SPEAKER_PIN, OUTPUT);
  pinMode(TREAT_PIN, OUTPUT);
  pinMode(VOL_DOWN_PIN, INPUT_PULLUP);
  pinMode(VOL_UP_PIN, INPUT_PULLUP);
  pinMode(PAD_PIN, INPUT_PULLUP);

  applyLights();

  Serial.begin(9600);
}

void loop() {
  readCommands();
  readVolumeButtons();
  readPad();

  if (HAS_BATTERY && millis() - lastBatteryMs > 30000) {
    lastBatteryMs = millis();
    reportBattery();
  }
}

// Serial

void readCommands() {
  while (Serial.available() > 0) {
    char c = Serial.read();

    if (c == '\n' || c == '\r') {
      if (lineLength > 0) {
        line[lineLength] = '\0';
        handleCommand(line);
        lineLength = 0;
      }
    } else if (lineLength < (int)sizeof(line) - 1) {
      line[lineLength++] = c;
    }
  }
}

void handleCommand(const char *command) {
  int value = constrain(atoi(command + 1), 0, 100);

  switch (command[0]) {
    case 'L':
      lightsOn = command[1] == '1';
      applyLights();
      break;
    case 'C':
      calmOn = command[1] == '1';
      applyLights();
      break;
    case 'S':
      playSound();
      break;
    case 'W':
      playWhistle();
      break;
    case 'T':
      releaseTreat();
      break;
    case 'X':
      lightsOn = false;
      calmOn = false;
      noTone(SPEAKER_PIN);
      applyLights();
      break;
    case 'V':
      volume = value;
      break;
    case 'B':
      brightness = value;
      applyLights();
      break;
    case '?':
      reportStatus();
      break;
  }
}

void reportStatus() {
  Serial.print("ID:");
  Serial.println(MAT_ID);
  Serial.print("VOL:");
  Serial.println(volume);
  Serial.print("PLAY:");
  Serial.println(playing ? 1 : 0);

  if (HAS_BATTERY) {
    reportBattery();
  }
}

void reportBattery() {
  int raw = analogRead(BATTERY_PIN);
  int percent = constrain(map(raw, BATTERY_EMPTY, BATTERY_FULL, 0, 100), 0, 100);

  Serial.print("BAT:");
  Serial.println(percent);
}

// Outputs

void applyLights() {
  int level = lightsOn ? map(brightness, 0, 100, 0, 255) : 0;

  // Calm mode gives a soft glow, a third of the chosen brightness
  if (calmOn) {
    level = map(brightness, 0, 100, 0, 255) / 3;
  }

  analogWrite(LIGHT_PIN, level);
}

// A piezo can't change loudness, so volume 0 mutes and anything else plays.
// Calm mode plays shorter, softer-sounding notes.
void beep(int frequency, int durationMs) {
  if (volume == 0) return;

  if (calmOn) durationMs /= 2;

  tone(SPEAKER_PIN, frequency, durationMs);
  delay(durationMs + 20);
}

void playSound() {
  beep(880, 120);
  beep(1175, 180);
}

void playWhistle() {
  if (volume == 0) return;

  for (int f = 1500; f <= 2600; f += 50) {
    tone(SPEAKER_PIN, f);
    delay(12);
  }
  noTone(SPEAKER_PIN);
  delay(120);
  beep(2600, 250);
}

void releaseTreat() {
  digitalWrite(TREAT_PIN, HIGH);
  delay(300);
  digitalWrite(TREAT_PIN, LOW);
}

// Inputs

void readVolumeButtons() {
  if (millis() - lastButtonMs < 200) return;

  int change = 0;
  if (digitalRead(VOL_UP_PIN) == LOW) change = 10;
  if (digitalRead(VOL_DOWN_PIN) == LOW) change = -10;
  if (change == 0) return;

  lastButtonMs = millis();
  volume = constrain(volume + change, 0, 100);

  Serial.print("VOL:");
  Serial.println(volume);
}

void readPad() {
  bool onMat = digitalRead(PAD_PIN) == LOW;

  if (onMat == playing || millis() - lastPadChangeMs < 50) return;

  lastPadChangeMs = millis();
  playing = onMat;

  Serial.print("PLAY:");
  Serial.println(playing ? 1 : 0);
}
