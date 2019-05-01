/*
** Module: apri-sensor-connector
**
** Main system module for handling sensor measurement data for DS18B20, PMSA003/PMS7003, BME280 in Redis to send to cloud service OpenIoD
**
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
var request 								= require('request');
//var express 								= require('express');
var fs 											= require('fs');
var redis										= require("redis");
//const ByteLength 						= require('@serialport/parser-byte-length')
var io	 										= require('socket.io-client');
//const exec 									= require('child_process').exec;
//const execFile							= require('child_process').execFile;

var redisClient 						= redis.createClient();
const {promisify} 					= require('util');
//const redisGetAsync 				= promisify(redisClient.get).bind(redisClient);
//const redisSetAsync 				= promisify(redisClient.set).bind(redisClient);
const redisHmsetHashAsync 	= promisify(redisClient.hmset).bind(redisClient);
const redisSaddAsync 				= promisify(redisClient.sadd).bind(redisClient);
const redisSortAsync 				= promisify(redisClient.sort).bind(redisClient);
const redisDelAsync         = promisify(redisClient.del).bind(redisClient);
const redisSmoveAsync       = promisify(redisClient.smove).bind(redisClient);

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
var loopTimeCycle		= 5000; //ms, 20000=20 sec

var usbPorts			= [];

var serialPortPath;

var devicesFolder = undefined;  // DS18B20 devices

var unit				= {};

var loopStart;
var loopTime			= 0; // ms

var sensors				= {};

//var nrOfChannels		= 15;
//var channelMaxValue;

//var channelTreshold		= [];
//for (var i=0;i<nrOfChannels;i++) {
//	channelTreshold.push(i*5000)
//}
//channelMaxValue			= channelTreshold[nrOfChannels-1];

// create headers to only use ones in the result files
//var writeHeaders		= true;
//var headerRaw			= 'dateiso;pm25;pm10\n';

//var sensorFileName 		= 'sensor-raspi-result';
//var sensorFileExtension	= '.csv';
//var sensorLocalPathRoot = systemFolderParent + '/sensor/';
//var fileFolder 			= 'openiod-v1';
//var resultsFolder 		= sensorLocalPathRoot + fileFolder + "/" + 'results/';

var today				= new Date();
var dateString = today.getFullYear() + "-" + (today.getMonth()+1) + "-" +  today.getDate() + "_" + today.getHours(); // + ":" + today.getMinutes();
//var resultsFileName = resultsFolder + sensorFileName + '_' + dateString;

var processDataCycle	= function(parm) {
  if (parm == undefined || parm.repeat == true) {
    setTimeout(processDataCycle, loopTimeCycle);
  }
  redisSortAsync('new', 'alpha','limit',0,1,'asc')
    .then(function(res) {
      var _res = res;
      var  result = res;
    //	redisSaddAsync('ds18b20', timeStamp.toISOString()+':ds18b20')
      if (_res.length>0) {
        console.log(_res);
        console.log(_res[0]);
        redisSmoveAsync('new','old',_res[0]).then(function(e){
          processDataCycle({repeat:false}); // continue with next measurement if available
          //console.log('Redis smove(d) from new to old-set success')
        });        
      }
    });
/*
	counters.busy = true;
	console.log('Counters pms: '+ counters.pms.nrOfMeas + '; bme280: '+ counters.bme280.nrOfMeas + '; ds18b20: '+ counters.ds18b20.nrOfMeas );

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

	results.ds18b20.temperature			= Math.round((counters.ds18b20.temperature/counters.ds18b20.nrOfMeas)*100)/100;
	results.ds18b20.nrOfMeas				= counters.ds18b20.nrOfMeas;

	initCounters();
	counters.busy = false;
*/
//  sendData();

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

