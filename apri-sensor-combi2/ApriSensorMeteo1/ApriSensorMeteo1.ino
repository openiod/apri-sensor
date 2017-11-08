
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

//-----------------------------------------------------------------------------
#include <avr/pgmspace.h>

const byte PROGMEM VersionMajor = 0;
const byte PROGMEM VersionMinor = 1;

#include <Wire.h>

const uint8_t PROGMEM UNIT_ID = 5; // todo: dipswitch or otherwise?

const byte PROGMEM channelId4b = 7;  // 0-15 left 4 bits for channel identification, xxxx .... -> 1111 0000 = channel 15
const byte PROGMEM extenderId2b = 0; // 1-7, 0 is for sensor. left most 2 bits of right most 4 bits for extender identification, .... xx.. = extender 3 of channel 15 
// extender skips messages sent by the same extender by checking extenderId bits. Retransmitted messages get +1 until rightmost two bits = 11 
// when extending a message, the channelId will ++ (plus one) until max '11b' = 3
// sensor sends ccccxx00. first extender: ccccxx01, second ccccxx10, third and last try: ccccxx11
// extender fills in its own extenderid when extending a message.

const uint8_t PROGMEM MSG_ID = channelId4b<<4; // default channelId use setChannel/getChannel methodes to set/get channel id. extenderId=0,msgcount=0;

#include <RH_ASK.h>
RH_ASK rfDriver; //(1000,11,12);
RH_ASK *rfDriverPtr;
// RH_ASK rfDriver(2000, 2, 4, 5); // ESP8266: do not use pin 11
//byte syncBuf[RH_ASK_MAX_MESSAGE_LEN];
//uint8_t syncBuflen = sizeof(syncBuf);
byte syncBuf[4];
uint8_t syncBuflen = 4;
// RF

const PROGMEM String SYNCDELAY= "I@Sync delay is ";

#include "ApriSensorMeteo.h"
#include "ApriSensorBmp280.h"
#include "ApriSensorAm2320.h"
#include "ApriSensorDs18b20.h"

//#include <AES.h> //todo encryption

  aprisensor_ns::Bmp280Sensor bmp280Sensor;
  aprisensor_ns::Am2320Sensor am2320Sensor;
  aprisensor_ns::Ds18b20Sensor ds18b20Sensor;


void setup() {
  rfDriverPtr = &rfDriver;
  Serial.begin(9600);
  while (!Serial) {
  }
//  printPrefix(MSGTYPE_INFO);Serial.print("Setup start\r\n");
  if (!rfDriver.init()) {
    printPrefix(MSGTYPE_INFO);//Serial.print("RF init failed\r\n");
  }

  printPrefix(MSGTYPE_INFO);//Serial.print("Sensors ready\r\n");

  bmp280Sensor.init();
  am2320Sensor.init();
  ds18b20Sensor.init();
  
  delay(1000); // 1 sec delay for sensors to start / initiate

}

void loop() {
    
//  while (1) {

//    printPrefix(INFO);Serial.print("BMP280");
    bmp280Sensor.readData();

//    printPrefix(INFO);Serial.print("AM2320");
    am2320Sensor.readData();

   // if (ds18b20Sensor.serialReady()==0 ) {
    ds18b20Sensor.readData();
    //}  

    if ((*rfDriverPtr).recv(syncBuf, &syncBuflen)) { // Non-blocking receiveSyncMsg();
        //Serial.print(" process Sync \r\n");
        //      if (rfDriver.recv(syncBuf, &syncBuflen)) { // Non-blocking receiveSyncMsg();
        receiveSyncMsg();
    };
    if (syncMsgActive == true) {
      long _delay = 500 + 500*UNIT_ID;
      Serial.print(SYNCDELAY);
      Serial.print(_delay);
      Serial.print(NEWLINE);
      delay((10 + 500*UNIT_ID));  // 1 sec after sync plus unitid x secs delaytime
      bmp280Sensor.sendResults();
      delay(100);
      am2320Sensor.sendResults();
      delay(100);
      ds18b20Sensor.sendResults();
      syncMsgActive = false;
    }
    if (syncMsgActive == true && millis() - syncMsgTime >= syncMaxTime) {
      syncMsgActive = false;
      //Serial.print("W@Sync time is deactivated");
      //Serial.print(NEWLINE);          
      return;          
    }

//  }

} // end loop()

