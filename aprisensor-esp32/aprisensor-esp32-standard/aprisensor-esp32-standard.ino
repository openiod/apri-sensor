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
#include <ESP8266WiFi.h>  //ESP8266 Core WiFi Library (you most likely already have this in your sketch)
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecureBearSSL.h>
#include <WiFiClientSecure.h>

#include <DNSServer.h>         //Local DNS Server used for redirecting all requests to the configuration portal
#include <ESP8266WebServer.h>  //Local WebServer used to serve the configuration portal
#include <WiFiManager.h>       //https://github.com/tzapu/WiFiManager WiFi Configuration Magic
WiFiManager wifiManager;
WiFiServer server(80);  //Service Port
WiFiClient wifiClient;

//-----------------------------------------------------------------------------

// #include "ApriSensor.h"
#include "ApriSensorBme280.h"
#include "ApriSensorPmsx003.h"

const int ledBlue = D0;  // D0 is standard LED on board //D1;

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
char foichar[17] = "SCNM2C3AE84F7C65";
char* foicharPtr;
char urlchar[200] = "https://aprisensor-in.openiod.org/pmsa003nm/v1/m?foi=";
char urlGetchar[200];
int code = 0;
float pm25;
double httpCount = 0;

void setup() {


  Serial.begin(9600);
  USE_SERIAL.begin(9600);
  Serial.print("Setup start\r\n");

  pinMode(ledBlue, OUTPUT);
  digitalWrite(ledBlue, LOW);

  wifiConnect();

  // Start the server
  server.begin();
  Serial.println("Local server started");

  // Print the IP address
  Serial.print("Use this URL to connect: ");
  Serial.print("http://");
  Serial.print(WiFi.localIP());
  Serial.println("/");

  WiFi.macAddress(macAddr);
  foicharPtr = &foichar[4];
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
}

void loop() {

  // in 25 seconds not one call to server succeeded (5 seconds more than measurement cycle)
  if (millis() - millisCycle > 25000) {
    Serial.print("c");
    millisCycle = millis();
    if (WiFi.status() != WL_CONNECTED) {
      Serial.print("r");
      wifiConnect();
    }
    restartCount++;
    Serial.print(restartCount);

    // 6 or more error cycles? then restart (>250 seconds)
    // and minimal 1 succeeded http call
    if (restartCount >= 5 & httpCount > 0) {
      Serial.print("Restart: bme:");
      Serial.print(resultsBme.nrOfMeasurementsBme);
      Serial.print(" pms:");
      Serial.println(resultsPms.nrOfMeasurementsPms);
      restartCount = 0;
      ESP.restart();
    }
    // 6 or more error cycles? then restart (>250 seconds)
    // and minimal 1 succeeded http call
    if (restartCount >= 10 & httpCount == 0) {
      Serial.print("Restart: bme:");
      Serial.print(resultsBme.nrOfMeasurementsBme);
      Serial.print(" pms:");
      Serial.println(resultsPms.nrOfMeasurementsPms);
      restartCount = 0;
      ESP.restart();
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
    digitalWrite(ledBlue, LOW);
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

  Serial.print("getFreeHeap: ");
  Serial.println(ESP.getFreeHeap());
  Serial.print("getHeapFragmentation: ");
  Serial.println(ESP.getHeapFragmentation());
  Serial.print("getMaxFreeBlockSize: ");
  Serial.println(ESP.getMaxFreeBlockSize());
};

void sendObservations() {

  //WiFi.printDiag(Serial);

  //Serial.println("Connecting to the HTTP server....");
  //std::unique_ptr<BearSSL::WiFiClientSecure> client(new BearSSL::WiFiClientSecure);
  //client->setInsecure();

  BearSSL::WiFiClientSecure client;
  client.setInsecure();
  //HTTPClient https;
  HTTPClient http;

  strcpy(urlGetchar, urlchar);
  strcat(urlGetchar, params);
  Serial.println("");
  Serial.println(urlGetchar);
  yield();
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
}
//https://aprisensor-in.openiod.org/pmsa003nm/v1/m?&foi=SCNM2C3AE84F7C65&observation=pm25cal:8.26,pm25:12.72,pressure:1025.92,temperature:26.03,rHum:43.11