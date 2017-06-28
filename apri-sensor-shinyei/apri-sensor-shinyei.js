/*
** Module: apri-sensor-shinyei
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
var SerialPort = require("serialport");
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
var serialPortPath		= "/dev/ttyACM0";

//var serialPortPath		= "/dev/cu.usbmodem1411";
var serialPortPath              = "/dev/ttyACM0";
var loopStart;
var loopTime			= 0; // ms

var sensors				= {};

var nrOfChannels		= 15;
var channelMaxValue;

var channelTreshold		= [];
for (var i=0;i<nrOfChannels;i++) {
	channelTreshold.push(i*5000)
}
channelMaxValue			= channelTreshold[nrOfChannels-1];

// create headers to only use ones in the result files
var writeHeaders		= true;
var headerCounts		= 'dateiso;cycletime;sensorid';
var headerPulseTotals	= 'dateiso;cycletime;sensorid';
var headerAvg			= 'dateiso;cycletime;sensorid';
for (var iHeader=0;iHeader<nrOfChannels;iHeader++) {
    var iStr = ""+iHeader>9?iHeader:'0'+iHeader;
	headerCounts 		= headerCounts + ';channel_' + iStr;
	headerPulseTotals 	= headerPulseTotals + ';channel_' + iStr;
	headerAvg		 	= headerAvg + ';channel_' + iStr;
}
headerCounts			+= '\n';
headerPulseTotals		+= '\n';
headerAvg				+= '\n';


var sensorFileName 		= 'sensor-shinyei-result';
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
		if (_dataArray.length == 3 && isNumeric(_dataArray[0]) && isNumeric(_dataArray[1]) && isNumeric(_dataArray[2]) ) {
			console.log('measurement: ' + data);
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
	var sensorId			= getSensorId(data[0]);
	if (loopStart == undefined) { loopStart 		= new Date(); };
	var measureMentTime		= new Date();
	var loopTime 			= measureMentTime.getTime() - loopStart.getTime();
	if (loopTime >= loopTimeMax) {
//		printChannelResults();
		writeResults(measureMentTime, loopTime);
		loopStart 		= new Date();
	}
	fillChannel(sensorId, measureMentTime, data);
}

var getSensorId = function(sId) {
	var sensorId = '' + sId;
	if (sensors[sensorId] == undefined) initSensor(sensorId);
	return sensorId;
}

var initSensor = function(sensorId) {
	sensors[sensorId] 			= {};
	sensors[sensorId].channel	= [];
	for (var i=0;i<nrOfChannels;i++){
		var _channel = {};
		_channel.pulseTotal	= 0;
		_channel.count		= 0;
		sensors[sensorId].channel.push(_channel);		  
	};
};

var fillChannel = function(sensorId, measureMentTime, data) {
	for (var i=nrOfChannels-1;i>=0;i--) {
		if (data[2] >= channelTreshold[i]) {
			sensors[sensorId].channel[i].count++;
			sensors[sensorId].channel[i].pulseTotal += parseFloat(data[2]);
			break;
		}
	}
}

var writeHeaderIntoFile = function() {
	fs.appendFile(resultsFileName + '_counts' + sensorFileExtension, headerCounts, function (err) {
		if (err != null) {
			console.log('Error writing results to file: ' + err);
		}
	});
	fs.appendFile(resultsFileName + '_pulse-totals' + sensorFileExtension, headerPulseTotals, function (err) {
		if (err != null) {
			console.log('Error writing results to file: ' + err);
		}
	});
	fs.appendFile(resultsFileName + '_avg' + sensorFileExtension, headerAvg, function (err) {
		if (err != null) {
			console.log('Error writing results to file: ' + err);
		}
	});
	writeHeaders	= false;
}

var writeResults	= function(measureTime, loopTime) {
	console.log('Results: ' + measureTime.toISOString() );
	

	var sosCount		= 0;
	var sosSensorCount 	= 0;
	
	for (var sensorId in sensors) {
		var recordCounts 		= measureTime.toISOString() + ';' + loopTime + ';' + sensorId;
		var recordPulseTotals 	= measureTime.toISOString() + ';' + loopTime + ';' + sensorId;
		var recordAvg			= measureTime.toISOString() + ';' + loopTime + ';' + sensorId;
		
		for (var i=0; i<nrOfChannels; i++) {
			recordCounts 		= recordCounts + ';' +  Math.round(sensors[sensorId].channel[i].count / loopTime * loopTimeMax *100)/100; 
			recordPulseTotals 	= recordPulseTotals + ';' + sensors[sensorId].channel[i].pulseTotal; 
			recordAvg			= recordAvg + ';' + Math.round(sensors[sensorId].channel[i].pulseTotal / loopTime * loopTimeMax *100)/100; 
		}
		recordCounts 					= recordCounts + '\n';
		recordPulseTotals 				= recordPulseTotals + '\n';
		recordAvg		 				= recordAvg + '\n';
		//console.log(record);
		fs.appendFile(resultsFileName + '_counts' + sensorFileExtension, recordCounts, function (err) {
			if (err != null) {
				console.log('Error writing results to file: ' + err);
			}
		});
		fs.appendFile(resultsFileName + '_pulse-totals' + sensorFileExtension, recordPulseTotals, function (err) {
			if (err != null) {
				console.log('Error writing results to file: ' + err);
			}
		});
		fs.appendFile(resultsFileName + '_avg' + sensorFileExtension, recordAvg, function (err) {
			if (err != null) {
				console.log('Error writing results to file: ' + err);
			}
		});
		
		for (var i=0; i<nrOfChannels; i++) {
			sosCount 	+= Math.round(sensors[sensorId].channel[i].count / loopTime * loopTimeMax *100)/100; 
		}
		sosSensorCount++;
				
		initSensor(sensorId);
	}

	var data			= {};
	data.neighborhoodCode	= 'BU04390603'; //geoLocation.neighborhoodCode;  	
	data.neighborhoodName	= '..'; //geoLocation.neighborhoodName;	
	data.cityCode			= 'GM0439'; //geoLocation.cityCode;	
	data.cityName			= '..'; //geoLocation.cityName;
		
	//observation=stress:01
		
		
	data.categories			= [];
	data.observation		= 'scapeler_shinyei:'+Math.round((sosCount/sosSensorCount)*100)/100 ;

	sendData(data);
 
}

// send data to SOS service via OpenIoD REST service
var sendData = function(data) {
// oud //		http://openiod.com/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&inputformat=insertom&objectid=humansensor&format=xml
// oud //			&region=EHV		&lat=50.1		&lng=4.0		&category=airquality		&value=1

//http://localhost:4000/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertom&sensorsystem=scapeler_shinyei&offering=offering_0439_initial&verbose=true&commit=true&observation=scapeler_shinyei:12.345&neighborhoodcode=BU04390402
//https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertom&sensorsystem=scapeler_shinyei&offering=offering_0439_initial&verbose=true&commit=true&observation=scapeler_shinyei:12.345&neighborhoodcode=BU04390402

		var _url = openiodUrl + '/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertom&sensorsystem=scapeler_shinyei&offering=offering_0439_initial&commit=true';
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

var printChannelResults	= function() {
	//console.log(sensors);
	for (var sensorKey in sensors) {
		var line = 'Sensor: ' + sensorKey + '\t';
		for (var i=0; i<nrOfChannels; i++) {
			line = line + '\t' + i + ': ';
			if (sensors[sensorKey].channel[i].count==0) {
				line = line + '\t'; 
			} else {
				line = line + sensors[sensorKey].channel[i].count + 'x'; 
			}
		}
		console.log(line);
	} 
}



/*
app.all('/*', function(req, res, next) {
  console.log("app.all/: " + req.url + " ; systemCode: " + apriConfig.systemCode );
//  res.header("Access-Control-Allow-Origin", "*");
//  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

// test url for systemcode
app.get('/'+apriConfig.systemCode+'/', function(req, res) {
  console.log("Reqparam: " + req.url);
  res.send("ok");
});
*/
/*
app.get('/'+apriConfig.systemCode+'/eventsource/:eventsource', function(req, res) {
	//getLocalFile(req, res, {contentType:'text/css'});
	console.log('EventSource action from '+ req.params.eventsource );
		
});
*/

/*
var io = require('socket.io').listen(app.listen(apriConfig.systemListenPort),{
    //serveClient: config.env !== 'production',
    path: '/SCAPE604/socket.io'
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
	console.log('websocket info '+ data);
	//io.sockets.emit('aireassignal', { data: data } );
	//socket.broadcast.emit('aireassignal', { data: data } );
});

