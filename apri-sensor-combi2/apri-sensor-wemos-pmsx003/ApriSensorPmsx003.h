#pragma once

#define PMSOUTPUTS 3 // nr of outputs like 1=PM0.3, 2=PM0.5, etc.
#define PMSRESULTS 3 

const uint8_t SERPORT_RX = D6; 
// D8 werkt niet
// D7 gaat goed 
// D6 gaat goed - deze wordt toegepast
const uint8_t SERPORT_TX = D5;

#include <SoftwareSerial.h>
uint16_t serialPmsAvailable;

SoftwareSerial SerialPms(SERPORT_RX, SERPORT_TX);


namespace aprisensor_ns {


class Pmsx003Sensor {

  private:
    String sensorSystem = "apri-sensor-pmsa003\0";
    long pmsx003InitTime;
    long pmsx003InitInterval = 1000; //1 seconden init wait time
//    long pmsx003MeasureTime;
//    long pmsx003MeasureInterval = 500;  // measurement interval in millisecs

    float pm1;
    float pm25;
    float pm10;

    long nrOfMeasurements;
    unsigned long nowTime;
    long measurements[PMSOUTPUTS];
    float totals[PMSOUTPUTS];
    float lowest[PMSOUTPUTS];
    float highest[PMSOUTPUTS];
    float results[PMSOUTPUTS];
    unsigned long transactionTime; // 20 seconds per transaction, send measurement
    const unsigned long transactionTimeMax = 60000; // milliseconds per transaction period, then send message
    unsigned long rfRepeatTime;
    const unsigned long rfRepeatTimeMax = 5000; // milliseconds waittime for repeating message
    unsigned long rfSentMsgTime;  // to calculate delay for repeat message
    const unsigned long rfDelayTimeMax = 60000; // maximum delaytime in millisec for repeating messages
    byte messageNr;
    char rfBuf[MSGLENGTH_PMSX003]; // was 15
    byte sensorType; // = "PMSx003"; //Plantower PMS7003 or PMSA003

    uint8_t  version;
    uint8_t  errorCode;
    uint16_t checksum;
    uint16_t inputChecksum;

    //
  private:
    byte getNewMsgNr() {
      this->messageNr++;
      if (this->messageNr == 0) this->messageNr = 1;
      return this->messageNr;
    };

