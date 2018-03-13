#pragma once

// AM320 =======
//#include <Wire.h>
//#include <AM2320.h>
// AM320 =======


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
    bool serialReadyBool=false;
    
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
//    uint8_t channelId = 123; // default channelId use setChannel/getChannel methodes to set/get channel id
    // unitid. Sub-number or identification of remote sensor in star-network.
//    uint8_t unitId = 0; // default unitId. Use setUnitId()/getUnitId() to set/get unitId
    byte messageNr;
    char rfBuf[MSGLENGTH_AM2320];
    byte sensorType; // = "PMSx003"; //Plantower PMS7003 or PMSA003
    //
  private:
    byte getNewMsgNr() {
      this->messageNr++;
      if (this->messageNr == 0) this->messageNr = 1;
      return this->messageNr;
    };
//  public:
//    enum State {
//      On,
//      Off
//    };
//  public:
//    struct SensorData {
//      uint8_t type;
//      uint8_t msgLength;
//      byte messageNr;
//      char rfBuf[15];
//    } sensorData;
  public:
    Sensor() {};
    void init() {
      this->messageNr = 0;
      this->sensorType = S_AM2320;
      
      this->am2320InitTime = millis();
      Serial.print("start am2320 init fase ");

      this->rfRepeatTime = 0;  //
      this->transactionTime = millis();
      this->am2320MeasureTime = millis();
      this->initTotals();

      //Wire.begin();
      byte test = this->th.Read();//==0;
      //if () this->
      Serial.println(test);
      serialReadyBool=true;
//      if (!rfDriver.init()) {
//        //Serial.println("RF init failed");
//      }

    };
//    uint8_t getChannelId() {
//      return this->channelId;
//    };
//    void setChannelId(uint8_t channelId) {
//      this->channelId = channelId;
//      return;
//    };
//    uint8_t getUnitId() {
//      return this->unitId;
//    };
//    void setUnitId(uint8_t unitId) {
//      this->unitId = unitId;
//      return;
//    };
    void getMsgNr() {
      return this->messageNr;
    };
//    void setState(State state) {};
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
      nowTime = millis();
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

      // process data once per transactiontime limit
      Serial.print("\nNr of measurements:");
      Serial.println(this->nrOfMeasurements);
      computeResults();
//      for (int i = 0; i < PMSRESULTS; i++) {
//        Serial.print(this->totals[i]);
//        Serial.print(";\t");
//      }
//      Serial.print("\n");
//      for (int i = 0; i < PMSRESULTS; i++) {
//        Serial.print(this->lowest[i]);
//        Serial.print(";\t");
//      }
//      Serial.print("\n");
//      for (int i = 0; i < PMSRESULTS; i++) {
//        Serial.print(this->highest[i]);
//        Serial.print(";\t");
//      }
//      Serial.print("\n");
//      for (int i = 0; i < PMSRESULTS; i++) {
//        Serial.print(this->results[i]);
//        Serial.print(";\t");
//      }
//      Serial.print("\n");

      rfBuf[0] = CHANNEL_ID;
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

      Serial.print("\nAM2320");
      Serial.print(";");
      Serial.print(this->results[0]);
      Serial.print(";");
      Serial.print(this->results[1]);
      Serial.println();


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
      //char buf[60];
      //sprintf(buf, "%lu;%s", messageNr, rfBuf);  // %lu = long  %i = int %s = string
      //Serial.println("RF sending test message");
      //Serial.println(buf);
      //rfDriver.send("test", 4);
      //rfDriver.waitPacketSent();

      // fille message type (New, Repeat)
      rfBuffer[3] = msgType;

      if (msgType == MSGTYPE_REPEAT) {
        unsigned long rfDelayTime = millis() - this->rfSentMsgTime;
        if (rfDelayTime > this->rfDelayTimeMax) { // max delaytime exceeded, end processing repeat
          Serial.println("RF max repeat time exceeded, stop repeating this message");
          Serial.println(rfDelayTime);
          this->rfRepeatTime = 0; // stop repeating this message
          return;
        }
        // fill delaytime in seconds
        rfBuffer[5] = rfDelayTime / 1000;
      }

      Serial.print("RF l:");
      Serial.print(msgLength);
      Serial.print(", C/U:");
      Serial.print(rfBuffer[0]);
      Serial.print("/");
      Serial.print(rfBuffer[1]);
      Serial.print(", T:");
      Serial.print(rfBuffer[2]);
      Serial.println(msgType);
      /*
          Serial.println(rfBuffer[0]);
          Serial.println(rfBuffer[1]);
          Serial.println(rfBuffer[2]);
          Serial.println(rfBuffer[3]);
          Serial.println(rfBuffer[4]);
          Serial.println(rfBuffer[5]);
          Serial.println(rfBuffer[6]);
          Serial.println(rfBuffer[7]);
          Serial.println(rfBuffer[8]);
          Serial.println(rfBuffer[9]);
          Serial.println(rfBuffer[10]);
          Serial.println(rfBuffer[11]);
      */
      rfDriver.send(rfBuffer, msgLength);
      rfDriver.waitPacketSent();

      this->rfRepeatTime = millis();
    }
    void computeResults() {
      int i;
      //  for(i==0;i<PMSRESULTSRF;i++) {  // only first x measurements for RF transmit
      //    pmsResultsRF[i] = round(this->totals[i]/this->nrOfMeasurements);
      //  }
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
        //    long tmpResult = round(this->totals[i] / this->nrOfMeasurements);
        //    long tmpResult = round((this->totals[i]*10) / this->nrOfMeasurements);
        //    this->results[i] = tmpResult;
        //    Serial.println(i);
        //    Serial.println(tmpResult);
        //    Serial.println(this->rfRepeatTimeMax);
      }

    };
    bool serialReady() {
      return this->serialReadyBool; 
    }
    bool readData() {
      if ( millis() - this->am2320MeasureTime < this->am2320MeasureInterval ) {
        //Serial.println("am2320 interval "); //delay(100);
        return;
      }
      
      // wait some time while in init fase (also during soft reset)
      if ( millis() - this->am2320InitTime < this->am2320InitInterval ) {
        //Serial.println("am2320 init fase");
        return;
      }
 //     Serial.print(this->th.Read());

	    if (this->th.Read()!=0) return; 

      //Serial.print('q');

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
