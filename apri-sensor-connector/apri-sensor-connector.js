/*
** Module: apri-sensor-connector
**
** Main system module for handling sensor measurement data for DS18B20,
**  PMSA003/PMS7003, BME280, BME680, tsi3007, tgs5042, sps30, solar, bam1020, radiationd
**  in Redis to send to cloud service OpenIoD
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
var axios = require('axios');
var fs = require('fs');
var redis = require("redis");
var io = require('socket.io-client');
var redisClient = redis.createClient();
const { promisify, isNullOrUndefined } = require('util');
//const redisGetAsync 				= promisify(redisClient.get).bind(redisClient);
//const redisSetAsync 				= promisify(redisClient.set).bind(redisClient);
const redisHmsetAsync = promisify(redisClient.hmset).bind(redisClient);
const redisSaddAsync = promisify(redisClient.sadd).bind(redisClient);
const redisSortAsync = promisify(redisClient.sort).bind(redisClient);
const redisDelAsync = promisify(redisClient.del).bind(redisClient);
const redisSmoveAsync = promisify(redisClient.smove).bind(redisClient);
const redisHgetallAsync = promisify(redisClient.hgetall).bind(redisClient);
const redisSRem = promisify(redisClient.srem).bind(redisClient);
var self = this

var log = function (message) {
	console.log(new Date().toISOString() + ' | ' + message);
}
var logDir = function (object) {
	console.log(object);
}

redisClient.on("error", function (err) {
	console.log("Redis client Error " + err);
});

// **********************************************************************************
/* web-socket */
var socketUrl, socketPath;

//prod:
socketUrl = 'https://openiod.org'; socketPath = '/' + apriConfig.systemCode + '/socket.io';
console.log('web-socket url: ' + socketUrl + socketPath);

var secureSite = true;
var siteProtocol = secureSite ? 'https://' : 'http://';
var openiodUrl = siteProtocol + 'aprisensor-in.openiod.org';
var loopTimeCycle = 5000; //ms, 20000=20 sec
//var waitTimeBeforeNext = 1000;
var lastSend = new Date().getTime();
var lastResponse = lastSend;
var minTimeBetweenLastResponse = 50;
var latencyPreviousSend = 500;

var unit = {};

var today = new Date();
var dateString = today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate() + "_" + today.getHours(); // + ":" + today.getMinutes();
//var resultsFileName = resultsFolder + sensorFileName + '_' + dateString;

var processDataCycle = function (parm) {
	//	console.log('processDataCycle ' + parm);

	var now = new Date().getTime();
	if (lastSend > lastResponse) {
		var timeBetween = now - lastSend;
		var waitTime = now - lastSend;
		log('Waiting for service to respond. Waiting: ' + waitTime + ' msec');
		//setTimeout(waitBeforeNext, waitTimeBeforeNext);
		//    processDataCycle({repeat:false});
		setTimeout(processDataCycle, loopTimeCycle);
		return;  // wait till next cycle process data, previous action to close.
	}

	// give service some time to breath
	if (now - lastResponse < minTimeBetweenLastResponse) {
		//    var timeBetween = now-lastResponse;
		//    latencyPreviousSend = lastResponse-lastSend;
		//    log('Time since previous send: '+timeBetween+' msec, latency previous send: '+latencyPreviousSend+' msec');
		//setTimeout(waitBeforeNext, waitTimeBeforeNext);
		//    processDataCycle({repeat:false});
		setTimeout(processDataCycle, loopTimeCycle);
		return;  // wait till next cycle process data, previous action to close.
	}

	//log('Find new record');
	//redisSortAsync('new', 'alpha', 'limit', 0, 60, 'asc')
	redisSortAsync('new', 'alpha', 'limit', 0, 250, 'asc')
		.then(function (res) {
			var _res = res;
			if (_res.length > 0) {
				log('New record available: ' + _res[0]);
				processRedisData(_res)
			} else setTimeout(processDataCycle, loopTimeCycle);
		})
	//	.catch(function(error) {
	//		setTimeout(processDataCycle, loopTimeCycle);
	//		log('Axios catch');
	//  });

	//	setTimeout(processDataCycle, loopTimeCycle);

}

var printHex = function (buffer, tekst) {
	var str = "";
	for (var i = 0; i < buffer.length; i++) {
		str = str + buffer[i].toString(16) + ' ';
	}
	console.log('log: ' + tekst + '  lengte:' + buffer.length + " " + str); // + data);
}