  public:
    Pmsx003Sensor() {};
    void init() {
     // rfDriverPtr = &rfDriver;
      this->messageNr = 0;
      this->sensorType = S_PMSA003;  // default
      
      this->pmsx003InitTime = millis();
      SerialPms.begin(9600);
      this->rfRepeatTime = 0;  //
      this->transactionTime = millis();
//      this->pmsx003MeasureTime = millis();
      this->initTotals();
//      resetLastMeasurementTime = millis()+resetAfterSilenceTime;
    };
    void readUInt16(uint16_t* value, uint16_t* inputChecksum) {
      int inputHigh = SerialPms.read();
      int inputLow = SerialPms.read();
      *inputChecksum += inputHigh + inputLow;
      *value = inputLow + (inputHigh << 8);
    };
    void readInt(uint8_t* value, uint16_t* inputChecksum) {
      *value = SerialPms.read();
      *inputChecksum += *value;
      return;
    };
    void processPmsRF() {
      Serial.print(" process RF \r\n");
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
/*        if (this->rfRepeatTime == 0) return; // no transaction finished yet or max repeattime exceeded, no action to repeat
        diffTime = nowTime - this->rfRepeatTime;
        if (diffTime >= this->rfRepeatTimeMax &&
            rfRepeatTimeMax < (transactionTimeMax - 1000) // stop repeating just before new message
           ) {
          sendRfMessage(rfBuf, MSGLENGTH_PMSX003, MSGTYPE_REPEAT); // repeat message
          printPrefix(INFO);
          Serial.print(" C/U:");
          Serial.print(MSG_ID);
          Serial.print("/");
          Serial.print(UNIT_ID);
          Serial.print(", T:");
          Serial.print(this->sensorType);
          Serial.print(" #");
          Serial.print(this->nrOfMeasurements);
          Serial.print(" repeat message");
          Serial.print("\r\n");
        } else {
*/
/*          
 *           
          printPrefix(INFO);
          Serial.print(" C/U:");
          Serial.print(MSG_ID);
          Serial.print("/");
          Serial.print(UNIT_ID);
          Serial.print(", T:");
          Serial.print(this->sensorType);
          Serial.print(" #");
          Serial.print(this->nrOfMeasurements);
          Serial.print(" not repeating message difftime:");
          Serial.print(diffTime);
          Serial.print("\r\n");
*/
//       }
        return;
      }
      sendResults();
    };
    void sendResults() {
      if (this->nrOfMeasurements ==0) return; // no measurements recieved so far
//      printPrefix(INFO);
//      Serial.print(" C/U:");
//      Serial.print(MSG_ID);
//      Serial.print("/");
//      Serial.print(UNIT_ID);
//      Serial.print(", T:");
//      Serial.print(this->sensorType);
//      Serial.print(" #");
//      Serial.print(this->nrOfMeasurements);
//      Serial.print(" Preparing new message. difftime:");
//      Serial.print(nowTime - this->transactionTime);
//      Serial.print(" freeSRam:");
//      Serial.print(getFreeSram());
//      Serial.print("\r\n");
      
      // process data once per transactiontime limit
      computeResults();
 

      rfBuf[0] = MSG_ID;
      rfBuf[1] = UNIT_ID;
      rfBuf[2] = this->sensorType;
      rfBuf[3] = 0; // msgType initiated when calling function sendRfMessage
      rfBuf[4] = this->getNewMsgNr();
      rfBuf[5] = 0;  // delaytime equal zero for first time sending message. In seconds.
//      this->rfSentMsgTime = millis();
//      rfBuf[6] = highByte(this->results[0]); // PM1
//      rfBuf[7] = lowByte(this->results[0]);  //
//      rfBuf[8] = highByte(this->results[1]); // PM2.5
//      rfBuf[9] = lowByte(this->results[1]);  //
//      rfBuf[10] = highByte(this->results[2]);// PM10
//      rfBuf[11] = lowByte(this->results[2]); //


//      sendRfMessage(rfBuf, MSGLENGTH_PMSX003, MSGTYPE_NEW); // new message

      this->transactionTime = millis();

      printPrefix(MEASUREMENT);
      Serial.print(this->sensorType);
      Serial.print(";");
      Serial.print(this->results[0]);
      Serial.print(";");
      Serial.print(this->results[1]);
      Serial.print(";");
      Serial.print(this->results[2]);
      Serial.print(";");
      Serial.print(this->nrOfMeasurements);
//      Serial.print(" freeSRam:");
//      Serial.print(getFreeSram());
      Serial.print("\r\n");


      String urlParams = "&observation=apri-sensor-pmsa003-concPM1_0_CF1:\0";
      double pm1 = this->results[0];  // double for String conversion and decimals)
      double pm25 = this->results[1];
      double pm10 = this->results[2];
      //double altitude = this->results[3];
      urlParams += String(pm1, 2) + ",";
      urlParams += "apri-sensor-pmsa003-concPM2_5_CF1:\0";
      urlParams += String(pm25, 2)+ ","; 
      urlParams += "apri-sensor-pmsa003-concPM10_0_CF1:\0";
      urlParams += String(pm10, 2); 
      urlParams += "&sensorsystem=" + this->sensorSystem; 
      sendObservations(urlParams);
      
      initTotals();

//      if (millis() > periodicResetTime) {  // reset for cleanup stack etc.
//        resetArduino();
//      }
      
    };

