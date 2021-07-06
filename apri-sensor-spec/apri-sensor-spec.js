/*
** Module: apri-sensor-spec
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
// var request 			= require('request');
//var express 			= require('express');
// var fs 					= require('fs');
// var SerialPort 			= require("serialport");

var io	 				= require('socket.io-client');
const exec 				= require('child_process').exec;
const execFile			= require('child_process').execFile;
const raspi									= require('raspi');
const Serial								= require('raspi-serial').Serial;
var redis										= require("redis");

var redisClient 						= redis.createClient();
const {promisify} 					= require('util');
//const redisGetAsync 				= promisify(redisClient.get).bind(redisClient);
//const redisSetAsync 				= promisify(redisClient.set).bind(redisClient);
const redisHmsetHashAsync 	= promisify(redisClient.hmset).bind(redisClient);
const redisSaddAsync 				= promisify(redisClient.sadd).bind(redisClient);

redisClient.on("error", function (err) {
    console.log("Redis client Error " + err);
});

var serial;
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

var usbPorts			= [];

var sensorKey			= '';
var serialPortPath;
serialPortPath		= "/dev/ttyUSB0"; // default port
var deviceParam			= process.argv[2];
console.log('Param for serial device is ' + deviceParam);
if (deviceParam != undefined) {
	serialPortPath		= deviceParam;
}
sensorKey			= serialPortPath.substring(8);  // minus '/dev/tty'
console.log('SensorKey = ' + sensorKey);

//var serialPortPath		= "/dev/cu.usbmodem1411";
//var serialPortPath		= "/dev/cu.usbserial-A1056661";

var sensors				= {};
var unit				= {};


// create headers to only use ones in the result files
var writeHeaders		= true;
var headerRaw			= 'dateiso;part\n';

var sensorFileName 		= 'sensor-spec-result';
var sensorFileExtension	= '.csv';
var sensorLocalPathRoot = systemFolderParent + '/sensor/';
var fileFolder 			= 'openiod-v1';
var resultsFolder 		= sensorLocalPathRoot + fileFolder + "/" + 'results/';

var today				= new Date();
var dateString = today.getFullYear() + "-" + (today.getMonth()+1) + "-" +  today.getDate() + "_" + today.getHours(); // + ":" + today.getMinutes();
var resultsFileName = resultsFolder + sensorFileName + '_' + dateString;

var loopTimeCycle		= 10000; //ms, 20000=20 sec

var counters	= {
	busy: false,  // dont/skip count when processing of results is busy (busy=true)
	spec: 	{
		part: 0
		, nrOfMeas		: 0
	}
};
var results			= {
	spec: 	{
			part	: 0
		, nrOfMeas		: 0
	}
};

var initCounters	= function () {
	counters.spec.part				= 0;
	counters.spec.nrOfMeas				= 0;
}
//-------------- raspi-serial
var byteArray 			= new ArrayBuffer(500);
var view8 					= new Uint8Array(byteArray);
var view16 					= new Uint16Array(byteArray);
var serialString = ''
var pos 						= 0;
var part = 0

var resetRaspiSerialArray = function() {
	pos = 0;
	part = 0;
}

var processRaspiSerialData = function (data) {

  if (data == 0x0D) {
    return
  }
  if (data == 0x0A) {
    processRaspiSerialRecord(serialString);
    serialString = ''
    return
  }
  for (var i=0;i<data.length;i++) {
    serialString += String.fromCharCode(data[i]);
  }

  console.log('Data: '+data)
  console.log(serialString)
  return
}
//  end-of raspi-serial variables and functions
var processRaspiSerialRecord = function(rec) {
	if (counters.busy==true) {
		console.log('Counters busy, measurement ignored *******************************');
		return;
	}

  console.log(rec)
  var eepromRecArray = []
  if (rec.substr(0,2)=='SN') {
    console.log('this is a measurement')
    eepromRecArray = rec.split(',')
    if (eepromRecArray.length >= 4) {
      console.log('this is a measurement: ' + eepromRecArray[0]+'/'+eepromRecArray[1]+'/'+eepromRecArray[2]+'/'+eepromRecArray[3])
    }
    return
  }
  eepromRecArray = rec.split('=')
  if (eepromRecArray.length > 1) {
    console.log('this is an eeprom value: '+eepromRecArray[0]+':'+eepromRecArray[1])
    return
  }
  console.log('record not recognized as eeprom value or measurement')

  return

	counters.spec.nrOfMeas++;
	counters.spec.part				+= part;
	console.log(counters.spec.nrOfMeas+' '+counters.spec.part+' '+counters.spec.part/counters.spec.nrOfMeas)
}

var processDataCycle	= function() {
	setTimeout(processDataCycle, loopTimeCycle);
	counters.busy = true;
	console.log('Counters spec: '+ counters.spec.nrOfMeas );

  results.spec.part							= Math.round((counters.spec.part/counters.spec.nrOfMeas)*100)/100;
	results.spec.nrOfMeas						= counters.spec.nrOfMeas;

	initCounters();
	counters.busy = false;

  return

  sendData();
}

// send data to service
var sendData = function() {
		var timeStamp = new Date();
		var url = '';
		if (results.spec.nrOfMeas > 0) {
			// console.dir(results.spec)
			redisHmsetHashAsync(timeStamp.toISOString()+':spec'
			  , 'foi', 'SCRP' + unit.id
			  , 'part', results.spec.part
			  ).then(function(res) {
					var _res = res;
					redisSaddAsync('new', timeStamp.toISOString()+':spec')
						.then(function(res2) {
							var _res2=res2;
						//	redisSaddAsync('pmsa003', timeStamp.toISOString()+':pmsa003')
							console.log('spec ', timeStamp.toISOString()+':spec'+ _res2);
						});
		    	console.log(timeStamp.toString()+':spec'+_res);
			});
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
	try {
		var dataStr = JSON.stringify(data);
		console.log(dataStr);
	}
	catch(err) {
		console.dir(data);
	}

});

var printHex = function(buffer, tekst) {
	var str="";
  for (var i=0;i<buffer.length;i++) {
	  str = str+ buffer[i].toString(16)+' ';
  }
  console.log('log: ' + tekst +'  lengte:'+buffer.length+ " "+ str); // + data);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

raspi.init(() => {
  console.log('serialPortPath: '+serialPortPath)
  serial = new Serial({portId:serialPortPath, baudRate:9600});
  serial.open(() => {
    serial.on('data', (data) => {
      printHex(data,'T');
			//for (var i=0;i<data.length;i++) {
			processRaspiSerialData(data[i]);
			//}
    });
    // read info from sensor (eeprom)
    serial.write('ee') // first e is trigger, second e call for eeprom info
    sleep(5000)
    // start continues measuring
    serial.write('cc')

		//setInterval(askSerialData,1000,serial)
		//console.log('ask serial data init')
  });
});


setTimeout(processDataCycle, loopTimeCycle);
