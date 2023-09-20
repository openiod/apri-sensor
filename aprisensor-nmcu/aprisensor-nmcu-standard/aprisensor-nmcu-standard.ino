/*------------------------------------------------------------------------------

  Application for reading sensor data from multiple sensor
  Sensors:
  - BME280 air pressure, temperature and relative humidity
  - PMSA003 fine dust sensor

  WiFi docs: https://arduino-esp8266.readthedocs.io/en/latest/esp8266wifi/station-class.html
  
*/
/*

  Copyright 2022 Scapeler

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

*/

//#include <Wire.h>
#define USE_SERIAL Serial

//#include <PubSubClient.h>
//#include <ESP8266WiFi.h>  //ESP8266 Core WiFi Library (you most likely already have this in your sketch)
#include <WiFi.h>
//#include <ESP8266HTTPClient.h>
//#include <WiFiClientSecureBearSSL.h>
//#include <WiFiClientSecure.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include "driver/adc.h"


#include <DNSServer.h>  //Local DNS Server used for redirecting all requests to the configuration portal
//#include <ESP8266WebServer.h>  //Local WebServer used to serve the configuration portal
#include <WiFiManager.h>  //https://github.com/tzapu/WiFiManager WiFi Configuration Magic
WiFiManager wifiManager;
WiFiServer server(80);  //Service Port
WiFiClient wifiClient;
WiFiClientSecure client;
//WiFiManager, Local intialization. Once its business is done, there is no need to keep it around
WiFiManager wm;
bool res;
bool disabledState = false;


void WiFiStationConnected(WiFiEvent_t event, WiFiEventInfo_t info) {
  Serial.println("Connected to AP successfully!");
}

