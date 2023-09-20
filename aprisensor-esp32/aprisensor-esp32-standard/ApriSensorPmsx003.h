#pragma once

#define PMSOUTPUTS 3  // nr of outputs like 1=PM0.3, 2=PM0.5, etc.

const uint8_t SERPORT_RX = D7;
// D8 werkt niet
// D7 gaat goed
// D6 gaat goed
const uint8_t SERPORT_TX = D8;  // not used (yet)

#include <SoftwareSerial.h>
uint16_t serialPmsAvailable;

SoftwareSerial SerialPms(SERPORT_RX, SERPORT_TX);

//namespace aprisensor_ns {

//class Pmsx003Sensor {

//private:

long int pmsx003InitTime = 0;
long int pmsx003InitInterval = 1000;  //1 seconden init wait time


int i;
int inputHigh;
int inputLow;
uint8_t inputHigh8;
uint8_t inputLow8;
long _nrOfMeasurementsPms;
long int millisTmpPms = 0;


unsigned long nowTime;
long measurementsPms[PMSOUTPUTS];
float totalsPms[PMSOUTPUTS];

bool resultsReadyPms = false;
unsigned long transactionTime;                   // 20 seconds per transaction, send measurement
const unsigned long transactionTimeMax = 20000;  // milliseconds per transaction period, then send message

uint8_t version;
uint8_t errorCode;
uint16_t checksum;
uint16_t inputChecksum;
uint16_t controleCodes;
uint16_t value;

//
//private:

//public:
//Pmsx003Sensor(){};
struct ResultsPms {
  float resultsPms[PMSOUTPUTS];
  long nrOfMeasurementsPms;
};
ResultsPms resultsPms;

void initTotalsPms() {
  for (i = 0; i < PMSOUTPUTS; i++) {
    totalsPms[i] = 0;
  }
  resultsPms.nrOfMeasurementsPms = 0;
  resultsReadyPms = false;
  transactionTime = millis();
};

void initPms() {
  pmsx003InitTime = millis();
  SerialPms.begin(9600);
  transactionTime = millis();
  initTotalsPms();
};
bool getResultsReadyPms() {
  return resultsReadyPms;
}
void readUInt16(uint16_t* value, uint16_t* inputChecksum) {
  inputHigh = SerialPms.read();
  inputLow = SerialPms.read();
  *inputChecksum += inputHigh + inputLow;
  *value = inputLow + (inputHigh << 8);
};
void readInt(uint8_t* value, uint16_t* inputChecksum) {
  *value = SerialPms.read();
  *inputChecksum += *value;
  return;
};
void processPms() {
  //Serial.print(" process RF \r\n");
  Serial.print(".");
  resultsPms.nrOfMeasurementsPms++;
  for (i = 0; i < PMSOUTPUTS; i++) {
    //        if (measurements[i] < lowest[i]) lowest[i] = measurements[i];
    //        if (measurements[i] > highest[i]) highest[i] = measurements[i];
    totalsPms[i] += measurementsPms[i];
  }
  yield();
  Serial.print("p");

  nowTime = millis();
  //unsigned long diffTime = nowTime - transactionTime;
  if (nowTime - transactionTime < transactionTimeMax) {
    return;
  }
  Serial.print("P");
  resultsReadyPms = true;
};



ResultsPms computeResultsPms() {

  //bool corrLowHigh = false;
  _nrOfMeasurementsPms = resultsPms.nrOfMeasurementsPms;
  //      if (_nrOfMeasurements>3) { // ignore highest / lowest values
  //          _nrOfMeasurements -= 2 ;
  //          corrLowHigh = true;
  //      }

  for (i = 0; i < PMSOUTPUTS; i++) {  // only first 3 measurements for RF transmit
                                      //        if (corrLowHigh) {
                                      //          totals[i] -= highest[i];
                                      //          totals[i] -= lowest[i];
                                      //        }
    //results[i] = (((totals[i] * 100) / _nrOfMeasurements ) + .49) / 10;
    resultsPms.resultsPms[i] = totalsPms[i] / _nrOfMeasurementsPms;
  }
  return resultsPms;
};
//bool serialReady() {
//  if (SerialPms) return true;
//  else return false;
//}
void readDataPms() {
  millisTmpPms = millis();
  if (millisTmpPms - pmsx003InitTime < pmsx003InitInterval) {
    return;
  }

  serialPmsAvailable = SerialPms.available();
  //Serial.print(serialPmsAvailable);

  if (serialPmsAvailable < 32) {
    //delay(10);
    return;
  }

  inputChecksum = 0;

  // test first 2 bytes must be 0x424D
  readUInt16(&controleCodes, &inputChecksum);
  if (controleCodes != 0x424D) return;

  // test next 2 bytes must be 0x001c
  readUInt16(&controleCodes, &inputChecksum);
  if (controleCodes != 0x001c) return;

  // read all sensor output values and sum Checksum

  readUInt16(&value, &inputChecksum);  //pm1
  measurementsPms[0] = value;
  readUInt16(&value, &inputChecksum);  //pm2.5
  measurementsPms[1] = value;
  //Serial.print("\r\n");
  //Serial.print(value);
  readUInt16(&value, &inputChecksum);  //pm10
  measurementsPms[2] = value;
  readUInt16(&value, &inputChecksum);  //pm1
  readUInt16(&value, &inputChecksum);  //pm25 amb
                                       //Serial.print(";");
                                       //Serial.print(value);
                                       //Serial.print(";");
  readUInt16(&value, &inputChecksum);  //pm10
  readUInt16(&value, &inputChecksum);  //pm0.3
                                       //Serial.print(value);
                                       //Serial.print(";");
  readUInt16(&value, &inputChecksum);  //pm0.5
  readUInt16(&value, &inputChecksum);  //pm1
  readUInt16(&value, &inputChecksum);  //pm2.5
                                       //Serial.print(value);
                                       //Serial.print(";");
  readUInt16(&value, &inputChecksum);  //pm5
  readUInt16(&value, &inputChecksum);  //pm10


  // read versionnumber
  readInt(&version, &inputChecksum);

  // read errorcode
  readInt(&errorCode, &inputChecksum);

  // determine sensortype
  //if (version == 128) sensorType = S_PMS7003;  // "PMS7003";
  //if (version == 145) sensorType = S_PMSA003;  // "PMSA003";

  // read sensor record checksum
  inputHigh8 = SerialPms.read();
  inputLow8 = SerialPms.read();
  checksum = inputLow8 + (inputHigh8 << 8);

  if (checksum != inputChecksum) {
    Serial.println("PMSx003 checksum error");
  } else {
    if (errorCode == 0) {
      processPms();
    } else {
      Serial.print("PMSx003 errorCode");
      Serial.println(errorCode);
    }
  }

  //while (SerialPms.read() != -1) {}; //clear buffer // misschien een probleem

  //delay(700);  // 700 when other sensors not included // higher will get you checksum errors
  //delay(1000);     // 50  when other sensors are included //higher will get you checksum errors

  return;
}
//};

//extern Pmsx003Sensor gPmsx003Sensor;  // global instance

//}  // end namespace  ApriSensor
