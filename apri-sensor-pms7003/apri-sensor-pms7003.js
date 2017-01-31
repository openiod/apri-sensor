/*
** Module: apri-sensor-pms7003
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
//var serialPortPath		= "/dev/cu.usbmodem1421";
var serialPortPath		= "/dev/cu.wchusbserial1420";


//var serialPortPath              = "/dev/ttyACM1";
var loopStart;
var loopTime			= 0; // ms

var concPM1_0_CF1Total, concPM2_5_CF1Total, concPM10_0_CF1Total, concPM1_0_ambTotal, concPM2_5_ambTotal, concPM10_0_ambTotal, rawGtPM0_3mTotal, rawGtPM0_5mTotal, rawGtPM1_0mTotal, rawGtPM2_5mTotal, rawGtPM5_0mTotal, rawGtPM10_0mTotal;
var measurementCount;


// create headers to only use ones in the result files
var writeHeaders		= true;
var headerAvg			= 'dateiso;duration;concPM1_0_CF1;concPM2_5_CF1;concPM10_0_CF1;concPM1_0_amb;concPM2_5_amb;concPM10_0_amb;rawGtPM0_3m;rawGtPM0_5m;rawGtPM1_0m;rawGtPM2_5m;rawGtPM5_0m;rawGtPM10_0m;count\n';

var sensorFileName 		= 'sensor-pms7003-result';
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
		if (_dataArray.length == 14 && isNumeric(_dataArray[0]) && isNumeric(_dataArray[1]) && isNumeric(_dataArray[2]) && isNumeric(_dataArray[3]) && isNumeric(_dataArray[4]) && isNumeric(_dataArray[5]) && isNumeric(_dataArray[6]) && isNumeric(_dataArray[7]) && isNumeric(_dataArray[8]) && isNumeric(_dataArray[9]) && isNumeric(_dataArray[10]) && isNumeric(_dataArray[11]) ) {
			//console.log('measurement: ' + data);
			processMeasurement(_dataArray);
		} else {
			console.log('log not valid data: ' + data);
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
//	console.log(data);

	if (loopStart == undefined) { 
		loopStart 		= new Date(); 
		concPM1_0_CF1Total	= 0;
		concPM2_5_CF1Total	= 0;
		concPM10_0_CF1Total	= 0;
		concPM1_0_ambTotal	= 0;
		concPM2_5_ambTotal	= 0;
		concPM10_0_ambTotal	= 0;
		rawGtPM0_3mTotal	= 0;
		rawGtPM0_5mTotal	= 0;
		rawGtPM1_0mTotal	= 0;
		rawGtPM2_5mTotal	= 0;
		rawGtPM5_0mTotal	= 0;
		rawGtPM10_0mTotal	= 0;
		measurementCount 	= 0;
//		console.log('first time init');
	};
	var measureMentTime		= new Date();
	var loopTime 			= measureMentTime.getTime() - loopStart.getTime();

	if (loopTime >= loopTimeMax) {
/*
		console.log(concPM1_0_CF1Total);
		if (concPM1_0_CF1Total == undefined) {
			loopStart 			= new Date();
			concPM1_0_CF1Total	= 0;
			concPM2_5_CF1Total	= 0;
			concPM10_0_CF1Total	= 0;
			concPM1_0_ambTotal	= 0;
			concPM2_5_ambTotal	= 0;
			concPM10_0_ambTotal	= 0;
			rawGtPM0_3mTotal	= 0;
			rawGtPM0_5mTotal	= 0;
			rawGtPM1_0mTotal	= 0;
			rawGtPM2_5mTotal	= 0;
			rawGtPM5_0mTotal	= 0;
			rawGtPM10_0mTotal	= 0;
			measurementCount 	= 0;
//			console.log('first time init');
			return;
		}
*/
//		console.log('Loop measurement');
//		console.log(measurementCount);
		writeResults(measureMentTime, loopTime);
		loopStart 			= new Date();
		concPM1_0_CF1Total	= 0;
		concPM2_5_CF1Total	= 0;
		concPM10_0_CF1Total	= 0;
		concPM1_0_ambTotal	= 0;
		concPM2_5_ambTotal	= 0;
		concPM10_0_ambTotal	= 0;
		rawGtPM0_3mTotal	= 0;
		rawGtPM0_5mTotal	= 0;
		rawGtPM1_0mTotal	= 0;
		rawGtPM2_5mTotal	= 0;
		rawGtPM5_0mTotal	= 0;
		rawGtPM10_0mTotal	= 0;
		measurementCount 	= 0;
	}
	
	if (concPM1_0_CF1Total == undefined) {
		return;
	}
	concPM1_0_CF1Total	+= parseFloat(data[0]);
	concPM2_5_CF1Total	+= parseFloat(data[1]);
	concPM10_0_CF1Total	+= parseFloat(data[2]);
	concPM1_0_ambTotal	+= parseFloat(data[3]);
	concPM2_5_ambTotal	+= parseFloat(data[4]);
	concPM10_0_ambTotal	+= parseFloat(data[5]);
	rawGtPM0_3mTotal	+= parseFloat(data[6]);
	rawGtPM0_5mTotal	+= parseFloat(data[7]);
	rawGtPM1_0mTotal	+= parseFloat(data[8]);
	rawGtPM2_5mTotal	+= parseFloat(data[9]);
	rawGtPM5_0mTotal	+= parseFloat(data[10]);
	rawGtPM10_0mTotal	+= parseFloat(data[11]);
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
	
	var concPM1_0_CF1Avg	= Math.round((concPM1_0_CF1Total/measurementCount)	 *100)/100;
	var	concPM2_5_CF1Avg	= Math.round((concPM2_5_CF1Total/measurementCount)	 *100)/100;
	var	concPM10_0_CF1Avg	= Math.round((concPM10_0_CF1Total/measurementCount)	 *100)/100;
	var	concPM1_0_ambAvg	= Math.round((concPM1_0_ambTotal/measurementCount)	 *100)/100;
	var	concPM2_5_ambAvg	= Math.round((concPM2_5_ambTotal/measurementCount)	 *100)/100;
	var	concPM10_0_ambAvg	= Math.round((concPM10_0_ambTotal/measurementCount)	 *100)/100;
	var	rawGtPM0_3mAvg		= Math.round((rawGtPM0_3mTotal/measurementCount)	 *100)/100;
	var	rawGtPM0_5mAvg		= Math.round((rawGtPM0_5mTotal/measurementCount)	 *100)/100;
	var	rawGtPM1_0mAvg		= Math.round((rawGtPM1_0mTotal/measurementCount)	 *100)/100;
	var	rawGtPM2_5mAvg		= Math.round((rawGtPM2_5mTotal/measurementCount)	 *100)/100;
	var	rawGtPM5_0mAvg		= Math.round((rawGtPM5_0mTotal/measurementCount)	 *100)/100;
	var	rawGtPM10_0mAvg		= Math.round((rawGtPM10_0mTotal/measurementCount)	 *100)/100;
	
	var recordAvg	= measureTime.toISOString() + ';' + loopTime ;
		
	recordAvg		= recordAvg + ';' +  
		concPM1_0_CF1Avg	+ ';' +
		concPM2_5_CF1Avg	+ ';' +
		concPM10_0_CF1Avg	+ ';' +
		concPM1_0_ambAvg	+ ';' +
		concPM2_5_ambAvg	+ ';' +
		concPM10_0_ambAvg	+ ';' +
		rawGtPM0_3mAvg	+ ';' +
		rawGtPM0_5mAvg	+ ';' +
		rawGtPM1_0mAvg	+ ';' +
		rawGtPM2_5mAvg	+ ';' +
		rawGtPM5_0mAvg	+ ';' +
		rawGtPM10_0mAvg;
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
	data.observation		= 
		'apri-sensor_concPM1_0_CF1:'+ concPM1_0_CF1Avg + ',' +
		'apri-sensor_concPM2_5_CF1:'+concPM2_5_CF1Avg + ',' +
		'apri-sensor_concPM10_0_CF1:'+concPM10_0_CF1Avg + ',' +
		'apri-sensor_concPM1_0_amb:'+concPM1_0_ambAvg + ',' +
		'apri-sensor_concPM2_5_amb:'+concPM2_5_ambAvg + ',' +
		'apri-sensor_concPM10_0_amb:'+concPM10_0_ambAvg + ',' +
		'apri-sensor_rawGtPM0_3m:'+rawGtPM0_3mAvg + ',' +
		'apri-sensor_rawGtPM0_5m:'+rawGtPM0_5mAvg + ',' +
		'apri-sensor_rawGtPM1_0m:'+rawGtPM1_0mAvg + ',' +
		'apri-sensor_rawGtPM2_5m:'+rawGtPM2_5mAvg + ',' +
		'apri-sensor_rawGtPM5_0m:'+rawGtPM5_0mAvg + ',' +
		'apri-sensor_rawGtPM10_0m:'+rawGtPM10_0mAvg ;

	//sendData(data);
 
}

// send data to SOS service via OpenIoD REST service
var sendData = function(data) {
// oud //		http://openiod.com/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&inputformat=insertom&objectid=humansensor&format=xml
// oud //			&region=EHV		&lat=50.1		&lng=4.0		&category=airquality		&value=1

//http://localhost:4000/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertom&sensorsystem=scapeler_shinyei&offering=offering_0439_initial&verbose=true&commit=true&observation=scapeler_shinyei:12.345&neighborhoodcode=BU04390402
//https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertom&sensorsystem=scapeler_shinyei&offering=offering_0439_initial&verbose=true&commit=true&observation=scapeler_shinyei:12.345&neighborhoodcode=BU04390402

		var _url = openiodUrl + '/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertom&sensorsystem=apri-sensor-pms7003&offering=offering_0439_initial&commit=true';
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

