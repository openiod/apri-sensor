#pragma once

// RF
#define MSGTYPE_NEW 'N'
#define MSGTYPE_REPEAT 'R'
#define MSGTYPE_INFO 'I'
#define MSGTYPE_EXTEND 'X' // retransmitted by "jumper transciever" or message extender;
#define MSGTYPE_EXTENDR 'Y' // Repeated message retransmitted by "jumper transciever" or message extender;
#define MSGTYPE_SYNC 'S' //Sync message/pulse

// sensortypes
#define S_DS18B20 51  // DS18B20
#define S_DS18B20_ID "DS18B20"
#define S_AM2320  61  // AM2320
#define S_AM2320_ID "AM2320"
#define S_BMP280  71  // BMP280
#define S_BMP280_ID "BMP280"
#define S_PMS7003 81  // Plantower PMS7003
#define S_PMS7003_ID "PMS7003"
#define S_PMSA003 82  // Plantower PMSA003
#define S_PMSA003_ID "PMSA003"

#define MSGLENGTH_DS18B20 8  // 51=S_DS18B20
#define MSGLENGTH_AM2320 10  // 61=S_AM2320
#define MSGLENGTH_BMP280 12  // 71=S_BMP280
#define MSGLENGTH_PMSX003 10 // 82=S_PMSx003

#define MSGMAXLENGTH 15 // maximum buffer length message
#define DATAINDEXMAX 10 // max different channel/unit/sensor types combinations (PMS7003/PMSA003/DS18B20/AM2320/BMP280/etc.) 


//#include <SoftwareSerial.h>
//uint16_t serial2Available;
#include <RH_ASK.h>
//#include <SPI.h> // Not actually used but needed to compile

//RH_ASK rfDriver(2000,11,12);
/// Initialise RH_ASK for ATTiny85 like this:
/// // #include <SPI.h> // comment this out, not needed
/// RH_ASK driver(2000, 4, 3); // 200bps, TX on D3 (pin 2), RX on D4 (pin 3)
/// then:
/// Connect D3 (pin 2) as the output to the transmitter
/// Connect D4 (pin 3) as the input from the receiver.
    RH_ASK rfDriver;
    RH_ASK *rfDriverPtr;

// RF

long syncTimeMax = 15000;  // send sync pulse every 10 sec
long syncTime = millis();
byte syncBuf[4];
uint8_t syncBuflen = sizeof(syncBuf);



long resetAfterSilenceTime = 50000;  // reset after 50 sec without measurements
long resetLastMeasurementTime = millis();

long periodicResetTime = millis()+3600000; // reset every hour

// automatic restart
void resetArduino() {
  //printPrefix(INFO);Serial.print("Reset");Serial.print("\r\n");
  resetLastMeasurementTime = millis()+resetAfterSilenceTime;
  //delay(1000);

  asm volatile (" jmp 0"); 
}

void syncPulse() {
  char syncMsgType = MSGTYPE_SYNC;
  syncBuf[0]=channelId4b<<4;
  syncBuf[1]=UNIT_ID;
  syncBuf[2]=0; //sensorType
  syncBuf[3]=syncMsgType; //msgTpe Sync
  rfDriver.send(syncBuf, syncBuflen);
  rfDriver.waitPacketSent();
  syncTime = millis();
  Serial.print("I@Sync pulse channelnr:");
  Serial.print(channelId4b);
  Serial.print(" channelId:");
  Serial.print(syncBuf[0]);
  Serial.print(" from unit:");
  Serial.print(UNIT_ID);
  Serial.print(" (Receiver) ");
  Serial.print(" MsgType:");
  Serial.print(syncMsgType);
  Serial.print("\r\n");
}

namespace aprisensor_ns {

class Receiver {

