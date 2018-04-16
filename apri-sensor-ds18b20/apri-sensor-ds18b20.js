/*
** Module: apri-sensor-ds18b20
**
** Main system module for handling sensor measurement data via serial port
**
*/

"use strict"; // This is for your code to comply with the ECMAScript 5 standard.

// activate init process config-main
var path = require('path');
var startFolder 			= __dirname;
var startFolderParent		= path.resolve(__dirname,'../..');
var configServerModulePath	= startFolder + '/../apri-config/apri-config';
console.log("Start of Config Main ", configServerModulePath);
var apriConfig = require(configServerModulePath)

var systemFolder 			= __dirname;
var systemFolderParent		= path.resolve(__dirname,'../..');
var systemFolderRoot		= path.resolve(systemFolderParent,'..');
var systemModuleFolderName 	= path.basename(systemFolder);
var systemModuleName 		= path.basename(__filename);
var systemBaseCode 			= path.basename(systemFolderParent);

var initResult = apriConfig.init(systemModuleFolderName+"/"+systemModuleName);

// **********************************************************************************

// add module specific requires
var request 			= require('request');
//var express 			= require('express');

var fs 					= require('fs');
//var SerialPort 			= require("serialport");
var io	 				= require('socket.io-client');
const exec 				= require('child_process').exec;
const execFile			= require('child_process').execFile;

//var app = express();

// **********************************************************************************
		/* web-socket */
	var socketUrl, socketPath;
//		socketUrl 	= 'http://localhost:3010';
//		socketUrl 	= 'http://openiod.org';
//		socketUrl 	= 'https://openiod.org';
//		socketUrl 	= '';
//		socketPath	= apriConfig.urlSystemRoot + '/socket.io';

//prod:
		socketUrl 	= 'https://openiod.org'; socketPath	= '/'+apriConfig.systemCode + '/socket.io';
		//console.log(apriConfig);

//test:
//		socketPort	= 3010; socketUrl 	= ':'+socketPort;
//		socketPath	= apriConfig.urlSystemRoot + '/socket.io';


		console.log('web-socket url: '+socketUrl+socketPath);

var secureSite 			= true;
var siteProtocol 		= secureSite?'https://':'http://';
var openiodUrl			= siteProtocol + 'openiod.org/' + apriConfig.systemCode; //SCAPE604';
var loopTimeMax			= 60000; //ms, 60000=60 sec