void WiFiGotIP(WiFiEvent_t event, WiFiEventInfo_t info) {
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void WiFiStationDisconnected(WiFiEvent_t event, WiFiEventInfo_t info) {
  Serial.println("Disconnected from WiFi access point");


  if (info.wifi_sta_disconnected.reason == WIFI_REASON_NO_AP_FOUND) {
    Serial.println("WIFI_REASON_NO_AP_FOUND");
    //disableWiFi();
    //delay(1000);
    //enableWiFi();
    //delay(1000);
    return;
  }

  if (info.wifi_sta_disconnected.reason == WIFI_REASON_AUTH_EXPIRE) {
    Serial.println("WIFI_REASON_AUTH_EXPIRE");
    //WiFi.disconnect();
    //WiFi.begin();
    delay(100);
    yield();
    return;
  }
  if (info.wifi_sta_disconnected.reason == WIFI_REASON_ASSOC_LEAVE) {
    //Serial.println("WIFI_REASON_ASSOC_LEAVE");
    //if (disabledState == true) {
    //  disableWiFi();
    //  delay(1000);
    //  enableWiFi();
    //  delay(1000);
    //}
    
    //WiFi.disconnect();
    //WiFi.reconnect();
    //res = wm.autoConnect();

    //if (!res) {
    //  Serial.println("Failed to connect");
    //  // ESP.restart();
    //} else {
    //  //if you get here you have connected to the WiFi
    //  Serial.println("connected...hoera :)");
    //}

    //WiFi.begin();
    delay(1000);
    yield();
    //WiFi.reconnect();
    ESP.restart();
    delay(5000);


    return;
  }
  if (info.wifi_sta_disconnected.reason == WIFI_REASON_BEACON_TIMEOUT) {
    Serial.println("WIFI_REASON_BEACON_TIMEOUT");
    //WiFi.disconnect();
    //WiFi.begin();
    delay(1000);
    yield();
    WiFi.reconnect();
    //ESP.restart();
    delay(1000);
    return;
  }
  Serial.print("WiFi lost connection. Reason: ");
  Serial.println(info.wifi_sta_disconnected.reason);
  Serial.println("Trying to Reconnect");
  delay(2000);
  yield();
  WiFi.reconnect();
  delay(100);
  yield();

  /*
  WIFI_REASON_UNSPECIFIED              = 1,
WIFI_REASON_AUTH_EXPIRE              = 2,
WIFI_REASON_AUTH_LEAVE               = 3,
WIFI_REASON_ASSOC_EXPIRE             = 4,
WIFI_REASON_ASSOC_TOOMANY            = 5,
WIFI_REASON_NOT_AUTHED               = 6,
WIFI_REASON_NOT_ASSOCED              = 7,
WIFI_REASON_ASSOC_LEAVE              = 8,
WIFI_REASON_ASSOC_NOT_AUTHED         = 9,
WIFI_REASON_DISASSOC_PWRCAP_BAD      = 10,
WIFI_REASON_DISASSOC_SUPCHAN_BAD     = 11,
WIFI_REASON_IE_INVALID               = 13,
WIFI_REASON_MIC_FAILURE              = 14,
WIFI_REASON_4WAY_HANDSHAKE_TIMEOUT   = 15,
WIFI_REASON_GROUP_KEY_UPDATE_TIMEOUT = 16,
WIFI_REASON_IE_IN_4WAY_DIFFERS       = 17,
WIFI_REASON_GROUP_CIPHER_INVALID     = 18,
WIFI_REASON_PAIRWISE_CIPHER_INVALID  = 19,
WIFI_REASON_AKMP_INVALID             = 20,
WIFI_REASON_UNSUPP_RSN_IE_VERSION    = 21,
WIFI_REASON_INVALID_RSN_IE_CAP       = 22,
WIFI_REASON_802_1X_AUTH_FAILED       = 23,
WIFI_REASON_CIPHER_SUITE_REJECTED    = 24,

WIFI_REASON_BEACON_TIMEOUT           = 200,
WIFI_REASON_NO_AP_FOUND              = 201,
WIFI_REASON_AUTH_FAIL                = 202,
WIFI_REASON_ASSOC_FAIL               = 203,
WIFI_REASON_HANDSHAKE_TIMEOUT        = 204,
  */
}




//-----------------------------------------------------------------------------

// #include "ApriSensor.h"
#include "ApriSensorBme280.h"
#include "ApriSensorPmsx003.h"

const int ledBlue = 2;  // D0 is standard LED on board //D1;

long int millisCycle = 0;
int restartCount = 0;

//BmeSensor bme280Sensor;
//Pmsx003Sensor pmsx003Sensor;

//ResultsBme resultsBme;
//ResultsPms resultsPms;

//aprisensor_ns::BmeSensor bme280Sensor;
//aprisensor_ns::Pmsx003Sensor pmsx003Sensor;

//aprisensor_ns::BmeSensor::ResultsBme resultsBme;
//aprisensor_ns::Pmsx003Sensor::ResultsPms resultsPms;

char params[100];
char* paramsPtr = params;

uint8_t macAddr[6];
//char foichar[17] = "SCESc8f09e7521a8";
char foichar[18] = "SCESP............";
char* foicharPtr;
char urlchar[200] = "https://aprisensor-in.openiod.org/pmsa003nm/v1/m?foi=";
const char* serverApriSensor = "aprisensor-in.openiod.org";
char urlGetchar[200];
int code = 0;
float pm25;
double httpCount = 0;

const char* ssid = "ap-24";
const char* password = "iam@Home";
unsigned long previousMillis = 0;
unsigned long interval = 10000;
unsigned long currentMillis;

void enableWiFi() {
  adc_power_on();
  WiFi.disconnect(false);  // Reconnect the network
  WiFi.mode(WIFI_STA);     // Switch WiFi off

  Serial.println("START WIFI");
  //WiFi.begin(STA_SSID, STA_PASS);
  WiFi.begin();

  // while (WiFi.status() != WL_CONNECTED) {
  //   delay(500);
  //   Serial.print(".");
  // }
  delay(500);
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected");
  } else {
    Serial.println("");
    Serial.println("WiFi connected");
    Serial.println("IP address: ");
    Serial.println(WiFi.localIP());
  }
  disabledState = false;
}
void disableWiFi() {
  disabledState = true;
  adc_power_off();
  WiFi.disconnect(true);  // Disconnect from the network
  WiFi.mode(WIFI_OFF);    // Switch WiFi off
  Serial.println("WIFI disabled");
}

