#pragma once

#define PMSOUTPUTS 2 // nr of outputs like 1=PM0.3, 2=PM0.5, etc.
#define PMSRESULTS 2



namespace aprisensor_ns {

class Am2320Sensor {

  private:
    int am2320_address = 0x5C; //default
//    byte am2320_address = 0xDC; //default
    String sensorSystem = "apri-sensor-am2320\0";
    AM2320 th; // I2C
    long am2320InitTime;
    long am2320InitInterval = 100; //1 seconden init wait time
    long am2320MeasureTime;
    long am2320MeasureInterval = 5000;  // measurement interval in millisecs

    float t;
    float h;
    
    long nrOfMeasurements;
    unsigned long nowTime;
    int measurements[PMSOUTPUTS];
    long totals[PMSOUTPUTS];
    long lowest[PMSOUTPUTS];
    long highest[PMSOUTPUTS];
    long results[PMSOUTPUTS];
    unsigned long transactionTime; // 20 seconds per transaction, send measurement
    const unsigned long transactionTimeMax = 55900; // milliseconds per transaction period, then send message. 55.9secs=+- 1x per minute
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
      printPrefix(INFO);Serial.print("start am2320 init fase\r\n");

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
      nowTime = millis();
      // repeat last sent RF messagde during transaction building process
      unsigned long diffTime = nowTime - this->transactionTime;
      if ( diffTime < this->transactionTimeMax ) {
        if (this->rfRepeatTime == 0) return; // no transaction finished yet or max repeattime exceeded, no action to repeat
        diffTime = nowTime - this->rfRepeatTime;
        if (diffTime >= this->rfRepeatTimeMax &&
            rfRepeatTimeMax < (transactionTimeMax - 1000) // stop repeating just before new message
           ) {
//          sendRfMessage(rfBuf, MSGLENGTH_AM2320, MSGTYPE_REPEAT); // repeat message
        }
        return;
      }

      // process data once per transactiontime limit

      computeResults();
/*    
      for (int i = 0; i < PMSRESULTS; i++) {
        Serial.print(this->totals[i]);
        Serial.print(";\t");
      }
      Serial.print("\r\n");

      for (int i = 0; i < PMSRESULTS; i++) {
        Serial.print(this->lowest[i]);
        Serial.print(";\t");
      }
      Serial.print("\r\n");
      for (int i = 0; i < PMSRESULTS; i++) {
        Serial.print(this->highest[i]);
        Serial.print(";\t");
      }

      Serial.print("\r\n");
      for (int i = 0; i < PMSRESULTS; i++) {
        Serial.print(this->results[i]);
        Serial.print(";\t");
      }
      Serial.print("\r\n");
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

//      sendRfMessage(rfBuf, MSGLENGTH_AM2320, MSGTYPE_NEW); // new message

      this->transactionTime = millis();

      printPrefix(MEASUREMENT);
      Serial.print(this->sensorType);
      Serial.print(";");
      Serial.print(this->results[0]);
      Serial.print(";");
      Serial.print(this->results[1]);
      Serial.print(";");
      Serial.print(this->nrOfMeasurements);
      Serial.print("\r\n");

      String urlParams = "&observation=apri-sensor-am2320-rHum:\0";
      double rHum = this->results[0];  // double for String conversion and decimals)
      double temperature = this->results[1];
      urlParams += String(rHum/100, 2) + ",";
      urlParams += "apri-sensor-am2320-temperature:\0";
      urlParams += String(temperature/100, 2); 
      urlParams += "&sensorsystem=" + this->sensorSystem; 
      sendObservations(urlParams);

      initTotals();

      return;
/*      
// Use WiFiClientSecure class to create TLS connection
  WiFiClientSecure client;
  Serial.print("connecting to ");
  Serial.println(host);
  if (!client.connect(host, httpsPort)) {
    Serial.println("connection failed");
    return;
  }

  if (client.verify(fingerprint, host)) {
    Serial.println("certificate matches");
  } else {
    Serial.println("certificate doesn't match");
  }

      String observation = "apri-sensor-am2320-rHum:\0";
      double rHum = this->results[0];  // double for String conversion and decimals)
      double temperature = this->results[1];
      observation += String(rHum/100, 2) + ",";
      observation += "apri-sensor-am2320-temperature:\0";
      observation += String(temperature/100, 2); 
      String url = URL+ "&sensorsystem=" + this->sensorSystem + "&region=0439" + "&foi=" + this->foi + "&neighborhoodcode=UNKNOWN&citycode=UNKNOWN&observation=" + observation +"\0";
//  String url = "/repos/esp8266/Arduino/commits/master/status";
  Serial.print("requesting URL: ");
  Serial.println(url);

  client.print(String("GET ") + url + " HTTP/1.1\r\n" +
               "Host: " + host + "\r\n" +
               "User-Agent: BuildFailureDetectorESP8266\r\n" +
               "Connection: close\r\n\r\n");

  Serial.println("request sent");
  while (client.connected()) {
    String line = client.readStringUntil("\r\n");
    if (line == "\r") {
      Serial.println("headers received");
      break;
    }
  }
  String line = client.readStringUntil("\r\n");
  if (line.startsWith("{\"state\":\"success\"")) {
    Serial.println("esp8266/Arduino CI successfull!");
  } else {
    Serial.println("esp8266/Arduino CI has failed");
  }
  Serial.println("reply was:");
  Serial.println("==========");
  Serial.println(line);
  Serial.println("==========");
  Serial.println("closing connection");


    return;  
*/
/*
      HTTPClient http;
//      String observation = "apri-sensor-am2320-rHum:";
      observation += this->results[0] + ",";
      observation += "apri-sensor-am2320-temperature:";
      observation += this->results[1]; 
      String url1 = URL+ "&sensorsystem=" + this->sensorSystem + "&region=0439" + "&foi=" + this->foi + "&neighborhoodcode=UNKNOWN&citycode=UNKNOWN&observation=" + observation ;
      
      http.begin(url1); //HTTP
      int httpCode = http.GET();
      // httpCode will be negative on error
      USE_SERIAL.println(url1);
      if(httpCode > 0) {
        // HTTP header has been send and Server response header has been handled
        USE_SERIAL.printf("[HTTP] GET... code: %d\r\n", httpCode);
 
        // file found at server
        if(httpCode == HTTP_CODE_OK) {
            String payload = http.getString();
            USE_SERIAL.println(payload);
        }
      } else {
        USE_SERIAL.printf("[HTTP] GET... failed, error: %s\r\n", http.errorToString(httpCode).c_str());
      }
 
      http.end();
*/       


    };

