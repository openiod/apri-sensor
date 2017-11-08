/*------------------------------------------------------------------------------

  Application for reading sensor data from multiple sensor
  Sensors:
  - BMP280 air pressure incl. temperature and altitude
  - AM2320 relative humidity incl. temperature
  - DS18B20 teperature sensor

  RF433 ASK transmitter RadioHead, Implements a simplex (one-way) transmitter with an TX-C1 module

*/
/*

  Copyright 2017 Scapeler

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
//#include <avr/pgmspace.h>

const byte  VersionMajor = 0;
const byte  VersionMinor = 1;

#include <SoftwareSerial.h>
#define USE_SERIAL Serial



//#include <PubSubClient.h>
#include <ESP8266WiFi.h>          //ESP8266 Core WiFi Library (you most likely already have this in your sketch)
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>

#include <DNSServer.h>            //Local DNS Server used for redirecting all requests to the configuration portal
#include <ESP8266WebServer.h>     //Local WebServer used to serve the configuration portal
#include <WiFiManager.h>          //https://github.com/tzapu/WiFiManager WiFi Configuration Magic
WiFiServer server(80);//Service Port
WiFiClient wifiClient;

// mqtt configuration
//const char* mqttServerName = "192.168.0.104";
//const char* topic = "test";
//const char* clientName = "org.openiod.test";
//PubSubClient pubSubClient(wifiClient);

//int value;
//int percent;
//String payload;

//-----------------------------------------------------------------------------
#include "ApriSensor.h"
#include "ApriSensorDylos.h"

aprisensor_ns::DylosSensor dylosSensor;

void setup() {
  Serial.begin(9600);
  USE_SERIAL.begin(9600);
  // USE_SERIAL.setDebugOutput(true);
  Serial.print("Setup start\r\n");
  dylosSerial.begin(9600);

  //  pubSubClient.setServer(mqttServerName, 1883);
  wifiConnect();
  String macAddress = WiFi.macAddress();
  foi = "SCWM" + macAddress.substring(0,2) + macAddress.substring(3,5) + macAddress.substring(6,8) + macAddress.substring(9,11) +macAddress.substring(12,14) +macAddress.substring(15,17) + + "\0";

  dylosSensor.init();
  Serial.print("Sensors ready\r\n");
}

void loop() {
  dylosSensor.readData();
  return;
}

void wifiConnect() {
    WiFiManager wifiManager;

    wifiManager.autoConnect();

    while (WiFi.status() != WL_CONNECTED) {
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

    /*

      if (pubSubClient.connect(clientName)) {
            Serial.print("Connected to MQTT broker at ");
            Serial.print(mqttServerName);
            Serial.print(" as ");
            Serial.println(clientName);
            Serial.print("Topic is: ");
            Serial.println(topic);
        }
        else {
            Serial.println("MQTT connect failed");
            Serial.println("Will reset and try again...");
            abort();
        }
    
    //}

    /*
        void mqttReConnect() {
        while (!pubSubClient.connected()) {
            Serial.print("Attempting MQTT connection...");
            // Attempt to connect
            if (pubSubClient.connect(clientName)) {
                Serial.println("connected");
                pubSubClient.subscribe(topic);
            } else {
                Serial.print("failed, rc=");
                Serial.print(pubSubClient.state());
                Serial.println(" try again in 5 seconds");
                delay(5000);
            }
        }
    */
}



