/*
** Module: apri-sensor-combi2
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
var apriConfig = require(configServerModulePath);

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
var SerialPort 			= require("serialport");
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

var usbComNames			= apriConfig.getSensorUsbComName();
console.log(usbComNames);
var usbPorts			= [];
//var serialPortPath		= "/dev/cu.usbmodem1411";
//var serialPortPath		= "/dev/cu.usbmodem1421";
var serialPortPath		= "/dev/cu.wchusbserial1430";


var unit				= {};

//var serialPortPath              = "/dev/ttyACM1";
var loopStart;
var loopTime			= 0; // ms
var loopTimeMax			= 60000; //ms, 60000=60 sec


var sensorDefs			= [];

var sensorFileExtension	= '.csv';
var sensorLocalPathRoot = systemFolderParent + '/sensor/';
var fileFolder 			= 'openiod-v1';
var resultsFolder 		= sensorLocalPathRoot + fileFolder + "/" + 'results/';

var today				= new Date();

var fileDateString = today.getFullYear() + "-" + (today.getMonth()+1) + "-" +  today.getDate() + "_" + today.getHours(); // + ":" + today.getMinutes();



var mainProcess = function() {
	
	console.dir(sensorDefs);
	
	for (var i=0;i<sensorDefs.length;i++) {
		var _sensor	= sensorDefs[i]; 
		_sensor.file	= resultsFolder + _sensor.fileName + '_' + fileDateString + '_result' + sensorFileExtension;
		fs.appendFile(_sensor.file, _sensor.csvHeader, function (err) {
			if (err != null) {
				console.log('Error writing header to results file: ' + err);
			}
		});
	}
	

	var processSensorResults	= function() {
		var observations = '';
		console.log('Process sensor results');
		for (var i=0;i<sensorDefs.length;i++) {
						
			if (sensorDefs[i].units == undefined) {
				var _sensor	= sensorDefs[i];
			
				if (_sensor.total.measurementCount > 0) {
					_sensor.processResult(); 
				
					_sensor.file	= resultsFolder + _sensor.fileName + '_' + fileDateString + '_result' + sensorFileExtension;
					fs.appendFile(_sensor.file, _sensor.record, function (err) {
						if (err != null) {
							console.log('Error writing header to results file: ' + err);
						}
					});
					var data			= {};
					data.neighborhoodCode	= 'BU04390603'; //geoLocation.neighborhoodCode;  
					data.sensorSystem		= _sensor.sensorSystem;
					data.foi				= 'SCRP' + unit.id;	
					data.neighborhoodName	= '..'; //geoLocation.neighborhoodName;	
					data.cityCode			= 'GM0439'; //geoLocation.cityCode;	
					data.cityName			= '..'; //geoLocation.cityName;
					data.categories			= [];
					data.observation		= _sensor.result.observations;
				
				
					var _url = openiodUrl + '/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertom&offering=offering_0439_initial&commit=true';
					_url = _url + '&sensorsystem=' + data.sensorSystem + '&region=0439' + '&foi=' + data.foi + '&neighborhoodcode=' + data.neighborhoodCode + '&citycode=' + data.cityCode + '&observation=' + data.observation ;
		
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
				}

			} else {
				console.log("process units");
				for (var key in sensorDefs[i].units) {
					var _sensor	= sensorDefs[i].units[key];
				    console.log("process unit " + key);
				
					if (_sensor.total.measurementCount > 0) {
						sensorDefs[i].processResult(key); 
				
						sensorDefs[i].file	= resultsFolder + sensorDefs[i].fileName + '_' + fileDateString + '_result' + sensorFileExtension;
						fs.appendFile(sensorDefs[i].file, sensorDefs[i].record, function (err) {
							if (err != null) {
								console.log('Error writing header to results file: ' + err);
							}
						});
						var data			= {};
						data.neighborhoodCode	= 'BU04390603'; //geoLocation.neighborhoodCode;  
						data.sensorSystem		= sensorDefs[i].sensorSystem;
						data.foi				= 'SCRP' + unit.id + '*'+ key;	
						data.neighborhoodName	= '..'; //geoLocation.neighborhoodName;	
						data.cityCode			= 'GM0439'; //geoLocation.cityCode;	
						data.cityName			= '..'; //geoLocation.cityName;
						data.categories			= [];
						data.observation		= sensorDefs[i].result.observations;
				
				
						var _url = openiodUrl + '/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertom&offering=offering_0439_initial&commit=true';
						_url = _url + '&sensorsystem=' + data.sensorSystem + '&region=0439' + '&foi=' + data.foi + '&neighborhoodcode=' + data.neighborhoodCode + '&citycode=' + data.cityCode + '&observation=' + data.observation ;
		
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
					}
				}


			}
		}


	}

	var serialport = new SerialPort(serialPortPath, {parser: SerialPort.parsers.readline('\n')} );
	serialport.on('open', function(){
		console.log('Serial Port connected');

		serialport.on('data', function(data){
			var validData	= false;
			var _sensorId	= '';
			var _dataArray	= data.split(';');
			var _dataPrefix = _dataArray[0].split('@');
			
			if (_dataPrefix[0] == 'M') { // Measurements
				for (var i=0;i<sensorDefs.length;i++) {
					var _sensor		= sensorDefs[i];
					if (_sensor.isSensorType(_dataArray)==true) {	
						_sensor.processData(_dataArray);
						_sensorId	= _sensor.id;
						validData	= true;
						break;
					}
				}		
			}
				
			if (validData == true) {
				//console.log('valid data retrieved from sensor ' + _sensorId);
				return;
			}
			
/*
			if (_dataArray.length == 3 && _dataArray[0] == 'AM2320' && isNumeric(_dataArray[1]) && isNumeric(_dataArray[2]) ) {
				processMeasurement(_dataArray);
				return;
			}

			if (_dataArray.length == 4 && _dataArray[0] == 'BMP280' && isNumeric(_dataArray[1]) && isNumeric(_dataArray[2]) && isNumeric(_dataArray[3]) ) {
				processMeasurement(_dataArray);
				return;
			}
			if (_dataArray.length == 15 && _dataArray[0] == 'PMS7003' && isNumeric(_dataArray[1]) && isNumeric(_dataArray[2])
					&& isNumeric(_dataArray[3]) && isNumeric(_dataArray[4])
					&& isNumeric(_dataArray[5]) && isNumeric(_dataArray[6])
					&& isNumeric(_dataArray[7]) && isNumeric(_dataArray[8])
					&& isNumeric(_dataArray[9]) && isNumeric(_dataArray[10])
					&& isNumeric(_dataArray[11]) && isNumeric(_dataArray[12])
					&& isNumeric(_dataArray[13]) && isNumeric(_dataArray[14])
				 ) {
				processMeasurement(_dataArray);
				return;
			}
*/
			console.log('log not valid sensor measurement data: ' + data);
		});

		//setInterval(callback, delay[, ...args])
		setInterval(processSensorResults, 60000);

	});
	serialport.on('error', function(err) {
  		console.log('Error: ', err.message);
	});
}
/*
function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}
*/