    void initTotals() {
      for (int i = 0; i < PMSOUTPUTS; i++) {
        this->totals[i] = 0;
        this->lowest[i] = 999999;
        this->highest[i] = -999999;
      }
      this->nrOfMeasurements = 0;
    };

/*
    void readSyncMsg() {
      if ((*rfDriverPtr).recv(syncBuf, &syncBuflen)) { // Non-blocking receiveSyncMsg();
//Serial.print(" process Sync \r\n");
//      if (rfDriver.recv(syncBuf, &syncBuflen)) { // Non-blocking receiveSyncMsg();
        receiveSyncMsg();
      };
    };
*/        
/*    void sendRfMessage(byte rfBuffer[], int msgLength, char msgType) {
      // fille message type (New, Repeat)
      rfBuffer[3] = msgType;

      if (msgType == MSGTYPE_REPEAT) {
        unsigned long rfDelayTime = millis() - this->rfSentMsgTime;
        if (rfDelayTime > this->rfDelayTimeMax) { // max delaytime exceeded, end processing repeat
          //Serial.print("RF max repeat time exceeded, stop repeating this message");Serial.print("\r\n");
          //Serial.print(rfDelayTime);Serial.print("\r\n");
          this->rfRepeatTime = 0; // stop repeating this message
          printPrefix(INFO);
          Serial.print("RF l:");
          Serial.print(msgLength);
          Serial.print(", C/U:");
          Serial.print(rfBuffer[0]);
          Serial.print("/");
          Serial.print(rfBuffer[1]);
          Serial.print(", T:");
          Serial.print(rfBuffer[2]);
          Serial.print(msgType);
          Serial.print(" #");
          Serial.print(this->nrOfMeasurements);
          Serial.print(" stop repeating message");
          Serial.print("\r\n");
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
      Serial.print(this->nrOfMeasurements);
      Serial.print("\r\n");
      
      rfDriver.send(rfBuffer, msgLength);
      rfDriver.waitPacketSent();

      this->rfRepeatTime = millis();

      resetLastMeasurementTime = millis();
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
        //this->results[i] = (((this->totals[i] * 100) / _nrOfMeasurements ) + .49) / 10;
        this->results[i] = this->totals[i] / _nrOfMeasurements ;
      }

    };
    bool serialReady() {
      if (SerialPms) return true; else return false;
    }
    void readData() {
//      if ( millis() - this->pmsx003MeasureTime < this->pmsx003MeasureInterval ) {
//        //printPrefix(INFO);Serial.print("pmsx003 interval ");Serial.print("\r\n"); //delay(100);
//        return;
//      }
      // wait some time while in init fase (also during soft reset)

      if ( millis() - this->pmsx003InitTime < this->pmsx003InitInterval ) {
        //printPrefix(INFO);Serial.print("pmsx003 init fase");Serial.print("\r\n");
//        resetLastMeasurementTime=millis() + resetAfterSilenceTime*2;
        return;
      }

 //     if ( millis() > resetLastMeasurementTime + resetAfterSilenceTime) {
       // resetArduino();
 //     }
      

//      uint16_t concPM1_0_CF1;
//      uint16_t concPM2_5_CF1;
//      uint16_t concPM10_0_CF1;
//      uint16_t concPM1_0_amb;
//      uint16_t concPM2_5_amb;
//      uint16_t concPM10_0_amb;
 //     uint16_t rawGt0_3um;
 //     uint16_t rawGt0_5um;
 //     uint16_t rawGt1_0um;
//      uint16_t rawGt2_5um;
//      uint16_t rawGt5_0um;
//      uint16_t rawGt10_0um;

      
      serialPmsAvailable = SerialPms.available();
      //Serial.print(serialPmsAvailable);

      if (serialPmsAvailable < 32) {
        //delay(10);
        return;
      }

      //Serial.print(serialPmsAvailable);

      inputChecksum = 0;

      // test first 2 bytes must be 0x424D
      uint16_t controleCodes;
      readUInt16(&controleCodes, &inputChecksum );
      if (controleCodes != 0x424D) return;

      // test next 2 bytes must be 0x001c
      readUInt16(&controleCodes, &inputChecksum );
      if (controleCodes != 0x001c) return;

      // read all sensor output values and sum Checksum
      uint16_t value;
      readUInt16(&value, &inputChecksum );  //pm1
      this->measurements[0] = value;
      readUInt16(&value, &inputChecksum );  //pm2.5
      this->measurements[1] = value;
            //Serial.print("\r\n");
            //Serial.print(value);
      readUInt16(&value, &inputChecksum );  //pm10
      this->measurements[2] = value;
      readUInt16(&value, &inputChecksum );  //pm1
      readUInt16(&value, &inputChecksum );  //pm25 amb
            //Serial.print(";");
            //Serial.print(value);
            //Serial.print(";");
      readUInt16(&value, &inputChecksum );  //pm10
      readUInt16(&value, &inputChecksum );  //pm0.3
            //Serial.print(value);
            //Serial.print(";");
      readUInt16(&value, &inputChecksum );  //pm0.5
      readUInt16(&value, &inputChecksum );  //pm1
      readUInt16(&value, &inputChecksum );  //pm2.5
            //Serial.print(value);
            //Serial.print(";");
      readUInt16(&value, &inputChecksum );  //pm5
      readUInt16(&value, &inputChecksum );  //pm10
      
//      for (int i = 0; i < PMSOUTPUTS; i++) {
//        int value;
//        readUInt16(&value, &inputChecksum );
//        this->measurements[i] = value;
//        if(i==1) this->measurements[0] = value; 
//        if(i==2) this->measurements[1] = value; 
//      }

 //     concPM1_0_CF1 = this->measurements[0];
 //     concPM2_5_CF1 = this->measurements[1];
 //     concPM10_0_CF1 = this->measurements[2];
 //     concPM1_0_amb = this->measurements[3];
 //     concPM2_5_amb = this->measurements[4];
 //     concPM10_0_amb = this->measurements[5];
 //     rawGt0_3um = this->measurements[6];
 //     rawGt0_5um = this->measurements[7];
 //     rawGt1_0um = this->measurements[8];
 //     rawGt2_5um = this->measurements[9];
 //     rawGt5_0um = this->measurements[10];
 //     rawGt10_0um = this->measurements[11];

      // read versionnumber
      readInt(&version, &inputChecksum );

      // read errorcode
      readInt(&errorCode, &inputChecksum );

      // determine sensortype
      if (version == 128) this->sensorType = S_PMS7003; // "PMS7003";
      if (version == 145) this->sensorType = S_PMSA003; // "PMSA003";

      // read sensor record checksum
      uint8_t inputHigh = SerialPms.read();
      uint8_t inputLow  = SerialPms.read();
      checksum  = inputLow + (inputHigh << 8);

      if (checksum != inputChecksum) {
        // checksum error, skip input
//            Serial.print(";");
//            Serial.print(checksum);
//            Serial.print(";");
//            Serial.print(inputChecksum);
            Serial.print("PMSx003 checksum error");
            Serial.print("\r\n");
      } else {
        if (errorCode == 0) {
          // send message via RF
//          this->measurements[0] = this->pm1;
//          this->measurements[1] = this->pm25;
//          this->measurements[2] = this->pm10;
          Serial.print("processing data PMSx003 RF");Serial.print("\r\n");
          processPmsRF();
        }
          Serial.print(errorCode);Serial.print("\r\n");
      }

      while (SerialPms.read() != -1) {}; //clear buffer

      //delay(700);  // 700 when other sensors not included // higher will get you checksum errors
      //delay(1000);     // 50  when other sensors are included //higher will get you checksum errors

      return;
    }

};

extern Pmsx003Sensor gPmsx003Sensor;  // global instance

}  // end namespace  ApriSensor
