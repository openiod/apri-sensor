#pragma once

// RF
#define MSGTYPE_NEW 'N'
#define MSGTYPE_REPEAT 'R'
#define MSGTYPE_INFO 'I'
#define MSGLENGTH_82 12  // 82=S_PMSA003

// sensortypes
#define S_PMS7003 81  // Plantower PMS7003
#define S_PMSA003 82  // Plantower PMSA003

#define PMSOUTPUTS 12 // nr of outputs like 1=PM0.3, 2=PM0.5, etc.
#define PMSRESULTS 12

#define NROFSENSORS 1

const uint8_t SERPORT_RX = 8;
const uint8_t SERPORT_TX = 9;

#include <SoftwareSerial.h>
uint16_t serial2Available;
#include <RH_ASK.h>
//#include <SPI.h> // Not actually used but needed to compile
RH_ASK rfDriver;
// RH_ASK rfDriver(2000, 2, 4, 5); // ESP8266: do not use pin 11
// RF
SoftwareSerial Serial2(SERPORT_RX, SERPORT_RX);


namespace aprisensorns {


class Sensor {

  private:
    long nrOfMeasurements;
    unsigned long nowTime;
    long measurements[PMSOUTPUTS];
    long totals[PMSOUTPUTS];
    long results[PMSOUTPUTS];
    unsigned long transactionTime; // 20 seconds per transaction, send measurement
    const unsigned long transactionTimeMax = 20000; // milliseconds per transaction period, then send message
    unsigned long rfRepeatTime;
    const unsigned long rfRepeatTimeMax = 5000; // milliseconds waittime for repeating message
    unsigned long rfSentMsgTime;  // to calculate delay for repeat message
    const unsigned long rfDelayTimeMax = 60000; // maximum delaytime in millisec for repeating messages
    uint8_t channelId = 123; // default channelId use setChannel/getChannel methodes to set/get channel id
    // unitid. Sub-number or identification of remote sensor in star-network.
    uint8_t unitId = 0; // default unitId. Use setUnitId()/getUnitId() to set/get unitId
    char rfBuf[15];
    byte sensorType; // = "PMSx003"; //Plantower PMS7003 or PMSA003
    //

  public:
    enum State {
      On,
      Off
    };
  public:
    struct SensorData {
      uint8_t type;
      uint8_t msgLength;
      byte messageNr;
      char rfBuf[15];
    } sensorData;
  public:
    Sensor() {};
    void init() {
      this->sensorData.messageNr = 0;
      Serial2.begin(9600);
      this->rfRepeatTime = 0;  //
      this->transactionTime = millis();
      this->initTotals();
      if (!rfDriver.init()) {
        //Serial.println("RF init failed");
      }
    };
    uint8_t getChannelId() {
      return this->channelId;
    };
    void setChannelId(uint8_t channelId) {
      this->channelId = channelId;
      return;
    };
    uint8_t getUnitId() {
      return this->unitId;
    };
    void setUnitId(uint8_t unitId) {
      this->unitId = unitId;
      return;
    };
    byte getNewMsgNr() {
      this->sensorData.messageNr++;
      if (this->sensorData.messageNr == 0) this->sensorData.messageNr = 1;
      return this->sensorData.messageNr;
    };
    void getMsgNr() {
      return this->sensorData.messageNr;
    };
    void setState(State state) {};
    void readUInt16(uint16_t* value, uint16_t* inputChecksum) {
      int inputHigh = Serial2.read();
      int inputLow = Serial2.read();
      *inputChecksum += inputHigh + inputLow;
      *value = inputLow + (inputHigh << 8);
    };
    void readInt(uint8_t* value, uint16_t* inputChecksum) {
      *value = Serial2.read();
      *inputChecksum += *value;
      return;
    };
    void processPmsRF() {
      this->nrOfMeasurements++;
      for (int i = 0; i < PMSOUTPUTS; i++) {
        this->totals[i] += measurements[i];
      }
      nowTime = millis();
      // repeat last sent RF messagde during transaction building process

      /*

        Serial.print("\ntransaction RF message");
           Serial.print(" nowTime:");
           Serial.print(nowTime);
           Serial.print(" transactionTime:");
           Serial.print(this->transactionTime);
           Serial.print(" this->transactionTimeMax:");
           Serial.println(this->transactionTimeMax);
           Serial.print(" rfRepeatTimeMax:");
           Serial.println(this->rfRepeatTimeMax);
      */
      unsigned long diffTime = nowTime - this->transactionTime;
      if ( diffTime < this->transactionTimeMax ) {
        if (this->rfRepeatTime == 0) return; // no transaction finished yet or max repeattime exceeded, no action to repeat
        diffTime = nowTime - this->rfRepeatTime;
        if (diffTime >= this->rfRepeatTimeMax &&
            rfRepeatTimeMax < (transactionTimeMax - 1000) // stop repeating just before new message
           ) {
          sendRfMessage(rfBuf, MSGLENGTH_82, MSGTYPE_REPEAT); // repeat message
        }
        return;
      }

      // process data once per transactiontime limit
      Serial.print("\nNr of measurements:");
      Serial.println(this->nrOfMeasurements);
      computeResults();
      for (int i = 0; i < PMSRESULTS; i++) {
        Serial.print(this->totals[i]);
        Serial.print(";\t");
      }
      Serial.print("\n");
      for (int i = 0; i < PMSRESULTS; i++) {
        Serial.print(this->results[i]);
        Serial.print(";\t");
      }
      Serial.print("\n");

      rfBuf[0] = this->channelId;
      rfBuf[1] = this->unitId;
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

      sendRfMessage(rfBuf, MSGLENGTH_82, MSGTYPE_NEW); // new message

      this->transactionTime = millis();
      initTotals();

    };

