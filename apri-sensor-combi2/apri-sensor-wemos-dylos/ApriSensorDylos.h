#pragma once

#define rxPin D3
//D1 werkt goed met db9 kabel  
//D3 werkt goed met db9 kabel
#define txPin D2
const byte numChars = 32;
SoftwareSerial dylosSerial= SoftwareSerial(rxPin, txPin);

namespace aprisensor_ns {

class DylosSensor {

  private:
    
    char receivedChars[numChars];  // an array to store the received data
    boolean newData = false;
    String sensorSystem = "scapeler_dylos\0";
    long dylosInitTime;
    long dylosInitInterval = 100; //0.1 seconden init wait time
    float pm10;
    float pm25;
  public:
    DylosSensor() {};
    void init() {
      this->dylosInitTime = millis();
      Serial.print("start dylos init fase\r\n");
    };
    void readData() {

      // wait some time while in init fase (also during soft reset)
      if ( millis() - this->dylosInitTime < this->dylosInitInterval ) {
        return;
      }
      static byte ndx = 0;
      byte endMarker = '\n';
      byte rc;
      double val1=0;
      double val2=0;
      double tmpResult=0;

      while (Serial.available() > 0 && newData == false) {
        rc = Serial.read();
        delay(1);
        if (rc != endMarker) {
          receivedChars[ndx] = rc;
          ndx++;
          if (ndx >= numChars) {
            ndx = numChars - 1;
          }
          byte value = rc-48;
          if ((value>=0) && (value<=9)) {
            tmpResult = (tmpResult*10)+value;
            //delay(10); // deze moet erin anders komt tmpResult op nul te staan, vreemd toch!?
            continue;
          }
          if (rc==',') { //separator between PM25 and PM10 values
            val1 = tmpResult;
            tmpResult = 0; 
          }
        } else {
          val2 = tmpResult;
          receivedChars[ndx] = '\0'; // terminate the string
          ndx = 0;
          newData = true;
        }
      }
      while (dylosSerial.available() > 0 && newData == false) {
        rc = dylosSerial.read();
        delay(1);
        if (rc != endMarker) {
          receivedChars[ndx] = rc;
          ndx++;
          if (ndx >= numChars) {
            ndx = numChars - 1;
          }
          byte value = rc-48;
          if ((value>=0) && (value<=9)) {
            tmpResult = (tmpResult*10)+value;
            //delay(10); // deze moet erin anders komt tmpResult op nul te staan, vreemd toch!?
            continue;
          }
          if (rc==',') { //separator between PM25 and PM10 values
            val1 = tmpResult;
            tmpResult = 0; 
          }
        } else {
          val2 = tmpResult;
          receivedChars[ndx] = '\0'; // terminate the string
          ndx = 0;
          newData = true;
        }
      }

      if (newData == true) {
        newData = false;
        Serial.println(receivedChars);
//      Serial.print(this->results[0]);
//      Serial.print(";");
//      Serial.print(this->results[1]);
//      Serial.print(";");
//      Serial.print(this->nrOfMeasurements);
//      Serial.print("\r\n");

        if (val1==0 || val2==0) {
          Serial.print("Not valid values: ");
          Serial.print(val1);
          Serial.print(",");
          Serial.print(val2);
          Serial.print("\r\n");
          return;
        }

          Serial.print("Valid values: ");
          Serial.print(val1);
          Serial.print(",");
          Serial.print(val2);
          Serial.print("\r\n");
        String urlParams = "&observation=scapeler_dylos_raw0:\0";
        double pm25 = val1;  // double for String conversion and decimals)
        double pm10 = val2;
        urlParams += String(pm25, 0) + ",";
        urlParams += "scapeler_dylos_raw1:\0";
        urlParams += String(pm10, 0); 
        urlParams += "&sensorsystem=" + this->sensorSystem; 
        sendObservations(urlParams);
      
        
      };
    };
};
  extern DylosSensor gDylosSensor;  // global instance
}  // end namespace  ApriSensor