/*
var processMeasurement = function(data) {
	//console.log(data);
	var _sensorId	= data[0];
	var _sensor	= combi_1_sensors[_sensorId];
	
	console.dir(_sensor);
	
	
	if (loopStart == undefined) { 
		loopStart 			= new Date(); 
		_sensor.init();
	};

	var measureMentTime		= new Date();
	var loopTime 			= measureMentTime.getTime() - loopStart.getTime();
	
	if (loopTime >= loopTimeMax) { //loopTime) {
			
		_sensor.computeAverage();
		
		writeResults(_sensorId, measureMentTime, loopTime);
		loopStart 			= new Date();
	}
	
	_sensor.addMeasurement(data);

}
*/


var writeResults	= function(sensorId, measureTime, loopTime) {
	console.log('Results ' + sensorId + ': ' + measureTime.toISOString() );
	
	var recordAvg	= measureTime.toISOString() + ';' + loopTime ;
		
	recordAvg		= recordAvg + ';' +  
		rHumAvg	+ ';' +
		temperatureAvg;
	recordAvg		= recordAvg + ';' + measurementCount; 
	recordAvg		= recordAvg + '\n';
	//console.log(record);
	fs.appendFile(resultsFileName + '_avg' + sensorFileExtension, recordAvg, function (err) {
		if (err != null) {
			console.log('Error writing results to file: ' + err);
		}
	});

	var data			= {};
	data.neighborhoodCode	= 'BU04390603'; //geoLocation.neighborhoodCode;  
	data.foi				= 'SCRP' + unit.id;	
	data.neighborhoodName	= '..'; //geoLocation.neighborhoodName;	
	data.cityCode			= 'GM0439'; //geoLocation.cityCode;	
	data.cityName			= '..'; //geoLocation.cityName;
		
	//observation=stress:01
		
	data.categories			= [];
	data.observation		= 
		'apri-sensor-am2320-rHum:'+ rHumAvg + ',' +
		'apri-sensor-am2320-temperature:'+temperatureAvg;

//console.log(data);
//	sendData(data);
 
}

