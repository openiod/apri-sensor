/*
** Module: apri-sensor-josuino
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

var usbComNames			= apriConfig.getSensorUsbComName();
console.log(usbComNames);
var usbPorts			= [];
//var serialPortPath		= "/dev/cu.usbmodem1411";
//var serialPortPath		= "/dev/cu.usbmodem1421";
//var serialPortPath		= "/dev/cu.wchusbserial1420";
var serialPortPath		= "/dev/cu.usbserial-A904I3WJ";

var sensors 	= [	 	{sensorId:'unitId',command: 'Get Id\n'}
					,	{sensorId:'PM',command: 'Get PM\n'}
					, 	{sensorId:'CO2',command: 'Get CO2\n'}
					, 	{sensorId:'rH',command: 'Get Humidity\n'}
					, 	{sensorId:'T',command: 'Get Temp\n'}
					, 	{sensorId:'Pasc',command: 'Get Pressure\n'}
//					, 	{sensorId:'LatLon',command: 'Get Location\n'}
					, 	{sensorId:'Light',command: 'Get Light\n'}
					];												
var sensorsIndex	= undefined;


//var serialPortPath              = "/dev/ttyACM1";
var loopStart;
var loopTime			= 0; // ms

var concPM1_0_CF1Total, concPM2_5_CF1Total, concPM10_0_CF1Total, concPM1_0_ambTotal, concPM2_5_ambTotal, concPM10_0_ambTotal, rawGt0_3umTotal, rawGt0_5umTotal, rawGt1_0umTotal, rawGt2_5umTotal, rawGt5_0umTotal, rawGt10_0umTotal;
var measurementCount;

var unitId_Value;
var pm25_Value;	
var pm10_Value;
var co2_Value;
var rHum_Value;
var t_Value;
var pressure_Value;
var light_Value;

var pm25_Avg;	
var pm10_Avg;
var co2_Avg;
var rHum_Avg;
var t_Avg;
var pressure_Avg;
var light_Avg;


var pm25_Array;	
var pm10_Array;
var co2_Array;
var rHum_Array;
var t_Array;
var pressure_Array;
var light_Array;




// create headers to only use ones in the result files
var writeHeaders		= true;
var headerAvg			= 'dateiso;duration;concPM1_0_CF1;concPM2_5_CF1;concPM10_0_CF1;concPM1_0_amb;concPM2_5_amb;concPM10_0_amb;rawGt0_3um;rawGt0_5um;rawGt1_0um;rawGt2_5um;rawGt5_0um;rawGt10_0um;count\n';

var sensorFileName 		= 'sensor-josuino-result';
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
	if (usbComNames['apri-sensor-josuino'] != undefined && usbComNames['apri-sensor-josuino'].comName != undefined) {
		serialPortPath	= usbComNames['apri-sensor-josuino'].comName;
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



var mainProcess = function() {
	var serialport = new SerialPort(serialPortPath, {baudRate: 115200, parser: SerialPort.parsers.readline('\n')} );
//	var serialport = new SerialPort(serialPortPath, {baudRate: 115200} );
	serialport.on('open', function(){
		console.log('Serial Port connected');
		if (writeHeaders == true) writeHeaderIntoFile();
		serialport.on('data', function(data){
//			if (!data.split) return;
			var _dataArray	= data.split(';');		
			if (_dataArray.length == 14 && isNumeric(_dataArray[0]) && isNumeric(_dataArray[1]) && isNumeric(_dataArray[2]) && isNumeric(_dataArray[3]) && isNumeric(_dataArray[4]) && isNumeric(_dataArray[5]) && isNumeric(_dataArray[6]) && isNumeric(_dataArray[7]) && isNumeric(_dataArray[8]) && isNumeric(_dataArray[9]) && isNumeric(_dataArray[10]) && isNumeric(_dataArray[11]) ) {
				//console.log('measurement: ' + data);
				processMeasurement(_dataArray);
			} else {
				if (sensorsIndex == undefined && data.substr(0,4) == "Type") { //"Type 'help' + \n for help") {
					setInterval(function() {
						pm25_Value		= undefined;	
						pm10_Value		= undefined;
						co2_Value		= undefined;
						rHum_Value		= undefined;
						t_Value			= undefined;
						pressure_Value	= undefined;
						light_Value		= undefined;
						sensorsIndex	= 0;
						getMeasurments();
					}, 60000);
				};


				if (data.substr(0,4) == "Unit") { 
					unitId_Value = getValue(data);
					sensorsIndex++;
					getMeasurments();
					return;
				}
				if (data.substr(0,4) == "PM10") { 
					pm10_Value = getValue(data);
					return;
				}
				if (data.substr(0,4) == "PM2.") { 
					pm25_Value = getValue(data);
					sensorsIndex++;
					getMeasurments();
					return;
				}
				if (data.substr(0,4) == "CO2:") {
					co2_Value = getValue(data);
					sensorsIndex++;
					getMeasurments();
					return;
				}
				if (data.substr(0,4) == "Humi") { 
					rHum_Value = getValue(data);
					sensorsIndex++;
					getMeasurments();
					return;
				}
				if (data.substr(0,4) == "Temp") {
					t_Value = getValue(data);
					sensorsIndex++;
					getMeasurments();
					return;
				}
				if (data.substr(0,4) == "Pres") {
					pressure_Value = getValue(data);
					sensorsIndex++;
					getMeasurments();
					return;
				}
				if (data.substr(0,5) == "Light") {
					light_Value = getValue(data);
					processMeasurement();
					return;
				}
						
				console.log('log not valid data: ' + data);
			}
		});

	});
	serialport.on('error', function(err) {
  		console.log('Error: ', err.message);
	});

	var getMeasurments	= function() {
		if (sensorsIndex < sensors.length) {
			//console.log(sensorsIndex);
			var serialCommand = sensors[sensorsIndex].command;
			//console.log(serialCommand);
			serialport.write(serialCommand, function(err) {
				if (err) {
					return console.log('Error on write: ', err.message);
				}
				//console.log('message written ' + sensors[sensorsIndex].command);
			});
		}
	}
	var getValue	= function(data) {
		var part2 = data.split(':')[1];
		var value = parseFloat(part2);
		return value;
	}

}

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}



var processMeasurement = function() {

	writeResults();
	
}


var writeHeaderIntoFile = function() {
	fs.appendFile(resultsFileName + '_avg' + sensorFileExtension, headerAvg, function (err) {
		if (err != null) {
			console.log('Error writing results to file: ' + err);
		}
	});
	writeHeaders	= false;
}

var writeResults	= function() {
	var measurementTime		= new Date();
	
	console.log('Results: ' + measurementTime.toISOString() );
	
	var recordAvg	= unitId_Value + ';' + measurementTime.toISOString();
		
	recordAvg		= recordAvg + ';' +  
		pm25_Value	+ ';' +
		pm10_Value	+ ';' +
		co2_Value	+ ';' +
		rHum_Value	+ ';' +
		t_Value	+ ';' +
		pressure_Value	+ ';' +
		light_Value + '\n';
		
	console.log(recordAvg);	
	
	fs.appendFile(resultsFileName + sensorFileExtension, recordAvg, function (err) {
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
		'apri-sensor-josuino-PM25:'+ pm25_Value + ',' +
		'apri-sensor-josuino-PM10:'+ pm10_Value + ',' +
		'apri-sensor-josuino-CO2:'+ co2_Value + ',' +
		'apri-sensor-josuino-rHum:'+ rHum_Value + ',' +
		'apri-sensor-josuino-temperature:'+ t_Value + ',' +
		'apri-sensor-josuino-pressure:'+ pressure_Value + ',' +
		'apri-sensor-josuino-light:'+ light_Value;

	sendData(data);
 
}

// send data to SOS service via OpenIoD REST service
var sendData = function(data) {
// oud //		http://openiod.com/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&inputformat=insertom&objectid=humansensor&format=xml
// oud //			&region=EHV		&lat=50.1		&lng=4.0		&category=airquality		&value=1

//http://localhost:4000/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertom&sensorsystem=scapeler_shinyei&offering=offering_0439_initial&verbose=true&commit=true&observation=scapeler_shinyei:12.345&neighborhoodcode=BU04390402
//https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertom&sensorsystem=scapeler_shinyei&offering=offering_0439_initial&verbose=true&commit=true&observation=scapeler_shinyei:12.345&neighborhoodcode=BU04390402

		var _url = openiodUrl + '/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertom&sensorsystem=apri-sensor-josuino&offering=offering_0439_initial&commit=true';
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

