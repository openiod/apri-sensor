/*
** Module: apri-sensor-raspi
**
** Main system module for handling sensor measurement data for:
**  DS18B20, PMSA003/PMS7003, BME280, BME680, TGS5042, SPS30, IPS7100, SCD30
**
*** SCD30 only with I2C clock stretching wich is only available in software i2c on Raspberry pi
*** in /boot/config.txt for /dev/i2c-3
***  dtoverlay=i2c-gpio,bus=3
*** SDA will be on GPIO23 and SCL will be on GPIO24 which are pins 16 and 18 on the GPIO header respectively.

sudo vi node_modules/raspi-i2c/dist/index.js
if (device === undefined) {
    console.log('Raspi-i2c address:')
    console.log(address)
    if(address==0x61) { // software i2c for clock stretching for SCD30 Sensirion
      console.log('Raspi-i2c device: 3')
      device = i2c_bus_1.openSync(3);
    } else {
      device = i2c_bus_1.openSync(raspi_board_1.getBoardRevision() === raspi_board_1.VERSION_1_MODEL_B_REV_1 ? 0 : 1);
    }
    this._devices[address] = device;
}


*/

"use strict"; // This is for your code to comply with the ECMAScript 5 standard.

// activate init process config-main
var path = require('path');
var startFolder 						= __dirname;
var startFolderParent				= path.resolve(__dirname,'../..');
var configServerModulePath	= startFolder + '/../apri-config/apri-config';

console.log("Start of Config Main ", configServerModulePath);
var apriConfig 							= require(configServerModulePath)

var systemFolder 						= __dirname;
var systemFolderParent			= path.resolve(__dirname,'../..');
var systemFolderRoot				= path.resolve(systemFolderParent,'..');
var systemModuleFolderName 	= path.basename(systemFolder);
var systemModuleName 				= path.basename(__filename);
var systemBaseCode 					= path.basename(systemFolderParent);

var initResult 							= apriConfig.init(systemModuleFolderName+"/"+systemModuleName);

// **********************************************************************************

// add module specific requires
//var express 								= require('express');
var fs 											= require('fs');
//var SerialPort 							= require("serialport");
const raspi									= require('raspi');
const I2C = require('raspi-i2c').I2C;
var redis										= require("redis");
const Serial								= require('raspi-serial').Serial;
//const ByteLength 						= require('@serialport/parser-byte-length')
var io	 										= require('socket.io-client');
const exec 									= require('child_process').exec;
const execFile							= require('child_process').execFile;
const BME280 								= require('./BME280.js');
var ModbusRTU
try {
  ModbusRTU             = require("modbus-serial");
}
catch (err) {
  console.log('modbus-serial module (scd30) not found');
}

var logConfiguration = {}
var winston
var logger={
  info:function(logmsg) {
    console.log(logmsg)
  }
}
try {
  winston = require('winston')
  require('winston-daily-rotate-file')
}
catch (err) {
  console.log('winston module (log) not found');
}

try {
  logConfiguration = {
    'transports': [
//          new winston.transports.Console()
      new winston.transports.DailyRotateFile({
          filename: 'aprisensor-raspi-%DATE%.log',
          dirname: '/var/log/aprisensor',
          datePattern: 'YYYY-MM-DD-HH',
          maxSize: '20m',
          maxFiles: '2d'
        })
/*      new winston.transports.File({
            //level: 'error',
            // Create the log directory if it does not exist
            filename: '/var/log/aprisensor/aprisensor.log'
      })
*/
    ]
  };
  logger = winston.createLogger(logConfiguration);
}
catch (err) {
  console.log('winston.createLogger error');
}


var aprisensorType = ''
var aprisensorTypeConfig={}
var aprisensorDevices={}
try {
  var tmpCfg=systemFolderParent+'/config/aprisensor-type.cfg'
  aprisensorType= fs.readFileSync(tmpCfg,{encoding:'utf8'}).split('\n')[0]
}
catch (err) {
  aprisensorType=''
  console.log('aprisensor-type.cfg not found');
}
if (aprisensorType!='') {
  try {
    aprisensorTypeConfig=JSON.parse(fs.readFileSync(startFolder+'/../apri-config/aprisensor-types/'+aprisensorType+'.json',{encoding:'utf8'}))
    for (var i=0;i<aprisensorTypeConfig.devices.length;i++) {
      var _dev=aprisensorTypeConfig.devices[i]
      aprisensorDevices[_dev.deviceType]=_dev
    }
  }
  catch (err) {
    aprisensorTypeConfig={}
    console.log('aprisensor-type '+aprisensorType+'.json' +' not found');
  }
}

if (aprisensorDevices.tgs5042!=undefined) {
  var ADS1x15
  var ads1115Available = false
  if (aprisensorDevices.tgs5042!=undefined) {
    try {
      ADS1x15 = require('raspi-kit-ads1x15');
      ads1115Available = true
    }
    catch (err) {
      console.log('ADS1115 module not installed');
    }
  }

  var adc
}

var getAds1115Tgs5042 = function() {
//  setTimeout(getAds1115Tgs5042, 1000);
  adc.readChannel(ADS1x15.channel.CHANNEL_0, (err, value, volts) => {
    if (err) {
      console.error('Failed to fetch value from ADC', err);
      ads1115Available=false;
    } else {
      // volgens Dieter:
      //   1 ppm = 1 ml/m3 CO = (1/22.4) = 0.04464 mmol CO/m3 = 0.04464 * 28 = 1,25 mg/m3
      //   Er van uitgaande dat CO een zogenaamd ideaal gas is en dan geldt het standaard molair volume van 22,4 liter gas per mol gas
      var co = (Math.round(1000000*(2.004-volts)*400))/1000000
      var mgM3 = co * 1.25
      console.log(' * CO ppm:', co, ' ',mgM3, ' mg/m3');
      if (counters.busy == false) {
        counters.tgs5042.nrOfMeas++;
        counters.tgs5042.nrOfMeasTotal++;
        counters.tgs5042.co			+= mgM3;
      }
    }
  });
}
if (aprisensorDevices.tgs5042!=undefined) {
  if (ads1115Available==true) {
    // Init Raspi
    raspi.init(() => {
      // Init Raspi-I2c
      const i2c = new I2C();
      // Init the ADC
      adc = new ADS1x15({
        i2c,                                    // i2c interface
        //chip: ADS1x15.chips.IC_ADS1015,         // chip model
        chip: ADS1x15.chips.IC_ADS1115,         // chip model
        address: ADS1x15.address.ADDRESS_0x48,  // i2c address on the bus

        // Defaults for future readings
//        pga: ADS1x15.pga.PGA_4_096V,            // power-gain-amplifier range
        pga: ADS1x15.pga.PGA_2_048V,            // power-gain-amplifier range
        sps: ADS1x15.spsADS1015.SPS_250         // data rate (samples per second)
      });
    });
  }
}
var pmsa003InitCounter = 0
var serial
var sleepMode = 0

//var ds18b20InitCounter = 0
var ds18b20InitTime = new Date()
var gpio
var gpioDs18b20, gpioBme
//, gpioBlueLed
//, gpioFan
try {
  gpio = require('onoff').Gpio
}
catch (err) {
  console.log('GPIO module onoff not installed');
}
if (gpio != undefined) {
  //gpioBlueLed = new gpio(19, 'out'); //use GPIO-19 pin .., and specify that it is output
  gpioDs18b20 = new gpio(25, 'out'); //use GPIO-25 pin 22, and specify that it is output
  //gpioFan = new gpio(26, 'out'); //use GPIO-26 pin 37, and specify that it is output
  gpioBme = new gpio(27, 'out'); //use GPIO-27 pin 13, and specify that it is output
}

var bmeInitCounter = 0
var indBme280=false
var indBme680=false

var Bme680
var bme680
try {
  Bme680 = require('bme680-sensor').Bme680
  bme680 = new Bme680(1, 0x77);
}
catch(err) {
  console.log('module BME680-sensor not installed')
}

var indSps30=false
var addressI2cSps30=0x69

var indScd30=false
var addressI2cScd30=0x61

var ips7100SerialNr =''
var ips7100Hash=''

//const port = new SerialPort('/dev/ttyAMA0')
//var app = express();

var redisClient 						= redis.createClient();
const {promisify} 					= require('util');
//const redisGetAsync 				= promisify(redisClient.get).bind(redisClient);
//const redisSetAsync 				= promisify(redisClient.set).bind(redisClient);
const redisHmsetHashAsync 	= promisify(redisClient.hmset).bind(redisClient);
const redisSaddAsync 				= promisify(redisClient.sadd).bind(redisClient);