  private:
    bool receiverState = false;
//    byte prevMsgNr_PMSA003 = 0;
//    unsigned long prevMsgNr_PMSA003Time = 0;
    static const int dataIndexMax = 6;
    struct SensorData {
      uint8_t msgChannelNr;
      uint8_t unitId;
      uint8_t sensorType;
      uint8_t msgType;
      byte msgNr;
      byte prevMsgNr;
      unsigned long prevMsgTime;
      byte rfBuf[MSGMAXLENGTH];
    };
    SensorData sensorDataArray[dataIndexMax];
  public:
    Receiver() {
      };
    void init() {
      rfDriverPtr = &rfDriver;
      for (int i=0;i<dataIndexMax;i++) {
        sensorDataArray[i].msgChannelNr = 0;
        sensorDataArray[i].unitId = 0;
        sensorDataArray[i].sensorType = 0;    
        sensorDataArray[i].msgType = 0;
        sensorDataArray[i].msgNr = 0;
        sensorDataArray[i].prevMsgNr = 0;
        sensorDataArray[i].prevMsgTime = 0;
      }
      if ((*rfDriverPtr).init()) {receiverState = true;}
    }
    void receiveData() {
      uint8_t buf[RH_ASK_MAX_MESSAGE_LEN];
      uint8_t buflen = sizeof(buf);

      if ((*rfDriverPtr).recv(buf, &buflen)) { // Non-blocking      
      Serial.print("loop");
      Serial.print("\r\n");
//      delay(1000);
        int index = -1;
        if (buflen == 0) {
          Serial.print("W@RF message length 0 received, ignoring ");
          Serial.print("\r\n");
          return; //message ingnored
        }
        
        delay(100); //delay extender to wait for original message
        
        byte channelId = buf[0];
        byte msgChannelNr = channelId>>4;
        byte msgChannelNrInId = msgChannelNr<<4;
        byte msgExtNr = (channelId - msgChannelNrInId) >>2;
        byte msgExtNrInId = msgExtNr<<2;
        byte msgCycle = channelId - msgChannelNrInId - msgExtNrInId;
        
        if (msgChannelNr != channelId4b ) {
          Serial.print("E@Invalid ApriSensor message received, first byte value: ");
          Serial.print(buf[0]);
          Serial.print("\r\n");
          return; //message discarded
        }
        if (extender && msgExtNr == extenderId2b ) {  // skip its own sent messages
          Serial.print("W@Extender skipped its own sent message (first byte): ");
          Serial.print(buf[0]);
          Serial.print("\r\n");
          return; //message discarded
        }

        byte unitId = buf[1];
        byte sensorType = buf[2];
        char msgType = buf[3];
        byte msgNr = buf[4];
        byte delayTime = buf[5];

        //if (extender and msgType == MSGTYPE_EXTEND) return; // skip extended messages or should it always retranscieve messages?
        // or maybe transmit it true extended channel (channel+1) to prevent looping msg to itself.
          
        if (extender) {  //act as an extender
          if (msgType == MSGTYPE_REPEAT) {
            buf[3] = MSGTYPE_EXTENDR;
          } else {
            if (msgType != MSGTYPE_EXTENDR) {
            buf[3] = MSGTYPE_EXTEND;
            } 
          }
          
          if (msgExtNr==extenderId2b) {
            Serial.print("W@Message from own extender ignored ");
            Serial.print(msgExtNr);
            Serial.print(' ');
            Serial.print(extenderId2b);
            Serial.print("\r\n");
            return; //Message from own extender ignored
          }
          if (msgCycle>=3) {
            Serial.print("E@Max extends reached ");
            Serial.print(msgChannelNr);
            Serial.print(' ');
            Serial.print(msgExtNr);
            Serial.print(' ');
            Serial.print(msgCycle);
            Serial.print(' ');
            Serial.print(extenderId2b);
            Serial.print("\r\n");
            return; // max extends reached, skip/ stop extending this message
          }
          byte _tmpExtNew = extenderId2b<<2;
          byte _newId = msgChannelNrInId + msgExtNrInId + msgCycle; 
 //           Serial.print("I@Test ");
 //           Serial.print(_tmpExtNew);
 //           Serial.print(' ');
 //           Serial.print(_tmpCycle);
 //           Serial.print("\r\n");
          
          buf[0]= _newId+1;  // increase channelnr to prevent looping msg's
          Serial.print("X@Extend message ");
          Serial.print(buf[0]);
          Serial.print(' ');
          Serial.print(buf[1]);
          Serial.print(' ');
          Serial.print(sensorType);
          Serial.print(' ');
          Serial.print(msgType);
          Serial.print(" channelnr:");
          Serial.print(msgChannelNr);
          Serial.print(" unitId:");
          Serial.print(unitId);
          Serial.print(" sensorType:");
          Serial.print(sensorType);
          Serial.print(" msgnr:");
          Serial.print(msgNr);
          Serial.print(" msgtype:");
          Serial.print(msgType);
          Serial.print(" msglength: ");
          Serial.print(buflen);
          Serial.print("\r\n");

          
          rfDriver.send(buf, buflen);
          rfDriver.waitPacketSent();
          return;
        }
        

        // find index in array for message with channel, unit, sensorType or init new entry
        for (int i=0;i<dataIndexMax;i++) {
          if (sensorDataArray[i].msgChannelNr == msgChannelNr &&
              sensorDataArray[i].unitId == unitId &&
              sensorDataArray[i].sensorType == sensorType
          ) {
            index = i;
            break;
          }
          if (sensorDataArray[i].msgChannelNr == 0) {
            sensorDataArray[i].msgChannelNr = msgChannelNr;
            sensorDataArray[i].unitId = unitId;
            sensorDataArray[i].sensorType = sensorType;
            index = i;
            break;
          }
          
        }

//        Serial.print("\r\nIndex for message = ");
//        Serial.print(index);

        if (index>=dataIndexMax) {
          Serial.print("E@Too many sensor units in neighborhood. Max is ");
          Serial.print(dataIndexMax);
          Serial.print(" Message skipped.");
          Serial.print("\r\n");
          return;
        }

        if (sensorDataArray[index].prevMsgNr == msgNr) {
          if (debug == true) {
            Serial.print("I@Repeated or Extended message already recieved. Ignoring ");
            Serial.print(msgChannelNr);
            Serial.print(" channelId:");
            Serial.print(channelId);
            Serial.print(" Unit:");
            Serial.print(unitId);
            Serial.print(" Sensor:");
            Serial.print(sensorType);
            Serial.print(" MsgType:");
            Serial.print(msgType);
            Serial.print("\r\n");
          }
          return;
        }

        if (debug == true) {
          Serial.print("I@Message recieved, processing ");
          Serial.print(msgChannelNr);
          Serial.print(" channelId:");
          Serial.print(channelId);
          Serial.print(" Unit:");
          Serial.print(unitId);
          Serial.print(" Sensor:");
          Serial.print(sensorType);
          Serial.print(" MsgType:");
          Serial.print(msgType);
          Serial.print("\r\n");
        }

        if (sensorType == S_PMSA003) {
          uint16_t pm1  = buf[6] << 8;
          pm1 += buf[7];
          uint16_t pm25 = buf[8] << 8;
          pm25 += buf[9];
          uint16_t pm10 = buf[10] << 8;
          pm10 += buf[11];

          if ( msgType == MSGTYPE_REPEAT || msgType == MSGTYPE_EXTENDR ) {
            if ( msgNr == sensorDataArray[index].prevMsgNr) {
              //Serial.print("repeated message already received, ignore.");
              //Serial.print("\r\n");
              //Serial.print(".");  // signal for received message
              return;
            }
            Serial.print("I@repeated or extended message received as new, processing. Delaytime: ");
            Serial.print(delayTime);        
            Serial.print(" channelnr:");
            Serial.print(msgChannelNr);
            Serial.print(" channelId:");
            Serial.print(channelId);
            Serial.print(" Unit:");
            Serial.print(unitId);
            Serial.print(" Sensor:");
            Serial.print(sensorType);
            Serial.print(" MsgType:");
            Serial.print(msgType);
            Serial.print("\r\n");
         }

          if (sensorDataArray[index].prevMsgNr != 0 && sensorDataArray[index].prevMsgNr != msgNr + 1) {
            uint16_t prev = sensorDataArray[index].prevMsgNr;
            uint16_t curr = msgNr;
            if (prev > curr) {
              curr += 255;
            }
            uint16_t diff = curr - prev - 1;
            if (diff > 0 ) {
              Serial.print("E@Messages not received: ");
              Serial.print(diff);
              Serial.print(" in  ");
              unsigned long diffTime = (millis() - sensorDataArray[index].prevMsgTime) / 1000;
              Serial.print(diffTime);
              Serial.print(" seconds.");
              Serial.print(" channelnr:");
              Serial.print(msgChannelNr);
              Serial.print(" channelId:");
              Serial.print(channelId);
              Serial.print(" Unit:");
              Serial.print(unitId);
              Serial.print(" Sensor:");
              Serial.print(sensorType);
              Serial.print(" MsgType:");
              Serial.print(msgType);
              Serial.print(" MsgNr:");
              Serial.print(msgNr);
              Serial.print(" PrevMsgNr:");
              Serial.print(prev);
              Serial.print("\r\n");
            }
          }

          char sensorId[20] = "PMSx003\0";
          if (sensorType ==  S_PMS7003) strncpy(sensorId, S_PMS7003_ID,20);
          if (sensorType ==  S_PMSA003) strncpy(sensorId, S_PMSA003_ID,20);
         
          // first the ID for ApriSensor system eg. "RF_PMSA003"
          Serial.print("M@RF");
          Serial.print(msgChannelNr);
          Serial.print("*");
          Serial.print(unitId);
          Serial.print("@");
          Serial.print(sensorId);
          Serial.print(";");
          Serial.print(msgNr);
          Serial.print(";");
          Serial.print(pm1);
          Serial.print(";");
          Serial.print(pm25);
          Serial.print(";");
          Serial.print(pm10);
          Serial.print("\r\n");

          sensorDataArray[index].prevMsgNr = msgNr;
          sensorDataArray[index].prevMsgTime = millis();

          return;
        }

        if (sensorType == S_DS18B20) {
          uint16_t temperature  = buf[6] << 8;
          temperature += buf[7];

          if ( msgType == MSGTYPE_REPEAT || msgType == MSGTYPE_EXTENDR ) {
            if ( msgNr == sensorDataArray[index].prevMsgNr) {
              //Serial.print("repeated message already received, ignore.");
              //Serial.print("\r\n");
              //Serial.print(".");  // signal for received message
              return;
            }
            Serial.print("I@repeated message received as new, processing. Delaytime: ");
            Serial.print(delayTime);
            Serial.print(" channelnr:");
            Serial.print(msgChannelNr);
            Serial.print(" channelId:");
            Serial.print(channelId);
            Serial.print(" Unit:");
            Serial.print(unitId);
            Serial.print(" Sensor:");
            Serial.print(sensorType);
            Serial.print("\r\n");
          }

          if (sensorDataArray[index].prevMsgNr != 0 && sensorDataArray[index].prevMsgNr != msgNr + 1) {
            uint16_t prev = sensorDataArray[index].prevMsgNr;
            uint16_t curr = msgNr;
            if (prev > curr) {
              curr += 255;
            }
            uint16_t diff = curr - prev - 1;
            if (diff > 0 ) {
              Serial.print("E@Messages not received: ");
              Serial.print(diff);
              Serial.print(" in  ");
              unsigned long diffTime = (millis() - sensorDataArray[index].prevMsgTime) / 1000;
              Serial.print(diffTime);
              Serial.print(" seconds. ");
              Serial.print(delayTime);
/*            Serial.print(" channel:");
            Serial.print(channelId);
            Serial.print(" Unit:");
            Serial.print(unitId);
            Serial.print(" Sensor:");
            Serial.print(sensorType);              
            Serial.print(" Msgnr:");
            Serial.print(msgNr);              
            Serial.print(" MsgnrPrev:");
            Serial.print(prev);              
*/
              Serial.print("\r\n");
            }
          }

          char sensorId[20] = "DS18B20\0";
          //if (sensorType ==  S_PMS7003) strncpy(sensorId, S_PMS7003_ID,20);
          //if (sensorType ==  S_PMSA003) strncpy(sensorId, S_PMSA003_ID,20);
         
          // first the ID for ApriSensor system eg. "RF_DS18B20"
          Serial.print("M@RF");
          Serial.print(msgChannelNr);
          Serial.print("*");
          Serial.print(unitId);
          Serial.print("@");
          Serial.print(sensorId);
          Serial.print(";");
          Serial.print(msgNr);
          Serial.print(";");
          Serial.print(temperature);
          Serial.print("\r\n");

          sensorDataArray[index].prevMsgNr = msgNr;
          sensorDataArray[index].prevMsgTime = millis();

          return;
        }

        if (sensorType == S_AM2320) {
          uint16_t rHum  = buf[6] << 8;
          rHum += buf[7];
          uint16_t temperature  = buf[8] << 8;
          temperature += buf[9];

          if ( msgType == MSGTYPE_REPEAT || msgType == MSGTYPE_EXTENDR ) {
            if ( msgNr == sensorDataArray[index].prevMsgNr) {
              //Serial.print("repeated message already received, ignore.");
              //Serial.print("\r\n");
              //Serial.print(".");  // signal for received message
              return;
            }
            Serial.print("I@repeated message received as new, processing. Delaytime: ");
            Serial.print(delayTime);
            Serial.print(" channelnr:");
            Serial.print(msgChannelNr);
            Serial.print(" channelId:");
            Serial.print(channelId);
            Serial.print(" Unit:");
            Serial.print(unitId);
            Serial.print(" Sensor:");
            Serial.print(sensorType);
            Serial.print("\r\n");
          }

          if (sensorDataArray[index].prevMsgNr != 0 && sensorDataArray[index].prevMsgNr != msgNr + 1) {
            uint16_t prev = sensorDataArray[index].prevMsgNr;
            uint16_t curr = msgNr;
            if (prev > curr) {
              curr += 255;
            }
            uint16_t diff = curr - prev - 1;
            if (diff > 0 ) {
              Serial.print("E@Messages not received: ");
              Serial.print(diff);
              Serial.print(" in  ");
              unsigned long diffTime = (millis() - sensorDataArray[index].prevMsgTime) / 1000;
              Serial.print(diffTime);
              Serial.print(" seconds.");
              Serial.print("\r\n");
            }
          }

          char sensorId[20] = "AM2320\0";
          //if (sensorType ==  S_PMS7003) strncpy(sensorId, S_PMS7003_ID,20);
          //if (sensorType ==  S_PMSA003) strncpy(sensorId, S_PMSA003_ID,20);
         
          // first the ID for ApriSensor system eg. "RF_AM2320"
          Serial.print("M@RF");
          Serial.print(msgChannelNr);
          Serial.print("*");
          Serial.print(unitId);
          Serial.print("@");
          Serial.print(sensorId);
          Serial.print(";");
          Serial.print(msgNr);
          Serial.print(";");
          Serial.print(rHum);
          Serial.print(";");
          Serial.print(temperature);
          Serial.print("\r\n");

          sensorDataArray[index].prevMsgNr = msgNr;
          sensorDataArray[index].prevMsgTime = millis();

          return;
        }

        if (sensorType == S_BMP280) {
          uint16_t pressureHPa  = buf[6] << 8;
          pressureHPa += buf[7];
          uint16_t temperature  = buf[8] << 8;
          temperature += buf[9];
          uint16_t altitude  = buf[10] << 8;
          altitude += buf[11];

          if ( msgType == MSGTYPE_REPEAT || msgType == MSGTYPE_EXTENDR ) {
            if ( msgNr == sensorDataArray[index].prevMsgNr) {
              //Serial.print("repeated message already received, ignore.");
              //Serial.print("\r\n");
              //Serial.print(".");  // signal for received message
              return;
            }
            Serial.print("I@repeated message received as new, processing. Delaytime: ");
            Serial.print(delayTime);
            Serial.print(" channelnr:");
            Serial.print(msgChannelNr);
            Serial.print(" channelId:");
            Serial.print(channelId);
            Serial.print(" Unit:");
            Serial.print(unitId);
            Serial.print(" Sensor:");
            Serial.print(sensorType);
            Serial.print("\r\n");
          }

          if (sensorDataArray[index].prevMsgNr != 0 && sensorDataArray[index].prevMsgNr != msgNr + 1) {
            uint16_t prev = sensorDataArray[index].prevMsgNr;
            uint16_t curr = msgNr;
            if (prev > curr) {
              curr += 255;
            }
            uint16_t diff = curr - prev - 1;
            if (diff > 0 ) {
              Serial.print("E@Messages not received: ");
              Serial.print(diff);
              Serial.print(" in  ");
              unsigned long diffTime = (millis() - sensorDataArray[index].prevMsgTime) / 1000;
              Serial.print(diffTime);
              Serial.print(" seconds.");
              Serial.print("\r\n");
            }
          }

          char sensorId[20] = "BMP280\0";
          //if (sensorType ==  S_PMS7003) strncpy(sensorId, S_PMS7003_ID,20);
          //if (sensorType ==  S_PMSA003) strncpy(sensorId, S_PMSA003_ID,20);
         
          // first the ID for ApriSensor system eg. "RF_BMP280"
          Serial.print("M@RF");
          Serial.print(msgChannelNr);
          Serial.print("*");
          Serial.print(unitId);
          Serial.print("@");
          Serial.print(sensorId);
          Serial.print(";");
          Serial.print(msgNr);
          Serial.print(";");
          Serial.print(pressureHPa);
          Serial.print(";");
          Serial.print(temperature);
          Serial.print(";");
          Serial.print(altitude);
          Serial.print("\r\n");

          sensorDataArray[index].prevMsgNr = msgNr;
          sensorDataArray[index].prevMsgTime = millis();

          return;
        }
        
        Serial.print("Invalid ApriSensor message received, sensortype byte value: ");
        Serial.print(sensorType);
        Serial.print("\r\n");
      }
    }

};

extern Receiver gApriSensorReceiver;  // global instance

}  // end namespace  ApriSensor
