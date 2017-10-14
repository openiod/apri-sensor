#pragma once

// RF
const byte PROGMEM  MSGTYPE_NEW ='N';
//#define MSGTYPE_REPEAT 'R'
const byte PROGMEM MSGTYPE_REPEAT= 'R';
const byte PROGMEM  MSGTYPE_INFO= 'I';
const byte PROGMEM  MSGTYPE_EXTEND= 'X';
const byte PROGMEM  MSGTYPE_SYNC= 'S';

// sensortypes
#define S_DS18B20 51  // DS18B20
#define S_AM2320  61  // AM2320
#define S_BMP280  71  // BMP280
//#define S_PMS7003 81  // Plantower PMS7003
//#define S_PMSA003 82  // Plantower PMSA003

#define MSGLENGTH_DS18B20 8  // 51=S_DS18B20
#define MSGLENGTH_AM2320 10  // 61=S_AM2320
#define MSGLENGTH_BMP280 12  // 71=S_BMP280
//#define MSGLENGTH_PMSX003 10 //12  // 82=S_PMSx003

const PROGMEM byte  INFO = 'I';
const PROGMEM byte  ERROR = 'E';
const PROGMEM byte  WARNING = 'W';
const PROGMEM byte  MEASUREMENT = 'M';

const PROGMEM String ERRORFIRSTBYTE = "E@Invalid first byte: \0"; 
const PROGMEM String SYNCTIMEACTIVETXT = "W@Sync time is active, ignore another sync request. ";
const PROGMEM String SETSYNCTIMEACTIVETXT ="W@Set sync time active ";
const PROGMEM String FREESRAMTXT =" freeSRam:";
const PROGMEM String NEWLINE = "\r\n";
const char PROGMEM AT = '@';
const char PROGMEM SLASH = '/';
const char PROGMEM SPACE = ' ';
const uint8_t PROGMEM ZERO = 0;
const uint8_t PROGMEM ONE = 1;

void printPrefix(char type) {
  Serial.print(type);
  Serial.print(AT);
  Serial.print(MSG_ID);
  Serial.print(SLASH);
  Serial.print(UNIT_ID);
  Serial.print(AT);
}

bool syncMsgActive = false;
long syncMsgTime=-1;
const long PROGMEM syncMaxTime = 10000; // 10 seconds max active time sync.

void receiveSyncMsg() {
//      if ((*rfDriverPtr).recv(buf, &buflen)) { // Non-blocking      
//      Serial.print("loop");
//      Serial.print(NEWLINE);
//      delay(1000);

        if (syncBuflen == 0) {
         // Serial.print("W@RF message length 0 received, ignoring ");
         // Serial.print(NEWLINE);
          return; //message ingnored
        }
        
        byte channelId = syncBuf[0];
        byte msgChannelNr = channelId>>4;
        byte msgChannelNrInId = msgChannelNr<<4;
//        byte msgExtNr = (channelId - msgChannelNrInId) >>2;
//        byte msgExtNrInId = msgExtNr<<2;
//        byte msgCycle = channelId - msgChannelNrInId - msgExtNrInId;
        
        if (msgChannelNr != channelId4b ) {
          Serial.print(ERRORFIRSTBYTE);
          Serial.print(syncBuf[0]);
          Serial.print(NEWLINE);
          return; //message discarded
        }
//        if (extender && msgExtNr == extenderId2b ) {  // skip its own sent messages
//          Serial.print("W@Extender skipped its own sent message (first byte): ");
//          Serial.print(syncBuf[0]);
//          Serial.print(NEWLINE);
//          return; //message discarded
//        }

        byte unitId = syncBuf[1];
        byte sensorType = syncBuf[2];
        char msgType = syncBuf[3];
        if (msgType !=  MSGTYPE_SYNC) {
//          Serial.print("W@Not a sync message received by sensor, ignore msgType ");
//          Serial.print(msgType);
//          Serial.print(NEWLINE);          
          return;
        }
        if (millis() - syncMsgTime < syncMaxTime) {
          Serial.print(SYNCTIMEACTIVETXT);
          Serial.print(millis() - syncMsgTime);          
          Serial.print(SPACE);          
          Serial.print(syncMaxTime);          
          Serial.print(NEWLINE);          
          return;          
        }
        syncMsgActive = true;
        syncMsgTime = millis();
        Serial.print(SETSYNCTIMEACTIVETXT);
        Serial.print(millis() - syncMsgTime);          
        Serial.print(SPACE);          
        Serial.print(syncMaxTime);          
        Serial.print(NEWLINE);
        return;        
//      }
}
/*
extern unsigned int __bss_end;
extern unsigned int __heap_start;
extern void *__brkval;

uint16_t getFreeSram() {
  uint8_t newVariable;
  // heap is empty, use bss as start memory address
  if ((uint16_t)__brkval == 0)
    return (((uint16_t)&newVariable) - ((uint16_t)&__bss_end));
  // use heap end as the start of the memory address
  else
    return (((uint16_t)&newVariable) - ((uint16_t)__brkval));
};
*/
