/*
** Module: apri-sensor-radiationd
**
** Main system module for handling sensor measurement data via serial port 
**
*/

"use strict"; // This is for your code to comply with the ECMAScript 5 standard.

// activate init process config-main
var path = require('path');
var startFolder = __dirname;
var startFolderParent = path.resolve(__dirname, '../..');
var configServerModulePath = startFolder + '/../apri-config/apri-config';
console.log("Start of Config Main ", configServerModulePath);
var apriConfig = require(configServerModulePath)

var systemFolder = __dirname;
var systemFolderParent = path.resolve(__dirname, '../..');
var systemFolderRoot = path.resolve(systemFolderParent, '..');
var systemModuleFolderName = path.basename(systemFolder);
var systemModuleName = path.basename(__filename);
var systemBaseCode = path.basename(systemFolderParent);

var initResult = apriConfig.init(systemModuleFolderName + "/" + systemModuleName);

// **********************************************************************************

// add module specific requires
var request = require('request');
var fs = require('fs');
var { SerialPort } = require("serialport");
//const { ReadlineParser } = require('@serialport/parser-readline')
const exec = require('child_process').exec;

var redis = require("redis");

var redisClient = redis.createClient();
const { promisify } = require('util');
//const redisGetAsync 				= promisify(redisClient.get).bind(redisClient);
//const redisSetAsync 				= promisify(redisClient.set).bind(redisClient);
const redisHmsetHashAsync = promisify(redisClient.hmset).bind(redisClient);
const redisSaddAsync = promisify(redisClient.sadd).bind(redisClient);

redisClient.on("error", function (err) {
	console.log("Redis client Error " + err);
});

// **********************************************************************************

var siteProtocol = 'https://';
var openiodUrl = siteProtocol + 'openiod.org/' + apriConfig.systemCode; //SCAPE604';
var loopTimeMax = 60000; //ms, 60000=60 sec

var usbComNames = apriConfig.getSensorUsbComName();
console.log(usbComNames);

var serialPortPath;
var serialBaudRate;

var deviceParam = process.argv[2];
var baudrateParam = process.argv[3];
console.log('Param for serial device is ' + deviceParam + ' ' + baudrateParam);
var sensorKey = '';
if (deviceParam != undefined) {
	serialPortPath = deviceParam;
	sensorKey = serialPortPath.substring(8);  // minus '/dev/tty'
	console.log('SensorKey = ' + sensorKey);
} else {
	serialPortPath = "/dev/ttyUSB0";
}
//var serialPortPath		= "/dev/cu.usbmodem1411";
//var serialPortPath		= "/dev/cu.usbserial-A1056661";
if (baudrateParam != undefined) {
	serialBaudRate = Number(baudrateParam);
} else {
	serialBaudRate = 9600; //19200 //38400; //9600;
}


var usbPorts = [];
//var serialPortPath		= "/dev/cu.usbmodem1411";
//var serialPortPath		= "/dev/cu.usbmodem1421";
//var serialPortPath		= "/dev/cu.wchusbserial1420";
//var serialPortPath		= "/dev/cu.wchusbserial1d1330";
//var serialPortPath		= "/dev/cu.usbserial-A904I3WJ";							
//var serialPortPath              = "/dev/ttyACM1";

var unit = {};

var loopStart;
var loopTime = 0; // ms

var sensorId = 'RadiationD';

var measurementCount;
var radiationValue;

// create headers to only use ones in the result files
var writeHeaders = true;
var headerAvg = 'dateiso;duration;radiation;count\n';

var sensorFileName = 'sensor-radiationd-result';
var sensorFileExtension = '.csv';
var sensorLocalPathRoot = systemFolderParent + '/sensor/';
var fileFolder = 'openiod-v1';
var resultsFolder = sensorLocalPathRoot + fileFolder + "/" + 'results/';

var today = new Date();
var dateString = today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate() + "_" + today.getHours(); // + ":" + today.getMinutes();
var resultsFileName = resultsFolder + sensorFileName + '_' + dateString;

