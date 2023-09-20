/*------------------------------------------------------------------------------

  Application for reading sensor data from multiple sensor
  Sensors:
  - BME280 air pressure, temperature and relative humidity
  - PMSA003 fine dust sensor
  
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
HTTPClient http;

#include <DNSServer.h>         //Local DNS Server used for redirecting all requests to the configuration portal
#include <ESP8266WebServer.h>  //Local WebServer used to serve the configuration portal
#include <WiFiManager.h>       //https://github.com/tzapu/WiFiManager WiFi Configuration Magic
WiFiServer server(80);         //Service Port
WiFiClient wifiClient;

//-----------------------------------------------------------------------------

#include "ApriSensor.h"
#include "ApriSensorBme280.h"
#include "ApriSensorPmsx003.h"

const int ledBlue = D0;  // D0 is standard LED on board //D1;

aprisensor_ns::Bme280Sensor bme280Sensor;
aprisensor_ns::Pmsx003Sensor pmsx003Sensor;

aprisensor_ns::Bme280Sensor::Results resultsBme280;
aprisensor_ns::Pmsx003Sensor::Results resultsPms;

void setup() {


  Serial.begin(115200);
  USE_SERIAL.begin(115200);
  //Serial.print("Setup start\r\n");

  pinMode(ledBlue, OUTPUT);
  digitalWrite(ledBlue, LOW);
  return;
  wifiConnect();
  macAddress = WiFi.macAddress();
  foi = "SCNM" + macAddress.substring(0, 2) + macAddress.substring(3, 5) + macAddress.substring(6, 8) + macAddress.substring(9, 11) + macAddress.substring(12, 14) + macAddress.substring(15, 17) + "\0";

  bme280Sensor.init();
  pmsx003Sensor.init();
}

void loop() {
Serial.print("r");
return;
  if (!pmsx003Sensor.getResultsReady()) {
    yield();
    bme280Sensor.readData();
    yield();
    pmsx003Sensor.readData();
  }

  if (pmsx003Sensor.getResultsReady()) {
    yield();
    digitalWrite(ledBlue, LOW);
    resultsBme280 = bme280Sensor.computeResults();
    resultsPms = pmsx003Sensor.computeResults();

    float pm25 = NAN;
    // overrule result[0] with calibrated value
    if (resultsBme280.results[2] == NAN) {
      //Serial.print("\r\n bme280 not available ");
      resultsPms.results[0] = resultsPms.results[1];
    } else {
      pm25 = 14.8 + (0.3834 * resultsPms.results[1]) + (-0.1498 * resultsBme280.results[2]) + (-0.1905 * resultsBme280.results[1]);
      if (pm25 > resultsPms.results[1]) pm25 = resultsPms.results[1];
      resultsPms.results[0] = pm25;
    }
    yield();
    sendResults();

    bme280Sensor.initTotals();
    yield();
    pmsx003Sensor.initTotals();
  }
}

void wifiConnect() {
  WiFiManager wifiManager;
  wifiManager.autoConnect();

  while (WiFi.status() != WL_CONNECTED) {
    yield();
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.println("WiFi connected");

  // Start the server
  server.begin();
  Serial.println("Local server started");

  // Print the IP address
  Serial.print("Use this URL to connect: ");
  Serial.print("http://");
  Serial.print(WiFi.localIP());
  Serial.println("/");
}

void sendResults() {
  yield();
  if (resultsPms.nrOfMeasurements == 0) return;  // no measurements recieved so far

  double pm25cal = resultsPms.results[0];  // double for String conversion and decimals)
  double pm25 = resultsPms.results[1];
  double pressure = resultsBme280.results[0];
  double temperature = resultsBme280.results[1];
  double rHum = resultsBme280.results[2];
  yield();
  String urlParams = "&observation=pm25cal:" + String(pm25cal, 2) + "," + "pm25:" + String(pm25, 2) + "," + "pressure:" + String(pressure, 2) + "," + "temperature:" + String(temperature, 2) + "," + "rHum:" + String(rHum, 2);
  yield();
  sendObservations(urlParams);
  Serial.print("getFreeHeap: ");
  Serial.println(ESP.getFreeHeap());
  Serial.print("getHeapFragmentation: ");
  Serial.println(ESP.getHeapFragmentation());
  Serial.print("getMaxFreeBlockSize: ");
  Serial.println(ESP.getMaxFreeBlockSize());
};
