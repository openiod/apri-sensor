
/*------------------------------------------------------------------------------

  Application for reading sensor data from multiple sensor
  Sensors:
  - Plantower PMS7003/PMSA003 PM sensor (fine dust)
  - BMP280 air pressure incl. temperature and altitude
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
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>

Adafruit_BME280 bme; // I2C

unsigned long delayTime;

//#define SEALEVELPRESSURE_HPA (1013.25)
#define SEALEVELPRESSURE_HPA (1015.50)

/*
#include <RH_ASK.h>
//#include <SPI.h> // Not actually used but needed to compile
RH_ASK rfDriver;
// RH_ASK rfDriver(2000, 2, 4, 5); // ESP8266: do not use pin 11
// RF
*/
//const uint8_t CHANNEL_ID = 123; // default channelId use setChannel/getChannel methodes to set/get channel id
//const uint8_t UNIT_ID = 5; // todo: dipswitch or otherwise?

//#include "ApriSensor.h"
//#include "ApriSensorPmsx003.h"
//#include "ApriSensorBmp280.h"
//#include "ApriSensorDs18b20.h"

//#include <AES.h>


//long sessionNr;
//unsigned long loopStartTime;
//unsigned long loopTime = 0;

/*
  Adafruit_BMP280 bmp; // I2C
  long bmp280InitTime;
  long bmp280InitInterval = 10000; //10 seconden init wait time


  // Temperature DS18B20 ====
  #include <OneWire.h>
  #include <DallasTemperature.h>
  // Data wire is plugged into pin 2 on the Arduino
  #define ONE_WIRE_BUS 2
  // Setup a oneWire instance to communicate with any OneWire devices
  // (not just Maxim/Dallas temperature ICs)
  OneWire oneWire(ONE_WIRE_BUS);
  // Pass our oneWire reference to Dallas Temperature.
  DallasTemperature sensors(&oneWire);
  int numberOfDevices; // Number of temperature devices found
  DeviceAddress tempDeviceAddress; // We'll use this variable to store a found device address
  #define TEMPERATURE_PRECISION 12 // 12=higher resolution
  // Temperature DS18B20 ====
*/
/*
// ozone MQ131  ====
int mq131AnalogPin = 3;     // potentiometer wiper (middle terminal) connected to analog pin 3
//int mq131AnalogPin4 = 4;
int mq131Val = 0;           // variable to store the value read
// ozone MQ131  ====
*/

