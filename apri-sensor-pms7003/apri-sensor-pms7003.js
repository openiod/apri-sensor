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

var concPM1_0_CF1Total, concPM2_5_CF1Total, concPM10_0_CF1Total, concPM1_0_ambTotal, concPM2_5_ambTotal, concPM10_0_ambTotal, rawGt0_3umTotal, rawGt0_5umTotal, rawGt1_0umTotal, rawGt2_5umTotal, rawGt5_0umTotal, rawGt10_0umTotal;
var measurementCount;


// create headers to only use ones in the result files
var writeHeaders		= true;
var headerAvg			= 'dateiso;duration;concPM1_0_CF1;concPM2_5_CF1;concPM10_0_CF1;concPM1_0_amb;concPM2_5_amb;concPM10_0_amb;rawGt0_3um;rawGt0_5um;rawGt1_0um;rawGt2_5um;rawGt5_0um;rawGt10_0um;count\n';

var sensorFileName 		= 'sensor-pms7003-result';
var sensorFileExtension	= '.csv';
var sensorLocalPathRoot = systemFolderParent + '/sensor/';
var fileFolder 			= 'openiod-v1';
var resultsFolder 		= sensorLocalPathRoot + fileFolder + "/" + 'results/';

var today				= new Date();
var dateString = today.getFullYear() + "-" + (today.getMonth()+1) + "-" +  today.getDate() + "_" + today.getHours(); // + ":" + today.getMinutes();
var resultsFileName = resultsFolder + sensorFileName + '_' + dateString;


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
	mainProcess();
});



var mainProcess = function() {
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
}

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
		rawGt0_3umTotal	= 0;
		rawGt0_5umTotal	= 0;
		rawGt1_0umTotal	= 0;
		rawGt2_5umTotal	= 0;
		rawGt5_0umTotal	= 0;
		rawGt10_0umTotal	= 0;
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
			rawGt0_3umTotal	= 0;
			rawGt0_5umTotal	= 0;
			rawGt1_0umTotal	= 0;
			rawGt2_5umTotal	= 0;
			rawGt5_0umTotal	= 0;
			rawGt10_0umTotal	= 0;
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
		rawGt0_3umTotal	= 0;
		rawGt0_5umTotal	= 0;
		rawGt1_0umTotal	= 0;
		rawGt2_5umTotal	= 0;
		rawGt5_0umTotal	= 0;
		rawGt10_0umTotal	= 0;
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
	rawGt0_3umTotal	+= parseFloat(data[6]);
	rawGt0_5umTotal	+= parseFloat(data[7]);
	rawGt1_0umTotal	+= parseFloat(data[8]);
	rawGt2_5umTotal	+= parseFloat(data[9]);
	rawGt5_0umTotal	+= parseFloat(data[10]);
	rawGt10_0umTotal	+= parseFloat(data[11]);
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
	var	rawGt0_3umAvg		= Math.round((rawGt0_3umTotal/measurementCount)	 *100)/100;
	var	rawGt0_5umAvg		= Math.round((rawGt0_5umTotal/measurementCount)	 *100)/100;
	var	rawGt1_0umAvg		= Math.round((rawGt1_0umTotal/measurementCount)	 *100)/100;
	var	rawGt2_5umAvg		= Math.round((rawGt2_5umTotal/measurementCount)	 *100)/100;
	var	rawGt5_0umAvg		= Math.round((rawGt5_0umTotal/measurementCount)	 *100)/100;
	var	rawGt10_0umAvg		= Math.round((rawGt10_0umTotal/measurementCount)	 *100)/100;
	
	var recordAvg	= measureTime.toISOString() + ';' + loopTime ;
		
	recordAvg		= recordAvg + ';' +  
		concPM1_0_CF1Avg	+ ';' +
		concPM2_5_CF1Avg	+ ';' +
		concPM10_0_CF1Avg	+ ';' +
		concPM1_0_ambAvg	+ ';' +
		concPM2_5_ambAvg	+ ';' +
		concPM10_0_ambAvg	+ ';' +
		rawGt0_3umAvg	+ ';' +
		rawGt0_5umAvg	+ ';' +
		rawGt1_0umAvg	+ ';' +
		rawGt2_5umAvg	+ ';' +
		rawGt5_0umAvg	+ ';' +
		rawGt10_0umAvg;
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
		'apri-sensor-pms7003-concPM1_0_CF1:'+ concPM1_0_CF1Avg + ',' +
		'apri-sensor-pms7003-concPM2_5_CF1:'+concPM2_5_CF1Avg + ',' +
		'apri-sensor-pms7003-concPM10_0_CF1:'+concPM10_0_CF1Avg + ',' +
		'apri-sensor-pms7003-concPM1_0_amb:'+concPM1_0_ambAvg + ',' +
		'apri-sensor-pms7003-concPM2_5_amb:'+concPM2_5_ambAvg + ',' +
		'apri-sensor-pms7003-concPM10_0_amb:'+concPM10_0_ambAvg + ',' +
		'apri-sensor-pms7003-rawGt0_3um:'+rawGt0_3umAvg + ',' +
		'apri-sensor-pms7003-rawGt0_5um:'+rawGt0_5umAvg + ',' +
		'apri-sensor-pms7003-rawGt1_0um:'+rawGt1_0umAvg + ',' +
		'apri-sensor-pms7003-rawGt2_5um:'+rawGt2_5umAvg + ',' +
		'apri-sensor-pms7003-rawGt5_0um:'+rawGt5_0umAvg + ',' +
		'apri-sensor-pms7003-rawGt10_0um:'+rawGt10_0umAvg ;

	sendData(data);
 
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