function isNumeric(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}

var processRedisData = function (redisArray) {

	var redisArrayIndex = 0
	var _redisArray = redisArray
	// getRedisData(_res[0]);
	//	for (var j=0;j<_res.length;j++) {
	// getRedisData(_res[j]);
	getRedisData(_redisArray, redisArrayIndex)
	//	}
	//setTimeout(processDataCycle, loopTimeCycle);

}

var getRedisData = function (redisArray, redisArrayIndex) {
	var _redisArrayIndex = redisArrayIndex
	var _redisArray = redisArray

	var _redisKey = _redisArray[_redisArrayIndex];
	console.log('Proces RedisData ' + _redisKey + ' Index: ' + _redisArrayIndex)
	var keySplit = _redisKey.split(':');
	var lastEntry = keySplit.length - 1;
	var dateObserved = _redisKey.substring(0, _redisKey.length - keySplit[lastEntry].length - 1);
	//  console.log(dateObserved);
	var url = '';

	redisHgetallAsync(_redisKey)
		.then(async function (res) {
			if (!res) { 
				await redisDelAsync(_redisKey)
					.then(function (res) {
						log('key deleted ' + _redisKey + ' ' + res);
						redisSRem('new', _redisKey)
							.then(function (res) {
								log('key deleted from new' + _redisKey + ' ' + res);
							})
							.catch((error) => {
								log(error);
							});
					})
					.catch((error) => {
						log(error);
					});
				if (_redisArrayIndex < _redisArray.length - 1) {
					_redisArrayIndex++
					getRedisData(_redisArray, _redisArrayIndex)
				} else {
					setTimeout(processDataCycle, 1000);
				}
				return
			}
			var _res = res;
			switch (keySplit[lastEntry]) {
				case 'bme280':
					url = bme280Attributes(res) + '&dateObserved=' + dateObserved;
					break;
				case 'bme680':
					url = bme680Attributes(res) + '&dateObserved=' + dateObserved;
					break;
				case 'pmsa003':
					url = pmsa003Attributes(res) + '&dateObserved=' + dateObserved;
					break;
				case 'ds18b20':
					url = ds18b20Attributes(res) + '&dateObserved=' + dateObserved;
					break;
				case 'tsi3007':
					url = tsi3007Attributes(res) + '&dateObserved=' + dateObserved;
					break;
				case 'tgs5042':
					url = tgs5042Attributes(res) + '&dateObserved=' + dateObserved;
					break;
				case 'sps30':
					url = sps30Attributes(res) + '&dateObserved=' + dateObserved;
					break;
				case 'ips7100':
					url = ips7100Attributes(res) + '&dateObserved=' + dateObserved;
					break;
				case 'scd30':
					url = scd30Attributes(res) + '&dateObserved=' + dateObserved;
					break;
				case 'solar':
					url = solarAttributes(res) + '&dateObserved=' + dateObserved;
					break;
				case 'bam1020':
					url = bam1020Attributes(res) + '&dateObserved=' + dateObserved;
					break;
				case 'radiationd':
					url = radiationdAttributes(res) + '&dateObserved=' + dateObserved;
					break;
				default:
					console.log('ERROR: redis entry unknown: ' + redisKey);
			};
			sendData(_redisArray, _redisArrayIndex, _redisKey, url);
		});
}

