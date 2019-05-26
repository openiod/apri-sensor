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
var axios 						  		= require('axios');
var fs 											= require('fs');
var redis										= require("redis");
var io	 										= require('socket.io-client');
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

//prod:
socketUrl 									= 'https://openiod.org'; socketPath	= '/'+apriConfig.systemCode + '/socket.io';
console.log('web-socket url: '+socketUrl+socketPath);

var secureSite 			= true;
var siteProtocol 		= secureSite?'https://':'http://';
var openiodUrl			= siteProtocol + 'aprisensor-in.openiod.org';
var loopTimeCycle		= 500; //ms, 20000=20 sec
var waitTimeBeforeNext = 1000;
var lastSend        = new Date().getTime();
var lastResponse    = lastSend;
var minTimeBetweenLastResponse = 100;
var latencyPreviousSend = 500;

var unit				= {};

var today				= new Date();
var dateString = today.getFullYear() + "-" + (today.getMonth()+1) + "-" +  today.getDate() + "_" + today.getHours(); // + ":" + today.getMinutes();
//var resultsFileName = resultsFolder + sensorFileName + '_' + dateString;


var waitBeforeNext = function() {
  processDataCycle({repeat:false});
}
var repeatProcessDataCycle = function() {
  processDataCycle({repeat:true});
}

var processDataCycle	= function(parm) {
//	console.log('processDataCycle ' + parm);
//  if (parm == undefined || parm.repeat == true) {
//		console.log('Initiate new loopcycle');
//    setTimeout(repeatProcessDataCycle, loopTimeCycle);
//  }
	setTimeout(processDataCycle, loopTimeCycle);

  var now = new Date().getTime();
  if (lastSend > lastResponse) {
    var timeBetween = now-lastSend;
    var waitTime = now-lastSend;
    log('Waiting for service to respond. Waiting: '+waitTime + ' msec');
    //setTimeout(waitBeforeNext, waitTimeBeforeNext);
//    processDataCycle({repeat:false});
    return;  // wait till next cycle process data, previous action to close.
  }

	// give service some time to breath
  if (now-lastResponse < minTimeBetweenLastResponse ) {
//    var timeBetween = now-lastResponse;
//    latencyPreviousSend = lastResponse-lastSend;
//    log('Time since previous send: '+timeBetween+' msec, latency previous send: '+latencyPreviousSend+' msec');
    //setTimeout(waitBeforeNext, waitTimeBeforeNext);
//    processDataCycle({repeat:false});
    return;  // wait till next cycle process data, previous action to close.
  }

	//log('Find new record');
  redisSortAsync('new', 'alpha','limit',0,1,'asc')
  .then(function(res) {
    var _res = res;
    if (_res.length>0) {
      log('New record available: '+_res[0]);
      getRedisData(_res[0]);
    }
  });
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
//  console.log(dateObserved);
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

// send data to service
var sendData = function(redisKey,url) {
  var _redisKey = redisKey;
  if (url=='') {
    return;  // todo: problem with this redis hash so wath to do with it?
  }
  var headers = {};
  lastSend = new Date().getTime();
  axios.get(url,{ headers: headers,timeout: 5000 })
  .then(response => {
		//log('Response recieved');
    if (response.status=='200' && response.data.statusCode != '422') {
      redisSmoveAsync('new','archive',_redisKey)
      .then(function(e){
//				logDir(response.data);
        log('status 200 and service status: ' + response.data.statusCode);
				lastResponse = new Date().getTime();
				latencyPreviousSend = lastResponse-lastSend;
				log('Transaction duration: '+latencyPreviousSend+' msec');
        //setTimeout(waitBeforeNext, waitTimeBeforeNext);
        //processDataCycle({repeat:false}); // continue with next measurement if available
        //console.log('Redis smove(d) from new to old-set success');
      });
    } else {
//      console.log(response.status + ' / ' + response.headers['content-type'] + ' / ' +response.data);
      log(response.status + ' / ' + response.statusText + ' / ' + response.headers['content-type'] + ', service status: ' + response.data.statusCode); 
    }
   })
   .catch(error => {
     lastResponse = new Date().getTime();
     log(error);
   });
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
});

processDataCycle({repeat:true});