void setup() {


  Serial.begin(9600);
  USE_SERIAL.begin(9600);
  Serial.print("Setup start\r\n");

  WiFi.onEvent(WiFiStationConnected, WiFiEvent_t::ARDUINO_EVENT_WIFI_STA_CONNECTED);
  WiFi.onEvent(WiFiGotIP, WiFiEvent_t::ARDUINO_EVENT_WIFI_STA_GOT_IP);
  WiFi.onEvent(WiFiStationDisconnected, WiFiEvent_t::ARDUINO_EVENT_WIFI_STA_DISCONNECTED);



  pinMode(ledBlue, OUTPUT);
  digitalWrite(ledBlue, LOW);

  //WiFi.mode(WIFI_AP_STA)
  //wifiConnect();
  // Set WiFi to station mode and disconnect from an AP if it was previously connected
  //WiFi.mode(WIFI_STA);
  //WiFi.mode(WIFI_IF_AP);
  //WiFi.disconnect();
  //delay(100);
  //initWiFi();

  //WiFiManager, Local intialization. Once its business is done, there is no need to keep it around
  //WiFiManager wm;
  // Supress Debug information
  wm.setDebugOutput(false);

  // reset settings - wipe stored credentials for testing
  // these are stored by the esp library
  //wm.resetSettings();

  // Automatically connect using saved credentials,
  // if connection fails, it starts an access point with the specified name ( "AutoConnectAP"),
  // if empty will auto generate SSID, if password is blank it will be anonymous AP (wm.autoConnect())
  // then goes into a blocking loop awaiting configuration and will return success result



  // res = wm.autoConnect(); // auto generated AP name from chipid
  // res = wm.autoConnect("AutoConnectAP"); // anonymous ap
  //res = wm.autoConnect("AutoConnectAP", "password");  // password protected ap
  res = wm.autoConnect();

  if (!res) {
    Serial.println("Failed to connect");
    // ESP.restart();
  } else {
    //if you get here you have connected to the WiFi
    Serial.println("connected...yeey :)");
  }

  //WiFi.setSleep(false);
  esp_wifi_set_ps(WIFI_PS_MAX_MODEM);

  //disableWiFi();
  //Serial.println("WiFi disabled");
  //enableWiFi();
  //Serial.println("WiFi enabled");


  Serial.println("Setup done");

  // Start the server
  //server.begin();
  //Serial.println("Local server started");

  int8_t j;
  esp_wifi_get_max_tx_power(&j);
  Serial.print("Wifi power get is: ");
  Serial.println(j);

  //esp_wifi_get_max_tx_power(78);
  //Serial.print("Set WiFi TX power to max (0=OK): ");
  //Serial.println(esp_wifi_set_max_tx_power(78));  // default=78=maximum
  //Serial.println(esp_wifi_set_max_tx_power(20)); // default=78=maximum
  delay(2000);
  Serial.print("RRSI: ");
  Serial.println(WiFi.RSSI());

  // Print the IP address
  Serial.print("Use this URL to connect: ");
  Serial.print("http://");
  Serial.print(WiFi.localIP());
  Serial.println("/");

  WiFi.macAddress(macAddr);
  foicharPtr = &foichar[5];
  for (byte i = 0; i < 6; i++) {
    snprintf(foicharPtr, 3, "%02x", macAddr[i]);  //convert a byte to character string, and save 2 characters (+null) to charArr;
    foicharPtr += 2;                              //increment the pointer by two characters in charArr so that next time the null from the previous go is overwritten.
  }
  Serial.println(foichar);
  strcat(urlchar, foichar);
  strcat(urlchar, "&observation=");

  initBme();
  initPms();
  //  bme280Sensor.initBme();
  //  pmsx003Sensor.initPms();

  //client.setInsecure();
}

