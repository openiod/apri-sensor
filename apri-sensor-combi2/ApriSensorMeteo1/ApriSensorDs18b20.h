#pragma once

// Temperature DS18B20 ====
#include <OneWire.h>
#include <DallasTemperature.h>
// Setup a oneWire instance to communicate with any OneWire devices
// (not just Maxim/Dallas temperature ICs)
    //#define ONE_WIRE_BUS 2
    const byte ONE_WIRE_BUS = 2;
    
    OneWire oneWire(ONE_WIRE_BUS);
    DallasTemperature sensors(&oneWire);
   
#define TEMPERATURE_PRECISION 12 // 12=higher resolution
// Temperature DS18B20 ====


#define PMSOUTPUTS 1 // nr of outputs like 1=PM0.3, 2=PM0.5, etc.
#define PMSRESULTS 1


namespace aprisensor_ns {

class Ds18b20Sensor {

  private:
    byte ds18b20_address = 0x5c; //default

    // Pass our oneWire reference to Dallas Temperature.
    // Data wire is plugged into pin 2 on the Arduino
    int numberOfDevices; // Number of temperature devices found
    DeviceAddress tempDeviceAddress; // We'll use this variable to store a found device address
    
    long ds18b20InitTime;
    long ds18b20InitInterval = 10000; //10 seconden init wait time
    long ds18b20MeasureTime;
    long ds18b20MeasureInterval = 500;  // measurement interval in millisecs

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
    char rfBuf[MSGLENGTH_DS18B20];
    byte sensorType; // = "PMSx003"; //Plantower PMS7003 or PMSA003

  private:
    byte getNewMsgNr() {
      this->messageNr++;
      if (this->messageNr == 0) this->messageNr = 1;
      return this->messageNr;
    };

  public:
    Ds18b20Sensor() {};
    void init() {
  
      this->messageNr = 0;
      this->sensorType = S_DS18B20;
      
      this->ds18b20InitTime = millis();
      printPrefix(INFO);Serial.println("start ds18b20 init fase");

      this->rfRepeatTime = 0;  //
      this->transactionTime = millis();
      this->ds18b20MeasureTime = millis();
      this->initTotals();

      // Start up the library DS18B20
      sensors.begin();

      // Grab a count of devices on the wire
      this->numberOfDevices = sensors.getDeviceCount();

      // locate devices on the bus
      printPrefix(INFO);Serial.print("Locating devices...");
      Serial.print("Found ");
      Serial.print(this->numberOfDevices, DEC);
      Serial.println(" devices.");

      // report parasite power requirements
      printPrefix(INFO);Serial.print("Parasite power is: ");
      if (sensors.isParasitePowerMode()) {printPrefix(INFO);Serial.println("ON");}
      else {printPrefix(INFO);Serial.println("OFF");}
      //printPrefix(INFO);Serial.print("DS18B20_resolution;");
      //Serial.println(sensors.getResolution());
      //printPrefix(INFO);Serial.print("DS18B20_resolution_global;");
      //Serial.println(sensors.getResolution());
      sensors.setResolution(12);
      printPrefix(INFO);Serial.print("DS18B20_powersupply;");
      Serial.println(sensors.readPowerSupply(0));
      // Loop through each device, print out address
      for(int i=0;i<this->numberOfDevices; i++)
      {
        // Search the wire for address
        if(sensors.getAddress(this->tempDeviceAddress, i))
        {
          printPrefix(INFO);Serial.print("Found device ");
          Serial.print(i, DEC);
          Serial.print(" with address: ");
          this->printAddress(this->tempDeviceAddress);
          Serial.print("\n");

          printPrefix(INFO);Serial.print("Setting resolution to ");
          Serial.println(TEMPERATURE_PRECISION, DEC);

          // set the resolution to TEMPERATURE_PRECISION bit (Each Dallas/Maxim device is capable of several different resolutions)
          sensors.setResolution(this->tempDeviceAddress, TEMPERATURE_PRECISION);

          printPrefix(WARNING);Serial.print("Resolution actually set to: ");
          Serial.print(sensors.getResolution(this->tempDeviceAddress), DEC);
          Serial.println();
        } else {
          printPrefix(WARNING);Serial.print("Found ghost device at ");
          Serial.print(i, DEC);
          Serial.println(" but could not detect address. Check power and cabling");
        }
      }

      //printPrefix(INFO);Serial.print("DS18B20_resolution;");
      //Serial.println(sensors.getResolution());
      //printPrefix(INFO);Serial.print("DS18B20_resolution_global;");
      //Serial.println(sensors.getResolution());
      // Temperature DS18B20 ====

    };
    void getMsgNr() {
      return this->messageNr;
    };
    void setDs18b20Address(byte ds18b20_address) {
      this->ds18b20_address = ds18b20_address;
    };
    // function to print a device address
    void printAddress(DeviceAddress deviceAddress) {
      for (uint8_t i = 0; i < 8; i++) {
        if (deviceAddress[i] < 16) Serial.print("0");
        Serial.print(deviceAddress[i], HEX);
      }
    };
    void processDs18b20RF() {
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
          sendRfMessage(rfBuf, MSGLENGTH_DS18B20, MSGTYPE_REPEAT); // repeat message
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
      rfBuf[6] = highByte(this->results[0]); // temperature
      rfBuf[7] = lowByte(this->results[0]);  //

      sendRfMessage(rfBuf, MSGLENGTH_DS18B20, MSGTYPE_NEW); // new message

      this->transactionTime = millis();
      initTotals();

      printPrefix(MEASUREMENT);Serial.print(this->sensorType);
      Serial.print(";");
      Serial.print(this->results[0]);
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

      // fill message type (New, Repeat)
      rfBuffer[3] = msgType;

      if (msgType == MSGTYPE_REPEAT) {
        unsigned long rfDelayTime = millis() - this->rfSentMsgTime;
        if (rfDelayTime > this->rfDelayTimeMax) { // max delaytime exceeded, end processing repeat
          //Serial.println("RF max repeat time exceeded, stop repeating this message");
          //Serial.println(rfDelayTime);
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
    bool readData() {
      if ( millis() - this->ds18b20MeasureTime < this->ds18b20MeasureInterval ) {
        //printPrefix(INFO);Serial.println("ds18b20 interval "); //delay(100);
        return;
      }
      
      // wait some time while in init fase (also during soft reset)
      if ( millis() - this->ds18b20InitTime < this->ds18b20InitInterval ) {
        //printPrefix(INFO);Serial.println("ds18b20 init fase");
        return;
      }
	  
      // Temperature DS18B20 ====
      // call sensors.requestTemperatures() to issue a global temperature
      // request to all devices on the bus
      //printPrefix(INFO);Serial.print(" Requesting temperatures...");
      sensors.requestTemperatures(); // Send the command to get temperatures
      //Serial.println("DONE");
      //  printPrefix(INFO);Serial.println(sensors.getTempCByIndex(0)); // Why "byIndex"? Index is the i-th sensor on I2C setting.
      // You can have more than one IC on the same bus.
      // 0 refers to the first IC on the wire
      // Temperature DS18B20 ====
	  
      this->temperature = sensors.getTempC(this->tempDeviceAddress);

      this->measurements[0] = this->temperature;

      processDs18b20RF();

      return;
    }

};

extern Ds18b20Sensor gDs18b20Sensor;  // global instance

}  // end namespace  ApriSensor
