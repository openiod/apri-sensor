
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

#include <Wire.h>
#include <AM2320.h>

#include <RH_ASK.h>
//#include <SPI.h> // Not actually used but needed to compile
RH_ASK rfDriver;
// RH_ASK rfDriver(2000, 2, 4, 5); // ESP8266: do not use pin 11
// RF

const uint8_t CHANNEL_ID = 123; // default channelId use setChannel/getChannel methodes to set/get channel id
const uint8_t UNIT_ID = 5; // todo: dipswitch or otherwise?

#include "ApriSensorMeteo.h"
#include "ApriSensorBmp280.h"
#include "ApriSensorAm2320.h"
#include "ApriSensorDs18b20.h"

//#include <AES.h> //todo encryption



void setup() {
  Serial.begin(9600);
  while (!Serial) {
  }
  printPrefix(INFO);Serial.print("Setup start\n");
  if (!rfDriver.init()) {
    printPrefix(INFO);Serial.print("RF init failed\n");
  }

  printPrefix(INFO);Serial.print("Sensors ready\n");

  delay(2000); // 2 sec delay for sensors to start / initiate

}

void loop() {

  aprisensor_ns::Bmp280Sensor bmp280Sensor;
  bmp280Sensor.init();

  aprisensor_ns::Am2320Sensor am2320Sensor;
  am2320Sensor.init();

  aprisensor_ns::Ds18b20Sensor ds18b20Sensor;
  ds18b20Sensor.init();


  while (1) {

//    printPrefix(INFO);Serial.print("BMP280");
    bmp280Sensor.readData();

//    printPrefix(INFO);Serial.print("AM2320");
    am2320Sensor.readData();

   // if (ds18b20Sensor.serialReady()==0 ) {
      ds18b20Sensor.readData();
    //}  

  }

} // end loop()

