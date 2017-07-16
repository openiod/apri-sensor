
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

//RF
long sessionNr;
unsigned long messageNr;
#include <RH_ASK.h>
//#include <SPI.h> // Not actually used but needed to compile
RH_ASK rfDriver;
// RH_ASK rfDriver(2000, 2, 4, 5); // ESP8266: do not use pin 11
//RF

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
uint16_t serial1Available;
int serial1Byte1;
int serial1Byte2;
// fine dust PMS7003/PMSA003 =====

// ozone MQ131  ====
int mq131AnalogPin = 3;     // potentiometer wiper (middle terminal) connected to analog pin 3
//int mq131AnalogPin4 = 4;
int mq131Val = 0;           // variable to store the value read
// ozone MQ131  ====

void setup() {

    //pinMode(analogFanPin, OUTPUT);
    //analogWrite(analogFanPin,0);

    sessionNr = 0;
    messageNr = 0;
    
    Serial.begin(9600);
    while (!Serial) {
    }
    Serial.println("Setup start");

    if (!rfDriver.init()) {
      Serial.println("RF init failed");
    } else {
      sessionNr = 1;  
    }
    
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


// fine dust PMS7003/A003 =====
   Serial1.begin(9600);
//   while (!Serial1) {
//      Serial.println("Could not find a valid PMSx003 sensor, check wiring!");    
//   }
   sensorType[0] = "PMSx003";
// fine dust PMS7003 PMSA003 =====

//for (int i = 0 ; i < 200 ; i++)
//  {

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
//delay (3000) ;
//  }



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

    loopTime = millis() - loopStartTime;

    if (loopTime > 1000) 
    {
      BMP280_read();
      AM2320_read();
      DS18B20_read();
     // MQ131_read();
      loopStartTime = millis();  //restart measure cycle
    }

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
    if (Serial1) {
      pmsx003ReadData();
    }
// fine dust PMS7003/A003 =====
}

bool pmsx003ReadData() {

    
//    while (Serial1.read()!=-1) {};  //clear buffer
    
    serial1Available = Serial1.available();

    if (serial1Available < 32) {
      return;
      if (serial1Available < 1) {
//        delay(150);
//        Serial.println("##############################");
//        BMP280_read();
//        AM2320_read();
//        DS18B20_read();
//        MQ131_read();
        //delay(10);
        return;
      };
      Serial.println(serial1Available);
      if (serial1Available > 16) {
        //delay(30);
        return;
      };
      if (serial1Available > 0) {
        //delay(30);
        return;
      };
      //delay(100);
      return;
    }
    
//    Serial.print("Serial1 available: ");
//    Serial.println(serial1Available);

    serial1Byte1 = Serial1.read();
    if (serial1Byte1 != 0x42) {
      while (Serial1.read()!=-1) {};  //clear buffer
      Serial.print("Serial1 msg Byte 1: ");
      Serial.println(serial1Byte1);
      return;
    }
    serial1Byte2 = Serial1.read();
    if (serial1Byte2 != 0x4D) {
      Serial.print("Serial1 msg Byte 2: ");
      Serial.println(serial1Byte2);
      return;
    }

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
    Serial.print(";"); 
    Serial.print(concPM2_5_CF1);
    Serial.print(";"); 
    Serial.print(concPM10_0_CF1);
    Serial.print(";"); 
    Serial.print(concPM1_0_amb);
    Serial.print(";"); 
    Serial.print(concPM2_5_amb);
    Serial.print(";"); 
    Serial.print(concPM10_0_amb);
    Serial.print(";"); 
    Serial.print(rawGt0_3um);
    Serial.print(";"); 
    Serial.print(rawGt0_5um);
    Serial.print(";"); 
    Serial.print(rawGt1_0um);
    Serial.print(";"); 
    Serial.print(rawGt2_5um);
    Serial.print(";"); 
    Serial.print(rawGt5_0um);
    Serial.print(";"); 
    Serial.print(rawGt10_0um);
    Serial.print(";"); 
    Serial.print(version);
    Serial.print(";"); 
    Serial.print(errorCode);
    
    inputHigh = Serial1.read();
    inputLow = Serial1.read();
    checksum = inputLow+(inputHigh<<8);
    if (checksum != inputChecksum) {
      Serial.print(";"); 
      Serial.print(checksum); 
      Serial.print(";"); 
      Serial.print(inputChecksum); 
    }
    Serial.print("\n");

    while (Serial1.read()!=-1) {};  //clear buffer

//    BMP280_read();
//    AM2320_read();
//    DS18B20_read();
//    MQ131_read();
    
    //delay(700);  // 700 when other sensors not included // higher will get you checksum errors
    //delay(1000);     // 50  when other sensors are included //higher will get you checksum errors
      
    return;
}

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
        sendRfMessage(rfBuf);
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

void sendRfMessage(char rfBuf) {
    Serial.print("Send RF message:");
//    Serial.print(sessionNr);
//    Serial.print(";");
    messageNr++;
//    Serial.print(messageNr);
//    Serial.print(";");
    

    //const char *msg = messageNr + ";hello from testboard";

    char buf[40];
    sprintf(buf, "%lu;%s", messageNr, rfBuf);

//    rfDriver.send((uint8_t *)msg, strlen(msg));
    rfDriver.send(buf, strlen(buf));
    rfDriver.waitPacketSent();

    Serial.println(buf);
}