/*
var usbPorts			= [];

var serialPortPath;

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

// create headers to only use ones in the result files
var writeHeaders		= true;
var headerRaw			= 'dateiso;temperature\n';

var sensorFileName 		= 'sensor-ds18b20-result';
var sensorFileExtension	= '.csv';
var sensorLocalPathRoot = systemFolderParent + '/sensor/';
var fileFolder 			= 'openiod-v1';
var resultsFolder 		= sensorLocalPathRoot + fileFolder + "/" + 'results/';

var today				= new Date();
var dateString = today.getFullYear() + "-" + (today.getMonth()+1) + "-" +  today.getDate() + "_" + today.getHours(); // + ":" + today.getMinutes();
var resultsFileName = resultsFolder + sensorFileName + '_' + dateString;

var temperatureTotal;
var measureMentCount;
var temperatureResult;
var temperatureResult;
var id = "DS18B20";


function isNumeric(n) {
  return !isNaN(parseInt(n,10)) && isFinite(n);
}

var writeHeaderIntoFile = function() {
	fs.appendFile(resultsFileName + '_raw' + sensorFileExtension, headerRaw, function (err) {
		if (err != null) {
			console.log('Error writing results to file: ' + err);
		}
	});
	writeHeaders	= false;
}

// send data to SOS service via OpenIoD REST service
var sendData = function(data) {
// oud //		http://openiod.com/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&inputformat=insertom&objectid=humansensor&format=xml
// oud //			&region=EHV		&lat=50.1		&lng=4.0		&category=airquality		&value=1

//http://localhost:4000/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertom&sensorsystem=apri-sensor-ds18b20&offering=offering_0439_initial&verbose=true&commit=true&observation=apri-sensor-ds18b20-temperature:12.345&neighborhoodcode=BU04390402
//https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertom&sensorsystem=apri-sensor-ds18b20&offering=offering_0439_initial&verbose=true&commit=true&observation=apri-sensor-ds18b20-temperature:12345&neighborhoodcode=BU04390402

		var _url = openiodUrl + '/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertom&sensorsystem=apri-sensor-ds18b20&offering=offering_0439_initial&commit=true';
		_url = _url +
		//'&region=0439' +
		'&foi=' + data.foi +
		//'&neighborhoodcode=' + data.neighborhoodCode + '&citycode=' + data.cityCode +
		'&observation=' + data.observation ;

		console.log(_url);
		request.get(_url)
			.on('response', function(response) {
				console.log(response.statusCode) // 200
				console.log(response.headers['content-type']) // 'image/png'
  			})
			.on('error', function(err) {
				console.log(err)
			})
		;

};

var getCpuInfo	= function() {
	//hostname --all-ip-address
	exec("cat /proc/cpuinfo | grep Serial | cut -d ' ' -f 2", (error, stdout, stderr) => {
		if (error) {
			console.error(`exec error: ${error}`);
			return '1A';
		}
		unit.id = stdout.substr(0,stdout.length-1);
		return '1B';
	});
	exec("cat /proc/cpuinfo | grep Hardware | cut -d ' ' -f 2", (error, stdout, stderr) => {
		if (error) {
			console.error(`exec error: ${error}`);
			return '2A';
		}
		unit.hardware = stdout.substr(0,stdout.length-1);
		return '2B';
	});
	exec("cat /proc/cpuinfo | grep Revision | cut -d ' ' -f 2", (error, stdout, stderr) => {
		if (error) {
			console.error(`exec error: ${error}`);
			return '3A';
		}
		unit.revision = stdout.substr(0,stdout.length-1);
		return '3B';
	});
	return '0';
};

var processDeviceData	= function() {
	console.log('processDeviceData');
	var line2 = _file.toString().split(/\n/)[1];
	var _temperature = line2.split('t=')[1];
	//console.log(line2);
	//console.log(_temperature);
	if (isNumeric(_temperature) ) {
		var temperature = parseInt(_temperature,10)/1000;
		console.log(temperature);
		//processMeasurement(temperature);
		var sensorId			= sensorId;
		var measureTime		= new Date();
		console.log('Results: ' + measureTime.toISOString());

			var data			= {};
			//data.neighborhoodCode	= 'BU04390603'; //geoLocation.neighborhoodCode;
			data.foi				= 'SCRP' + unit.id;
	//		if (sensorKey != '') {
	//			data.foi	+= '_' + sensorKey;
	//		}
			//data.neighborhoodName	= '..'; //geoLocation.neighborhoodName;
			//data.cityCode			= 'GM0439'; //geoLocation.cityCode;
			//data.cityName			= '..'; //geoLocation.cityName;

			var recordOut 			= measureTime.toISOString() + ';' + temperatureResult + '\n';

			fs.appendFile(resultsFileName + '_raw' + sensorFileExtension, recordOut, function (err) {
				if (err != null) {
					console.log('Error writing results to file: ' + err);
				}
			});

			data.categories			= [];
			data.observation		= 'apri-sensor-ds18b20-temperature:'+temperatureResult ;
	    console.log('Writing: ');
			console.dir(data);
			//sendData(data);

		//writeResults(measureMentTime);
};
console.log('getCpuInfo');
console.log(getCpuInfo());

try {
	var devicesFolder = fs.readdirSync('/sys/bus/w1/devices');
} catch (err) {
  console.log('Directory or file for DS18B20 not found. (/sys/bus/w1/devices/28-*/w1_slave)');
  return;
}

try {
	var devicesFolder = fs.readdirSync('/sys/bus/w1/devices');
} catch (err) {
  console.log('Directory or file for DS18B20 not found. (/sys/bus/w1/devices/28-*/w1_slave)');
  return;
}

var _file;
//var sensorKey			= 'DS18B20';
//console.log('SensorKey = ' + sensorKey);


for (var i=0;i<devicesFolder.length;i++) {
	if (devicesFolder[i].split('-')[0] == '28') {
		console.log('DS18B20 device: ' +  devicesFolder[i]);
		var path = '/sys/bus/w1/devices/'+devicesFolder[i];
		//var deviceFolder = fs.readdirSync(path);
		//for (var i=0;i<deviceFolder.length;i++) {
		try {
			console.log(path+ '/w1_slave');
			_file = fs.readFile(path+'/w1_slave',processDeviceData);
		} catch (err) {
		  console.log('Directory or file for DS18B20 not found. ('+path+ '/w1_slave'+')');
		  return;
		}
		//}
	}
}
