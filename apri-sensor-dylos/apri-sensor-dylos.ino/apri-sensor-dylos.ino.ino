/*------------------------------------------------------------------------------

Application for reading sensor data
  Plantower PMS7003/PMSA003 PM sensor (fine dust)

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
#include <SoftwareSerial.h> 
SoftwareSerial SerialDylos(14, 15); // serial ports RX, TX

char *sensorType[1];
int inputHigh = 0;
int inputLow = 0;
int inputByte = 0;
int inputByte1 = 0;

void setup() {
    Serial.begin(9600);
    while (!Serial) {
    }
    Serial.println("Serial port ready");
    SerialDylos.begin(9600);
    while (!SerialDylos) {
      
    }
    Serial1.begin(9600);
    while (!Serial1) {
      
    }
    
    sensorType[0] = "Dylos";
    
    Serial.println("Sensor port ready");
}

void loop() {
  // put your main code here, to run repeatedly:

  readData();

}

void readData() {


//  if (SerialDylos.available() <=0) {
//    //Serial.println('x'); 
//    return;
//  }
delay(10);
  //Serial1.write("L\n");
  //  Serial.print(".");
  
//  while (Serial.available()) {
//    inputByte = Serial.read();

// /   if (inputByte >= 48 && inputByte <= 57) {
//      Serial.print("\nA"); return;
//    }
  //  Serial.print("\nx"); 
//    Serial.print(inputByte); return;
//  }
  while (Serial1.available()) {
    inputByte1 = Serial1.read();

    if (inputByte1 == 0) {
      Serial.print("."); return;
    }

    if (inputByte1 >= 48 && inputByte1 <= 57) {
      Serial.print("\nA"); return;
    }
    Serial.print("\nx"); 
    Serial.print(inputByte1); return;
  }
return;

   inputByte1 = SerialDylos.read();
Serial.println(inputByte1); return;
  
  if (inputByte == ",") { //44
    Serial.print(","); return;
  }
  if (inputByte >= 48 && inputByte <= 57) {
    Serial.print("A"); return;
  }
  if (inputByte == 255) {
    Serial.print("\n"); return;
  }
  if (inputByte == 0) {
    return;
  }
  if (inputByte == -1) {
    return;
  }
    //Serial.print(".");
    Serial.print(inputByte);  
    

return;
  
  if (SerialDylos.read() != 44) {
    Serial.print("\nloop KOMMA !! ");
    //Serial.print(SerialDylos.read());
    Serial.print(SerialDylos.read());
    Serial.print(" ");
    Serial.print(SerialDylos.read());
    Serial.print(" ");
 } else {
    Serial.print(".");  
 }

  
  
}

