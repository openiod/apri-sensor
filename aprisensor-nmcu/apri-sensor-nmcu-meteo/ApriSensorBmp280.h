#pragma once

#include <Adafruit_BMP280.h>

//#define BMP_SCK 13
//#define BMP_MISO 12
//#define BMP_MOSI 11
//#define BMP_CS 10

#define PMSOUTPUTS 4 // nr of outputs like 1=PM0.3, 2=PM0.5, etc.
#define PMSRESULTS 4

namespace aprisensor_ns {

class Bmp280Sensor {

  private:
    byte bmp280_address = 0x76; //default

    String sensorSystem = "apri-sensor-bmp280\0";

    Adafruit_BMP280 bmp; // I2C
    long bmp280InitTime;
    long bmp280InitInterval = 10000; //10 seconden init wait time
    long bmp280MeasureTime;
    long bmp280MeasureInterval = 5000;  // measurement interval in millisecs
    bool sensorFound = false;
    float pressure;
    float pressureHPa;
    float seaLevelHPa;
    float temperature;
    float altitude;
    
    long nrOfMeasurements;
    unsigned long nowTime;
    float measurements[PMSOUTPUTS];
    float totals[PMSOUTPUTS];
    float lowest[PMSOUTPUTS];
    float highest[PMSOUTPUTS];
    float results[PMSOUTPUTS];
    unsigned long transactionTime; // 20 seconds per transaction, send measurement
    const unsigned long transactionTimeMax = 57800; // milliseconds per transaction period, then send message. 57.8secs=+-1x per minute
    unsigned long rfRepeatTime;
    const unsigned long rfRepeatTimeMax = 5000; // milliseconds waittime for repeating message
 //   unsigned long rfSentMsgTime;  // to calculate delay for repeat message
    const unsigned long rfDelayTimeMax = 60000; // maximum delaytime in millisec for repeating messages
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
      printPrefix(INFO);Serial.println("BMP280 sensor start");
      this->sensorType = S_BMP280;
      sensorFound = this->bmp.begin(bmp280_address);
      //while (!this->bmp.begin(bmp280_address)) {
      //  Serial.println("Could not find a valid BMP280 sensor, check wiring!");
      //}
      //this->bmp.begin(bmp280_address);

      printPrefix(INFO);Serial.println("BMP280 sensor connected");
      this->bmp280InitTime = millis();
      printPrefix(INFO);Serial.println("start bmp280 init fase");

      this->rfRepeatTime = 0;  //
      this->transactionTime = millis();
      this->bmp280MeasureTime = millis();
      this->initTotals();

    };

//    void getMsgNr() {
//      return this->messageNr;
//    };
    void setBmp280Address(byte bmp280_address) {
      this->bmp280_address = bmp280_address;
    };
    void processBmp280RF() {
      this->nrOfMeasurements++;
      for (int i = 0; i < PMSOUTPUTS; i++) {
        if (measurements[i] < this->lowest[i]) this->lowest[i] = measurements[i];
        if (measurements[i] > this->highest[i]) this->highest[i] = measurements[i];
        this->totals[i] += measurements[i];
      }
      nowTime = millis();
      // repeat last sent RF messagde during transaction building process

      unsigned long diffTime = nowTime - this->transactionTime;
      if ( diffTime < this->transactionTimeMax ) {
        if (this->rfRepeatTime == 0) return; // no transaction finished yet or max repeattime exceeded, no action to repeat
        diffTime = nowTime - this->rfRepeatTime;
        if (diffTime >= this->rfRepeatTimeMax &&
            rfRepeatTimeMax < (transactionTimeMax - 1000) // stop repeating just before new message
           ) {
          Serial.print("repeat message");  
          //sendRfMessage(rfBuf, MSGLENGTH_BMP280, MSGTYPE_REPEAT); // repeat message
        }
        return;
      }

      // process data once per transactiontime limit

      computeResults();
/*    
      for (int i = 0; i < PMSRESULTS; i++) {
        Serial.print(this->totals[i]);
        Serial.print(";\t");
      }
      Serial.print("\r\n");

      for (int i = 0; i < PMSRESULTS; i++) {
        Serial.print(this->lowest[i]);
        Serial.print(";\t");
      }
      Serial.print("\r\n");
      for (int i = 0; i < PMSRESULTS; i++) {
        Serial.print(this->highest[i]);
        Serial.print(";\t");
      }

      Serial.print("\r\n");
      for (int i = 0; i < PMSRESULTS; i++) {
        Serial.print(this->results[i]);
        Serial.print(";\t");
      }
      Serial.print("\r\n");
*/

      rfBuf[0] = MSG_ID;
      rfBuf[1] = UNIT_ID;
      rfBuf[2] = this->sensorType;
      rfBuf[3] = 0; // msgType initiated when calling function sendRfMessage
      rfBuf[4] = this->getNewMsgNr();
      rfBuf[5] = 0;  // delaytime equal zero for first time sending message. In seconds.
//      this->rfSentMsgTime = millis();
//      rfBuf[6] = highByte(this->results[0]); // pressureHPa
//      rfBuf[7] = lowByte(this->results[0]);  //
//      rfBuf[8] = highByte(this->results[2]); // temperature
//      rfBuf[9] = lowByte(this->results[2]);  //
//      rfBuf[10] = highByte(this->results[3]);// altitude
//      rfBuf[11] = lowByte(this->results[3]); //

//      Serial.print("send message");  
//      sendRfMessage(rfBuf, MSGLENGTH_BMP280, MSGTYPE_NEW); // new message

      this->transactionTime = millis();

      printPrefix(MEASUREMENT);
      Serial.print(this->sensorType);
      Serial.print(";");
      Serial.print(this->results[0]); // pressureHPa
      Serial.print(";");
      Serial.print(this->results[2]); // temperature
      Serial.print(";");
      Serial.print(this->results[3]); // altitude
      Serial.print(";");
      Serial.print(this->nrOfMeasurements);
      Serial.print("\r\n");

      String urlParams = "&observation=apri-sensor-bmp280-pressure:\0";
      double pressureHPa = this->results[0];  // double for String conversion and decimals)
      double temperature = this->results[2];
      //double altitude = this->results[3];
      urlParams += String(pressureHPa, 2) + ",";
      urlParams += "apri-sensor-bmp280-temperature:\0";
      urlParams += String(temperature, 2); 
      urlParams += "&sensorsystem=" + this->sensorSystem; 
      sendObservations(urlParams);

      initTotals();

    };