    void initTotals() {
      for (int i = 0; i < PMSOUTPUTS; i++) {
        this->totals[i] = 0;
        this->lowest[i] = 999999;
        this->highest[i] = -999999;
      }
      this->nrOfMeasurements = 0;
    }
/*
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
*/
    
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
      long diff = millis() - this->am2320MeasureTime;
      if ( diff < this->am2320MeasureInterval ) {
 //       printPrefix(INFO);Serial.println("am2320 interval "); //delay(100);
        return;
      }

      // wait some time while in init fase (also during soft reset)
      if ( millis() - this->am2320InitTime < this->am2320InitInterval ) {
//        printPrefix(INFO);Serial.println("am2320 init fase");
        return;
      }
//	    if (this->th.Read()!=0) return; 
      byte result =this->readSensor();

      if (result!=0) {
        return; 
        
      }
//Serial.print(this->th.h);

//      this->rHum = this->th.h;
//      this->temperature = this->th.t;

      this->measurements[0] = this->h*10;
      this->measurements[1] = this->t*10;

      processAm2320RF();
      return;
    };
    
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
  byte test = 1 ;
  
//  byte count = 0;
  //  for (byte i = 1; i < 120; i++)
//  for (byte i = 92; i < 93; i++)
//  {
    //delayMicroseconds(1600); //>1.5ms
    Wire.beginTransmission (this->am2320_address);
    delayMicroseconds(900); //>0.8ms
    test = Wire.endTransmission() ;
    if (test != 0) return test;
//    Serial.print(test);
    if (test == 0)
      {
//      Serial.print ("address: ");
//      Serial.print (i, DEC);
//      Serial.print (" (0x");
//      Serial.print (i, HEX);
//      Serial.print (")");
//      Serial.print (this->am2320_address, DEC);
//      Serial.print (")");
//      count++;
      delayMicroseconds(1600); //>1.5ms
      } // end of good response
//  } // end of for loop
  
//  Wire.beginTransmission(this->am2320_address);
////    Wire.write(0x00); //wake up call  
//if (test==0){    Serial.print('X');
//} else {
//  Serial.print('.');
//}    
//    test = Wire.endTransmission() ;
//  while (test!=99) {
    Wire.beginTransmission(this->am2320_address);
    Wire.write(0x00); //wake up call  
    test = Wire.endTransmission() ;
if (test!=0){ 
//  Serial.print(test);
//  Serial.println('.');
}

//  }  
  // Get 4 bytes, temperature and humidity

  this->am2320MeasureTime = millis();
  Wire.beginTransmission(this->am2320_address);
  Wire.write(0x03);// get
  Wire.write(0x00); // address 0
  Wire.write(0x04); // 4 bytes
  delayMicroseconds(300); //>0.250ms Important!!
  if (Wire.endTransmission() != 0) {
//    Serial.print("Error reading sensor");
    return 1;
  }
  delayMicroseconds(800); //>0.7ms
  // Get results
  Wire.requestFrom(this->am2320_address, 0x08); 
  delayMicroseconds(300); //>0.250ms Important!!
  for (int i = 0; i < 0x08; i++) buf[i] = Wire.read();
//  Serial.print("\r\nread");

  // CRC check
  unsigned int Rcrc = buf[7] << 8;
  Rcrc += buf[6];
  if (Rcrc == CRC16(buf, 6)) {
    unsigned int temperature = ((buf[4] & 0x7F) << 8) + buf[5];
    this->t = temperature / 10.0;
    this->t = ((buf[4] & 0x80) >> 7) == 1 ? this->t * (-1) : this->t;

    unsigned int humidity = (buf[2] << 8) + buf[3];
    this->h = humidity / 10.0;
//    Serial.print("\r\n");Serial.println(this->h);
    return 0;
  }
//  Serial.print(buf[4]);
//  Serial.print(' ');
//  Serial.println(buf[5]);
  return 2;
}    
};

extern Am2320Sensor gAm2320Sensor;  // global instance

}  // end namespace  ApriSensor
