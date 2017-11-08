#pragma once

#include <Adafruit_BMP280.h>

//#define BMP_SCK 13
//#define BMP_MISO 12
//#define BMP_MOSI 11
//#define BMP_CS 10

#define PMSOUTPUTS 4 // nr of outputs like 1=PM0.3, 2=PM0.5, etc.
#define PMSRESULTS 4

const PROGMEM byte bmp280_address = 0x76;
const PROGMEM byte bmp280InitInterval = 5000; // 5 seconden init wait time
//const long PROGMEM bmp280MeasureInterval = 1000;  // measurement interval in millisecs
//const PROGMEM unsigned long rfRepeatTimeMax = 5000; // milliseconds waittime for repeating message
//const PROGMEM unsigned long transactionTimeMax = 20000; // milliseconds per transaction period, then send message
//const PROGMEM unsigned long rfDelayTimeMax = 60000; // maximum delaytime in millisec for repeating messages


namespace aprisensor_ns {

class Bmp280Sensor {

  private:
//    byte bmp280_address = 0x76; //default

    Adafruit_BMP280 bmp; // I2C
    long bmp280InitTime;
    long bmp280MeasureTime;

    float pressure;
    float pressureHPa;
    float seaLevelHPa;
    float temperature;
    float altitude;
    
    uint8_t nrOfMeasurements;
    //unsigned long nowTime;
    float measurements[PMSOUTPUTS];
    float totals[PMSOUTPUTS];
    float lowest[PMSOUTPUTS];
    float highest[PMSOUTPUTS];
    long results[PMSOUTPUTS];
    unsigned long transactionTime; // 20 seconds per transaction, send measurement
//    unsigned long rfRepeatTime;
    unsigned long rfSentMsgTime;  // to calculate delay for repeat message
    byte messageNr;
    char rfBuf[MSGLENGTH_BMP280];
    byte sensorType; // eg = "BMP280" 

  private:
    byte getNewMsgNr() {
      this->messageNr++;
      if (this->messageNr == 0) this->messageNr = 1;
      return this->messageNr;
    };

  public:
    Bmp280Sensor() {};
    void init() {
      this->messageNr = 0;
      printPrefix(INFO);//Serial.println("BMP280 sensor start");
      this->sensorType = S_BMP280;
      
      //while (!this->bmp.begin(bmp280_address)) {
      //  Serial.println("Could not find a valid BMP280 sensor, check wiring!");
      //}
      this->bmp.begin(bmp280_address);

      printPrefix(INFO);//Serial.println("BMP280 sensor connected");
      this->bmp280InitTime = millis();
      printPrefix(INFO);//Serial.println("start bmp280 init fase");

//      this->rfRepeatTime = 0;  //
      this->initTotals();

    };

//    void getMsgNr() {
//      return this->messageNr;
//    };
//    void setBmp280Address(byte bmp280_address) {
//      this->bmp280_address = bmp280_address;
//    };
    void processBmp280RF() {
      this->nrOfMeasurements++;
      for (int i = 0; i < PMSOUTPUTS; i++) {
        if (measurements[i] < this->lowest[i]) this->lowest[i] = measurements[i];
        if (measurements[i] > this->highest[i]) this->highest[i] = measurements[i];
        this->totals[i] += measurements[i];
      }
/*      nowTime = millis();
      // repeat last sent RF messagde during transaction building process

      unsigned long diffTime = nowTime - this->transactionTime;
      if ( diffTime < this->transactionTimeMax ) {
        if (this->rfRepeatTime == 0) return; // no transaction finished yet or max repeattime exceeded, no action to repeat
        diffTime = nowTime - this->rfRepeatTime;
        if (diffTime >= this->rfRepeatTimeMax &&
            rfRepeatTimeMax < (transactionTimeMax - 1000) // stop repeating just before new message
           ) {
          sendRfMessage(rfBuf, MSGLENGTH_BMP280, MSGTYPE_REPEAT); // repeat message
        }
        return;
      }
*/    };
    