var sendRequest = function(url) {
	var _url			= url;
	request.get(_url)
		.on('response', function(response) {
			console.log(response.statusCode + ' / ' + response.headers['content-type']) // 200
			})
		.on('error', function(err) {
			console.log(err)
		})
	;

}
// send data to service
var sendData = function() {
/*
		var timeStamp = new Date();
		var url = '';
		if (results.pms.nrOfMeas > 0) {
			url = openiodUrl + '/pmsa003'+ '/v1/m?foi=' + 'SCRP' + unit.id + '&observation='+
						'pm1:'+results.pms.pm1CF1+',pm25:'+results.pms.pm25CF1+',pm10:'+results.pms.pm10CF1 +
			 			',pm1amb:'+results.pms.pm1amb+',pm25amb:'+results.pms.pm25amb+',pm10amb:'+results.pms.pm10amb +
						',raw0_3:'+results.pms.part0_3+',raw0_5:'+results.pms.part0_5+',raw1_0:'+results.pms.part1_0 +
						',raw2_5:'+results.pms.part2_5+',raw5_0:'+results.pms.part5_0+',raw10_0:'+results.pms.part10_0;
			console.log(url);
			sendRequest(url);
			redisHmsetHashAsync(timeStamp.toISOString()+':pmsa003'
			  , 'foi', 'SCRP' + unit.id
			  , 'pm1', results.pms.pm1CF1
				, 'pm25', results.pms.pm25CF1
				, 'pm10', results.pms.pm10CF1
				, 'pm1', results.pms.pm1amb
				, 'pm25', results.pms.pm25amb
				, 'raw0_3', results.pms.part0_3
				, 'raw0_5', results.pms.part0_5
				, 'raw1_0', results.pms.part1_0
				, 'raw2_5', results.pms.part2_5
				, 'raw5_0', results.pms.part5_0
				, 'raw10_0', results.pms.part10_0
			  ).then(function(res) {
					var _res = res;
					redisSaddAsync('pmsa003', timeStamp.toISOString()+':pmsa003')
						.then(function(res2) {
							var _res2=res2;
							redisSaddAsync('pmsa003', timeStamp.toISOString()+':pmsa003')
							console.log('pmsa003 ', timeStamp.toISOString()+':pmsa003'+ _res2);
						});
		    	console.log(timeStamp.toString()+':pmsa003'+_res);
			});
		}
		if (results.bme280.nrOfMeas > 0) {
			url = openiodUrl + '/bme280'+ '/v1/m?foi=' + 'SCRP' + unit.id + '&observation='+
						'temperature:'+results.bme280.temperature+',pressure:'+results.bme280.pressure+',rHum:'+results.bme280.rHum ;
			console.log(url);
			sendRequest(url);
			redisHmsetHashAsync(timeStamp.toISOString()+':bme280'
			  , 'foi', 'SCRP' + unit.id
			  , 'temperature', results.bme280.temperature
				, 'pressure', results.bme280.pressure
				, 'rHum', results.bme280.rHum
			  ).then(function(res) {
					var _res = res;
					redisSaddAsync('bme280', timeStamp.toISOString()+':bme280')
						.then(function(res2) {
							var _res2 = res2;
							redisSaddAsync('bme280', timeStamp.toISOString()+':bme280')
							console.log('bme280 ', timeStamp.toISOString()+':bme280'+ _res2);
						});
		    	console.log(timeStamp.toISOString()+':bme280'+_res);
			});
		}
		if (results.ds18b20.nrOfMeas > 0) {
			redisHmsetHashAsync(timeStamp.toISOString()+':ds18b20'
			  , 'foi', 'SCRP' + unit.id
			  , 'temperature', results.ds18b20.temperature
			  ).then(function(res) {
					var _res = res;
					redisSaddAsync('ds18b20', timeStamp.toISOString()+':ds18b20')
						.then(function(res2) {
							var _res2 = res2;
							redisSaddAsync('ds18b20', timeStamp.toISOString()+':ds18b20')
			    		console.log('ds18b20 ', timeStamp.toISOString()+':ds18b20'+ _res2);
						});
				console.log(timeStamp.toISOString()+':ds18b20'+_res);
			});
		}
*/
};

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

processDataCycle({repeat:true});