void setup() {
  Serial.begin(9600);
  while (!Serial) {
  }
  Serial.println("Setup start");

  unsigned status;

  // default settings
    //status = bme.begin();  
    // You can also pass in a Wire library object like &Wire2
//    Wire.begin(D1, D2);
    Wire.begin(D6, D5);
    status = bme.begin(0x76, &Wire);
    if (!status) {
        Serial.println("Could not find a valid BME280 sensor, check wiring, address, sensor ID!");
        Serial.print("SensorID was: 0x"); Serial.println(bme.sensorID(),16);
        Serial.print("        ID of 0xFF probably means a bad address, a BMP 180 or BMP 085\n");
        Serial.print("   ID of 0x56-0x58 represents a BMP 280,\n");
        Serial.print("        ID of 0x60 represents a BME 280.\n");
        Serial.print("        ID of 0x61 represents a BME 680.\n");
        while (1) delay(10);
    }
    
    Serial.println("-- Default Test --");
    delayTime = 1000;

    Serial.println();


/*
  if (!rfDriver.init()) {
    Serial.println("RF init failed");
  }
*/

  //Wire.begin();
 /*
      bmp.begin();
    //    while (!bmp.begin()) {
    //      Serial.println("Could not find a valid BMP280 sensor, check wiring!");
    //    }
    //    Serial.println("BMP280 sensor connected");
      bmp280InitTime = millis();
      Serial.println("start bmp280 init fase");

      Wire.begin();

      // Temperature DS18B20 ====
      // Start up the library DS18B20
      sensors.begin();

     // Grab a count of devices on the wire
    numberOfDevices = sensors.getDeviceCount();

    // locate devices on the bus
    Serial.print("Locating devices...");

    Serial.print("Found ");
    Serial.print(numberOfDevices, DEC);
    Serial.println(" devices.");

    // report parasite power requirements
    Serial.print("Parasite power is: ");
    if (sensors.isParasitePowerMode()) Serial.println("ON");
    else Serial.println("OFF");
    //Serial.print("DS18B20_resolution;");
    //Serial.println(sensors.getResolution());
    //Serial.print("DS18B20_resolution_global;");
    //Serial.println(sensors.getResolution());
    sensors.setResolution(12);
    Serial.print("DS18B20_powersupply;");
    Serial.println(sensors.readPowerSupply(0));
      // Loop through each device, print out address
    for(int i=0;i<numberOfDevices; i++)
    {
      // Search the wire for address
      if(sensors.getAddress(tempDeviceAddress, i))
    {
      Serial.print("Found device ");
      Serial.print(i, DEC);
      Serial.print(" with address: ");
      printAddress(tempDeviceAddress);
      Serial.println();

      Serial.print("Setting resolution to ");
      Serial.println(TEMPERATURE_PRECISION, DEC);

      // set the resolution to TEMPERATURE_PRECISION bit (Each Dallas/Maxim device is capable of several different resolutions)
      sensors.setResolution(tempDeviceAddress, TEMPERATURE_PRECISION);

       Serial.print("Resolution actually set to: ");
      Serial.print(sensors.getResolution(tempDeviceAddress), DEC);
      Serial.println();
    }else{
      Serial.print("Found ghost device at ");
      Serial.print(i, DEC);
      Serial.print(" but could not detect address. Check power and cabling");
    }
    }

    //Serial.print("DS18B20_resolution;");
    //Serial.println(sensors.getResolution());
    //Serial.print("DS18B20_resolution_global;");
    //Serial.println(sensors.getResolution());
      // Temperature DS18B20 ====
  */

  /*    Serial.println ("pin 3") ;
      pinMode (mq131AnalogPin, INPUT) ;
      Serial.print (analogRead (mq131AnalogPin) * 5.0 / 1024) ; Serial.println ("V when an input") ;Serial.println (analogRead (mq131AnalogPin) ) ;
      pinMode (mq131AnalogPin, INPUT_PULLUP) ;
      delay (300) ;
      Serial.print (analogRead (mq131AnalogPin) * 5.0 / 1024) ;  Serial.println ("V when an pulled up input") ;Serial.println (analogRead (mq131AnalogPin) ) ;
      pinMode (mq131AnalogPin, OUTPUT) ;
      delay (300) ;
      Serial.print (analogRead (mq131AnalogPin) * 5.0 / 1024) ; Serial.println ("V when an output") ;Serial.println (analogRead (mq131AnalogPin) ) ;
  */
  /*

      Serial.println ("pin 4") ;
      pinMode (mq131AnalogPin4, INPUT) ;
      Serial.print (analogRead (mq131AnalogPin4) * 5.0 / 1024) ; Serial.println ("V when an input") ;Serial.println (analogRead (mq131AnalogPin4) ) ;
      pinMode (mq131AnalogPin4, INPUT_PULLUP) ;
      delay (300) ;
      Serial.print (analogRead (mq131AnalogPin4) * 5.0 / 1024) ;  Serial.println ("V when an pulled up input") ;Serial.println (analogRead (mq131AnalogPin4) ) ;
      pinMode (mq131AnalogPin4, OUTPUT) ;
      delay (300) ;
      Serial.print (analogRead (mq131AnalogPin4) * 5.0 / 1024) ; Serial.println ("V when an output") ;Serial.println (analogRead (mq131AnalogPin4) ) ;
  */

//  pinMode(mq131AnalogPin, INPUT);
//  //   digitalWrite(mq131AnalogPin, INPUT_PULLUP);

//  Serial.println("Sensors ready");

//  delay(6000); // 6 sec delay for sensors to start / initiate
  // analogWrite(analogFanPin,255);
//  delay(1000); // 5 sec delay for sensors to start / initiate
//  loopStartTime = millis();
//  delay(1);
}

void loop() {

  printValues();
  delay(delayTime);
  return;

} // end loop()


void printValues() {
    Serial.print("Temperature = ");
    Serial.print(bme.readTemperature());
    Serial.println(" °C");

    Serial.print("Pressure = ");

    Serial.print(bme.readPressure() / 100.0F);
    Serial.println(" hPa");

    Serial.print("Approx. Altitude = ");
    Serial.print(bme.readAltitude(SEALEVELPRESSURE_HPA));
    Serial.println(" m");

    Serial.print("Humidity = ");
    Serial.print(bme.readHumidity());
    Serial.println(" %");

    Serial.println();
}