var bme280Attributes = function (res) {
	return openiodUrl + '/bme280' + '/v1/m?foi=' + res.foi + '&observation=' +
		'temperature:' + res.temperature + ',' + 'pressure:' + res.pressure + ',' + 'rHum:' + res.rHum;
}
var bme680Attributes = function (res) {
	return openiodUrl + '/bme680' + '/v1/m?foi=' + res.foi + '&observation=' +
		'temperature:' + res.temperature + ',' + 'pressure:' + res.pressure + ',' + 'rHum:' + res.rHum + ',' + 'gasResistance:' + res.gasResistance;
}
var pmsa003Attributes = function (res) {
	return openiodUrl + '/pmsa003' + '/v1/m?foi=' + res.foi + '&observation=' +
		'pm1:' + res.pm1 + ',pm25:' + res.pm25 + ',pm10:' + res.pm10 +
		',pm1amb:' + res.pm1amb + ',pm25amb:' + res.pm25amb + ',pm10amb:' + res.pm10amb +
		',raw0_3:' + res.raw0_3 + ',raw0_5:' + res.raw0_5 + ',raw1_0:' + res.raw1_0 +
		',raw2_5:' + res.raw2_5 + ',raw5_0:' + res.raw5_0 + ',raw10_0:' + res.raw10_0;
}
var ds18b20Attributes = function (res) {
	return openiodUrl + '/ds18b20' + '/v1/m?foi=' + res.foi + '&observation=' +
		'temperature:' + res.temperature;
}
var tsi3007Attributes = function (res) {
	return openiodUrl + '/tsi3007' + '/v1/m?foi=' + res.foi + '&observation=' +
		'part:' + res.part;
}
var tgs5042Attributes = function (res) {
	return openiodUrl + '/tgs5042' + '/v1/m?foi=' + res.foi + '&observation=' +
		'co:' + res.co;
}
var sps30Attributes = function (res) {
	var gps = ''
	if (res.gpsMode == 2) {
		gps = ',gpsMode:' + res.gpsMode +
			',gpsLat:' + res.gpsLat +
			',gpsLon:' + res.gpsLon
	}
	if (res.gpsMode == 3) {
		gps = ',gpsMode:' + res.gpsMode +
			',gpsTime:' + res.gpsTime +
			',gpsEpt:' + res.gpsEpt +
			',gpsLat:' + res.gpsLat +
			',gpsLon:' + res.gpsLon +
			',gpsAlt:' + res.gpsAlt +
			',gpsEpx:' + res.gpsEpx +
			',gpsEpy:' + res.gpsEpy +
			',gpsEpv:' + res.gpsEpv +
			',gpsTrack:' + res.gpsTrack +
			',gpsSpeed:' + res.gpsSpeed +
			',gpsClimb:' + res.gpsClimb +
			',gpsEps:' + res.gpsEps +
			',gpsEpc:' + res.gpsEpc
	}

	return openiodUrl + '/sps30' + '/v1/m?foi=' + res.foi + '&observation=' +
		'pm1:' + res.pm1 + ',pm25:' + res.pm25 + ',pm4:' + res.pm4 + ',pm10:' + res.pm10 +
		',raw0_5:' + res.raw0_5 + ',raw1_0:' + res.raw1_0 +
		',raw2_5:' + res.raw2_5 + ',raw4_0:' + res.raw4_0 + ',raw10_0:' + res.raw10_0 +
		',tps:' + res.tps +
		gps
}
var ips7100Attributes = function (res) {
	return openiodUrl + '/ips7100' + '/v1/m?foi=' + res.foi + '&observation=' +
		'pm01:' + res.pm01 + ',pm03:' + res.pm03 + ',pm05:' + res.pm05 + ',pm1:' + res.pm1 + ',pm25:' + res.pm25 + ',pm5:' + res.pm5 + ',pm10:' + res.pm10 +
		',raw0_1:' + res.raw0_1 + ',raw0_3:' + res.raw0_3 + ',raw0_5:' + res.raw0_5 + ',raw1_0:' + res.raw1_0 +
		',raw2_5:' + res.raw2_5 + ',raw5_0:' + res.raw5_0 + ',raw10_0:' + res.raw10_0 +
		',serialNr:' + res.serialNr
}
var scd30Attributes = function (res) {
	return openiodUrl + '/scd30' + '/v1/m?foi=' + res.foi + '&observation=' +
		'temperature:' + res.temperature + ',' + 'co2:' + res.co2 + ',' + 'rHum:' + res.rHum;
}
var solarAttributes = function (res) {
	return openiodUrl + '/solar' + '/v1/m?foi=' + res.foi + '&observation=' +
		'irradiance:' + res.irradiance + ',' + 'raw:' + res.raw + ',' + 'amplified:' + res.amplified +
		',' + 'sensor:' + res.sensor + ',' + 'offset:' + res.offset + ',' + 'Vfactor:' + res.Vfactor +
		',' + 's:' + res.s;
}
var bam1020Attributes = function (res) {
	return openiodUrl + '/bam1020' + '/v1/m?foi=' + res.foi + '&observation=' +
		'temperature:' + res.temperature + ',' + 'pm25:' + res.pm25 + ',' + 'rHum:' + res.rHum;
}
var radiationdAttributes = function (res) {
	return openiodUrl + '/radiationd' + '/v1/m?foi=' + res.foi + '&observation=' +
		'rad:' + res.rad;
}

