
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
const byte VersionMajor = 0;
const byte VersionMinor = 1;


const uint8_t UNIT_ID = 1; // todo: dipswitch or otherwise? >100 for recievers/pulsers/repeaters

const byte channelId4b = 7;  // 0-15 left 4 bits for channel identification, xxxx .... -> 1111 0000 = channel 15
const byte extenderId2b = 0; // 1-7, 0 is for sensor. left most 2 bits of right most 4 bits for extender identification, .... xx.. = extender 3 of channel 15 
// extender skips messages sent by the same extender by checking extenderId bits. Retransmitted messages get +1 until rightmost two bits = 11 
// when extending a message, the channelId will ++ (plus one) until max '11b' = 3
// sensor sends ccccxx00. first extender: ccccxx01, second ccccxx10, third and last try: ccccxx11

const uint8_t MSG_ID = channelId4b<<4; // default channelId use setChannel/getChannel methodes to set/get channel id. extenderId=0,msgcount=0;
// extender fills in its own extenderid when extending a message.

#include <RH_ASK.h>
//#include <SPI.h> // Not actually used but needed to compile
RH_ASK rfDriver;
RH_ASK *rfDriverPtr;
// RH_ASK rfDriver(2000, 2, 4, 5); // ESP8266: do not use pin 11
byte syncBuf[RH_ASK_MAX_MESSAGE_LEN];
uint8_t syncBuflen = sizeof(syncBuf);
// RF

#include "ApriSensorAll.h"
#include "ApriSensorPmsx003.h"

//#include <AES.h> //todo encryption

void setup() {
  Serial.begin(9600);
  while (!Serial) {
  }
  printPrefix(INFO);Serial.print("Setup start\r\n");
  if (!rfDriver.init()) {
    printPrefix(INFO);Serial.print("RF init failed\r\n");
  }

  printPrefix(INFO);Serial.print("Sensors ready\r\n");

  delay(1000); // 1 sec delay for sensors to start / initiate

}

void loop() {

  aprisensor_ns::Pmsx003Sensor pmsx003Sensor;
  pmsx003Sensor.init();

  while (1) {

    //printPrefix(INFO);Serial.print("PMSX003\r\n");
    pmsx003Sensor.readData();

    pmsx003Sensor.readSyncMsg();
    
    if (syncMsgActive == true) {
      long _delay = 500 + 500*UNIT_ID;
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

  }

} // end loop()

