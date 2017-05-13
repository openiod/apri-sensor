
/*------------------------------------------------------------------------------

Application for reading sensor data from multiple sensor
  Sensors: 
  - Plantower PMS7003/PMSA003 PM sensor (fine dust)
  - BMP280 air pressure incl. temperature and altitude
  - AM2320 relative humidity incl. temperature
  - DS18B20 teperature sensor 
  - MQ131 ozone sensor 

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
#include <Adafruit_BMP280.h>

#define BMP_SCK 13
#define BMP_MISO 12
#define BMP_MOSI 11 
#define BMP_CS 10

Adafruit_BMP280 bmp; // I2C

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
// Temperature DS18B20 ====

// fine dust PMS7003/PMSA003 =====
#include <SoftwareSerial.h> 
SoftwareSerial Serial1(10, 11); // serial ports RX, TX

// input byte variables
int inputHigh = 0;
int inputLow = 0;
// variable to caclulate checksum input variables
uint16_t inputChecksum = 0;
bool pms7003 = false;
char *sensorType[1]; // = "PMSx003"; //Plantower PMS7003 or PMSA003 
// sensor variables
uint16_t concPM1_0_CF1;
uint16_t concPM2_5_CF1;
uint16_t concPM10_0_CF1;
uint16_t concPM1_0_amb;
uint16_t concPM2_5_amb;
uint16_t concPM10_0_amb;
uint16_t rawGt0_3um;
uint16_t rawGt0_5um;
uint16_t rawGt1_0um;
uint16_t rawGt2_5um;
uint16_t rawGt5_0um;
uint16_t rawGt10_0um;
uint8_t  version;
uint8_t  errorCode;
uint16_t checksum;
// fine dust PMS7003/PMSA003 =====

// ozone MQ131  ====
int mq131AnalogPin = 3;     // potentiometer wiper (middle terminal) connected to analog pin 3
int mq131Val = 0;           // variable to store the value read
// ozone MQ131  ====

void setup() {
    Serial.begin(9600);
    while (!Serial) {
    }

    while (!bmp.begin()) {
      Serial.println("Could not find a valid BMP280 sensor, check wiring!");
    }  

    Wire.begin();

    // Temperature DS18B20 ====
    // Start up the library DS18B20
 //   sensors.begin();
    // Temperature DS18B20 ====

// fine dust PMS7003/A003 =====
   Serial1.begin(9600);
   while (!Serial1) {
      //Serial.println("Could not find a valid PMSx003 sensor, check wiring!");    
   }
   sensorType[0] = "PMSx003";
// fine dust PMS7003 PMSA003 =====

    Serial.println("Sensors ready");  
}

void loop() {

//  if (pms7003==false) {
//    Serial.println("Sensor PMS7003 not ready");
//    if (Serial1) {
//      while (Serial1.read()!=-1) {};  //clear buffer  
//      Serial.println("Sensor PMS7003 ready");
//      pms7003 = true;  
//    }  
 
    
//    BMP280_read();
//    AM2320_read();
//    DS18B20_read();
//    MQ131_read();
//    delay(1000);
//    return;
//  }

//Serial.println("Sensor PMS7003 get sensor data");  

// fine dust PMS7003/A003 =====
    pmsx003ReadData();
// fine dust PMS7003/A003 =====
}

bool pmsx003ReadData() {

    
//    while (Serial1.read()!=-1) {};  //clear buffer

    if (Serial1.available() < 32) {
      if (Serial1.available() == 0) {
//        delay(150);
        delay(600);
        return;
      };
      if (Serial1.available() > 16) {
        delay(10);
        return;
      };
      if (Serial1.available() > 0) {
        delay(30);
        return;
      };
      delay(100);
      return;
    }
    if (Serial1.read() != 0x42) return;
    if (Serial1.read() != 0x4D) return;

    inputChecksum = 0x42 + 0x4D;

    inputHigh = Serial1.read();
    inputLow = Serial1.read();
    inputChecksum += inputHigh + inputLow;
    if (inputHigh != 0x00) return; 
    if (inputLow != 0x1c) return;    

    inputHigh = Serial1.read();
    inputLow = Serial1.read();
    inputChecksum += inputHigh + inputLow;
    concPM1_0_CF1 = inputLow+(inputHigh<<8);

    inputHigh = Serial1.read();
    inputLow = Serial1.read();
    inputChecksum += inputHigh + inputLow;
    concPM2_5_CF1 = inputLow+(inputHigh<<8);

    inputHigh = Serial1.read();
    inputLow = Serial1.read();
    inputChecksum += inputHigh + inputLow;
    concPM10_0_CF1 = inputLow+(inputHigh<<8);

    inputHigh = Serial1.read();
    inputLow = Serial1.read();
    inputChecksum += inputHigh + inputLow;
    concPM1_0_amb = inputLow+(inputHigh<<8);

    inputHigh = Serial1.read();
    inputLow = Serial1.read();
    inputChecksum += inputHigh + inputLow;
    concPM2_5_amb = inputLow+(inputHigh<<8);

    inputHigh = Serial1.read();
    inputLow = Serial1.read();
    inputChecksum += inputHigh + inputLow;
    concPM10_0_amb = inputLow+(inputHigh<<8);

    inputHigh = Serial1.read();
    inputLow = Serial1.read();
    inputChecksum += inputHigh + inputLow;
    rawGt0_3um = inputLow+(inputHigh<<8);

    inputHigh = Serial1.read();
    inputLow = Serial1.read();
    inputChecksum += inputHigh + inputLow;
    rawGt0_5um = inputLow+(inputHigh<<8);

    inputHigh = Serial1.read();
    inputLow = Serial1.read();
    inputChecksum += inputHigh + inputLow;
    rawGt1_0um = inputLow+(inputHigh<<8);

    inputHigh = Serial1.read();
    inputLow = Serial1.read();
    inputChecksum += inputHigh + inputLow;
    rawGt2_5um = inputLow+(inputHigh<<8);

    inputHigh = Serial1.read();
    inputLow = Serial1.read();
    inputChecksum += inputHigh + inputLow;
    rawGt5_0um = inputLow+(inputHigh<<8);

    inputHigh = Serial1.read();
    inputLow = Serial1.read();
    inputChecksum += inputHigh + inputLow;
    rawGt10_0um = inputLow+(inputHigh<<8);

    inputLow = Serial1.read();
    inputChecksum += inputLow;
    version = inputLow;
                            
    inputLow = Serial1.read();
    inputChecksum += inputLow;
    errorCode = inputLow;

    if (version == 128) sensorType[0] = "PMS7003"; 
    if (version == 145) sensorType[0] = "PMSA003"; 

    Serial.print(sensorType[0]); 
    Serial.print(";"); 
    Serial.print(concPM1_0_CF1);
    Serial.print(';'); 
    Serial.print(concPM2_5_CF1);
    Serial.print(';'); 
    Serial.print(concPM10_0_CF1);
    Serial.print(';'); 
    Serial.print(concPM1_0_amb);
    Serial.print(';'); 
    Serial.print(concPM2_5_amb);
    Serial.print(';');     
    Serial.print(concPM10_0_amb);
    Serial.print(';');     
    Serial.print(rawGt0_3um);
    Serial.print(';');
    Serial.print(rawGt0_5um);
    Serial.print(';'); 
    Serial.print(rawGt1_0um);
    Serial.print(';'); 
    Serial.print(rawGt2_5um);
    Serial.print(';'); 
    Serial.print(rawGt5_0um);
    Serial.print(';'); 
    Serial.print(rawGt10_0um);
    Serial.print(';'); 
    Serial.print(version);
    Serial.print(';'); 
    Serial.print(errorCode);
    
    inputHigh = Serial1.read();
    inputLow = Serial1.read();
    checksum = inputLow+(inputHigh<<8);
    if (checksum != inputChecksum) {
      Serial.print(';'); 
      Serial.print(checksum); 
      Serial.print(';'); 
      Serial.print(inputChecksum); 
    }
    Serial.print('\n');

    BMP280_read();
    AM2320_read();
    DS18B20_read();
    MQ131_read();
    
    //delay(700);  // 700 when other sensors not included // higher will get you checksum errors
    delay(50);     // 50  when other sensors are included //higher will get you checksum errors
      
    return;
}

bool BMP280_read() {
    float pressureHPa = bmp.readPressure()/100;
    float seaLevelHPa = pressureHPa;

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
      Serial.print("AM2320");
      Serial.print(';');
      Serial.print(th.h);
      Serial.print(';');
//      Serial.print("%, temperature: ");
      Serial.println(th.t);
//      Serial.println("*C");
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
  Serial.println(sensors.getTempCByIndex(0)); // Why "byIndex"? 
    // You can have more than one IC on the same bus. 
    // 0 refers to the first IC on the wire
  // Temperature DS18B20 ====
  return;
}

bool MQ131_read() {
  // Ozone MQ131 ====
  mq131Val = analogRead(mq131AnalogPin);
  Serial.print("MQ131;");
  Serial.println(mq131Val);
  // Ozone MQ131 ====
  return;
}


