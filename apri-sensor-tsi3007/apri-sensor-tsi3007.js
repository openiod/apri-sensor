/*
** Module: apri-sensor-tsi3007
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

var sensorFileName 		= 'sensor-tsi3007-result';
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
	tsi3007: 	{
		part: 0
		, nrOfMeas		: 0
	}
};
var results			= {
	tsi3007: 	{
			part	: 0
		, nrOfMeas		: 0
	}
};

var initCounters	= function () {
	counters.tsi3007.part				= 0;
	counters.tsi3007.nrOfMeas				= 0;
}
//-------------- raspi-serial
var byteArray 			= new ArrayBuffer(10);
var view8 					= new Uint8Array(byteArray);
var view16 					= new Uint16Array(byteArray);
var pos 						= 0;
var part = 0

var resetRaspiSerialArray = function() {
	pos = 0;
	part = 0;
}

var processRaspiSerialData = function (data) {
  var byte = data;
	console.log(pos)
  if (pos==9) {
//		console.log('Raspi-serial processing.');
		if (byte == 0x0A) {
			processRaspiSerialRecord();
		}
    resetRaspiSerialArray();
  }
  if (pos==8) {
    if (byte == 0x0D) {
      view8[pos] = byte;
      pos++;
    } else {
			resetRaspiSerialArray();
    }
  }
	if (pos==7) {
    view8[pos] = byte;
    part = part + (byte - 30)
    pos++;
  }
	if (pos==6) {
    view8[pos] = byte;
    part = part + (byte - 30) * 10
    pos++;
  }
	if (pos==5) {
    view8[pos] = byte;
    part = part + (byte - 30) * 100
    pos++;
  }
	if (pos==4) {
    view8[pos] = byte;
    part = part + (byte - 30) * 1000
    pos++;
  }
	if (pos==3) {
    view8[pos] = byte;
    part = part + (byte - 30) * 10000
    pos++;
  }
  if (pos==2) {
    view8[pos] = byte;
    part = (byte - 30) * 100000;
    pos++;
  }
  if (pos==1) {
    if (byte == 0x44) {
      view8[pos] = byte;
      pos++;
    } else resetRaspiSerialArray();
  }
  if (pos==0 & byte == 0x52) {
    view8[pos] = byte;
    part = 0;
    pos = 1;
  }
	console.log('byte: ' + byte)
}
//  end-of raspi-serial variables and functions
var processRaspiSerialRecord = function() {
	if (counters.busy==true) {
		console.log('Counters busy, measurement ignored *******************************');
		return;
	}
	counters.tsi3007.nrOfMeas++;
	counters.tsi3007.part				+= part;
	console.log(counters.tsi3007.nrOfMeas+' '+counters.tsi3007.part)
}
/*
var mainProcess = function() {
	console.log('Found usb comname: ' + serialPortPath );

	var serialport = new SerialPort(serialPortPath, {parser: SerialPort.parsers.readline('\n')} );
	serialport.on('open', function(){
		console.log('Serial Port connected');
		serialport.on('data', function(data){
			var _data = data.substr(0,data.length-1);
			var _dataArray	= data.split(',');
			if (_dataArray.length == 3 && isNumeric(_dataArray[1]) && _data[_data.length-1] =='\r' ) {
				console.log('measurement: ' + data);
				processTsi3007SerialRecord(_dataArray);
			} else {
				console.log('log: ' + data);
			}
		});
	});
	serialport.on('error', function(err) {
		console.log('Error: ', err.message);
	});
};

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}
*/
var processDataCycle	= function() {
	setTimeout(processDataCycle, loopTimeCycle);
	counters.busy = true;
	console.log('Counters tsi3007: '+ counters.tsi3007.nrOfMeas );

  results.tsi3007.part							= Math.round((counters.tsi3007.part/counters.tsi3007.nrOfMeas)*100)/100;
	results.tsi3007.nrOfMeas						= counters.tsi3007.nrOfMeas;

	initCounters();
	counters.busy = false;

  sendData();
}

