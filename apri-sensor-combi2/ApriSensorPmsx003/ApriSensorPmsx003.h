#pragma once

#define PMSOUTPUTS 3 // nr of outputs like 1=PM0.3, 2=PM0.5, etc.
#define PMSRESULTS 3 

const uint8_t SERPORT_RX = 9;
const uint8_t SERPORT_TX = 8;

#include <SoftwareSerial.h>
uint16_t serialPmsAvailable;

SoftwareSerial SerialPms(SERPORT_RX, SERPORT_TX);


namespace aprisensor_ns {


class Pmsx003Sensor {

  private:

    long pmsx003InitTime;
    long pmsx003InitInterval = 10000; //10 seconden init wait time
//    long pmsx003MeasureTime;
//    long pmsx003MeasureInterval = 500;  // measurement interval in millisecs

    float pm1;
    float pm25;
    float pm10;

    long nrOfMeasurements;
    unsigned long nowTime;
    long measurements[PMSOUTPUTS];
    long totals[PMSOUTPUTS];
    long lowest[PMSOUTPUTS];
    long highest[PMSOUTPUTS];
    long results[PMSOUTPUTS];
    unsigned long transactionTime; // 20 seconds per transaction, send measurement
    const unsigned long transactionTimeMax = 20000; // milliseconds per transaction period, then send message
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
      this->messageNr = 0;
      this->sensorType = S_PMSA003;  // default
      
      this->pmsx003InitTime = millis();
      SerialPms.begin(9600);
      this->rfRepeatTime = 0;  //
      this->transactionTime = millis();
//      this->pmsx003MeasureTime = millis();
      this->initTotals();
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
          sendRfMessage(rfBuf, MSGLENGTH_PMSX003, MSGTYPE_REPEAT); // repeat message
        }
        return;
      }

      // process data once per transactiontime limit
      computeResults();
 

      rfBuf[0] = MSG_ID;
      rfBuf[1] = UNIT_ID;
      rfBuf[2] = this->sensorType;
      rfBuf[3] = 0; // msgType initiated when calling function sendRfMessage
      rfBuf[4] = this->getNewMsgNr();
      rfBuf[5] = 0;  // delaytime equal zero for first time sending message. In seconds.
      this->rfSentMsgTime = millis();
      rfBuf[6] = highByte(this->results[0]); // PM1
      rfBuf[7] = lowByte(this->results[0]);  //
      rfBuf[8] = highByte(this->results[1]); // PM2.5
      rfBuf[9] = lowByte(this->results[1]);  //
      rfBuf[10] = highByte(this->results[2]);// PM10
      rfBuf[11] = lowByte(this->results[2]); //

      sendRfMessage(rfBuf, MSGLENGTH_PMSX003, MSGTYPE_NEW); // new message

      this->transactionTime = millis();
      initTotals();

      printPrefix(MEASUREMENT);Serial.print(this->sensorType);
      Serial.print(";");
      Serial.print(this->results[0]);
      Serial.print(";");
      Serial.print(this->results[1]);
      Serial.print(";");
      Serial.print(this->results[2]);
      Serial.print('\n');
    };

    void initTotals() {
      for (int i = 0; i < PMSOUTPUTS; i++) {
        this->totals[i] = 0;
        this->lowest[i] = 999999;
        this->highest[i] = -999999;
      }
      this->nrOfMeasurements = 0;
    }
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
    bool serialReady() {
      if (SerialPms) return true; else return false;
    }
    bool readData() {
//      if ( millis() - this->pmsx003MeasureTime < this->pmsx003MeasureInterval ) {
//        //printPrefix(INFO);Serial.println("pmsx003 interval "); //delay(100);
//        return;
//      }
      // wait some time while in init fase (also during soft reset)
      if ( millis() - this->pmsx003InitTime < this->pmsx003InitInterval ) {
        //printPrefix(INFO);Serial.println("pmsx003 init fase");
        return;
      }
      

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
      if (serialPmsAvailable < 32) {
        //delay(10);
        return;
      }



      inputChecksum = 0;

      // test first 2 bytes must be 0x424D
      uint16_t controleCodes;
      readUInt16(&controleCodes, &inputChecksum );
      if (controleCodes != 0x424D) return;

      // test next 2 bytes must be 0x001c
      readUInt16(&controleCodes, &inputChecksum );
      if (controleCodes != 0x001c) return;

      // read all sensor output values and sum Checksum
      int value;
      readUInt16(&value, &inputChecksum );  //pm1
      this->measurements[0] = value;
      readUInt16(&value, &inputChecksum );  //pm2.5
      this->measurements[1] = value;
            //Serial.print("\n");
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
            Serial.print("\nPMSx003 checksum error");
      } else {
        if (errorCode == 0) {
          // send message via RF
//          this->measurements[0] = this->pm1;
//          this->measurements[1] = this->pm25;
//          this->measurements[2] = this->pm10;
          //Serial.println("processing data PMSx003 RF");
          processPmsRF();
        }
      }

      while (SerialPms.read() != -1) {}; //clear buffer

      //delay(700);  // 700 when other sensors not included // higher will get you checksum errors
      //delay(1000);     // 50  when other sensors are included //higher will get you checksum errors

      return;
    }

};

extern Pmsx003Sensor gPmsx003Sensor;  // global instance

}  // end namespace  ApriSensor