void loop() {

  currentMillis = millis();
  // if WiFi is down, try reconnecting every CHECK_WIFI_TIME seconds
  if ((WiFi.status() != WL_CONNECTED) && (currentMillis - previousMillis >= interval)) {
    Serial.print(millis());
    Serial.println("Reconnecting to WiFi...");
    //WiFi.disconnect();
    WiFi.reconnect();
    previousMillis = currentMillis;
  }


  // in 25 seconds not one call to server succeeded (5 seconds more than measurement cycle)
  if (millis() - millisCycle > 25000) {
    Serial.print("c");
    millisCycle = millis();
    if (WiFi.status() != WL_CONNECTED) {
      Serial.print("r");
      //wifiConnect();
    }
    restartCount++;
    Serial.print(restartCount);

    // 6 or more error cycles? then restart (>250 seconds)
    // and minimal 1 succeeded http call
    if (restartCount >= 5 && httpCount > 0) {
      Serial.print("Restart: bme:");
      Serial.print(resultsBme.nrOfMeasurementsBme);
      Serial.print(" pms:");
      Serial.println(resultsPms.nrOfMeasurementsPms);
      restartCount = 0;
      //ESP.restart();
    }
    // 6 or more error cycles? then restart (>250 seconds)
    // and minimal 1 succeeded http call
    if (restartCount >= 10 && httpCount == 0) {
      Serial.print("Restart: bme:");
      Serial.print(resultsBme.nrOfMeasurementsBme);
      Serial.print(" pms:");
      Serial.println(resultsPms.nrOfMeasurementsPms);
      restartCount = 0;
      //ESP.restart();
    }
  }

  if (!getResultsReadyPms()) {
    yield();
    readDataBme();
    yield();
    readDataPms();
  }

  if (getResultsReadyPms()) {
    yield();
    digitalWrite(ledBlue, HIGH);
    resultsBme = computeResultsBme();
    resultsPms = computeResultsPms();

    pm25 = NAN;
    // overrule result[0] with calibrated value
    if (resultsBme.resultsBme[2] == NAN) {  // nodig voor calibratie
      //Serial.print("\r\n bme280 not available ");
      resultsPms.resultsPms[0] = resultsPms.resultsPms[1];
    } else {
      pm25 = 14.8 + (0.3834 * resultsPms.resultsPms[1]) + (-0.1498 * resultsBme.resultsBme[2]) + (-0.1905 * resultsBme.resultsBme[1]);
      if (pm25 > resultsPms.resultsPms[1]) pm25 = resultsPms.resultsPms[1];
      resultsPms.resultsPms[0] = pm25;
    }
    yield();
    sendResults();

    initTotalsBme();
    yield();
    initTotalsPms();
  }
}

void initWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi ..");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print('.');
    delay(1000);
  }
  Serial.println(WiFi.localIP());
}
/*
void wifiConnect() {
  wifiManager.autoConnect();

  //  while (WiFi.status() != WL_CONNECTED) {
  if (WiFi.status() != WL_CONNECTED) {
    yield();
    //delay(500);
    Serial.println("WiFi not connected");
  } else {
    Serial.println("");
    Serial.println("WiFi connected");
  }
}
*/
void sendResults() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected, no results sent to server");
    return;
  }


  yield();
  if (resultsPms.nrOfMeasurementsPms == 0) return;  // no measurements recieved so far

  strcpy(params, "");
  snprintf(paramsPtr, 100, "pm25cal:%.2f,pm25:%.2f,pressure:%.2f,temperature:%.2f,rHum:%.2f", resultsPms.resultsPms[0], resultsPms.resultsPms[1], resultsBme.resultsBme[0], resultsBme.resultsBme[1], resultsBme.resultsBme[2]);

  yield();
  sendObservations();

  //  Serial.print("getFreeHeap: ");
  //  Serial.println(ESP.getFreeHeap());
  //  Serial.print("getHeapFragmentation: ");
  //  Serial.println(ESP.getHeapFragmentation());
  //  Serial.print("getMaxFreeBlockSize: ");
  //  Serial.println(ESP.getMaxFreeBlockSize());
};