    void initTotals() {
      for (int i = 0; i < PMSOUTPUTS; i++) {
        this->totals[i] = 0;
        this->lowest[i] = 999999;
        this->highest[i] = -999999;
      }
      this->nrOfMeasurements = 0;
    }
/*
    void sendRfMessage(byte rfBuffer[], int msgLength, char msgType) {
      // fille message type (New, Repeat)
      rfBuffer[3] = msgType;

      if (msgType == MSGTYPE_REPEAT) {
        unsigned long rfDelayTime = millis() - this->rfSentMsgTime;
        if (rfDelayTime > this->rfDelayTimeMax) { // max delaytime exceeded, end processing repeat
          //Serial.println("RF max repeat time exceeded, stop repeating this message");
          //Serial.println(rfDelayTime);
          this->rfRepeatTime = 0; // stop repeating this message
          return;
        }
        // fill delaytime in seconds
        rfBuffer[5] = rfDelayTime / 1000;
      }

      printPrefix(INFO);Serial.print("RF l:");
      Serial.print(msgLength);
      Serial.print(", C/U:");
      Serial.print(rfBuffer[0]);
      Serial.print("/");
      Serial.print(rfBuffer[1]);
      Serial.print(", T:");
      Serial.print(rfBuffer[2]);
      Serial.print(msgType);
      Serial.print(" #");
      Serial.println(this->nrOfMeasurements);

      rfDriver.send(rfBuffer, msgLength);
      rfDriver.waitPacketSent();

      this->rfRepeatTime = millis();
    }
*/
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
//        this->results[i] = (((this->totals[i] * 100) / _nrOfMeasurements ) + .49) / 10;
        this->results[i] = this->totals[i] / _nrOfMeasurements ;
      }
    };
    void readData() {

      if (!sensorFound) {
        sensorFound = this->bmp.begin(bmp280_address);
        return;
      }
      if ( millis() - this->bmp280MeasureTime < this->bmp280MeasureInterval ) {
        //Serial.println("bmp280 init fase");
        return;
      }
      
      // wait some time while in init fase (also during soft reset)
      if ( millis() - this->bmp280InitTime < this->bmp280InitInterval ) {
        //Serial.println("bmp280 init fase");
        return;
      }
      
      this->bmp280MeasureTime = millis();      
//Serial.print("4");
      this->pressure = this->bmp.readPressure();
//Serial.print("5");
      if (this->pressure == 0) {
        printPrefix(ERROR);Serial.println("No value for BMP280 found");
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

extern Bmp280Sensor gBmp280Sensor;  // global instance

}  // end namespace  ApriSensor