// send data to service
var sendData = function (redisArray, redisArrayIndex, redisKey, url) {
	var _redisArrayIndex = redisArrayIndex
	var _redisArray = redisArray

	var _redisKey = redisKey;
	if (url == '') {
		return;  // todo: problem with this redis hash so wath to do with it?
	}
	var headers = {};
	lastSend = new Date().getTime();
	console.log(url);
	axios.get(url, {
		headers: headers
		, timeout: 15000
	})
		.then(response => {
			//log('Response recieved');
			var removeRecord = false;
			//		if (response.status==200) removeRecord=true;
			if (response.data.statusCode == '201') removeRecord = true;
			if (response.data.statusCode == '422') {
				console.log('Statuscode 422 and ' + response.data.statusDesc);
				console.dir(response.data)
			}
			if (response.data.statusCode == '422' && response.data.statusDesc == 'Already Exists') {
				// if (response.data.statusDesc=='Already Exists') {
				//			if (response.data.description=='Already Exists') {
				console.log('Already Exists');
				removeRecord = true;
			}
			if (response.data.status == 201) removeRecord = true;
			if (response.data.status == '422') {
				console.log('Status 422 and ' + response.data.statusData.description);
			}
			if (response.data.status == 422 && response.data.statusData.description == 'Already Exists') {
				// if (response.data.statusDesc=='Already Exists') {
				// if (response.data.description=='Already Exists') {
				console.log('Already Exists 2');
				removeRecord = true;
			}
			//		 else {
			//				console.log(response.data.statusDesc)
			//				console.log(response.data.statusData)
			//				removeRecord=false;
			//			}
			//		}
			console.log(response.data)

			if (removeRecord == true) {
				redisSmoveAsync('new', 'archive', _redisKey)
					.then(function (e) {
						//				logDir(response.data);
						log('status ' + response.status + ' and service status: ' + response.data.status);
						lastResponse = new Date().getTime();
						latencyPreviousSend = lastResponse - lastSend;
						log('Transaction duration: ' + latencyPreviousSend + ' msec');
						//setTimeout(waitBeforeNext, waitTimeBeforeNext);
						//processDataCycle({repeat:false}); // continue with next measurement if available
						//console.log('Redis smove(d) from new to old-set success');
					});
			} else {
				//      console.log(response.status + ' / ' + response.headers['content-type'] + ' / ' +response.data);
				lastResponse = new Date().getTime();
				latencyPreviousSend = lastResponse - lastSend;
				log('Transaction duration: ' + latencyPreviousSend + ' msec');
				log(response.status + ' / ' + response.statusText + ' / ' + response.headers['content-type'] + ', service status: ' + response.data.status);
			}
			if (_redisArrayIndex < _redisArray.length - 1) {
				_redisArrayIndex++
				getRedisData(_redisArray, _redisArrayIndex)
			} else {
				setTimeout(processDataCycle, 1000);
			}
			//		setTimeout(processDataCycle, loopTimeCycle);
		})
		.catch(error => {
			lastResponse = new Date().getTime();
			//logDir(error);
			// Error
			if (error.response) {
				// The request was made and the server responded with a status code
				// that falls out of the range of 2xx
				log('error.response');
				//logDir(error.response.data);
				logDir(error.response.status);
				//logDir(error.response.headers);
			} else if (error.request) {
				var _err = '' + error
				log('error.request ' + _err.substr(0, 33)); // time exceeded?
				// The request was made but no response was received
				// `error.request` is an instance of XMLHttpRequest in the browser and an instance of
				// http.ClientRequest in node.js
				//logDir(error.request);
			} else {
				// Something happened in setting up the request that triggered an Error
				log('Error', error.message);
			}
			//log(error.config);
			log('Error config code: ' + error.code);
			setTimeout(processDataCycle, loopTimeCycle);
			//		 logDir(error)
		});
};

var socket = io(socketUrl, { path: socketPath });

socket.on('connection', function (socket) {
	//var currTime = new Date();
	//console.log(currTime + ': connect from ' + socket.request.connection.remoteAddress + ' / ' + socket.handshake.headers['x-forwarded-for'] || socket.handshake.address.address);
});

socket.on('disconnect', function () {
	//console.log('Disconnected from web-socket ');
});

socket.on('info', function (data) {
	//console.log('websocket info: ');
	//console.dir(data);
});

processDataCycle({ repeat: true });