void sendObservations() {

  //WiFi.printDiag(Serial);

  //Serial.println("Connecting to the HTTP server....");
  //std::unique_ptr<BearSSL::WiFiClientSecure> client(new BearSSL::WiFiClientSecure);
  //client->setInsecure();

  //BearSSL::WiFiClientSecure client;
  //client.setInsecure();
  //HTTPClient https;
  //HTTPClient http;

  strcpy(urlGetchar, urlchar);
  strcat(urlGetchar, params);
  Serial.println("");
  Serial.println(urlGetchar);
  yield();

  WiFiClientSecure* client = new WiFiClientSecure;
  if (client) {
    // set secure client with certificate
    client->setInsecure();
    client->setTimeout(4000);
    //create an HTTPClient instance
    HTTPClient https;
    https.setTimeout(4000);
    delay(0);
    yield();

    if (https.begin(*client, urlGetchar)) {  // HTTPS
      yield();
      Serial.print("[HTTPS] GET...\n");
      // start connection and send HTTP header
      int httpCode = https.GET();
      yield();
      // httpCode will be negative on error
      if (httpCode > 0) {
        // HTTP header has been send and Server response header has been handled
        Serial.printf("[HTTPS] GET... code: %d\n", httpCode);
        // file found at server
        if (httpCode == HTTP_CODE_OK || httpCode == HTTP_CODE_MOVED_PERMANENTLY) {
          // print server response payload
          String payload = https.getString();
          Serial.println(payload);
          restartCount = 0;
          millisCycle = millis();
          httpCount++;
        }
        yield();
        digitalWrite(ledBlue, LOW);

      } else {
        Serial.printf("[HTTPS] GET... failed, error: %s - %d \n", https.errorToString(httpCode).c_str(), httpCode);
        Serial.println("reconnect WiFi");
        yield();
        WiFi.reconnect();
      }
      yield();
      https.end();
    }
    client->stop();
  } else {
    Serial.printf("[HTTPS] Unable to connect\n");
    yield();
  }
  Serial.println(";");
  yield();

  /*

  if (!client.connect(serverApriSensor, 443))
    Serial.println("Connection failed!");
  else {
    Serial.println("Connected to server!");
    // Make a HTTP request:
    Serial.print("GET ");
    Serial.print(urlGetchar);
    Serial.println(" HTTP/1.0");
    Serial.print("Host: ");
    Serial.println(serverApriSensor);
    Serial.println("Connection: close");
    Serial.println();

    client.print("GET ");
    client.print(urlGetchar);
    client.println(" HTTP/1.0");
    client.print("Host: ");
    client.println(serverApriSensor);
    client.println("Connection: close");
    client.println();
    Serial.println("GET OK");

    while (client.connected()) {
      String line = client.readStringUntil('\n');
      if (line == "\r") {
        Serial.println("headers received");
        break;
      }
    }
    restartCount = 0;
    millisCycle = millis();
    httpCount++;
    // if there are incoming bytes available
    // from the server, read them and print them:
    while (client.available()) {
      char c = client.read();
      Serial.write(c);
    }
    */
  /*
  //  if (http.begin(*client, urlGetchar)) {
  if (http.begin(client, urlGetchar)) {
    //Serial.println("Connected");
    http.addHeader("Accept", "application/json");
    //http.addHeader("apikey", API_KEY);
    yield();
    code = http.GET();
    Serial.printf("HTTP Code [%d]", code);
    yield();
    if (code > 0) {
      if (code == HTTP_CODE_OK || code == HTTP_CODE_MOVED_PERMANENTLY) {
        Serial.println("GET OK");
        //        String payload = http.getString();
        //        Serial.println(payload);
        //        Serial.println("...JSON..");
        restartCount = 0;
        millisCycle = millis();
        httpCount++;
      }
    } else {
      Serial.printf("[HTTP] GET... failed, error: %s", http.errorToString(code).c_str());
    }
  } else {
    Serial.print("failed to connect to server");
  }
  http.end();
  */
}
//client.end();
//}

//https://aprisensor-in.openiod.org/pmsa003nm/v1/m?&foi=SCNM2C3AE84F7C65&observation=pm25cal:8.26,pm25:12.72,pressure:1025.92,temperature:26.03,rHum:43.11