    void initTotals() {
      for (int i = 0; i < PMSOUTPUTS; i++) {
        this->totals[i] = 0;
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

      Serial.print("RF sending message length: ");
      Serial.print(msgLength);
      Serial.print(", Channel: ");
      Serial.print(rfBuffer[0]);
      Serial.print(", Unit: ");
      Serial.print(rfBuffer[1]);
      Serial.print(", Sensortype: ");
      Serial.print(rfBuffer[2]);
      Serial.print(", Msgtype: ");
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

      for (i = 0; i < PMSOUTPUTS; i++) { // only first 3 measurements for RF transmit
        this->results[i] = (((this->totals[i] * 100) / this->nrOfMeasurements) + .49) / 10;
        //    long tmpResult = round(this->totals[i] / this->nrOfMeasurements);
        //    long tmpResult = round((this->totals[i]*10) / this->nrOfMeasurements);
        //    this->results[i] = tmpResult;
        //    Serial.println(i);
        //    Serial.println(tmpResult);
        //    Serial.println(this->rfRepeatTimeMax);
      }

    };
    bool serialReady() {
      if (Serial2) return true; else return false;
    }
    bool readData() {

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
      uint16_t inputChecksum;

      serial2Available = Serial2.available();

      if (serial2Available < 32) {
        return;
        if (serial2Available < 1) {
          //        delay(150);
          //        Serial.println("##############################");
          //        BMP280_read();
          //        AM2320_read();
          //        DS18B20_read();
          //        MQ131_read();
          //delay(10);
          return;
        };
        Serial.println(serial2Available);
        if (serial2Available > 16) {
          //delay(30);
          return;
        };
        if (serial2Available > 0) {
          //delay(30);
          return;
        };
        //delay(100);
        return;
      }

      //    Serial.print("Serial1 available: ");
      //    Serial.println(serial2Available);

      inputChecksum = 0;

      // test first 2 bytes must be 0x424D
      uint16_t controleCodes;
      readUInt16(&controleCodes, &inputChecksum );
      if (controleCodes != 0x424D) return;

      // test next 2 bytes must be 0x001c
      readUInt16(&controleCodes, &inputChecksum );
      if (controleCodes != 0x001c) return;

      // read all sensor output values and sum Checksum
      for (int i = 0; i < PMSOUTPUTS; i++) {
        int value;
        readUInt16(&value, &inputChecksum );
        this->measurements[i] = value;
      }

      concPM1_0_CF1 = this->measurements[0];
      concPM2_5_CF1 = this->measurements[1];
      concPM10_0_CF1 = this->measurements[2];
      concPM1_0_amb = this->measurements[3];
      concPM2_5_amb = this->measurements[4];
      concPM10_0_amb = this->measurements[5];
      rawGt0_3um = this->measurements[6];
      rawGt0_5um = this->measurements[7];
      rawGt1_0um = this->measurements[8];
      rawGt2_5um = this->measurements[9];
      rawGt5_0um = this->measurements[10];
      rawGt10_0um = this->measurements[11];

      // read versionnumber
      readInt(&version, &inputChecksum );

      // read errorcode
      readInt(&errorCode, &inputChecksum );

      // determine sensortype
      if (version == 128) this->sensorType = S_PMS7003; // "PMS7003";
      if (version == 145) this->sensorType = S_PMSA003; // "PMSA003";

      // read sensor record checksum
      uint8_t inputHigh = Serial2.read();
      uint8_t inputLow  = Serial2.read();
      checksum  = inputLow + (inputHigh << 8);

      if (checksum != inputChecksum) {
        // checksum error, skip input
        //    Serial.print(";");
        //    Serial.print(checksum);
        //    Serial.print(";");
        //    Serial.print(inputChecksum);
      } else {
        if (errorCode == 0) {
          // send message via RF
          processPmsRF();
        }
      }

      while (Serial2.read() != -1) {}; //clear buffer

      //delay(700);  // 700 when other sensors not included // higher will get you checksum errors
      //delay(1000);     // 50  when other sensors are included //higher will get you checksum errors

      return;
    }

};

extern Sensor gApriSensor;  // global instance

}  // end namespace  ApriSensor
