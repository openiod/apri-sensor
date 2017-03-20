
/*------------------------------------------------------------------------------

Application for reading sensor data from multiple sensor
  Sensors: 
  - Plantower PMS7003 PM sensor (fine dust)
  - BMP280 air pressure incl. temperature and altitude
  - AM2320 relative humidity incl. temperature
  - DS18B20 teperature sensor  

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

//------------------------------------------------------------------------------


//#include <Adafruit_Sensor.h>

#include <Wire.h>
//#include <SPI.h>
//#include <Adafruit_Sensor.h>
#include <Adafruit_BMP280.h>

#define BMP_SCK 13
#define BMP_MISO 12
#define BMP_MOSI 11 
#define BMP_CS 10

//#include <apri_barometer_bmp280.h>


Adafruit_BMP280 bmp; // I2C
//Adafruit_BMP280 bmp(BMP_CS); // hardware SPI
//Adafruit_BMP280 bmp(BMP_CS, BMP_MOSI, BMP_MISO,  BMP_SCK);

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

// fine dust PMS7003 =====
#include <SoftwareSerial.h> 
SoftwareSerial Serial1(10, 11); // serial ports RX, TX

// input byte variables
int inputHigh = 0;
int inputLow = 0;
// variable to caclulate checksum input variables
uint16_t inputChecksum = 0;
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
// fine dust PMS7003 =====


void setup() {
    Serial.begin(9600);
    while (!Serial) {
    }
//Adafruit_BMP280::Adafruit_BMP280();
// apri_barometer_bmp280.initSerial(); 
//Serial.println("test");
//  if (!bmp.begin()) {  
//    Serial.println("Could not find a valid BMP280 sensor, check wiring!");
//    while (1);
//  }

    while (!bmp.begin()) {
      Serial.println("Could not find a valid BMP280 sensor, check wiring!");
    }

    Wire.begin();

    // Temperature DS18B20 ====
    // Start up the library DS18B20
 //   sensors.begin();
    // Temperature DS18B20 ====

// fine dust PMS7003 =====
   Serial1.begin(9600);
      while (!Serial1) {
    }
    while (Serial1.read()!=-1) {};  //clear buffer
// fine dust PMS7003 =====

    Serial.println("Sensors ready");  
}

void loop() {


/*    
 *     
    Serial.print(F("Temperature = "));
    Serial.print(bmp.readTemperature());
    Serial.println(" *C");
    
    Serial.print(F("Pressure = "));
    Serial.print(pressureHPa);
    Serial.println(" hPa");

    Serial.print(F("Approx altitude = "));
//    Serial.print(bmp.readAltitude(1013.25)); // this should be adjusted to your local forcase
    Serial.print(bmp.readAltitude(seaLevelHPa)); // this should be adjusted to your local forcase
    Serial.println(" m");
    
    Serial.println();
*/


//    BMP280_read();
//    AM2320_read();
//    DS18B20_read();
//    delay(5000);
//return;


// fine dust PMS7003 =====
    pms7003ReadData();
// fine dust PMS7003 =====



}

bool pms7003ReadData() {

    
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

    Serial.print("PMS7003;"); 
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
    
    //delay(700);  // 700 when other sensors not included // higher will get you checksum errors
    delay(50);     // 50  when other sensors are included //higher will get you checksum errors
      
    return;
}

bool BMP280_read() {
    float pressureHPa = bmp.readPressure()/100;
    float seaLevelHPa = pressureHPa;

    Serial.print("BMP280");
    Serial.print(";");    Serial.print(bmp.readTemperature());
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