// send data to SOS service via OpenIoD REST service
var sendData = function(data) {
// oud //		http://openiod.com/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&inputformat=insertom&objectid=humansensor&format=xml
// oud //			&region=EHV		&lat=50.1		&lng=4.0		&category=airquality		&value=1

//http://localhost:4000/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertom&sensorsystem=scapeler_shinyei&offering=offering_0439_initial&verbose=true&commit=true&observation=scapeler_shinyei:12.345&neighborhoodcode=BU04390402
//https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertom&sensorsystem=scapeler_shinyei&offering=offering_0439_initial&verbose=true&commit=true&observation=scapeler_shinyei:12.345&neighborhoodcode=BU04390402

		var _url = openiodUrl + '/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertom&sensorsystem=apri-sensor-am2320&offering=offering_0439_initial&commit=true';
		_url = _url + '&region=0439' + '&foi=' + data.foi + '&neighborhoodcode=' + data.neighborhoodCode + '&citycode=' + data.cityCode + '&observation=' + data.observation ;
		
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

var readSensorDefs	= function(location) {
	fs.readdir(location, function(err, files) {
		if (err) {
			throw err;
		}
		files.map(function(file) {
			return path.join(location, file);  
		}).filter(function (file) {
        	if (fs.statSync(file).isFile() & path.basename(file).substr(0,11) == 'sensor-def-' & path.extname(file) == '.js') return true;
			return false;
    	}).forEach(function (file) {
			var _sensorDef = require(file);
			sensorDefs.push(_sensorDef.sensor);
		});	
	})
}


var getCpuInfo	= function() {
	//hostname --all-ip-address
	exec("cat /proc/cpuinfo | grep Serial | cut -d ' ' -f 2", (error, stdout, stderr) => {
		if (error) {
			console.error(`exec error: ${error}`);
			return;
		}
		unit.id = stdout.substr(0,stdout.length-1);
		//console.log('unit.id:' + unit.id);
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

readSensorDefs(startFolder);
getCpuInfo();

SerialPort.list(function(err, ports) {
	console.log(ports);

	console.log('Find usb comport:');
	
	usbPorts	= ports;

	if (usbComNames['apri-sensor-combi2'] != undefined && usbComNames['apri-sensor-combi2'].comName != undefined) {
		serialPortPath	= usbComNames['apri-sensor-combi2'].comName;
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




var socket = io(socketUrl, {path:socketPath}); 

socket.on('connection', function (socket) {
	var currTime = new Date();
	console.log(currTime +': connect from '+ socket.request.connection.remoteAddress + ' / '+ socket.handshake.headers['x-forwarded-for'] || socket.handshake.address.address);
	
});

socket.on('disconnect', function() {
	console.log('Disconnected from web-socket ');
});

socket.on('info', function(data) {
	console.log('websocket info '+ data);
	//io.sockets.emit('aireassignal', { data: data } );
	//socket.broadcast.emit('aireassignal', { data: data } );
});