    void sendResults() {
      if (this->nrOfMeasurements ==0) return; // no measurements recieved so far
      printPrefix(INFO);
      Serial.print(" C/U:");
      Serial.print(MSG_ID);
      Serial.print("/");
      Serial.print(UNIT_ID);
      Serial.print(", T:");
      Serial.print(this->sensorType);
      Serial.print(" #");
      Serial.print(this->nrOfMeasurements);
      Serial.print(SPACE);
      Serial.print(millis() - this->transactionTime);
//      Serial.print(FREESRAMTXT);
//      Serial.print(getFreeSram());
      Serial.print(NEWLINE);
      
      // process data once per transactiontime limit
      computeResults();
/*    
      for (int i = 0; i < PMSRESULTS; i++) {
        Serial.print(this->totals[i]);
        Serial.print(";\t");
      }
      Serial.print("\n");

      for (int i = 0; i < PMSRESULTS; i++) {
        Serial.print(this->lowest[i]);
        Serial.print(";\t");
      }
      Serial.print("\n");
      for (int i = 0; i < PMSRESULTS; i++) {
        Serial.print(this->highest[i]);
        Serial.print(";\t");
      }

      Serial.print("\n");
      for (int i = 0; i < PMSRESULTS; i++) {
        Serial.print(this->results[i]);
        Serial.print(";\t");
      }
      Serial.print("\n");
*/

      rfBuf[0] = MSG_ID;
      rfBuf[1] = UNIT_ID;
      rfBuf[2] = this->sensorType;
      rfBuf[3] = 0; // msgType initiated when calling function sendRfMessage
      rfBuf[4] = this->getNewMsgNr();
      rfBuf[5] = 0;  // delaytime equal zero for first time sending message. In seconds.
      this->rfSentMsgTime = millis();
      rfBuf[6] = highByte(this->results[0]); // pressureHPa
      rfBuf[7] = lowByte(this->results[0]);  //
      rfBuf[8] = highByte(this->results[2]); // temperature
      rfBuf[9] = lowByte(this->results[2]);  //
      rfBuf[10] = highByte(this->results[3]);// altitude
      rfBuf[11] = lowByte(this->results[3]); //

      sendRfMessage(rfBuf, MSGLENGTH_BMP280, MSGTYPE_NEW, this->nrOfMeasurements); // new message
//      this->rfRepeatTime = millis();


      initTotals();

      printPrefix(MEASUREMENT);Serial.print(this->sensorType);
      Serial.print(";");
      Serial.print(this->results[0]); // pressureHPa
      Serial.print(";");
      Serial.print(this->results[2]); // temperature
      Serial.print(";");
      Serial.print(this->results[3]); // altitude
      Serial.println();

    };

    void initTotals() {
      for (int i = 0; i < PMSOUTPUTS; i++) {
        this->totals[i] = 0;
        this->lowest[i] = 999999;
        this->highest[i] = -999999;
      }
      this->nrOfMeasurements = 0;
      this->transactionTime = millis();

    }

    void computeResults() {
      int i;
      bool corrLowHigh = false;
      long _nrOfMeasurements = this->nrOfMeasurements;
      if (_nrOfMeasurements>3) { // ignore highest / lowest values
          _nrOfMeasurements -= 2 ;
          corrLowHigh = true;
      }

      for (i = 0; i < PMSOUTPUTS; i++) { // only first 3 measurements for RF transmit
        if (corrLowHigh) {
          this->totals[i] -= this->highest[i];
          this->totals[i] -= this->lowest[i];          
        }
        this->results[i] = (((this->totals[i] * 100) / _nrOfMeasurements ) + .49) / 10;
      }
    };
    
    void readData() {
//      if ( millis() - this->bmp280MeasureTime < this->bmp280MeasureInterval ) {
//        //Serial.println("bmp280 init fase");
//        return;
//      }
      
      // wait some time while in init fase (also during soft reset)
      if ( millis() - this->bmp280InitTime < bmp280InitInterval ) {
        //Serial.println("bmp280 init fase");
        return;
      }
      
      this->bmp280MeasureTime = millis();      

      this->pressure = this->bmp.readPressure();
      if (this->pressure == 0) {
        //printPrefix(ERROR);Serial.println("No value for BMP280 found");
        return;
      }
      this->pressureHPa = this->pressure/100;
      this->seaLevelHPa = this->pressureHPa;
      this->temperature = this->bmp.readTemperature();
      this->altitude = this->bmp.readAltitude(seaLevelHPa);

      // reset sensor when temperature value below -100
      if (this->temperature < -50) {
        printPrefix(INFO);Serial.println("start bmp280 soft reset");
        this->bmp.begin(bmp280_address);
        this->bmp280InitTime = millis();
        return;
      }

      this->measurements[0] = this->pressureHPa;
      this->measurements[1] = this->seaLevelHPa;
      this->measurements[2] = this->temperature;
      this->measurements[3] = this->altitude;

      processBmp280RF();

      return;
    }

};

//extern Bmp280Sensor gBmp280Sensor;  // global instance

}  // end namespace  ApriSensor
