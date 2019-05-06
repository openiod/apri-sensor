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
//var request 								= require('request');
//var express 								= require('express');
var axios 						  		= require('axios');
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
const redisHmsetAsync 	    = promisify(redisClient.hmset).bind(redisClient);
const redisSaddAsync 				= promisify(redisClient.sadd).bind(redisClient);
const redisSortAsync 				= promisify(redisClient.sort).bind(redisClient);
const redisDelAsync         = promisify(redisClient.del).bind(redisClient);
const redisSmoveAsync       = promisify(redisClient.smove).bind(redisClient);
const redisHgetallAsync     = promisify(redisClient.hgetall).bind(redisClient);

var log 										= function(message){
	console.log(new Date().toISOString()+' | '+message);
}
var logDir 									= function(object){
	console.log(object);
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
        getRedisData(_res[0]);
//        sendData(_res[0]);
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

var getRedisData = function(redisKey) {
  var _redisKey = redisKey;
  var keySplit = redisKey.split(':');
  var lastEntry = keySplit.length-1;
  var dateObserved = _redisKey.substring(0,_redisKey.length - keySplit[lastEntry].length-1);
  console.log(dateObserved);
  var url = '';

  redisHgetallAsync(redisKey)
    .then(function(res) {
      var _res = res;
      switch (keySplit[lastEntry]) {
        case 'bme280':
          url = bme280Attributes(res)+'&dateObserved='+dateObserved;
          break;
        case 'pmsa003':
          url = pmsa003Attributes(res)+'&dateObserved='+dateObserved;
          break;
        case 'ds18b20':
          url = ds18b20Attributes(res)+'&dateObserved='+dateObserved;
          break;
        default:
          console.log('ERROR: redis entry unknown: '+ redisKey);
      };
      sendData(_redisKey,url);
    });
}

var bme280Attributes = function(res) {
  return openiodUrl + '/bme280'+ '/v1/m?foi=' + res.foi + '&observation='+
    'temperature:'+res.temperature+','+'pressure:'+res.pressure+','+'rHum:'+res.rHum;
}
var pmsa003Attributes = function(res) {
  return openiodUrl + '/pmsa003'+ '/v1/m?foi=' + res.foi + '&observation=' +
    'pm1:'+res.pm1+',pm25:'+res.pm25+',pm10:'+res.pm10 +
    ',pm1amb:'+res.pm1amb+',pm25amb:'+res.pm25amb+',pm10amb:'+res.pm10amb +
    ',raw0_3:'+res.raw0_3+',raw0_5:'+res.raw0_5+',raw1_0:'+res.raw1_0 +
    ',raw2_5:'+res.raw2_5+',raw5_0:'+res.raw5_0+',raw10_0:'+res.raw10_0;
}
var ds18b20Attributes = function(res) {
  return openiodUrl + '/ds18b20'+ '/v1/m?foi=' + res.foi + '&observation='+
    'temperature:'+res.temperature;
}

/*
// send data to service
var sendData = function(redisKey,url) {
  var _redisKey = redisKey;
  if (url=='') {
    // todo: problem with this redis hash so wath to do with it?
  } else {
    console.log(url);
    request.get(url)
      .on('response', function(response) {
        console.log(response.statusCode + ' / ' + response.headers['content-type']) // 200
        if (response.statusCode=='200') {
          redisSmoveAsync('new','archive',_redisKey)
          .then(function(e){
            console.log('next');
            processDataCycle({repeat:false}); // continue with next measurement if available
            //console.log('Redis smove(d) from new to old-set success')
          });
        } else {
          console.log(response.statusCode + ' / ' + response.headers['content-type'] + ' / ' +response.body);
        }
      })
      .on('error', function(err) {
        console.log(err)
      })
    ;
  }
};
*/

// send data to service
var sendData = function(redisKey,url) {
  var _redisKey = redisKey;
  if (url=='') {
    return;  // todo: problem with this redis hash so wath to do with it?
  }
  var headers = {};
  axios.get(url,{ headers: headers })
  .then(response => {
    logDir(response);
    console.log(response.statusCode + ' / ' + response.headers['content-type']) // 200
    if (response.statusCode=='200') {
      redisSmoveAsync('new','archive',_redisKey)
      .then(function(e){
        console.log('next');
        processDataCycle({repeat:false}); // continue with next measurement if available
        //console.log('Redis smove(d) from new to old-set success')
      });
    } else {
      console.log(response.statusCode + ' / ' + response.headers['content-type'] + ' / ' +response.data);
    }
   })
   .catch(error => {
     log(error);
   });
  //	return axios.get(url,{ headers: headers });


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
