#pragma once

#define AM2320_address (0xB8 >> 1) 
#define PMSOUTPUTS 2 // nr of outputs like 1=PM0.3, 2=PM0.5, etc.
#define PMSRESULTS 2

const PROGMEM byte  am2320InitInterval = 5000; // 5 seconden init wait time
//const PROGMEM long am2320MeasureInterval = 500;  // measurement interval in millisecs
    const PROGMEM unsigned long transactionTimeMax = 20000; // milliseconds per transaction period, then send message
//    const PROGMEM unsigned long rfRepeatTimeMax = 5000; // milliseconds waittime for repeating message
//    const PROGMEM unsigned long rfDelayTimeMax = 60000; // maximum delaytime in millisec for repeating messages
//    const PROGMEM String sensorType = " Preparing new message. difftime:";

namespace aprisensor_ns {

class Am2320Sensor {

  private:
    byte am2320_address = 0x5c; //default

    //AM2320 th; // I2C
    long am2320InitTime;
    long am2320MeasureTime;

    long t;
    long h;
//    float rHum;
//    float temperature;
    
    uint8_t nrOfMeasurements;
    //unsigned long nowTime;
    int measurements[PMSOUTPUTS];
    long totals[PMSOUTPUTS];
    long lowest[PMSOUTPUTS];
    long highest[PMSOUTPUTS];
    long results[PMSOUTPUTS];
    unsigned long transactionTime; // 20 seconds per transaction, send measurement
//    unsigned long rfRepeatTime;
    unsigned long rfSentMsgTime;  // to calculate delay for repeat message
    byte messageNr;
    char rfBuf[MSGLENGTH_AM2320];
//    byte sensorType; // eg. = "AM2320"

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
//      this->sensorType = S_AM2320;
      
      this->am2320InitTime = millis();
      printPrefix(INFO);Serial.print("start am2320 init fase\r\n");

//      this->rfRepeatTime = 0;  //
      this->transactionTime = millis();
      this->am2320MeasureTime = millis();
      this->initTotals();

    };
//    void setAm2320Address(byte am2320_address) {
//      this->am2320_address = am2320_address;
//    };
    void processAm2320RF() {
      this->nrOfMeasurements++;
      for (int i = ZERO; i < PMSOUTPUTS; i++) {
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
      Serial.print(SLASH);
      Serial.print(UNIT_ID);
      Serial.print(", T:");
      Serial.print(S_AM2320);
      Serial.print(" #");
      Serial.print(this->nrOfMeasurements);
      Serial.print(SPACE);
      Serial.print(millis() - this->transactionTime);
//      Serial.print(FREESRAMTXT);
//      Serial.print(getFreeSram());
      Serial.print(NEWLINE);
      
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
      rfBuf[2] = S_AM2320; //this->sensorType;
      rfBuf[3] = ZERO; // msgType initiated when calling function sendRfMessage
      rfBuf[4] = this->getNewMsgNr();
      rfBuf[5] = ZERO;  // delaytime equal zero for first time sending message. In seconds.
      this->rfSentMsgTime = millis();
      rfBuf[6] = highByte(this->results[ZERO]); // rHum
      rfBuf[7] = lowByte(this->results[ZERO]);  //
      rfBuf[8] = highByte(this->results[ONE]); // temperature
      rfBuf[9] = lowByte(this->results[ONE]);  //

      sendRfMessage(rfBuf, MSGLENGTH_AM2320, MSGTYPE_NEW, this->nrOfMeasurements); // new message
 //     this->rfRepeatTime = millis();

      this->transactionTime = millis();
      initTotals();

      printPrefix(MEASUREMENT);Serial.print(S_AM2320); //this->sensorType);
      Serial.print(";");
      Serial.print(this->results[0]);
      Serial.print(";");
      Serial.print(this->results[1]);
      Serial.print(NEWLINE);

    };

    void initTotals() {
      for (int i = 0; i < PMSOUTPUTS; i++) {
        this->totals[i] = 0;
        this->lowest[i] = 999999;
        this->highest[i] = -999999;
      }
      this->nrOfMeasurements = 0;
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
        this->results[i] = (((this->totals[i] * 100) / _nrOfMeasurements ) + .49) / 100;
      }

    };
    void readData() {
//      if ( millis() - this->am2320MeasureTime < am2320MeasureInterval ) {
        //printPrefix(INFO);Serial.println("am2320 interval "); //delay(100);
//        return;
//      }
      
      // wait some time while in init fase (also during soft reset)
      if ( millis() - this->am2320InitTime < am2320InitInterval ) {
        //printPrefix(INFO);Serial.println("am2320 init fase");
        return;
      }

	   // if (this->th.Read()!=0) return; 
      if (this->readSensor()!=0) return; 

//      this->rHum = this->h;
//      this->temperature = this->t;

      this->measurements[0] = this->h;
      this->measurements[1] = this->t;

      processAm2320RF();
      return;
    };
// AM2320 Temperature & Humidity Sensor library for Arduino

unsigned int CRC16(byte *ptr, byte length) 
{ 
      unsigned int crc = 0xFFFF; 
      uint8_t s = 0x00; 

      while(length--) {
        crc ^= *ptr++; 
        for(s = 0; s < 8; s++) {
          if((crc & 0x01) != 0) {
            crc >>= 1; 
            crc ^= 0xA001; 
          } else crc >>= 1; 
        } 
      } 
      return crc; 
} ;

int readSensor()
{
  byte buf[8];
  for(int s = 0; s < 8; s++) buf[s] = 0x00; 

  Wire.beginTransmission(AM2320_address);
  Wire.endTransmission();
  // Get 4 bytes, temperature and humidity
  Wire.beginTransmission(AM2320_address);
  Wire.write(0x03);// get
  Wire.write(0x00); // address 0
  Wire.write(0x04); // 4 bytes
  if (Wire.endTransmission(1) != 0) return 1;
  delayMicroseconds(1600); //>1.5ms
  // Get results
  Wire.requestFrom(AM2320_address, 0x08); 
  for (int i = 0; i < 0x08; i++) buf[i] = Wire.read();

  // CRC check
  unsigned int Rcrc = buf[7] << 8;
  Rcrc += buf[6];
  if (Rcrc == CRC16(buf, 6)) {
    unsigned int temperature = ((buf[4] & 0x7F) << 8) + buf[5];
    this->t = temperature; // / 10.0;
    this->t = ((buf[4] & 0x80) >> 7) == 1 ? this->t * (-1) : this->t;

    unsigned int humidity = (buf[2] << 8) + buf[3];
    this->h = humidity; // / 10.0;
    return 0;
  }
  return 2;
}
    
};

//extern Am2320Sensor gAm2320Sensor;  // global instance

}  // end namespace  ApriSensor
