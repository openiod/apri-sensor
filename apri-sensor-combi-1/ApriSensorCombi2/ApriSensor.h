#pragma once

// RF
#define MSGTYPE_NEW 'N'
#define MSGTYPE_REPEAT 'R'
#define MSGTYPE_INFO 'I'

// sensortypes
#define S_DS18B20 51  // DS18B20
#define S_AM2320  61  // AM2320
#define S_BMP280  71  // BMP280
#define S_PMS7003 81  // Plantower PMS7003
#define S_PMSA003 82  // Plantower PMSA003

#define MSGLENGTH_DS18B20 8  // 51=S_DS18B20
#define MSGLENGTH_AM2320 10  // 61=S_AM2320
#define MSGLENGTH_BMP280 12  // 71=S_BMP280
#define MSGLENGTH_PMSX003 10 //12  // 82=S_PMSx003



