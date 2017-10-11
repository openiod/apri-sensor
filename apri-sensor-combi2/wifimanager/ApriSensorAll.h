#pragma once

// RF
#define MSGTYPE_NEW 'N'
#define MSGTYPE_REPEAT 'R'
#define MSGTYPE_INFO 'I'
#define MSGTYPE_EXTEND 'X'

// sensortypes
#define S_DS18B20 51  // DS18B20
#define S_AM2320  61  // AM2320
#define S_BMP280  71  // BMP280
#define S_PMS7003 81  // Plantower PMS7003
#define S_PMSA003 82  // Plantower PMSA003

#define MSGLENGTH_DS18B20 8  // 51=S_DS18B20
#define MSGLENGTH_AM2320 10  // 61=S_AM2320
#define MSGLENGTH_BMP280 12  // 71=S_BMP280
#define MSGLENGTH_PMSX003 12 // 82=S_PMSx003

char INFO = 'I';
char ERROR = 'E';
char WARNING = 'W';
char MEASUREMENT = 'M';



void printPrefix(char type) {
  Serial.print(type);
  Serial.print("@");
  Serial.print(MSG_ID);
  Serial.print("/");
  Serial.print(UNIT_ID);
  Serial.print("@");
}

bool syncMsgActive = false;
long syncMsgTime=-1;
long syncMaxTime = 4000; // 4 seconds max active time sync.


long resetAfterSilenceTime = 50000;  // reset after 50 sec without measurements
long resetLastMeasurementTime = millis();

long periodicResetTime = millis()+3600000; 

// automatic restart
//void resetArduino() {
//  printPrefix(INFO);Serial.print("Reset");Serial.print("\r\n");
//  resetLastMeasurementTime = millis()+resetAfterSilenceTime;
//  delay(1000);
//
//  asm volatile (" jmp 0"); 
//}


/*
void receiveSyncMsg() {
//      if ((*rfDriverPtr).recv(buf, &buflen)) { // Non-blocking      
//      Serial.print("loop");
//      Serial.print("\r\n");
//      delay(1000);

        if (syncBuflen == 0) {
          Serial.print("W@RF message length 0 received, ignoring ");
          Serial.print("\r\n");
          return; //message ingnored
        }
        
        byte channelId = syncBuf[0];
        byte msgChannelNr = channelId>>4;
        byte msgChannelNrInId = msgChannelNr<<4;
//        byte msgExtNr = (channelId - msgChannelNrInId) >>2;
//        byte msgExtNrInId = msgExtNr<<2;
//        byte msgCycle = channelId - msgChannelNrInId - msgExtNrInId;
        
        if (msgChannelNr != channelId4b ) {
          Serial.print("E@Invalid ApriSensor message received, first byte value: ");
          Serial.print(syncBuf[0]);
          Serial.print("\r\n");
          return; //message discarded
        }
//        if (extender && msgExtNr == extenderId2b ) {  // skip its own sent messages
//          Serial.print("W@Extender skipped its own sent message (first byte): ");
//          Serial.print(syncBuf[0]);
//          Serial.print("\r\n");
//          return; //message discarded
//        }

        byte unitId = syncBuf[1];
        byte sensorType = syncBuf[2];
        char msgType = syncBuf[3];
        if (msgType != 'S') {
//          Serial.print("W@Not a sync message received by sensor, ignore msgType ");
//          Serial.print(msgType);
//          Serial.print("\r\n");          
          return;
        }
        if (millis() - syncMsgTime < syncMaxTime) {
          Serial.print("W@Sync time is active, ignore another sync request. ");
          Serial.print(millis() - syncMsgTime);          
          Serial.print(" ");          
          Serial.print(syncMaxTime);          
          Serial.print("\r\n");          
          return;          
        }
        syncMsgActive = true;
        syncMsgTime = millis();
          Serial.print("W@Set sync time active ");
          Serial.print(millis() - syncMsgTime);          
          Serial.print(" ");          
          Serial.print(syncMaxTime);          
          Serial.print("\r\n");
        return;        
//      }
}
*/
//extern unsigned int __bss_end;
//extern unsigned int __heap_start;
//extern void *__brkval;

/*
 * 
 *uint16_t getFreeSram() {
  uint8_t newVariable;
  // heap is empty, use bss as start memory address
  if ((uint16_t)__brkval == 0)
    return (((uint16_t)&newVariable) - ((uint16_t)&__bss_end));
  // use heap end as the start of the memory address
  else
    return (((uint16_t)&newVariable) - ((uint16_t)__brkval));
};
*/