const sleepFunction=function(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
const isEmpty=function(obj) {
  return Object.keys(obj).length === 0;
}
redisClient.on("error", function (err) {
    console.log("Redis client Error " + err);
});

// **********************************************************************************
		/* web-socket */
var socketUrl, socketPath;
//		socketUrl 	= 'http://localhost:3010';
//		socketUrl 	= 'http://openiod.org';
//		socketUrl 	= 'https://openiod.org';
//		socketUrl 	= '';
//		socketPath	= apriConfig.urlSystemRoot + '/socket.io';

//prod:
socketUrl 									= 'https://openiod.org'; socketPath	= '/'+apriConfig.systemCode + '/socket.io';
		//console.log(apriConfig);
//test:
//		socketPort	= 3010; socketUrl 	= ':'+socketPort;
//		socketPath	= apriConfig.urlSystemRoot + '/socket.io';

console.log('web-socket url: '+socketUrl+socketPath);

//const port 					= new SerialPort('/dev/ttyS0')

var secureSite 			= true;
var siteProtocol 		= secureSite?'https://':'http://';
var openiodUrl			= siteProtocol + 'aprisensor-in.openiod.org';
var loopTimeCycle		= 20000; //ms, 20000=20 sec

var usbPorts			= [];

var serialPortPath;

var devicesFolder = undefined;  // DS18B20 devices


/*
var deviceParam			= process.argv[2];
console.log('Param for serial device is ' + deviceParam);
var sensorKey			= '';
if (deviceParam != undefined) {
	serialPortPath		= deviceParam;
	sensorKey			= serialPortPath.substring(8);  // minus '/dev/tty'
	console.log('SensorKey = ' + sensorKey);
} else {
//	serialPortPath		= "/dev/ttyUSB0";
//	serialPortPath		= "/dev/tty.wchusbserial1d1330";
	serialPortPath		= "/dev/tty.wchusbserial1d1310";
}
//var serialPortPath		= "/dev/cu.usbmodem1411";
//var serialPortPath		= "/dev/cu.usbserial-A1056661";
*/

var unit				= {};

var loopStart;
var loopTime			= 0; // ms

var sensors				= {};

var nrOfChannels		= 15;
var channelMaxValue;

var channelTreshold		= [];
for (var i=0;i<nrOfChannels;i++) {
	channelTreshold.push(i*5000)
}
channelMaxValue			= channelTreshold[nrOfChannels-1];

// create headers to only use ones in the result files
var writeHeaders		= true;
var headerRaw			= 'dateiso;pm25;pm10\n';

var sensorFileName 		= 'sensor-raspi-result';
var sensorFileExtension	= '.csv';
var sensorLocalPathRoot = systemFolderParent + '/sensor/';
//var fileFolder 			= 'openiod-v1';
//var resultsFolder 		= sensorLocalPathRoot + fileFolder + "/" + 'results/';

var today				= new Date();
var dateString = today.getFullYear() + "-" + (today.getMonth()+1) + "-" +  today.getDate() + "_" + today.getHours(); // + ":" + today.getMinutes();
//var resultsFileName = resultsFolder + sensorFileName + '_' + dateString;

var counters	= {
	busy: false,  // dont/skip count when processing of results is busy (busy=true)
	pms: 	{
			pm1CF1			: 0
		, pm25CF1			: 0
		, pm10CF1			: 0
		,	pm1amb			: 0
		, pm25amb			: 0
		, pm10amb			: 0
		, part0_3			: 0
		, part0_5			: 0
		, part1_0			: 0
		, part2_5			: 0
		, part5_0			: 0
		, part10_0		: 0
		, nrOfMeas		: 0
    , nrOfMeasTotal	: 0
	},
	ds18b20: {
		temperature		: 0
		, nrOfMeas		: 0
    , nrOfMeasTotal	: 0
	},
	bme280: {
		  temperature	: 0
		, pressure		: 0
		, rHum				: 0
		, nrOfMeas		: 0
    , nrOfMeasTotal	: 0
	},
  bme680: {
		  temperature	: 0
		, pressure		: 0
		, rHum				: 0
    , gasResistance	: 0
		, nrOfMeas		: 0
    , nrOfMeasTotal	: 0
	},
	tgs5042: {
		co		: 0
		, nrOfMeas		: 0
    , nrOfMeasTotal	: 0
	},
  sps: 	{
			pm1			    : 0
		, pm25			  : 0
    , pm4			    : 0
		, pm10			  : 0
		, part0_5			: 0
		, part1_0			: 0
		, part2_5			: 0
		, part4_0			: 0
		, part10_0		: 0
    , tps			    : 0
		, nrOfMeas		: 0
    , nrOfMeasTotal	: 0
	},
  ips7100: 	{
      pm01			    : 0
    , pm03			    : 0
    , pm05			    : 0
    , pm1			    : 0
		, pm25			  : 0
    , pm5			    : 0
		, pm10			  : 0
    , part0_1			: 0
    , part0_3			: 0
		, part0_5			: 0
		, part1_0			: 0
		, part2_5			: 0
		, part5_0			: 0
		, part10_0		: 0
		, nrOfMeas		: 0
    , nrOfMeasTotal	: 0
	},
  scd30: {
		  temperature	: 0
		, rHum				: 0
    , co2		: 0
		, nrOfMeas		: 0
    , nrOfMeasTotal	: 0
	}
};
var results			= {
	pms: 	{
			pm1CF1			: 0
		, pm25CF1			: 0
		, pm10CF1			: 0
		,	pm1amb			: 0
		, pm25amb			: 0
		, pm10amb			: 0
		, part0_3			: 0
		, part0_5			: 0
		, part1_0			: 0
		, part2_5			: 0
		, part5_0			: 0
		, part10_0		: 0
		, nrOfMeas		: 0
	},
	ds18b20: {
		temperature		: 0
		, nrOfMeas		: 0
	},
	bme280: {
		  temperature	: 0
		, pressure		: 0
		, rHum				: 0
		, nrOfMeas		: 0
	},
  bme680: {
		  temperature	: 0
		, pressure		: 0
		, rHum				: 0
    , gasResistance	: 0
		, nrOfMeas		: 0
	},
	tgs5042: {
		co		: 0
		, nrOfMeas		: 0
	},
  sps: 	{
      pm1			    : 0
		, pm25			  : 0
    , pm4			    : 0
		, pm10			  : 0
		, part0_5			: 0
		, part1_0			: 0
		, part2_5			: 0
		, part4_0			: 0
		, part10_0		: 0
		, nrOfMeas		: 0
	},
  ips7100: 	{
			pm01		    : 0
    , pm03		    : 0
    , pm05		    : 0
    , pm1			    : 0
		, pm25			  : 0
    , pm5			    : 0
		, pm10			  : 0
    , part0_1			: 0
    , part0_3			: 0
		, part0_5			: 0
		, part1_0			: 0
		, part2_5			: 0
		, part5_0			: 0
		, part10_0		: 0
		, nrOfMeas		: 0
	},
  scd30: {
		  temperature	: 0
		, rHum				: 0
    , co2		: 0
		, nrOfMeas		: 0
	}
};

var initCounters	= function () {
	counters.pms.pm1CF1					= 0;
	counters.pms.pm25CF1				= 0;
	counters.pms.pm10CF1				= 0;
	counters.pms.pm1amb					= 0;
	counters.pms.pm25amb				= 0;
	counters.pms.pm10amb				= 0;
	counters.pms.part0_3				= 0;
	counters.pms.part0_5				= 0;
	counters.pms.part1_0				= 0;
	counters.pms.part2_5				= 0;
	counters.pms.part5_0				= 0;
	counters.pms.part10_0				= 0;
	counters.pms.nrOfMeas				= 0;

	counters.ds18b20.temperature= 0;
	counters.ds18b20.nrOfMeas		= 0;

	counters.bme280.temperature	= 0;
	counters.bme280.pressure		= 0;
	counters.bme280.rHum				= 0;
	counters.bme280.nrOfMeas		= 0;

  counters.bme680.temperature	= 0;
	counters.bme680.pressure		= 0;
	counters.bme680.rHum				= 0;
  counters.bme680.gasResistance	= 0;
	counters.bme680.nrOfMeas		= 0;

  counters.tgs5042.co= 0;
	counters.tgs5042.nrOfMeas		= 0;

	counters.sps.pm1					  = 0;
	counters.sps.pm25				    = 0;
  counters.sps.pm4					  = 0;
	counters.sps.pm10				    = 0;
	counters.sps.part0_5				= 0;
	counters.sps.part1_0				= 0;
	counters.sps.part2_5				= 0;
	counters.sps.part4_0				= 0;
	counters.sps.part10_0				= 0;
  counters.sps.tps					  = 0;
	counters.sps.nrOfMeas				= 0;

  counters.ips7100.pm01					  = 0;
  counters.ips7100.pm03					  = 0;
  counters.ips7100.pm05					  = 0;
  counters.ips7100.pm1					  = 0;
	counters.ips7100.pm25				    = 0;
  counters.ips7100.pm5					  = 0;
	counters.ips7100.pm10				    = 0;
  counters.ips7100.part0_1				= 0;
  counters.ips7100.part0_3				= 0;
  counters.ips7100.part0_5				= 0;
	counters.ips7100.part1_0				= 0;
	counters.ips7100.part2_5				= 0;
	counters.ips7100.part5_0				= 0;
	counters.ips7100.part10_0				= 0;
	counters.ips7100.nrOfMeas				= 0;

  counters.scd30.temperature	= 0;
	counters.scd30.rHum				= 0;
  counters.scd30.co2		= 0;
	counters.scd30.nrOfMeas		= 0;
}

//-------------- raspi-serial
var byteArray 			= new ArrayBuffer(32);
var view8 					= new Uint8Array(byteArray);
var view16 					= new Uint16Array(byteArray);
var pos 						= 0;
var checksum 				= 0;
//-------------- raspi-serial ips7100
var ips7100Record = 'ips7100,'

var processRaspiSerialRecord = function() {
	if (counters.busy==true) {
		console.log('Counters busy, measurement ignored *******************************');
		return;
	}
	counters.pms.nrOfMeas++;
  counters.pms.nrOfMeasTotal++;
	counters.pms.pm1CF1				+= (view8[4]<<8)	+ view8[5];
	counters.pms.pm25CF1			+= (view8[6]<<8)	+ view8[7];
	counters.pms.pm10CF1			+= (view8[8]<<8)	+ view8[9];
	counters.pms.pm1amb				+= (view8[10]<<8)	+ view8[11];
	counters.pms.pm25amb			+= (view8[12]<<8)	+ view8[13];
	counters.pms.pm10amb			+= (view8[14]<<8)	+ view8[15];
	counters.pms.part0_3			+= (view8[16]<<8)	+ view8[17];
	counters.pms.part0_5			+= (view8[18]<<8)	+ view8[19];
	counters.pms.part1_0			+= (view8[20]<<8)	+ view8[21];
	counters.pms.part2_5			+= (view8[22]<<8)	+ view8[23];
	counters.pms.part5_0			+= (view8[24]<<8)	+ view8[25];
	counters.pms.part10_0			+= (view8[26]<<8)	+ view8[27];
/*
  if (view8[28] == 0x80) {  //128=PMS7003
  //  process.stdout.write('einde datarecord PMS7003-128\n');
  }
  if (view8[28] == 0x91) {  //145=PMSA003
  //  process.stdout.write('einde datarecord PMSA003-145\n');
  }
  if (view8[28] == 0x97) {  //151=PMSA003
  //  process.stdout.write('einde datarecord PMSA003-151\n');
  }
*/
}

var resetRaspiSerialArray = function() {
	pos = 0;
	checksum=0;
}


var processRaspiSerialData = function (data) {
  var byte = data;

  if (pos>=4 & pos <32) {
    view8[pos] = byte;
    if (pos<30 ) checksum=checksum+byte;
    pos++;
  }
  if (pos==32) {
//		console.log('Raspi-serial processing.');
		if (checksum == ((view8[30]<<8)+view8[31])) {
			processRaspiSerialRecord();
		} else {
			console.log('Raspi-serial checksum error');
		}
    resetRaspiSerialArray();
  }
  if (pos==3) {
    if (byte == 0x1c) {
      view8[pos] = byte;
      checksum=checksum+byte;
      pos++;
    } else {
			resetRaspiSerialArray();
    }
  }
  if (pos==2) {
    if (byte == 0x00) {
      view8[pos] = byte;
      checksum=checksum+byte;
      pos++;
    } else resetRaspiSerialArray();
  }
  if (pos==1) {
    if (byte == 0x4D) {
      view8[pos] = byte;
      checksum=checksum+byte;
      pos++;
    } else resetRaspiSerialArray();
  }
  if (pos==0 & byte == 0x42) {
    view8[pos] = byte;
    checksum=checksum+byte;
    pos = 1;
  }
}
//  end-of raspi-serial variables and functions

//----------------- raspi-i2c
// The BME280 constructor options are optional.
//
var bme280
const options = {
  i2cBusNo   : 1, // defaults to 1
  i2cAddress : 0x76  // BME280.BME280_DEFAULT_I2C_ADDRESS() // defaults to 0x77
};
if (isEmpty(aprisensorDevices)) {
  bme280 = new BME280(options);
}
// Read BME280 sensor data, repeat
//
const readSensorDataBme280 = () => {
  if (indBme280==false) return
  bme280.readSensorData()
    .then((data) => {
      // temperature_C, pressure_hPa, and humidity are returned by default.
      // I'll also calculate some unit conversions for display purposes.
      //
      //data.temperature_F = BME280.convertCelciusToFahrenheit(data.temperature_C);
      //data.pressure_inHg = BME280.convertHectopascalToInchesOfMercury(data.pressure_hPa);

			if (counters.busy == false) {
        if (data.pressure_hPa<900) {
          console.log('BME280 pressure below 900. Less than 3.3V power? Measure skipped');
        } else {
          counters.bme280.nrOfMeas++;
          counters.bme280.nrOfMeasTotal++;
  				counters.bme280.temperature				+= data.temperature_C;
  				counters.bme280.pressure					+= data.pressure_hPa;
  				counters.bme280.rHum							+= data.humidity;
          //console.log(' ' + data.temperature_C+ ' ' + data.pressure_hPa + ' ' + data.humidity + ' ' + counters.bme280.nrOfMeas);
        }
			} else {
				console.log('Raspi-i2c processing is busy, measurement BME280 skipped');
			}
      //setTimeout(readSensorDataBme280, 1000);
    })
    .catch((err) => {
      console.log(`BME280 read error: ${err}`);

    });
};
// Initialize the BME280 sensor
//

/*
bme280.init()
  .then(() => {
    console.log('BME280 initialization succeeded');
    readSensorDataBme280();
  })
  .catch((err) => console.error(`BME280 initialization failed: ${err} `));
//  end-of bme280 raspi-i2c variables and functions
*/

const readSensorDataBme680 = async function(){
  if (indBme680==false) return
  var bme680Data = await bme680.getSensorData()
  .catch((err) => { console.error(err); return});
  var data = bme680Data.data;
  if (counters.busy == false) {
    if (data.pressure<900) {
      console.log('BME680 pressure below 900. Less than 3.3V power? Measure skipped');
    } else {
      counters.bme680.nrOfMeas++;
      counters.bme680.nrOfMeasTotal++;
      counters.bme680.temperature				+= data.temperature;
      counters.bme680.pressure					+= data.pressure;
      counters.bme680.rHum							+= data.humidity;
      counters.bme680.gasResistance  		+= data.gas_resistance;
      //console.log(' ' + data.temperature+ ' ' + data.pressure + ' ' + data.humidity + ' ' +data.gas_resistance+' ' + counters.bme680.nrOfMeas);
    }
  } else {
    console.log('Raspi-i2c processing is busy, measurement BME680 skipped');
  }
  //setTimeout(readSensorDataBme680, 1000);
}

var initBme680	= function() {
  indBme280=false
  indBme680=false
  if (bme680 != undefined) {
    bme680.initialize()
    .then(async () => {
      console.info('BME680 sensor initialized');
      indBme280=false
      indBme680=true

    //  readSensorDataBme680()
/*
      setInterval( async () => {
          console.info('before await bme680.getSensorData()');
          var bme680Data = await bme680.getSensorData()
          .then()
          console.info('after await bme680.getSensorData()');
  //        console.info(bme680Data)
  //        console.info(bme680Data.data)
          var data = bme680Data.data;
          //console.dir(data)
          if (counters.busy == false) {
            if (data.pressure<900) {
              console.log('BME680 pressure below 900. Less than 3.3V power? Measure skipped');
            } else {
              counters.bme680.nrOfMeas++;
              counters.bme680.nrOfMeasTotal++;
              counters.bme680.temperature				+= data.temperature;
              counters.bme680.pressure					+= data.pressure;
              counters.bme680.rHum							+= data.humidity;
              counters.bme680.gasResistance  		+= data.gas_resistance;
              console.log(' ' + data.temperature+ ' ' + data.pressure + ' ' + data.humidity + ' ' +data.gas_resistance+' ' + counters.bme680.nrOfMeas);
            }
          } else {
            console.log('Raspi-i2c processing is busy, measurement BME680 skipped');
          }
      }, 3000)
      //.catch((err)=> console.error('setInterval async error'));
    })
    .catch((err) => {
      console.error(`BME680 initialization failed: ${err} `));
    }
*/
    })
  }
  else{
    indBme280=false
    indBme680=false
    console.log('BME680 module not installed')
  }
}

var processDeviceData	= function(err,temperatureData) {
	if (err) {
    //throw err;
    console.log(err)
//    reset_w1_device()
    return
  }
  // warm-up time for ds18b20 also after reset
  if (new Date().getTime()-ds18b20InitTime.getTime()<30000) return

	var line2 = temperatureData.toString().split(/\n/)[1];
  if (line2==undefined) return
	var _temperature = line2.split('t=')[1];
	if (isNumeric(_temperature) ) {
		var temperature = Math.round(parseFloat(_temperature)/10)/100; // round to 2 decimals
		if (counters.busy == false) {
      if (temperature>50 | temperature < -15) {
        console.log('Error, temerature value our of range: ' + temperature);
      } else {
        counters.ds18b20.nrOfMeas++;
        counters.ds18b20.nrOfMeasTotal++;
  			counters.ds18b20.temperature			+= temperature;
        // console.log(' ' + temperature + ' ' + counters.ds18b20.nrOfMeas);
      }
		}
	};

//  setTimeout(readSensorDataDs18b20, 1000);
};

const readSensorDataDs18b20 = () => {
	//console.dir(devicesFolder  )
  if (devicesFolder==undefined) return
  var found=false
  for (var i=0;i<devicesFolder.length;i++) {
		if (devicesFolder[i].split('-')[0] == '28') {  // 00 for GPIO
//			console.log('DS18B20 device: ' +  devicesFolder[i]);
			var path = '/sys/bus/w1/devices/'+devicesFolder[i];
			//console.log('try read ' + path+ '/w1_slave');
			fs.readFile(path+'/w1_slave',processDeviceData);  // start process
      found=true
		}
	}
//  if (found == true) {
//    setTimeout(readSensorDataDs18b20, 1000);
//  }
};



var processDataCycle	= function() {
//	setTimeout(processDataCycle, loopTimeCycle);
	counters.busy = true;
	console.log('Counters pms: '+ counters.pms.nrOfMeas +
    '; bme280: '+ counters.bme280.nrOfMeas +
    '; bme680: '+ counters.bme680.nrOfMeas  +
    '; ds18b20: '+ counters.ds18b20.nrOfMeas +
    '; tgs5042: '+ counters.tgs5042.nrOfMeas +
    '; sps30: '+ counters.sps.nrOfMeas +
    '; ips7100: '+ counters.ips7100.nrOfMeas +
    '; scd30: '+ counters.scd30.nrOfMeas
  )

  results.pms.pm1CF1							= Math.round((counters.pms.pm1CF1/counters.pms.nrOfMeas)*100)/100;
	results.pms.pm25CF1							= Math.round((counters.pms.pm25CF1/counters.pms.nrOfMeas)*100)/100;
	results.pms.pm10CF1							= Math.round((counters.pms.pm10CF1/counters.pms.nrOfMeas)*100)/100;
	results.pms.pm1amb							= Math.round((counters.pms.pm1amb/counters.pms.nrOfMeas)*100)/100;
	results.pms.pm25amb							= Math.round((counters.pms.pm25amb/counters.pms.nrOfMeas)*100)/100;
	results.pms.pm10amb							= Math.round((counters.pms.pm10amb/counters.pms.nrOfMeas)*100)/100;
	results.pms.part0_3							= Math.round((counters.pms.part0_3/counters.pms.nrOfMeas)*100)/100;
	results.pms.part0_5							= Math.round((counters.pms.part0_5/counters.pms.nrOfMeas)*100)/100;
	results.pms.part1_0							= Math.round((counters.pms.part1_0/counters.pms.nrOfMeas)*100)/100;
	results.pms.part2_5							= Math.round((counters.pms.part2_5/counters.pms.nrOfMeas)*100)/100;
	results.pms.part5_0							= Math.round((counters.pms.part5_0/counters.pms.nrOfMeas)*100)/100;
	results.pms.part10_0						= Math.round((counters.pms.part10_0/counters.pms.nrOfMeas)*100)/100;
	results.pms.nrOfMeas						= counters.pms.nrOfMeas;

	results.bme280.temperature			= Math.round((counters.bme280.temperature/counters.bme280.nrOfMeas)*100)/100;
	results.bme280.pressure					= Math.round((counters.bme280.pressure/counters.bme280.nrOfMeas)*100)/100;
	results.bme280.rHum							= Math.round((counters.bme280.rHum/counters.bme280.nrOfMeas)*100)/100;
	results.bme280.nrOfMeas					= counters.bme280.nrOfMeas;

  results.bme680.temperature			= Math.round((counters.bme680.temperature/counters.bme680.nrOfMeas)*100)/100;
	results.bme680.pressure					= Math.round((counters.bme680.pressure/counters.bme680.nrOfMeas)*100)/100;
	results.bme680.rHum							= Math.round((counters.bme680.rHum/counters.bme680.nrOfMeas)*100)/100;
  results.bme680.gasResistance		= Math.round((counters.bme680.gasResistance/counters.bme680.nrOfMeas)*100)/100;
	results.bme680.nrOfMeas					= counters.bme680.nrOfMeas;

	results.ds18b20.temperature			= Math.round((counters.ds18b20.temperature/counters.ds18b20.nrOfMeas)*100)/100;
	results.ds18b20.nrOfMeas				= counters.ds18b20.nrOfMeas;

  results.tgs5042.co			= Math.round((counters.tgs5042.co/counters.tgs5042.nrOfMeas)*100)/100;
	results.tgs5042.nrOfMeas				= counters.tgs5042.nrOfMeas;

  results.sps.pm1							    = Math.round((counters.sps.pm1/counters.sps.nrOfMeas)*100)/100;
	results.sps.pm25							  = Math.round((counters.sps.pm25/counters.sps.nrOfMeas)*100)/100;
  results.sps.pm4							    = Math.round((counters.sps.pm4/counters.sps.nrOfMeas)*100)/100;
	results.sps.pm10							  = Math.round((counters.sps.pm10/counters.sps.nrOfMeas)*100)/100;
	results.sps.part0_5							= Math.round((counters.sps.part0_5/counters.sps.nrOfMeas)*100)/100;
	results.sps.part1_0							= Math.round((counters.sps.part1_0/counters.sps.nrOfMeas)*100)/100;
	results.sps.part2_5							= Math.round((counters.sps.part2_5/counters.sps.nrOfMeas)*100)/100;
	results.sps.part4_0							= Math.round((counters.sps.part4_0/counters.sps.nrOfMeas)*100)/100;
	results.sps.part10_0						= Math.round((counters.sps.part10_0/counters.sps.nrOfMeas)*100)/100;
  results.sps.tps							    = Math.round((counters.sps.tps/counters.sps.nrOfMeas)*100)/100;
	results.sps.nrOfMeas						= counters.sps.nrOfMeas;

  // skip first 30 measurements, initialization fase of the ips7100
  if (counters.ips7100.nrOfMeasTotal>30) {
    results.ips7100.pm01					= Math.round((counters.ips7100.pm01/counters.ips7100.nrOfMeas)*100)/100;
    results.ips7100.pm03					= Math.round((counters.ips7100.pm03/counters.ips7100.nrOfMeas)*100)/100;
    results.ips7100.pm05					= Math.round((counters.ips7100.pm05/counters.ips7100.nrOfMeas)*100)/100;
    results.ips7100.pm1						= Math.round((counters.ips7100.pm1/counters.ips7100.nrOfMeas)*100)/100;
  	results.ips7100.pm25					= Math.round((counters.ips7100.pm25/counters.ips7100.nrOfMeas)*100)/100;
    results.ips7100.pm5						= Math.round((counters.ips7100.pm5/counters.ips7100.nrOfMeas)*100)/100;
  	results.ips7100.pm10					= Math.round((counters.ips7100.pm10/counters.ips7100.nrOfMeas)*100)/100;
  	results.ips7100.part0_1				= Math.round((counters.ips7100.part0_1/counters.ips7100.nrOfMeas)*100)/100;
    results.ips7100.part0_3				= Math.round((counters.ips7100.part0_3/counters.ips7100.nrOfMeas)*100)/100;
    results.ips7100.part0_5				= Math.round((counters.ips7100.part0_5/counters.ips7100.nrOfMeas)*100)/100;
  	results.ips7100.part1_0				= Math.round((counters.ips7100.part1_0/counters.ips7100.nrOfMeas)*100)/100;
  	results.ips7100.part2_5				= Math.round((counters.ips7100.part2_5/counters.ips7100.nrOfMeas)*100)/100;
  	results.ips7100.part5_0				= Math.round((counters.ips7100.part5_0/counters.ips7100.nrOfMeas)*100)/100;
  	results.ips7100.part10_0			= Math.round((counters.ips7100.part10_0/counters.ips7100.nrOfMeas)*100)/100;
  	results.ips7100.nrOfMeas			= counters.ips7100.nrOfMeas;
  }

  results.scd30.temperature			= Math.round((counters.scd30.temperature/counters.scd30.nrOfMeas)*100)/100;
	results.scd30.rHum						= Math.round((counters.scd30.rHum/counters.scd30.nrOfMeas)*100)/100;
  results.scd30.co2							= Math.round((counters.scd30.co2/counters.scd30.nrOfMeas)*100)/100;
	results.scd30.nrOfMeas				= counters.scd30.nrOfMeas;

	initCounters();
	counters.busy = false;

  sendData();
}

var printHex = function(buffer, tekst) {
	var str="";
  for (var i=0;i<buffer.length;i++) {
	  str = str+ buffer[i].toString(16)+' ';
  }
  console.log('log: ' + tekst +'  lengte:'+buffer.length+ " "+ str); // + data);
}

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

// send data to service
var sendData = function() {
		var timeStamp = new Date();
		var url = '';
		if (results.pms.nrOfMeas > 0) {
//			url = openiodUrl + '/pmsa003'+ '/v1/m?foi=' + 'SCRP' + unit.id + '&observation='+
//						'pm1:'+results.pms.pm1CF1+',pm25:'+results.pms.pm25CF1+',pm10:'+results.pms.pm10CF1 +
//			 			',pm1amb:'+results.pms.pm1amb+',pm25amb:'+results.pms.pm25amb+',pm10amb:'+results.pms.pm10amb +
//						',raw0_3:'+results.pms.part0_3+',raw0_5:'+results.pms.part0_5+',raw1_0:'+results.pms.part1_0 +
//						',raw2_5:'+results.pms.part2_5+',raw5_0:'+results.pms.part5_0+',raw10_0:'+results.pms.part10_0;
//			console.log(url);
			redisHmsetHashAsync(timeStamp.toISOString()+':pmsa003'
			  , 'foi', 'SCRP' + unit.id
			  , 'pm1', results.pms.pm1CF1
				, 'pm25', results.pms.pm25CF1
				, 'pm10', results.pms.pm10CF1
				, 'pm1amb', results.pms.pm1amb
				, 'pm25amb', results.pms.pm25amb
        , 'pm10amb', results.pms.pm10amb
				, 'raw0_3', results.pms.part0_3
				, 'raw0_5', results.pms.part0_5
				, 'raw1_0', results.pms.part1_0
				, 'raw2_5', results.pms.part2_5
				, 'raw5_0', results.pms.part5_0
				, 'raw10_0', results.pms.part10_0
			  ).then(function(res) {
					var _res = res;
					redisSaddAsync('new', timeStamp.toISOString()+':pmsa003')
						.then(function(res2) {
							var _res2=res2;
						//	redisSaddAsync('pmsa003', timeStamp.toISOString()+':pmsa003')
							console.log('pmsa003 ', timeStamp.toISOString()+':pmsa003'+ _res2);
						});
		    	console.log(timeStamp.toString()+':pmsa003'+_res);
			});
		}
		if (results.bme280.nrOfMeas > 0) {
//			url = openiodUrl + '/bme280'+ '/v1/m?foi=' + 'SCRP' + unit.id + '&observation='+
//						'temperature:'+results.bme280.temperature+',pressure:'+results.bme280.pressure+',rHum:'+results.bme280.rHum ;
//			console.log(url);
			redisHmsetHashAsync(timeStamp.toISOString()+':bme280'
			  , 'foi', 'SCRP' + unit.id
			  , 'temperature', results.bme280.temperature
				, 'pressure', results.bme280.pressure
				, 'rHum', results.bme280.rHum
			  ).then(function(res) {
					var _res = res;
					redisSaddAsync('new', timeStamp.toISOString()+':bme280')
						.then(function(res2) {
							var _res2 = res2;
						//	redisSaddAsync('bme280', timeStamp.toISOString()+':bme280')
							console.log('bme280 ', timeStamp.toISOString()+':bme280'+ _res2);
						});
		    	console.log(timeStamp.toISOString()+':bme280'+_res);
			});
		}
    if (results.bme680.nrOfMeas > 0) {
//			url = openiodUrl + '/bme680'+ '/v1/m?foi=' + 'SCRP' + unit.id + '&observation='+
//						'temperature:'+results.bme680.temperature+',pressure:'+results.bme680.pressure+
//            ',rHum:'+results.bme680.rHum+',gasResistance:'+results.bme680.gasResistance ;
//			console.log(url);
			redisHmsetHashAsync(timeStamp.toISOString()+':bme680'
			  , 'foi', 'SCRP' + unit.id
			  , 'temperature', results.bme680.temperature
				, 'pressure', results.bme680.pressure
				, 'rHum', results.bme680.rHum
        , 'gasResistance', results.bme680.gasResistance
			  ).then(function(res) {
					var _res = res;
					redisSaddAsync('new', timeStamp.toISOString()+':bme680')
						.then(function(res2) {
							var _res2 = res2;
						//	redisSaddAsync('bme680', timeStamp.toISOString()+':bme680')
							console.log('bme680 ', timeStamp.toISOString()+':bme680'+ _res2);
						});
		    	console.log(timeStamp.toISOString()+':bme680'+_res);
			});
		}
		if (results.ds18b20.nrOfMeas > 0) {
			redisHmsetHashAsync(timeStamp.toISOString()+':ds18b20'
			  , 'foi', 'SCRP' + unit.id
			  , 'temperature', results.ds18b20.temperature
			  ).then(function(res) {
					var _res = res;
					redisSaddAsync('new', timeStamp.toISOString()+':ds18b20')
						.then(function(res2) {
							var _res2 = res2;
						//	redisSaddAsync('ds18b20', timeStamp.toISOString()+':ds18b20')
			    		console.log('ds18b20 ', timeStamp.toISOString()+':ds18b20'+ _res2);
						});
				console.log(timeStamp.toISOString()+':ds18b20'+_res);
			});
		}
    if (results.tgs5042.nrOfMeas > 0) {
			redisHmsetHashAsync(timeStamp.toISOString()+':tgs5042'
			  , 'foi', 'SCRP' + unit.id
			  , 'co', results.tgs5042.co
			  ).then(function(res) {
					var _res = res;
					redisSaddAsync('new', timeStamp.toISOString()+':tgs5042')
						.then(function(res2) {
							var _res2 = res2;
						//	redisSaddAsync('tgs5042', timeStamp.toISOString()+':tgs5042')
			    		console.log('tgs5042 ', timeStamp.toISOString()+':tgs5042'+ _res2);
						});
				console.log(timeStamp.toISOString()+':tgs5042'+_res);
			});
		}
    if (results.sps.nrOfMeas > 0) {
//			url = openiodUrl + '/sps30'+ '/v1/m?foi=' + 'SCRP' + unit.id + '&observation='+
//						'pm1:'+results.sps.pm1+',pm25:'+results.sps.pm25+',pm4:'+results.sps.pm4+',pm10:'+results.sps.pm10 +
//						',raw0_5:'+results.sps.part0_5+',raw1_0:'+results.sps.part1_0 +
//						',raw2_5:'+results.sps.part2_5+',raw4_0:'+results.sps.part4_0+
//            ',raw10_0:'+results.sps.part10_0 + ',tps:'+results.sps.tps;
//			console.log(url);
			redisHmsetHashAsync(timeStamp.toISOString()+':sps30'
			  , 'foi', 'SCRP' + unit.id
			  , 'pm1', results.sps.pm1
				, 'pm25', results.sps.pm25
        , 'pm4', results.sps.pm4
				, 'pm10', results.sps.pm10
				, 'raw0_5', results.sps.part0_5
				, 'raw1_0', results.sps.part1_0
				, 'raw2_5', results.sps.part2_5
				, 'raw4_0', results.sps.part4_0
				, 'raw10_0', results.sps.part10_0
        , 'tps', results.sps.tps
			  ).then(function(res) {
					var _res = res;
					redisSaddAsync('new', timeStamp.toISOString()+':sps30')
						.then(function(res2) {
							var _res2=res2;
						//	redisSaddAsync('sps30', timeStamp.toISOString()+':sps30')
							console.log('sps30 ', timeStamp.toISOString()+':sps30'+ _res2);
						});
		    	console.log(timeStamp.toString()+':sps30'+_res);
			});
		}
    if (results.ips7100.nrOfMeas > 0) {
//			url = openiodUrl + '/ips7100'+ '/v1/m?foi=' + 'SCRP' + unit.id + '&observation='+
//						'pm01:'+results.ips7100.pm01+',pm03:'+results.ips7100.pm03+',pm05:'+results.ips7100.pm05+', +
//						'pm1:'+results.ips7100.pm1+',pm25:'+results.ips7100.pm25+',pm5:'+results.ips7100.pm5+',pm10:'+results.ips7100.pm10 +
//						',raw0_1:'+results.ips7100.part0_1+',raw0_3:'+results.ips7100.part0_3 +
//						',raw0_5:'+results.ips7100.part0_5+',raw1_0:'+results.ips7100.part1_0 +
//						',raw2_5:'+results.ips7100.part2_5+',raw4_0:'+results.ips7100.part4_0+
//            ',raw10_0:'+results.ips7100.part10_0 ;
//			console.log(url);
      redisHmsetHashAsync(timeStamp.toISOString()+':ips7100'
        , 'foi', 'SCRP' + unit.id
        , 'pm01', results.ips7100.pm01
        , 'pm03', results.ips7100.pm03
        , 'pm05', results.ips7100.pm05
        , 'pm1', results.ips7100.pm1
        , 'pm25', results.ips7100.pm25
        , 'pm5', results.ips7100.pm5
        , 'pm10', results.ips7100.pm10
        , 'raw0_1', results.ips7100.part0_1
        , 'raw0_3', results.ips7100.part0_3
        , 'raw0_5', results.ips7100.part0_5
        , 'raw1_0', results.ips7100.part1_0
        , 'raw2_5', results.ips7100.part2_5
        , 'raw5_0', results.ips7100.part5_0
        , 'raw10_0', results.ips7100.part10_0
        , 'serialNr', ips7100SerialNr
        )
        .then(function(res) {
        var _res = res;
        redisSaddAsync('new', timeStamp.toISOString()+':ips7100')
        .then(function(res2) {
          var _res2=res2;
          //	redisSaddAsync('ips7100', timeStamp.toISOString()+':ips7100')
          console.log('ips7100 ', timeStamp.toISOString()+':ips7100'+ _res2);
        });
        console.log(timeStamp.toString()+':ips7100'+_res);
      });
    }
    if (results.scd30.nrOfMeas > 0) {
//			url = openiodUrl + '/scd30'+ '/v1/m?foi=' + 'SCRP' + unit.id + '&observation='+
//						'temperature:'+results.scd30.temperature+',rHum:'+results.scd30.rHum+',co2:'+results.scd30.co2 ;
//			console.log(url);
			redisHmsetHashAsync(timeStamp.toISOString()+':scd30'
			  , 'foi', 'SCRP' + unit.id
			  , 'temperature', results.scd30.temperature
				, 'rHum', results.scd30.rHum
        , 'co2', results.scd30.co2
			  ).then(function(res) {
					var _res = res;
					redisSaddAsync('new', timeStamp.toISOString()+':scd30')
						.then(function(res2) {
							var _res2 = res2;
						//	redisSaddAsync('scd30', timeStamp.toISOString()+':scd30')
							console.log('scd30 ', timeStamp.toISOString()+':scd30'+ _res2);
						});
		    	console.log(timeStamp.toISOString()+':scd30'+_res);
			});
		}

    if (results.bme280.nrOfMeas == 0 & results.bme680.nrOfMeas == 0) {
      if (isEmpty(aprisensorDevices)) {
        console.log('Both bmw280/bme680 counters zero, looks like error, next time initdevices ')
        if (bmeInitCounter <3) {
          bmeInitCounter++
        } else {
          bmeInitCounter = 0
          resetBmeDevice()
        }
      }
    } else {
      bmeInitCounter=0
    }
    if (results.ds18b20.nrOfMeas == 0) {
      if (isEmpty(aprisensorDevices)) {
        // warm-up time for ds18b20 also after reset
        if (new Date().getTime()-ds18b20InitTime.getTime()>=30000){
          console.log('ds18b20 counters zero, looks like error, next time initdevices ')
//        if (ds18b20InitCounter <3) {
//          ds18b20InitCounter++
//        } else {
//          ds18b20InitCounter = 0
            reset_w1_device()
//        }
        }
      }
    } //else {
      //ds18b20InitCounter=0
    //}

    if (results.pms.nrOfMeas == 0 && results.pms.nrOfMeasTotal > 0 ) {
      if (isEmpty(aprisensorDevices)) {
        if (pmsa003InitCounter <1) {
          console.log('pmsa003 counters zero, looks like error, next time try active mode ')
          pmsa003InitCounter++
        } else {
          pmsa003InitCounter = 0
          // switch active / passive mode
          var cmdByteArray 		= new ArrayBuffer(7);
          var cmdView8 				= new Uint8Array(cmdByteArray);
          var cmdCheckSum=0
          cmdView8[0] = 0x42
          cmdView8[1] = 0x4D
          //cmdView8[2] = 0xE4  // set sleep/wakeup
          cmdView8[2] = 0xE1  // set passive/active
          cmdView8[3] = 0x00
//        if (sleepMode==1) {
//          cmdView8[4] = 0x00 // set to sleep
////          console.log('set pmsa003 to sleep')
//          console.log('set pmsa003 to passive')
//          sleepMode=0
//        } else {
          cmdView8[4] = 0x01 // set to wakeup
////          console.log('set pmsa003 to wakeup')
          console.log('set pmsa003 to active')
//          sleepMode=1
//        }
          cmdCheckSum = cmdView8[0]+cmdView8[1]+cmdView8[2]+cmdView8[3]+cmdView8[4]
          cmdView8[5]=cmdCheckSum>>8
          cmdView8[6]=cmdCheckSum-(cmdView8[5]<<8)

          for (var i=0; i<serialDevices.length;i++) {
            if (serialDevices[i].deviceType == 'pmsa003') {
              if (serialDevices[i].serial!=undefined){
                serialDevices[i].serial.write(cmdView8);
              }
            }
          }
        }
      }
    } else {
      pmsa003InitCounter=0
    }

    if (results.sps.nrOfMeas == 0) {
      // reset sps30 when connected ?
    }
    if (results.ips7100.nrOfMeas == 0) {
      // reset ips7100 when connected ?
    }
    if (results.scd30.nrOfMeas == 0) {
      // reset ips7100 when connected ?
    }

};


var getCpuInfo	= function() {
	//hostname --all-ip-address
	exec("cat /proc/cpuinfo | grep Serial | cut -d ' ' -f 2", (error, stdout, stderr) => {
		if (error) {
			console.error(`exec error: ${error}`);
			return;
		}
		unit.id = stdout.substr(0,stdout.length-1);
	});
	exec("cat /proc/cpuinfo | grep Hardware | cut -d ' ' -f 2", (error, stdout, stderr) => {
		if (error) {
			console.error(`exec error: ${error}`);
			return;
		}
		unit.hardware = stdout.substr(0,stdout.length-1);
	});
	exec("cat /proc/cpuinfo | grep Revision | cut -d ' ' -f 2", (error, stdout, stderr) => {
		if (error) {
			console.error(`exec error: ${error}`);
			return;
		}
		unit.revision = stdout.substr(0,stdout.length-1);
	});
};


getCpuInfo();

/*
var setGpioFanOn = function() {
  console.log('set fan GPIO on')
  gpioFan.writeSync(1); //set pin state to 1 (power DS18B20 on)
}
var setGpioFanOff = function() {
  console.log('set fan GPIO off')
  gpioFan.writeSync(0); //set pin state to 0 (power DS18B20 off)
  setTimeout(setGpioFanOn, 5000);
}
setGpioFanOff() // fan always on but first set gpio to off
*/
var i2cSps30
var sps30ProductType=''
var sps30SerialNr =''
if (isEmpty(aprisensorDevices)) {
  i2cSps30 = new I2C();
}

var calcCrcSps30=function(data1,data2) {
   var crc = 0xFF
   for(var i = 0; i < 2; i++) {
     if (i==0) crc ^= data1
     else crc ^= data2
     for(var bit = 8; bit > 0; --bit) {
       if(crc & 0x80) {
         crc = (crc << 1) ^ 0x31
       } else {
         crc = (crc << 1)
       }
       if (crc>255) {
         var a=crc>>8
         var b=a<<8
         crc=crc-b
       }
    }
  }
  return crc
}

var initSps30Device = function() {
  raspi.init(() => {
    var str12
    try {
      i2cSps30.writeSync(addressI2cSps30,Buffer.from([ 0xD0,0x02]))
      str12=i2cSps30.readSync(addressI2cSps30,12)
    }
    catch {
      console.log('error initializing SPS30, maybe not available')
      indSps30=false
      return
    }
    sps30ProductType=''
    if (Buffer.compare(str12,
      Buffer.from([0x30, 0x30, 0xf6, 0x30, 0x38, 0x4f, 0x30, 0x30, 0xf6, 0x30, 0x30, 0xf6])) ==0) {
      sps30ProductType='00080000'
      console.log('SPS30 producttype found: '+ sps30ProductType)
      indSps30=true
    } else {
      console.log('SPS30 producttype not found')
      indSps30=false
      return
    }
    var buf48
    try {
      i2cSps30.writeSync(addressI2cSps30,Buffer.from([ 0xD0,0x33]))
      buf48=i2cSps30.readSync(addressI2cSps30,48)
    }
    catch {
      console.log('error initializing SPS30, maybe not available')
      indSps30=false
      return
    }
    sps30SerialNr=''
    for (var i=0;i<48;i=i+3) {
      if (buf48[i]==0) break
      sps30SerialNr+=String.fromCharCode(buf48[i])
      if (buf48[i+1]==0) break
      sps30SerialNr+=String.fromCharCode(buf48[i+1])
    }
    console.log(`SPS30 producttype: ${sps30ProductType}`)
    console.log(`SPS30 serialnr: ${sps30SerialNr}`)
    // start measuring
    try {
      // set sensor to produce floating point values
      i2cSps30.writeSync(addressI2cSps30,Buffer.from([ 0x00,0x10,0x03,0x00,calcCrcSps30(0x03,0x00)]))
      //      // integer
      //    i2cSps30.writeSync(addressI2cSps30,Buffer.from([ 0x00,0x10,0x05,0x00,0xF6]))
    }
    catch {
      console.log('error initializing SPS30, maybe not available')
      indSps30=false
      return
    }
  });
}
var readSps30Device = function() {
  if (indSps30==true) {
    var buf60
    var result=[]
    try {
      i2cSps30.writeSync(addressI2cSps30,Buffer.from([ 0x03,0x00]))
      buf60=i2cSps30.readSync(addressI2cSps30,60)
    }
    catch {
      console.log('ERROR readSps30Device writeSync ')
      return
    }
    // floats
    for (var i=0;i<60;i=i+6) {
//      console.log(i)
      if (buf60[i+2]!=calcCrcSps30(buf60[i],buf60[i+1])) {
        console.log('checksum error')
        break
      }
      if (buf60[i+5]!=calcCrcSps30(buf60[i+3],buf60[i+4])) {
        console.log('checksum error')
        break
      }
      var data=[buf60[i],buf60[i+1],buf60[i+3],buf60[i+4]]
//      console.dir(data)
//      console.log(buf30[i])
//      console.log(buf30[i+1])
      // Create a buffer
      var buf = new ArrayBuffer(4);
      // Create a data view of it
      //var view = new DataView(buf);
      var view = new Float32Array(buf);
      var view8 = new Uint8Array(buf);
      var view16 = new Uint16Array(buf);

//      function bytesToFloat(bytes) {
      // JavaScript bitwise operators yield a 32 bits integer, not a float.
      // Assume LSB (least significant byte first).
      var bits = buf60[i]<<24 | buf60[i+1]<<16 | buf60[i+3]<<8 | buf60[i+4]
      var sign = (bits>>>31 === 0) ? 1.0 : -1.0;
      var e = bits>>>23 & 0xff;
      var m = (e === 0) ? (bits & 0x7fffff)<<1 : (bits & 0x7fffff) | 0x800000;
      var value = sign * m * Math.pow(2, e - 150);

      // the nodejs procedure to convert float (4 bytes) into double

      // const bufTest = Buffer.from([buf60[i], buf60[i+1], buf60[i+3], buf60[i+4]]);
      // console.log('test: '+i)
      // console.log(value);
      // dit geeft dezelfde resultaat als de bovenstaande float omrekening: console.log(bufTest.readFloatBE(0));
      // deze geeft foutieve waarden: console.log(bufTest.readFloatLE(0));
//        return f;
//      }

/*
      // set bytes
      data.forEach(function (b, i) {
          view8[i]=b;
      });
      console.dir(view)

      var value= view[0]
      console.log(view[0])
*/
      // Read the bits as a float; note that by doing this, we're implicitly
      // converting it from a 32-bit float into JavaScript's native 64-bit double
//      var value = view.getFloat32(0);
      // Done
//      console.log(value);

//      var buffer = new ArrayBuffer(4);
//      var intView = new Int32Array(buffer);
//      var floatView = new Float32Array(buffer);

//      floatView[0] = Math.PI
//      console.log(intView[0].toString(2)); //bits of the 32 bit float
//      console.log(floatView[0])

      // convert number of particles from cm3 into 0.1L (multiply by 100)
      if (result.length>=4 && result.length<=8) {
        value=value*100
      }
      result.push(value)
    }
/* integer
    var buf30=i2cSps30.readSync(addressI2cSps30,30)
    for (var i=0;i<30;i=i+3) {
      if (buf30[i+2]!=calcCrcSps30(buf30[i],buf30[i+1])) {
        console.log('checksum error')
        break
      }
//      console.log(buf30[i])
//      console.log(buf30[i+1])
      var value = buf30[i]<<8
      value+=buf30[i+1]
      result.push(value)
    }
*/
    if (result.length==10) {
      processRaspiSpsRecord(result)
    }
  }
}

var processRaspiSpsRecord = function(result) {
	if (counters.busy==true) {
		console.log('Counters busy, sps30 measurement ignored *******************************');
		return;
	}
	counters.sps.nrOfMeas++;
  counters.sps.nrOfMeasTotal++;
	counters.sps.pm1			  	+= result[0]
	counters.sps.pm25			    += result[1]
  counters.sps.pm4			    += result[2]
	counters.sps.pm10			    += result[3]
	counters.sps.part0_5			+= result[4]
	counters.sps.part1_0			+= result[5]-result[4]
	counters.sps.part2_5			+= result[6]-result[5]
	counters.sps.part4_0			+= result[7]-result[6]
	counters.sps.part10_0			+= result[8]-result[7]
  counters.sps.tps			    += result[9]
}

if (isEmpty(aprisensorDevices)) {
  initSps30Device()
}

// =================================

var initScd30Device = function() {
  scd30Client.setID(0x61)
}

const readScd30Device = function() {
  if (scd30Client.isOpen)  {
//    console.log('open')
    //mbsState = MBS_STATE_NEXT;
  } else {
//    console.log('not open')
    return
  }

  scd30Client.readHoldingRegisters(0x27, 1)
  .then(async function(data) {
    if (data.data[0]==1) {
      //console.log('data available, read measurement')
      await sleepFunction(3)
      readScd30Measurement()
    }
  })
  .catch(function(err) {
    console.log('xx error xxxx')
    console.log(err)
  })
}

const readScd30Measurement= function() {
  // console.log('read measurement')
  // read the 6 registers starting at address 0x28
  // on device number 0x61
  scd30Client.readHoldingRegisters(0x28, 6)
  .then(function(data) {
    var result = {}
    result.co2         = data.buffer.readFloatBE(0)
    result.temperature = data.buffer.readFloatBE(4)
    result.rHum        = data.buffer.readFloatBE(8)
    processRaspiScd30Record(result)
  })
  .catch(function(err) {
    console.log('xx error xxxx')
    console.log(err)
  })
}

var processRaspiScd30Record = function(result) {
	if (counters.busy==true) {
		console.log('Counters busy, Scd30 measurement ignored *******************************');
		return;
	}
	counters.scd30.nrOfMeas++;
  counters.scd30.nrOfMeasTotal++;
  counters.scd30.co2			    += result.co2
	counters.scd30.temperature	+= result.temperature
  counters.scd30.rHum			    += result.rHum
}

if (aprisensorDevices.scd30!=undefined) {
  // SCD30 open modbus connection to serial port
  var scd30Client = new ModbusRTU()
  scd30Client.connectRTUBuffered("/dev/ttyS0", { baudRate: 19200 }, initScd30Device)
}

// ips7100
var processRaspiIps7100Record = function(result) {
	if (counters.busy==true) {
		console.log('Counters busy, Ips7100 measurement ignored *******************************');
		return;
	}
	counters.ips7100.nrOfMeas++;
  counters.ips7100.nrOfMeasTotal++;
	counters.ips7100.part0_1			+= parseFloat(result[2])
  counters.ips7100.part0_3			+= parseFloat(result[4])
  counters.ips7100.part0_5			+= parseFloat(result[6])
	counters.ips7100.part1_0			+= parseFloat(result[8])
	counters.ips7100.part2_5			+= parseFloat(result[10])
	counters.ips7100.part5_0			+= parseFloat(result[12])
	counters.ips7100.part10_0			+= parseFloat(result[14])
  counters.ips7100.pm01			  	+= parseFloat(result[16])
  counters.ips7100.pm03			  	+= parseFloat(result[18])
  counters.ips7100.pm05			  	+= parseFloat(result[20])
	counters.ips7100.pm1			  	+= parseFloat(result[22])
	counters.ips7100.pm25			    += parseFloat(result[24])
  counters.ips7100.pm5			    += parseFloat(result[26])
	counters.ips7100.pm10			    += parseFloat(result[28])
  ips7100SerialNr = result[29]
  ips7100Hash = result[30]
}

var initBmeDevice = function(){
  console.log('initBmeDevice')
  bme280.init()
    .then(() => {
      console.log('BME280 initialization succeeded');
      indBme280=true
      indBme680=false
      //readSensorDataBme280();
    })
    .catch((err) => {
      console.error(`BME280 initialization failed: ${err} `);
      console.log('BME680 init') //
      indBme280=false
      indBme680=false
      initBme680()
    })
  //  end-of bme280 raspi-i2c variables and functions

}
var setGpioBmeOn = function() {
  console.log('set BME280/BME680 GPIO on')
  gpioBme.writeSync(1); //set pin state to 1 (power DS18B20 on)
  setTimeout(initBmeDevice, 5000);
}
var setGpioBmeOff = function() {
  console.log('set BME280/BME680 GPIO off')
  gpioBme.writeSync(0); //set pin state to 0 (power DS18B20 off)
  setTimeout(setGpioBmeOn, 5000);
}
var resetBmeDevice = function() {
  console.log('resetBmeDevice')
  if (gpioBme != undefined) {  // only try to reset when gpio module available
    setGpioBmeOff()
  }
}

var setGpioDs18b20On = function() {
  console.log('set DS18B20 GPIO on')
  gpioDs18b20.writeSync(1); //set pin state to 1 (power DS18B20 on)
  setTimeout(check_w1_device, 5000);
}
var setGpioDs18b20Off = function() {
  console.log('set DS18B20 GPIO off')
  gpioDs18b20.writeSync(0); //set pin state to 0 (power DS18B20 off)
  setTimeout(setGpioDs18b20On, 5000);
}

var reset_w1_device = function() {
  console.log('reset_w1_device')
  if (gpioDs18b20 != undefined) {  // only try to reset when gpio module available
    ds18b20InitTime=new Date()
    setGpioDs18b20Off()
  }
}

var check_w1_device = function() {
  console.log('check_w1_device')
  try {
  	devicesFolder = fs.readdirSync('/sys/bus/w1/devices');
//  	readSensorDataDs18b20();
  } catch (err) {
  	devicesFolder = undefined;
    console.log('Directory for W1 not found. No GPIO available? (/sys/bus/w1/devices');
    //setTimeout(reset_w1_device, 60000);
    //return;
  }
}

if (isEmpty(aprisensorDevices)) {
  reset_w1_device()  // check w1 device for DS18B20
  resetBmeDevice()  // check bme280 or bme680
}


var socket = io(socketUrl, {path:socketPath});

socket.on('connection', function (socket) {
	var currTime = new Date();
	console.log(currTime +': connect from '+ socket.request.connection.remoteAddress + ' / '+ socket.handshake.headers['x-forwarded-for'] || socket.handshake.address.address);
});

socket.on('disconnect', function() {
	console.log('Disconnected from web-socket ');
});

socket.on('info', function(data) {
	console.log('websocket info: ');
	console.dir(data);
	//io.sockets.emit('aireassignal', { data: data } );
	//socket.broadcast.emit('aireassignal', { data: data } );
});

var processRaspiSerialData7100=function(data){
/*
  [ 'ips7100',
  'PC0.1',
  '18590',
  'PC0.3',
  '10345',
  'PC0.5',
  '2641',
  'PC1.0',
  '246',
  'PC2.5',
  '65',
  'PC5.0',
  '1',
  'PC10',
  '0',
  'PM0.1',
  ' 0.01553309',
  'PM0.3',
  ' 0.24892623',
  'PM0.5',
  ' 0.52479007',
  'PM1.0',
  ' 0.73060520',
  'PM2.5',
  ' 1.01262989',
  'PM5.0',
  ' 1.09557569',
  'PM10',
  ' 1.09557569',
  'IPS-S-21C000096V18',
  'y3hmwH/uvwi6MDsVjL6EWg== ' ]
*/
  if (data==13) return // \r carriage return
  if (data==10) { // \n line feed
//    console.log('process ips7100 record '+ ips7100Record)
    var items = ips7100Record.split(',')
    if (items.length == 31
      && items[1]=='PC0.1'
      && items[3]=='PC0.3'
      && items[5]=='PC0.5'
      && items[7]=='PC1.0'
      && items[9]=='PC2.5'
      && items[11]=='PC5.0'
      && items[13]=='PC10'
      && items[15]=='PM0.1'
      && items[17]=='PM0.3'
      && items[19]=='PM0.5'
      && items[21]=='PM1.0'
      && items[23]=='PM2.5'
      && items[25]=='PM5.0'
      && items[27]=='PM10'
      ) { // valid ips-7100 record
      //console.dir(items)
      processRaspiIps7100Record(items)
    }
    ips7100Record='ips7100,'
    return
  }
  ips7100Record +=String.fromCharCode(data)
}

var serialDevices=[
  {device:'/dev/ttyS0'
    ,baudRate:9600
    ,initiated:false
    ,validData:false
    ,deviceType:'pmsa003'
  },
  {device:'/dev/ttyS0'
    ,baudRate:115200
    ,initiated:false
    ,validData:false
    ,deviceType:'ips7100'
  }
]

var scanSerialDevices=function() {
//  console.log('Scan serial devices')
  var inUseDevices=[]
  for (var i=0;i<serialDevices.length;i++){
//    console.log('Device '+i)
    var serialDevice=serialDevices[i]
//    console.dir(serialDevice)
//    console.dir(inUseDevices)
    // device in error state, reboot or restart process for retry
    if (serialDevice.error!=undefined) continue
    if (serialDevice.validData==true) {
      inUseDevices[serialDevice.device]=true
      continue
    }
    // device in use
    if (inUseDevices[serialDevice.device]!=undefined) continue
    if (serialDevice.deviceType=='ips7100'	&& counters.ips7100.nrOfMeasTotal>0) {
      serialDevice.validData=true
    }
    if (serialDevice.deviceType=='pmsa003' &&	counters.pms.nrOfMeasTotal>0) {
      serialDevice.validData=true
    }
    if (serialDevice.validData==true) {
      inUseDevices[serialDevice.device]=true
      continue
    }
    if (serialDevice.scanTime == undefined ||
        new Date().getTime()-serialDevice.scanTime.getTime()>5000) {
      if (serialDevice.serial == undefined ) {
        inUseDevices[serialDevice.device]=true
        initSerial(i)
      } else {
        serialDevice.serial.close()
        serialDevice.error=true
        inUseDevices[serialDevice.device]=false
      }
      serialDevice.scanTime=new Date()
    }
//    console.log('next ===============')
  }
//  console.dir(inUseDevices)
//  console.dir(serialDevices)
}

var initSerial=function(serialDeviceIndex){
  console.log('init serial '+serialDevices[serialDeviceIndex].device+' '+
    serialDevices[serialDeviceIndex].deviceType)
  raspi.init(() => {
    var options={portId:serialDevices[serialDeviceIndex].device,baudRate:serialDevices[serialDeviceIndex].baudRate}
    serialDevices[serialDeviceIndex].serial = new Serial(options);
    serialDevices[serialDeviceIndex].serial.serialDeviceIndex=serialDeviceIndex
    serialDevices[serialDeviceIndex].serial.open(() => {
      //console.log('serial open')
      if (serialDevices[serialDeviceIndex].deviceType=='pmsa003') {
        console.log('serial device for pmsa003 opened')
        serialDevices[serialDeviceIndex].serial.on('data', (data) => {
          //console.log('serial on data')
          //console.log(data)
          //printHex(data,'T');
          for (var i=0;i<data.length;i++) {
            processRaspiSerialData(data[i]);
          }
        });
      }
      if (serialDevices[serialDeviceIndex].deviceType=='ips7100') {
        console.log('serial device for ips7100 opened')
        console.dir(options)
        serialDevices[serialDeviceIndex].serial.on('data', (data) => {
          //console.log('serial on data')
          //printHex(data,'T');
          //process.stdout.write(data);
          for (var i=0;i<data.length;i++) {
            processRaspiSerialData7100(data[i]);
          }
        });
        var command ='$Won=200\r\n'
        console.log('write start measurement ips7100: '+command)

        serialDevices[serialDeviceIndex].serial.write(command)
      }
      //serial.write('Hello from raspi-serial');
    });
  });
}

if (isEmpty(aprisensorDevices)) {
  let timerIdBme280 = setInterval(readSensorDataBme280, 2000)
  //setTimeout(readSensorDataBme280, 1000);
  let timerIdBme680 = setInterval(readSensorDataBme680, 2000)
  //setTimeout(readSensorDataBme680, 1000);
  let timerIdDs18B20 = setInterval(readSensorDataDs18b20, 2000)
  let timerIdSps30 = setInterval(readSps30Device, 1000)  // particulate matter
}

if (aprisensorDevices.tgs5042!=undefined) {
  // start processing TGS5042 CO sensor if available
  if (ads1115Available==true) {
    let timerIdAds1115Tgs5042 = setInterval(getAds1115Tgs5042, 2000)
    //setTimeout(getAds1115Tgs5042, 1000);
  }
}

if (aprisensorDevices.scd30!=undefined) {
  let timerIdScd30 = setInterval(readScd30Device, 1000)  // CO2,temperature,rHum
}

let timerDataCycle = setInterval(processDataCycle, loopTimeCycle)
//setTimeout(processDataCycle, loopTimeCycle);

if (isEmpty(aprisensorDevices)) {
  scanSerialDevices()
  let timerSerialDevices = setInterval(scanSerialDevices, 10000)
}
