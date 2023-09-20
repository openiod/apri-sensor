#pragma once

#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>

#define BMEOUTPUTS 3  // nr of outputs like 1=PM0.3, 2=PM0.5, etc.

//namespace aprisensor_ns {

//class BmeSensor {

//private:
byte bme280_address = 0x76;  //default

Adafruit_BME280 bme;  // I2C
long bme280InitTime = 0;
long bme280InitInterval = 5000;  //5 seconden init wait time
long bme280MeasureTime = 0;
long bme280MeasureInterval = 1000;  // measurement interval in millisecs
bool resultsReadyBme = false;
bool sensorFound = false;
float pressure;
float pressureHPa;
float temperature;
float rHum;
long int millisTmpBme = 0;
int iBme;

//   float seaLevelHPa;
//    float altitude;
const int ledBlueBme = 20; //gpio20 //D0;  // D0 is standard LED on board //D1;
int ledTimer = 0;

// unsigned long nowTime;
float measurementsBme[BMEOUTPUTS];
float totalsBme[BMEOUTPUTS];

//private:
//public:
struct ResultsBme {
  float resultsBme[BMEOUTPUTS];
  long nrOfMeasurementsBme;
};
ResultsBme resultsBme;

void initTotalsBme() {
  for ( iBme = 0; iBme < BMEOUTPUTS; iBme++) {
    totalsBme[iBme] = 0;
  }
  resultsBme.nrOfMeasurementsBme = 0;
}
void initBme() {

  //Wire.begin(D6, D5);
  //Wire.begin(I2C_SDA, I2C_SCL);
  Wire.begin(21, 22);
  pinMode(ledBlueBme, OUTPUT);
  digitalWrite(ledBlueBme, LOW);
  sensorFound = bme.begin(bme280_address, &Wire);
  if (!sensorFound) {
    Serial.println("Could not find a valid BME280 sensor, check wiring!");
  }

  //Serial.println("BME280 sensor connected");
  bme280InitTime = millis();
  Serial.println("start bme280 init fase");

  bme280MeasureTime = millis();
  initTotalsBme();
};

void processBme() {
  resultsBme.nrOfMeasurementsBme++;
  for ( iBme = 0; iBme < BMEOUTPUTS; iBme++) {
    totalsBme[iBme] += measurementsBme[iBme];
  }
  Serial.print("b");
  resultsReadyBme = true;
};

ResultsBme computeResultsBme() {
//  int i;
  //long _nrOfMeasurementsBme = resultsBme.nrOfMeasurementsBme;
  for (iBme = 0; iBme < BMEOUTPUTS; iBme++) {  // only first 3 measurements for RF transmit
    resultsBme.resultsBme[iBme] = totalsBme[iBme] / resultsBme.nrOfMeasurementsBme;
  }
  return resultsBme;
};

void readDataBme() {

  if (!sensorFound) {
    sensorFound = bme.begin(bme280_address, &Wire);
    //Serial.println("x");
    digitalWrite(ledBlueBme, LOW);
    return;
  }

  millisTmpBme = millis();
  if (millisTmpBme - bme280MeasureTime < bme280MeasureInterval) {
    //Serial.println("bme280 init fase");
    return;
  }

  // wait some time while in init fase (also during soft reset)
  if (millisTmpBme - bme280InitTime < bme280InitInterval) {
    //Serial.println("bme280 init fase");
    return;
  }

  ledTimer++;
  if (ledTimer > 1) {
    digitalWrite(ledBlueBme, HIGH);  // LED uit
    ledTimer = 0;
  }

  bme280MeasureTime = millis();
  pressure = bme.readPressure();
  if (pressure == 0) {
    return;
  }
  pressureHPa = pressure / 100;
  temperature = bme.readTemperature();
  rHum = bme.readHumidity();

  // reset sensor when temperature value below -100
  if (temperature < -40) {
    Serial.println("temp > -40 bme280 soft reset");
    sensorFound = false;
    return;
  }
  if (temperature > 60) {
    Serial.println("temp > 60 bme280 soft reset");
    sensorFound = false;
    return;
  }

  if (pressureHPa == NAN) {
    Serial.println("NAN value for bme280 soft reset");
    sensorFound = false;
    return;
  }

  measurementsBme[0] = pressureHPa;
  measurementsBme[1] = temperature;
  measurementsBme[2] = rHum;

  processBme();

  return;
}
//};

//extern Bme280Sensor gBme280Sensor;  // global instance

//}  // end namespace  ApriSensor
