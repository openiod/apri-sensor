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

#include <Wire.h>
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

#include <AM2320.h>


const uint8_t UNIT_ID = 5; // todo: dipswitch or otherwise? >100 for recievers/pulsers/repeaters

const byte channelId4b = 7;  // 0-15 left 4 bits for channel identification, xxxx .... -> 1111 0000 = channel 15
const byte extenderId2b = 0; // 1-7, 0 is for sensor. left most 2 bits of right most 4 bits for extender identification, .... xx.. = extender 3 of channel 15
// extender skips messages sent by the same extender by checking extenderId bits. Retransmitted messages get +1 until rightmost two bits = 11
// when extending a message, the channelId will ++ (plus one) until max '11b' = 3
// sensor sends ccccxx00. first extender: ccccxx01, second ccccxx10, third and last try: ccccxx11

const uint8_t MSG_ID = channelId4b << 4; // default channelId use setChannel/getChannel methodes to set/get channel id. extenderId=0,msgcount=0;
// extender fills in its own extenderid when extending a message.

/* #include <RH_ASK.h>
  //#include <SPI.h> // Not actually used but needed to compile
  RH_ASK rfDriver;
  RH_ASK *rfDriverPtr;
  // RH_ASK rfDriver(2000, 2, 4, 5); // ESP8266: do not use pin 11
  byte syncBuf[RH_ASK_MAX_MESSAGE_LEN];
  uint8_t syncBuflen = sizeof(syncBuf);
  // RF
*/
#include "ApriSensorMeteo.h"
#include "ApriSensorBmp280.h"
#include "ApriSensorAm2320.h"
#include "ApriSensorDs18b20.h"
#include "ApriSensorPmsx003.h"

//#include <AES.h> //todo encryption

aprisensor_ns::Bmp280Sensor bmp280Sensor;
aprisensor_ns::Am2320Sensor am2320Sensor;
aprisensor_ns::Ds18b20Sensor ds18b20Sensor;
aprisensor_ns::Pmsx003Sensor pmsx003Sensor;

void setup() {
  // put your setup code here, to run once:
  Serial.begin(9600);
  USE_SERIAL.begin(9600);
  // USE_SERIAL.setDebugOutput(true);
  //printPrefix(INFO); 
  Serial.print("Setup start\r\n");
  Wire.begin(D1, D2);
  //  if (!rfDriver.init()) {
  //    printPrefix(INFO);Serial.print("RF init failed\r\n");
  //  }


  //  pubSubClient.setServer(mqttServerName, 1883);
  wifiConnect();
  String macAddress = WiFi.macAddress();
  foi = "SCWM" + macAddress.substring(0,2) + macAddress.substring(3,5) + macAddress.substring(6,8) + macAddress.substring(9,11) +macAddress.substring(12,14) +macAddress.substring(15,17) + + "\0";

  printPrefix(INFO); Serial.print("Sensors ready\r\n");

  bmp280Sensor.init();
  am2320Sensor.init();
  ds18b20Sensor.init();
  pmsx003Sensor.init();


  //  delay(1000); // 1 sec delay for sensors to start / initiate

}

void loop() {
  // aprisensor_ns::Bmp280Sensor bmp280Sensor;
  //  bmp280Sensor.init();
  //  aprisensor_ns::Am2320Sensor am2320Sensor;
  //  am2320Sensor.init();
  //Serial.print("3\r\n");

  //  while (1) {

  //    printPrefix(INFO);Serial.print("BMP280");
  bmp280Sensor.readData();
  //   printPrefix(INFO);Serial.print("AM2320");
  am2320Sensor.readData();
    //   printPrefix(INFO);Serial.print("DS18B20");
  ds18b20Sensor.readData();
  pmsx003Sensor.readData();

  return;

/*

  //Serial.print("4");
  //    pmsx003Sensor.readSyncMsg();

  WiFiClient client = server.available();
  if (!client) {
    return;
  }
  if (client.available()) {
    // Read the first line of the request
    String request = client.readStringUntil('\r');
    Serial.println(request);
    client.flush();
    // Return the response
    client.println("HTTP/1.1 200 OK");
    client.println("Content-Type: text/html");
    client.println(""); //  do not forget this one
    client.println("<!DOCTYPE HTML>");
    client.println("<html>");

    client.print("Led pin is now: ");

    client.print("This is a test");
    client.println("<br><br>");
    client.println("Click <a href=\"/LED=ON\">here</a> turn the LED on pin 2 ON<br>");
    client.println("Click <a href=\"/LED=OFF\">here turn the LED on pin 2 OFF<br>");
    client.println("</html>");

    delay(1);
    Serial.println("Client disconnected");
    Serial.println("");
    //continue;
    return;
    //  }
    //  client.flush();


  }
  
*/
  
  /*

    if (syncMsgActive == true) {
        long _delay = 50 + 500*UNIT_ID;
        Serial.print("I@Sync delay is ");
        Serial.print(_delay);
        Serial.print("\r\n");
        delay((10 + 500*UNIT_ID));  // 1 sec after sync plus unitid x secs delaytime
        pmsx003Sensor.sendResults();
        syncMsgActive = false;
      }
      if (syncMsgActive == true && millis() - syncMsgTime >= syncMaxTime) {
          syncMsgActive = false;
          Serial.print("W@Sync time is deactivated");
          Serial.print("\r\n");
          return;
        }
  */



  /*

    // Wait until the client sends some data
    Serial.println("new client");
    while(!client.available()){
      delay(1);
    }

    if (client.available()) {
      // Read the first line of the request
      String request = client.readStringUntil('\r');
      Serial.println(request);
      client.flush();

    // Return the response
    client.println("HTTP/1.1 200 OK");
    client.println("Content-Type: text/html");
    client.println(""); //  do not forget this one
    client.println("<!DOCTYPE HTML>");
    client.println("<html>");

    client.print("Led pin is now: ");

    client.print("This is a test");
    client.println("<br><br>");
    client.println("Click <a href=\"/LED=ON\">here</a> turn the LED on pin 2 ON<br>");
    client.println("Click <a href=\"/LED=OFF\">here turn the LED on pin 2 OFF<br>");
    client.println("</html>");

    delay(1);
    Serial.println("Client disconnected");
    Serial.println("");
    }
      payload="test%";
  */
  /*
         if (pubSubClient.connected()) {
          if (pubSubClient.publish(topic, (char*) payload.c_str())) {
              Serial.print("Publish ok (");
              Serial.print(payload);
              Serial.println(")");
          } else {
              Serial.println("Publish failed");
          }
      } else {
         // mqttReConnect();
      }
  */
  //  }

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



