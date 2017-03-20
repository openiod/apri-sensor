
//------------------------------------------------------------------------------
//  PM sensor PMS7003 (fine dust)

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

void setup() {
    Serial.begin(9600);
    while (!Serial) {
    }
    Serial.println("Serial port ready");
    Serial1.begin(9600);
    while (!Serial1) {
    }
    while (Serial1.read()!=-1) {};  //clear buffer
    Serial.println("Sensor port ready");
}

bool pms7003ReadData() {
    
//    while (Serial1.read()!=-1) {};  //clear buffer

    if (Serial1.available() < 32) {
      if (Serial1.available() == 0) {
        delay(150);
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

    delay(700);  // higher will get you checksum errors
      
    return;
}


void loop () {
    pms7003ReadData();
}
