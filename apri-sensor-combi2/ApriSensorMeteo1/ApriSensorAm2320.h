#pragma once

#define PMSOUTPUTS 2 // nr of outputs like 1=PM0.3, 2=PM0.5, etc.
#define PMSRESULTS 2

namespace aprisensor_ns {

class Am2320Sensor {

  private:
    byte am2320_address = 0x5c; //default

    AM2320 th; // I2C
    long am2320InitTime;
    long am2320InitInterval = 10000; //10 seconden init wait time
    long am2320MeasureTime;
    long am2320MeasureInterval = 500;  // measurement interval in millisecs

    float rHum;
    float temperature;
    
    long nrOfMeasurements;
    unsigned long nowTime;
    float measurements[PMSOUTPUTS];
    float totals[PMSOUTPUTS];
    float lowest[PMSOUTPUTS];
    float highest[PMSOUTPUTS];
    long results[PMSOUTPUTS];
    unsigned long transactionTime; // 20 seconds per transaction, send measurement
    const unsigned long transactionTimeMax = 20000; // milliseconds per transaction period, then send message
    unsigned long rfRepeatTime;
    const unsigned long rfRepeatTimeMax = 5000; // milliseconds waittime for repeating message
    unsigned long rfSentMsgTime;  // to calculate delay for repeat message
    const unsigned long rfDelayTimeMax = 60000; // maximum delaytime in millisec for repeating messages
    byte messageNr;
    char rfBuf[MSGLENGTH_AM2320];
    byte sensorType; // eg. = "AM2320"

  private:
    byte getNewMsgNr() {
      this->messageNr++;
      if (this->messageNr == 0) this->messageNr = 1;
      return this->messageNr;
    };
  public:
    Am2320Sensor() {};
    void init() {
      this->messageNr = 0;
      this->sensorType = S_AM2320;
      
      this->am2320InitTime = millis();
      printPrefix(INFO);Serial.print("start am2320 init fase\n");

      this->rfRepeatTime = 0;  //
      this->transactionTime = millis();
      this->am2320MeasureTime = millis();
      this->initTotals();

    };
    void setAm2320Address(byte am2320_address) {
      this->am2320_address = am2320_address;
    };
    void processAm2320RF() {
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
          sendRfMessage(rfBuf, MSGLENGTH_AM2320, MSGTYPE_REPEAT); // repeat message
        }
        return;
      }
*/
    };
    
      
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
      Serial.print(" Preparing new message. difftime:");
      Serial.print(nowTime - this->transactionTime);
      Serial.print(" freeSRam:");
      Serial.print(getFreeSram());
      Serial.print("\r\n");
      
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
      rfBuf[6] = highByte(this->results[0]); // rHum
      rfBuf[7] = lowByte(this->results[0]);  //
      rfBuf[8] = highByte(this->results[1]); // temperature
      rfBuf[9] = lowByte(this->results[1]);  //

      sendRfMessage(rfBuf, MSGLENGTH_AM2320, MSGTYPE_NEW); // new message

      this->transactionTime = millis();
      initTotals();

      printPrefix(MEASUREMENT);Serial.print(this->sensorType);
      Serial.print(";");
      Serial.print(this->results[0]);
      Serial.print(";");
      Serial.print(this->results[1]);
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
          printPrefix(INFO);Serial.print("RF max repeat time exceeded, stop repeating this message ");
          Serial.println(rfDelayTime);
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
    void readData() {
      if ( millis() - this->am2320MeasureTime < this->am2320MeasureInterval ) {
        //printPrefix(INFO);Serial.println("am2320 interval "); //delay(100);
        return;
      }
      
      // wait some time while in init fase (also during soft reset)
      if ( millis() - this->am2320InitTime < this->am2320InitInterval ) {
        //printPrefix(INFO);Serial.println("am2320 init fase");
        return;
      }

	    if (this->th.Read()!=0) return; 

      this->rHum = this->th.h;
      this->temperature = this->th.t;

      this->measurements[0] = this->rHum;
      this->measurements[1] = this->temperature;

      processAm2320RF();
      return;
    }
};

extern Am2320Sensor gAm2320Sensor;  // global instance

}  // end namespace  ApriSensor
