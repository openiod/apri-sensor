/*
** Module: apri-sensor-co2
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
var SerialPort 			= require("serialport");
var io	 				= require('socket.io-client');

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
//var serialPortPath		= "/dev/cu.usbmodem1411";
var serialPortPath		= "/dev/cu.usbmodem1421";
//var serialPortPath              = "/dev/ttyACM1";
var loopStart;
var loopTime			= 0; // ms

var tempSensorTotal;
var co2Total;
var measurementCount;


// create headers to only use ones in the result files
var writeHeaders		= true;
var headerAvg			= 'dateiso;duration;temp;co2;count\n';

var sensorFileName 		= 'sensor-co2-result';
var sensorFileExtension	= '.csv';
var sensorLocalPathRoot = systemFolderParent + '/sensor/';
var fileFolder 			= 'openiod-v1';
var resultsFolder 		= sensorLocalPathRoot + fileFolder + "/" + 'results/';

var today				= new Date();
var dateString = today.getFullYear() + "-" + (today.getMonth()+1) + "-" +  today.getDate() + "_" + today.getHours(); // + ":" + today.getMinutes();
var resultsFileName = resultsFolder + sensorFileName + '_' + dateString;


var serialport = new SerialPort(serialPortPath, {parser: SerialPort.parsers.readline('\n')} );
serialport.on('open', function(){
	console.log('Serial Port connected');
	if (writeHeaders == true) writeHeaderIntoFile();
	serialport.on('data', function(data){
		var _dataArray	= data.split(';');
		if (_dataArray.length == 2 && isNumeric(_dataArray[0]) && isNumeric(_dataArray[1]) ) {
			//console.log('measurement: ' + data);
			processMeasurement(_dataArray);
		} else {
			console.log('log: ' + data);
		}
	});
});
serialport.on('error', function(err) {
  console.log('Error: ', err.message);
});
SerialPort.list(function(err, ports) {
	console.log(ports);
});

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

var processMeasurement = function(data) {
	if (loopStart == undefined) { 
		loopStart 		= new Date(); 
	};
	var measureMentTime		= new Date();
	var loopTime 			= measureMentTime.getTime() - loopStart.getTime();
	if (loopTime >= loopTimeMax) {
//		console.log(loopTime);
		if (tempSensorTotal == undefined) {
			loopStart 			= new Date();
			tempSensorTotal 	= 0;
			co2Total 			= 0;
			measurementCount 	= 0;
//			console.log('first time init');
			return;
		}
//		console.log('Loop measurement');
//		console.log(measurementCount);
		writeResults(measureMentTime, loopTime);
		loopStart 			= new Date();
		tempSensorTotal 	= 0;
		co2Total 			= 0;
		measurementCount 	= 0;
	}
	
	if (tempSensorTotal == undefined) {
		return;
	}
	tempSensorTotal		+= parseFloat(data[0]);
	co2Total			+= parseFloat(data[1]);
	measurementCount	++;

}


var writeHeaderIntoFile = function() {
	fs.appendFile(resultsFileName + '_avg' + sensorFileExtension, headerAvg, function (err) {
		if (err != null) {
			console.log('Error writing results to file: ' + err);
		}
	});
	writeHeaders	= false;
}

var writeResults	= function(measureTime, loopTime) {
	console.log('Results: ' + measureTime.toISOString() );
	
//	console.log(tempSensorTotal);
//	console.log(co2Total);
//	console.log(measurementCount);
//	console.logloopTime;
//	console.loopTimeMax;

//	var tempAvg			= Math.round((tempSensorTotal/measurementCount)	/ loopTime * loopTimeMax *100)/100;
//	var co2Avg			= Math.round((co2Total/measurementCount)		/ loopTime * loopTimeMax *100)/100;
	var tempAvg			= Math.round((tempSensorTotal/measurementCount)	 *100)/100;
	var co2Avg			= Math.round((co2Total/measurementCount)		 *100)/100;
	
	var recordAvg	= measureTime.toISOString() + ';' + loopTime ;
		
	recordAvg		= recordAvg + ';' + tempAvg; 
	recordAvg		= recordAvg + ';' + co2Avg; 
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
	data.neighborhoodName	= '..'; //geoLocation.neighborhoodName;	
	data.cityCode			= 'GM0439'; //geoLocation.cityCode;	
	data.cityName			= '..'; //geoLocation.cityName;
		
	//observation=stress:01
		
	data.categories			= [];
	data.observation		= 'scapeler_co2:'+co2Avg+',scapeler_co2_temp:'+tempAvg ;

	sendData(data);
 
}

// send data to SOS service via OpenIoD REST service
var sendData = function(data) {
// oud //		http://openiod.com/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&inputformat=insertom&objectid=humansensor&format=xml
// oud //			&region=EHV		&lat=50.1		&lng=4.0		&category=airquality		&value=1

//http://localhost:4000/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertom&sensorsystem=scapeler_shinyei&offering=offering_0439_initial&verbose=true&commit=true&observation=scapeler_shinyei:12.345&neighborhoodcode=BU04390402
//https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertom&sensorsystem=scapeler_shinyei&offering=offering_0439_initial&verbose=true&commit=true&observation=scapeler_shinyei:12.345&neighborhoodcode=BU04390402

		var _url = openiodUrl + '/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertom&sensorsystem=scapeler_co2&offering=offering_0439_initial&commit=true';
		_url = _url + '&region=0439' + '&neighborhoodcode=' + data.neighborhoodCode + '&citycode=' + data.cityCode + '&observation=' + data.observation ;
		
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

