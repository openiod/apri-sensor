#pragma once

// RF
#define MSGTYPE_NEW 'N'
#define MSGTYPE_REPEAT 'R'
#define MSGTYPE_INFO 'I'
#define MSGTYPE_EXTEND 'X'

const String NEWLINE = "\r\n";
const char  AT = '@';
const char  SLASH = '/';
const char  SPACE = ' ';
const uint8_t  ZERO = 0;
const uint8_t  ONE = 1;

// sensortypes
#define S_DS18B20 51  // DS18B20
#define S_AM2320  61  // AM2320
#define S_BMP280  71  // BMP280
#define S_PMS7003 81  // Plantower PMS7003
#define S_PMSA003 82  // Plantower PMSA003

#define MSGLENGTH_DS18B20 8  // 51=S_DS18B20
#define MSGLENGTH_AM2320 10  // 61=S_AM2320
#define MSGLENGTH_BMP280 12  // 71=S_BMP280
#define MSGLENGTH_PMSX003 12 //12  // 82=S_PMSx003

const char* host = "openiod.org";
const int httpsPort = 443;
// Use web browser to view and copy
// SHA1 fingerprint of the certificate
const char* fingerprint = "FD:C8:1C:3E:29:DB:00:29:72:0E:BC:C0:CD:BB:E2:66:79:25:AD:8F";

String URL = "https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertom&offering=offering_0439_initial&commit=true&region=0439&neighborhoodcode=UNKNOWN&citycode=UNKNOWN";
String foi = "WEMOSD1test\0";

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
};



void sendObservations(String urlParams) {
  // Use WiFiClientSecure class to create TLS connection
  WiFiClientSecure client;
//  Serial.print("connecting to ");
//  Serial.println(host);
  if (!client.connect(host, httpsPort)) {
    Serial.println("connection failed");
    return;
  }

/*  if (client.verify(fingerprint, host)) {
//    Serial.println("certificate matches");
  } else {
    Serial.println("certificate doesn't match");
  }
*/
  String url = URL+ "&foi=" + foi + "" + urlParams +"\0";
//  String url = "/repos/esp8266/Arduino/commits/master/status";
//  Serial.print("requesting URL: ");
  Serial.println(url);

  client.print(String("GET ") + url + " HTTP/1.1\r\n" +
               "Host: " + host + "\r\n" +
               "User-Agent: BuildFailureDetectorESP8266\r\n" +
               "Connection: close\r\n\r\n");

//  Serial.println("request sent");
//  while (client.connected()) {
//    String line = client.readStringUntil("\r\n");
//    if (line == "\r") {
//      Serial.println("headers received");
//      break;
//    }
//  }
//  String line = client.readStringUntil("\r\n");
//  if (line.startsWith("{\"state\":\"success\"")) {
//    Serial.println("esp8266/Arduino CI successfull!");
//  } else {
//    Serial.println("esp8266/Arduino CI has failed");
//  }
//  Serial.println("reply was:");
//  Serial.println("==========");
//  Serial.println(line);
//  Serial.println("==========");
//  Serial.println("closing connection");
  client.stop();
  
}