// send data to service
var sendData = function() {
		var timeStamp = new Date();
		var url = '';
		if (results.tsi3007.nrOfMeas > 0) {
			console.dir(results.tsi3007)
			return;
			redisHmsetHashAsync(timeStamp.toISOString()+':tsi3007'
			  , 'foi', 'SCRP' + unit.id
			  , 'part', results.tsi3007.part
			  ).then(function(res) {
					var _res = res;
					redisSaddAsync('new', timeStamp.toISOString()+':tsi3007')
						.then(function(res2) {
							var _res2=res2;
						//	redisSaddAsync('pmsa003', timeStamp.toISOString()+':pmsa003')
							console.log('tsi3007 ', timeStamp.toISOString()+':tsi3007'+ _res2);
						});
		    	console.log(timeStamp.toString()+':tsi3007'+_res);
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

/*
SerialPort.list(function(err, ports) {
	console.log(ports);
	console.log('Find usb comport:');

	usbPorts	= ports;

	if (serialPortPath != deviceParam) {
		for (var i=0;i<usbPorts.length;i++) {
			console.log('searching for usb comport FTDI ' + i + ' '+ usbPorts[i].manufacturer + ' ' +  usbPorts[i].comName);
			if (usbPorts[i].manufacturer == 'FTDI' || usbPorts[i].manufacturer == 'Prolific_Technology_Inc.') {
				serialPortPath	= usbPorts[i].comName;
				break;
			}
		}
	}
	mainProcess();
});
*/

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

	//io.sockets.emit('aireassignal', { data: data } );
	//socket.broadcast.emit('aireassignal', { data: data } );
});

var printHex = function(buffer, tekst) {
	var str="";
  for (var i=0;i<buffer.length;i++) {
	  str = str+ buffer[i].toString(16)+' ';
  }
  console.log('log: ' + tekst +'  lengte:'+buffer.length+ " "+ str); // + data);
}

raspi.init(() => {
  var serial = new Serial({portId:serialPortPath, baudRate:9600});
  serial.open(() => {
    serial.on('data', (data) => {
      printHex(data,'T');
			for (var i=0;i<data.length;i++) {
				processRaspiSerialData(data[i]);
			}
    });
		setInterval(askSerialData,1000,serial)
		console.log('ask serial data init')
    //serial.write('Hello from raspi-serial');
  });
});

var askSerialData = function(serial){
	console.log('ask serial data')
	serial.write('RD\r\n')
}
var testIndex = 0
var byte0 = 0x52
var byte1 = 0x44
var byte2 = 0x30
var byte3 = 0x31
var byte4 = 0x32
var byte5 = 0x33
var byte6 = 0x34
var byte7 = 0x35
var byte8 = 0x36
var byte9 = 0x37
var dataTest = ''+byte0+byte1+byte2+byte3+byte4+byte5+byte6+byte7+byte8+byte9

var byteArray 			= new ArrayBuffer(10);
var view8 					= new Uint8Array(byteArray);
view8[0] = 0x52
view8[1] = 0x44
view8[2] = 0x30
view8[3] = 0x31
view8[4] = 0x32
view8[5] = 0x33
view8[6] = 0x34
view8[7] = 0x35
view8[8] = 0x0D
view8[9] = 0x0A


var testSerial = function() {
	console.log(testIndex)

	var data = 'RD012345da'
	if (testIndex == 0 ) data = view8
	if (testIndex == 1 ) data = view8
	if (testIndex == 2 ) data = view8
	if (testIndex == 3 ) data = view8
	if (testIndex == 4 ) data = view8
	if (testIndex == 5 ) data = view8
	if (testIndex == 6 ) data = view8
	if (testIndex == 7 ) data = view8
	if (testIndex == 8 ) data = view8
	if (testIndex == 9 ) data = view8
	if (testIndex == 10 ) data = view8
	printHex(data,'T');
	for (var i=0;i<data.length;i++) {
		processRaspiSerialData(data[i]);
	}
	testIndex++
	if (testIndex>10) testIndex=0
	setTimeout(testSerial,2000)
}
setTimeout(testSerial,2000)

setTimeout(processDataCycle, loopTimeCycle);