var getCpuInfo = function () {
	//hostname --all-ip-address
	exec("cat /proc/cpuinfo | grep Serial | cut -d ' ' -f 2", (error, stdout, stderr) => {
		if (error) {
			console.error(`exec error: ${error}`);
			return;
		}
		unit.id = stdout.substr(0, stdout.length - 1);
	});
	exec("cat /proc/cpuinfo | grep Hardware | cut -d ' ' -f 2", (error, stdout, stderr) => {
		if (error) {
			console.error(`exec error: ${error}`);
			return;
		}
		unit.hardware = stdout.substr(0, stdout.length - 1);
	});
	exec("cat /proc/cpuinfo | grep Revision | cut -d ' ' -f 2", (error, stdout, stderr) => {
		if (error) {
			console.error(`exec error: ${error}`);
			return;
		}
		unit.revision = stdout.substr(0, stdout.length - 1);
	});
};

getCpuInfo();

/*
SerialPort.list(function(err, ports) {
	console.log(ports);

	console.log('Find usb comport:');
	
	usbPorts	= ports;

	for (var i=0;i<usbPorts.length;i++) {
		console.log('searching for usb comport 1a86 ' + i + ' '+ usbPorts[i].manufacturer + ' ' +  usbPorts[i].comName);
		if (usbPorts[i].manufacturer == '1a86') {
			serialPortPath	= usbPorts[i].comName;
			break;
		}
	}
	if (usbComNames['apri-sensor-radiationd'] != undefined && usbComNames['apri-sensor-radiationd'].comName != undefined) {
		serialPortPath	= usbComNames['apri-sensor-radiationd'].comName;
	} else {
		for (var i=0;i<usbPorts.length;i++) {
			console.log('searching for usb comport 1a86 ' + i + ' '+ usbPorts[i].manufacturer + ' ' +  usbPorts[i].comName);
			if (usbPorts[i].manufacturer == '1a86') { // && usbPorts[i].comName == '/dev/ttyUSB0') {
				serialPortPath	= usbPorts[i].comName;
				break;
			}
		}
	}
	mainProcess();
});
*/


var mainProcess = function () {
	var serialport = new SerialPort({ path: serialPortPath, baudRate: serialBaudRate });
	//const parser = serialport.pipe(new ReadlineParser({ delimiter: '\r\n' }))
	// , parser: SerialPort.parsers.readline('\n')} );
	//	var serialport = new SerialPort(serialPortPath, {baudRate: 115200} );
	serialport.on('open', function () {
		console.log('Serial Port connected');
		//if (writeHeaders == true) writeHeaderIntoFile();
		serialport.on('data', function (data) {
			var dataTmp = '' + data;
			if (!dataTmp.split) return;
			//console.log('measurement: ' + dataTmp);
			var _dataArray = dataTmp.split(';');
			if (_dataArray[0] != sensorId) return false;
			if (_dataArray.length == 2 && isNumeric(_dataArray[1]) && _dataArray[0] == sensorId) {
				//				console.log('measurement: ' + data);
				radiationValue = _dataArray[1];
				processMeasurement();
			} else {
				console.log('log not valid data: ' + dataTmp);
			}
		});

	});
	serialport.on('error', function (err) {
		console.log('Error: ', err.message);
	});

}

function isNumeric(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}



var processMeasurement = function () {

	writeResults();

}


var writeHeaderIntoFile = function () {
	fs.appendFile(resultsFileName + sensorFileExtension, headerAvg, function (err) {
		if (err != null) {
			console.log('Error writing results to file: ' + err);
		}
	});
	writeHeaders = false;
}

var writeResults = function () {


	var record = sensorId + ';' + measurementTime.toISOString() + ';' + radiationValue + '\n';

	console.log(record);

	//fs.appendFile(resultsFileName + sensorFileExtension, record, function (err) {
	//	if (err != null) {
	//		console.log('Error writing results to file: ' + err);
	//	}
	//});	

	var data = {};
	data.foi = 'SCRP' + unit.id;
	data.datumUtc = new Date();
	data.rad = radiationValue;

	sendData(data);

}

// send data to SOS service via OpenIoD REST service
var sendData = function (data) {
	var url = '';
	redisHmsetHashAsync(data.datumUtc.toISOString() + ':radiationd'
		, 'foi', 'SCRP' + unit.id
		, 'rad', data.rad
	)
		.then(function (res) {
			var _res = res;
			redisSaddAsync('new', data.datumUtc.toISOString() + ':radiationd')
				.then(function (res2) {
					var _res2 = res2;					//	redisSaddAsync('pmsa003', timeStamp.toISOString()+':pmsa003')
					console.log('radiationd ', data.datumUtc.toISOString() + ':radiationd' + _res2);
				});
			console.log(data.datumUtc.toString() + ':radiationd' + _res);
		});

	return;

};


mainProcess();