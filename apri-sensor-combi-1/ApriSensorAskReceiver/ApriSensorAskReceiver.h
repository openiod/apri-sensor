#pragma once

// RF
#define MSGTYPE_NEW 'N'
#define MSGTYPE_REPEAT 'R'
#define MSGTYPE_INFO 'I'

#define MSGLENGTH_82 12  // 82=S_PMSA003

// sensortypes
#define S_PMS7003 81  // Plantower PMS7003
#define S_PMS7003_ID "PMS7003"
#define S_PMSA003 82  // Plantower PMSA003
#define S_PMSA003_ID "PMSA003"

#define PMSOUTPUTS 12 // nr of outputs like 1=PM0.3, 2=PM0.5, etc.
#define PMSRESULTS 12

#define NROFSENSORS 1

//#include <SoftwareSerial.h>
//uint16_t serial2Available;
#include <RH_ASK.h>
#include <SPI.h> // Not actually used but needed to compile

//RH_ASK rfDriver(2000,11,12);
/// Initialise RH_ASK for ATTiny85 like this:
/// // #include <SPI.h> // comment this out, not needed
/// RH_ASK driver(2000, 4, 3); // 200bps, TX on D3 (pin 2), RX on D4 (pin 3)
/// then:
/// Connect D3 (pin 2) as the output to the transmitter
/// Connect D4 (pin 3) as the input from the receiver.

// RF

namespace aprisensorRns {


class Receiver {

  private:
    RH_ASK rfDriver;
    RH_ASK *rfDriverPtr;
    bool receiverState = false;
//    byte prevMsgNr_PMSA003 = 0;
//    unsigned long prevMsgNr_PMSA003Time = 0;
    static const int dataIndexMax = 5;
    struct SensorData {
      uint8_t channelId;
      uint8_t unitId;
      uint8_t sensorType;
      uint8_t msgType;
      byte msgNr;
      byte prevMsgNr;
      unsigned long prevMsgTime;
      byte rfBuf[15];
    };
    SensorData sensorDataArray[dataIndexMax];
     
    /*
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
    */

  public:
    enum State {
      On,
      Off
    };

  public:
    Receiver() {
      RH_ASK rfDriver(2000,9,10);
      };
    void init() {
        rfDriverPtr = &rfDriver;
      //          this->sensorData.messageNr = 0;
      //          this->rfRepeatTime = 0;  //
      //          this->transactionTime = millis();
      //          this->initTotals();
      for (int i=0;i<dataIndexMax;i++) {
        sensorDataArray[i].channelId = 0;
        sensorDataArray[i].unitId = 0;
        sensorDataArray[i].sensorType = 0;    
        sensorDataArray[i].msgType = 0;
        sensorDataArray[i].msgNr = 0;
        sensorDataArray[i].prevMsgNr = 0;
        sensorDataArray[i].prevMsgTime = 0;
      }
      if ((*rfDriverPtr).init()) {receiverState = true;}
    }
    void setState(State state) {};
    bool isActive() {return this->receiverState;};
    uint16_t getPointer() {return this->rfDriverPtr;}
    

    void receiveData() {

      uint8_t buf[RH_ASK_MAX_MESSAGE_LEN];
      uint8_t buflen = sizeof(buf);
      //Serial.println("loop");

//      if (rfDriver.recv(buf, &buflen)) // Non-blocking
      if ((*rfDriverPtr).recv(buf, &buflen)) // Non-blocking
      {
       
        int index = -1;
        if (buflen == 0) {
          Serial.print("\nRF message length 0 received, ignoring ");
          return; //message ingnored
        }
        byte channelId = buf[0];
        if (channelId != 123) {
          Serial.print("\nInvalid ApriSensor message received, first byte value: ");
          Serial.print(buf[0]);
          return; //message discarded
        }
        byte unitId = buf[1];
        byte sensorType = buf[2];
        char msgType = buf[3];
        byte msgNr = buf[4];
        byte delayTime = buf[5];

        // find index in array for message with channel, unit, sensorType or init new entry
        for (int i=0;i<dataIndexMax;i++) {
          if (sensorDataArray[i].channelId == channelId &&
              sensorDataArray[i].unitId == unitId &&
              sensorDataArray[i].sensorType == sensorType
          ) {
            index = i;
            break;
          }
          if (sensorDataArray[i].channelId == 0) {
            sensorDataArray[i].channelId = channelId;
            sensorDataArray[i].unitId = unitId;
            sensorDataArray[i].sensorType = sensorType;
            index = i;
            break;
          }
          if (sensorDataArray[i].channelId == channelId &&
              sensorDataArray[i].unitId == unitId &&
              sensorDataArray[i].sensorType == sensorType
          ) {
            index = i;
            break;
          }
          
        }

//        Serial.print("\nIndex for message = ");
//        Serial.print(index);

        if (index>=dataIndexMax) {
          Serial.print("\nToo many sensor units in neighborhood. Max is ");
          Serial.print(dataIndexMax);
          Serial.print(" Message skipped.");
          return;
        }

        if (sensorType == S_PMSA003) {
          uint16_t pm1  = buf[6] << 8;
          pm1 += buf[7];
          uint16_t pm25 = buf[8] << 8;
          pm25 += buf[9];
          uint16_t pm10 = buf[10] << 8;
          pm10 += buf[11];

          if ( msgType == MSGTYPE_REPEAT ) {
            if ( msgNr == sensorDataArray[index].prevMsgNr) {
              //Serial.println("repeated message already received, ignore.");
              //Serial.print(".");  // signal for received message
              return;
            }
            Serial.print("\nrepeated message received as new, processing. Delaytime: ");
            Serial.print(delayTime);
          }

          if (sensorDataArray[index].prevMsgNr != 0 && sensorDataArray[index].prevMsgNr != msgNr + 1) {
            uint16_t prev = sensorDataArray[index].prevMsgNr;
            uint16_t curr = msgNr;
            if (prev > curr) {
              curr += 255;
            }
            uint16_t diff = curr - prev - 1;
            if (diff > 0 ) {
              Serial.print("\nMessages not received: ");
              Serial.print(diff);
              Serial.print(" in  ");
              unsigned long diffTime = (millis() - sensorDataArray[index].prevMsgTime) / 1000;
              Serial.print(diffTime);
              Serial.print(" seconds.");
            }
          }

          char sensorId[20] = "PMSx003\0";
          if (sensorType ==  S_PMS7003) strncpy(sensorId, S_PMS7003_ID,20);
          if (sensorType ==  S_PMSA003) strncpy(sensorId, S_PMSA003_ID,20);
         
          // first the ID for ApriSensor system eg. "RF_PMSA003"
          Serial.print("\nRF_");
          Serial.print(sensorId);
          Serial.print(";*RF");
          Serial.print(channelId);
          Serial.print("*");
          Serial.print(unitId);
          Serial.print(";");
          Serial.print(sensorId);
          Serial.print(";");
          Serial.print(pm1);
          Serial.print(";");
          Serial.print(pm25);
          Serial.print(";");
          Serial.print(pm10);
//          Serial.print(" msgnr:");
//          Serial.print(msgNr);

          sensorDataArray[index].prevMsgNr = msgNr;
          sensorDataArray[index].prevMsgTime = millis();

          return;
        }

        Serial.print("\nInvalid ApriSensor message received, sensortype byte value: ");
        Serial.print(sensorType);
      }
    }

};

extern Receiver gApriSensorReceiver;  // global instance

}  // end namespace  ApriSensor
