
/*------------------------------------------------------------------------------

  Application for reading sensor data from multiple sensor
  Sensors:
  - Plantower PMS7003/PMSA003 PM sensor (fine dust)
  - BMP280 air pressure incl. temperature and altitude
  - AM2320 relative humidity incl. temperature
  - DS18B20 teperature sensor
  - MQ131 ozone sensor

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

#include "ApriSensorCombi2.h"
#include <AES.h>

uint8_t UNIT_ID = 4; // todo: dipswitch or otherwise?

long sessionNr;
//byte byteHigh;
//byte byteLow;


#include <Wire.h>
#include <Adafruit_BMP280.h>

unsigned long loopStartTime;
unsigned long loopTime = 0;
//int analogFanPin = 7;

// available sensors
//boolean BMP280_available = false;
//boolean AM2320_available = false;
//boolean DS18B20_available = false;
//boolean PMSx003_available = false;
//boolean MQ131_available = false;

#define BMP_SCK 13
#define BMP_MISO 12
#define BMP_MOSI 11
#define BMP_CS 10


/*
  Adafruit_BMP280 bmp; // I2C
  long bmp280InitTime;
  long bmp280InitInterval = 10000; //10 seconden init wait time


  // AM320 =======
  #include <AM2320.h>
  AM2320 th;
  // AM320 =======

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

// ozone MQ131  ====
int mq131AnalogPin = 3;     // potentiometer wiper (middle terminal) connected to analog pin 3
//int mq131AnalogPin4 = 4;
int mq131Val = 0;           // variable to store the value read
// ozone MQ131  ====

void setup() {
  Serial.begin(9600);
  while (!Serial) {
  }
  Serial.println("Setup start");

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

  pinMode(mq131AnalogPin, INPUT);
  //   digitalWrite(mq131AnalogPin, INPUT_PULLUP);

  Serial.println("Sensors ready");

  delay(4000); // 5 sec delay for sensors to start / initiate
  // analogWrite(analogFanPin,255);
  delay(1000); // 5 sec delay for sensors to start / initiate
  loopStartTime = millis();
  delay(1);
}

void loop() {

  aprisensorns::Sensor mySensor;
  mySensor.setState('On');
  mySensor.init();
  mySensor.setUnitId(UNIT_ID); 

  /*
    bool BMP280_read() {

      // wait some time while in init fase (also during soft reset)
      if ( millis() - bmp280InitTime < bmp280InitInterval ) {
        //Serial.println("bmp280 init fase");
        return;
      }

      float pressure = bmp.readPressure();
      if (pressure == 0) {
        //Serial.println("No value for BMP280 found");
        return;
      }
      float pressureHPa = pressure/100;
      float seaLevelHPa = pressureHPa;
      float temperature = bmp.readTemperature();

      // reset sensor when temperature value below -100
      if (temperature < -100) {
        Serial.println("start bmp280 soft reset");
        bmp.begin();
        bmp280InitTime = millis();
        return;
      }


      Serial.print("BMP280");
      Serial.print(";");
      Serial.print(bmp.readTemperature());
      Serial.print(";");
      Serial.print(pressureHPa);
      Serial.print(";");
      Serial.print(bmp.readAltitude(seaLevelHPa)); // this should be adjusted to your local forcase
      Serial.println();
    }
    bool AM2320_read() {

      // AM2320 =======
    switch(th.Read()) {
      case 2:
        Serial.println("CRC failed");
        break;
      case 1:
        Serial.println("Sensor offline");
        break;
      case 0:
        char rfBuf[50];
        sprintf(rfBuf, "AM2320;%lu;%lu",th.h,th.t);

        Serial.print("AM2320");
        Serial.print(";");
        Serial.print(th.h);
        Serial.print(";");
    //      Serial.print("%, temperature: ");
        Serial.println(th.t);
    //      Serial.println("*C");

        if (sessionNr >0)
          sendRfMessage(rfBuf, 5, MSGTYPE_NEW); //new message
        break;
    }
    // AM2320 =======
    }

    bool DS18B20_read() {
    // Temperature DS18B20 ====
    // call sensors.requestTemperatures() to issue a global temperature
    // request to all devices on the bus
    //Serial.print(" Requesting temperatures...");
    sensors.requestTemperatures(); // Send the command to get temperatures
    //Serial.println("DONE");
    Serial.print("DS18B20;");
    //  Serial.println(sensors.getTempCByIndex(0)); // Why "byIndex"? Index is the i-th sensor on I2C setting.
    Serial.println(sensors.getTempC(tempDeviceAddress));
      // You can have more than one IC on the same bus.
      // 0 refers to the first IC on the wire
    // Temperature DS18B20 ====
    return;
    }

    bool MQ131_read() {
    // Ozone MQ131 ====
    mq131Val = analogRead(mq131AnalogPin);
    if (mq131Val == 0) return;
    Serial.print("MQ131;");
    Serial.println(mq131Val);
    // Ozone MQ131 ====
    return;
    }

    // function to print a device address
    void printAddress(DeviceAddress deviceAddress)
    {
    for (uint8_t i = 0; i < 8; i++)
    {
      if (deviceAddress[i] < 16) Serial.print("0");
      Serial.print(deviceAddress[i], HEX);
    }
    }
  */

  while (1) {
    loopTime = millis() - loopStartTime;

    if (loopTime > 1000)
    {
      //      BMP280_read();
      //      AM2320_read();
      //      DS18B20_read();
      // MQ131_read();
      loopStartTime = millis();  //restart measure cycle
    }

    //    BMP280_read();
    //    AM2320_read();
    //    DS18B20_read();
    //    MQ131_read();
    //    delay(1000);
    //    return;
    //  }

    //Serial.println("Sensor PMS7003 get sensor data");
    // fine dust PMS7003/A003 =====
    if (mySensor.serialReady() ) {
      mySensor.readData();
    }
    // fine dust PMS7003/A003 =====

  }

} // end loop()

