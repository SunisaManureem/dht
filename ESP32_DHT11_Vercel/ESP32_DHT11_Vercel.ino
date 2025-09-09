
/*
  ESP32 DHT11 → Vercel API (MongoDB Atlas)
  -------------------------------------------------
  - Board: ESP32 (Arduino core)
  - Sensor: DHT11 (data pin -> GPIO 4 by default)
  - HTTPS: using WiFiClientSecure with setInsecure() for simplicity in dev
           (⚠️ for production, install proper root certificate instead)
*/

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <time.h>
#include <DHT.h>

// ---------- USER SETTINGS (EDIT THESE) ----------
// WiFi credentials
const char* WIFI_SSID     = "Adil";
const char* WIFI_PASSWORD = "0622198015";

// Your deployed Vercel base URL (no trailing slash). Example:
//   https://your-project.vercel.app
const char* BASE_URL = "https://dht-sensor-f88.vercel.app/api";

// Device ID (use a stable unique id per board)
const char* DEVICE_ID = "ESP32-DHT11-001";

// DHT11 settings
#define DHT_PIN 4
#define DHT_TYPE DHT11

// Upload interval (ms)
const unsigned long UPLOAD_INTERVAL = 60UL * 1000UL; // 60s

// NTP / Timezone (Thailand GMT+7, no DST)
const char* ntpServer        = "pool.ntp.org";
const long  gmtOffset_sec    = 7 * 3600;
const int   daylightOffset_s = 0;

// ---------- GLOBALS ----------
DHT dht(DHT_PIN, DHT_TYPE);
unsigned long lastUpload = 0;

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  Serial.print("Connecting to WiFi");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 60) { // ~30s
    delay(500);
    Serial.print(".");
    attempts++;
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WiFi connected!");
    Serial.print("IP: "); Serial.println(WiFi.localIP());
  } else {
    Serial.println("WiFi connect failed.");
  }
}

void setupTime() {
  configTime(gmtOffset_sec, daylightOffset_s, ntpServer);
  Serial.print("Syncing time");
  struct tm timeinfo;
  int tries = 0;
  while (!getLocalTime(&timeinfo) && tries < 20) {
    Serial.print(".");
    delay(500);
    tries++;
  }
  Serial.println();
  if (tries < 20) {
    Serial.print("Time OK: ");
    Serial.println(&timeinfo, "%A, %B %d %Y %H:%M:%S");
  } else {
    Serial.println("Time sync failed (will still send data).");
  }
}

void printWiFiStatus() {
  Serial.print("WiFi: ");
  switch (WiFi.status()) {
    case WL_CONNECTED: Serial.println("Connected"); break;
    case WL_NO_SSID_AVAIL: Serial.println("SSID not available"); break;
    case WL_CONNECT_FAILED: Serial.println("Connection failed"); break;
    case WL_CONNECTION_LOST: Serial.println("Connection lost"); break;
    case WL_DISCONNECTED: Serial.println("Disconnected"); break;
    default: Serial.println("Unknown"); break;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("RSSI: "); Serial.print(WiFi.RSSI()); Serial.println(" dBm");
  }
}

bool sendData(float temperature, float humidity) {
  String url = String(BASE_URL) + "/api/sensors/data";
  Serial.println("POST " + url);

  WiFiClientSecure client;
  client.setInsecure(); // DEV ONLY. Replace with root cert for production.

  HTTPClient http;
  if (!http.begin(client, url)) {
    Serial.println("HTTP begin() failed");
    return false;
  }
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000);

  // Build JSON
  StaticJsonDocument<512> doc;
  doc["deviceId"] = DEVICE_ID;
  JsonObject loc = doc.createNestedObject("location");
  loc["name"] = "ESP32 Sensor";
  loc["latitude"] = 0.0;   // optional: set real coords
  loc["longitude"] = 0.0;

  JsonObject s = doc.createNestedObject("sensorData");
  s["temperature"] = temperature;
  s["humidity"] = humidity;
  s["source"] = "ESP32";

  String payload;
  serializeJson(doc, payload);
  Serial.println("Payload: " + payload);

  int code = http.POST(payload);
  if (code > 0) {
    Serial.printf("HTTP %d\n", code);
    String resp = http.getString();
    Serial.println("Response: " + resp);
  } else {
    Serial.printf("HTTP error: %d\n", code);
  }
  http.end();
  return code == 200;
}

void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println("\n=== ESP32 DHT11 → Vercel API ===");

  dht.begin();
  Serial.printf("DHT11 init OK (GPIO %d)\n", DHT_PIN);

  connectWiFi();
  setupTime();
}

void loop() {
  if (millis() - lastUpload >= UPLOAD_INTERVAL) {
    lastUpload = millis();

    // Ensure WiFi
    if (WiFi.status() != WL_CONNECTED) {
      connectWiFi();
      if (WiFi.status() != WL_CONNECTED) {
        Serial.println("Skip upload: WiFi not connected");
        printWiFiStatus();
        return;
      }
    }

    Serial.println("\n--- Reading DHT11 ---");
    float h = dht.readHumidity();
    float t = dht.readTemperature(); // Celsius

    if (isnan(h) || isnan(t)) {
      Serial.println("Read failed. Check wiring: VCC=3.3V, GND=GND, DATA=GPIO4");
    } else {
      Serial.printf("Temp: %.1f C, Hum: %.0f %%\n", t, h);
      bool ok = sendData(t, h);
      Serial.println(ok ? "Upload OK" : "Upload FAILED");
    }
  }
  delay(500);
}