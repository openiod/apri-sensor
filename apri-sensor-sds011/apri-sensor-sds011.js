/*
** Module: apri-sensor-sds011
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
var loopTimeMax			= 60000; //ms, 60000=60 sec

var usbPorts			= [];

var serialPortPath;

var deviceParam			= process.argv[2];
console.log('Param for serial device is ' + deviceParam);
var sensorKey			= '';
if (deviceParam != undefined) {
	serialPortPath		= deviceParam;
	sensorKey			= serialPortPath.substring(8);  // minus '/dev/tty'
	console.log('SensorKey = ' + sensorKey);
} else {
//	serialPortPath		= "/dev/ttyUSB0";
//	serialPortPath		= "/dev/tty.wchusbserial1d1330";
	serialPortPath		= "/dev/tty.wchusbserial1d1310";
}


//var serialPortPath		= "/dev/cu.usbmodem1411";
//var serialPortPath		= "/dev/cu.usbserial-A1056661";




var unit				= {};

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
var headerRaw			= 'dateiso;pm25;pm10\n';

var sensorFileName 		= 'sensor-sds011-result';
var sensorFileExtension	= '.csv';
var sensorLocalPathRoot = systemFolderParent + '/sensor/';
var fileFolder 			= 'openiod-v1';
var resultsFolder 		= sensorLocalPathRoot + fileFolder + "/" + 'results/';

var today				= new Date();
var dateString = today.getFullYear() + "-" + (today.getMonth()+1) + "-" +  today.getDate() + "_" + today.getHours(); // + ":" + today.getMinutes();
var resultsFileName = resultsFolder + sensorFileName + '_' + dateString;

var pm25Total;
var pm10Total;
var measureMentCount;
var pm25Result;
var pm10Result;
var id = "SDS011";

var printHex = function(buffer, tekst) {
	var str="";
  for (var i=0;i<buffer.length;i++) {
	  str = str+ buffer[i].toString(16)+' ';
  }
  console.log('log: ' + tekst +'  lengte:'+buffer.length+ " "+ str); // + data);
}

var incommingData = new Buffer(0);
var tmpBuffer = new Buffer(0);
var emitBuffer = new Buffer(0);
var myParser = function(emitter, buffer) {
	  printHex(incommingData,'nog niet verwerkt');
	  printHex(buffer,'input buffer erbij');
	  console.log('parser datalength: ' + incommingData.length + ' plus '+ buffer.length);
    tmpBuffer = Buffer.concat([incommingData, buffer]);
		incommingData = tmpBuffer;


//    if (incommingData.length > 3 && incommingData[incommingData.length - 3] == 3) {
		if (incommingData.length >= 10 ) {
			for (var i=0;i<incommingData.length;i++) {
				if (incommingData.length-i<10 ){
					console.log('parser klaar datalength: ' + incommingData.length + ' i '+ i);
					tmpBuffer = incommingData.slice(i+1);
					incommingData = tmpBuffer;
					break;
				}
				if (incommingData[i]==170 && incommingData[i+1]==192) {
					//emitBuffer = new Buffer(0);
          emitBuffer = incommingData.slice(i,i+10);
//					for (var j=0;j<10;j++) {
//						emitBuffer = Buffer.concat([emitBuffer, incommingData[i+j]]);
//					}
          emitter.emit("data", emitBuffer);
					i=i+9;
					console.log('parser new byte incommingdata to process: ' + incommingData[i+10]);
					console.log ('bufferlengte was: '+incommingData.length);
					//tmpBuffer = incommingData.slice(i+10);
					//incommingData = tmpBuffer;
					console.log ('bufferlengte wordt: '+incommingData.length);
				} else {
					console.log ('nieuwe foutieve byte was: '+ incommingData[i]);
				}
			}
			//if (i==incommingData.length) {
				incommingData = new Buffer(0);
			//}
			//tmpBuffer = incommingData.slice(i+1);
			//incommingData = tmpBuffer;

//      emitter.emit("data", incommingData);
//      incommingData = new Buffer(0);
    }
};

var mainProcess = function() {
	console.log('Found usb comname: ' + serialPortPath );


//	var serialport = new SerialPort(serialPortPath, {parser: SerialPort.parsers.readline('\n')} );
	var serialport = new SerialPort(serialPortPath, {parser: myParser} );
	serialport.on('open', function(){
		console.log('Serial Port connected');
		if (writeHeaders == true) writeHeaderIntoFile();
		serialport.on('data', function(data){
			console.log('datalength: ' + data.length);
			var checksum = 0;
			if (data.length == 10 ) {
				var c1 =(data[2]+data[3]+data[4]+data[5]+data[6]+data[7]);
				var c2 = c1>>8;
				checksum = c1 - (c2<<8);
			}
			if (data.length == 10 && data[0]==170 && data[1]==192 && data[9]==171 &&
			   checksum==data[8]) {  // AA;C0;AB
				//console.log('message recieved: ');
//				var str="";
//				for (var i=0;i<data.length;i++) {
//					str = str+ data[i].toString(16)+ ' ';
//				}
//				console.log('log: data gevonden, lengte:'+data.length+ " "+ str); // + data);
				processMeasurement(data);

// aac0 1a03 00 703e f8 ab  26 48 703e 6
// aac0 1b04 20 703e .b ab



			} else {
				var str="";
				for (var i=0;i<data.length;i++) {
					str = str+ data[i].toString(16)+' ';
				}
				console.log('log: data gevonden maar niet herkend, lengte:'+data.length+ " "+ str); // + data);
			}
			//console.log(roughScale(data,16))
			// var _data = data.substr(0,data.length-1);
//			for (var i=0;i<data.length;i++){
//				console.log(data[0]);
//				if (data.substr(i,1)==0xAA) console.log('0:AA');
//				if (data.substr(i,1)==0xC0) console.log('0:C0');
//			}
//			if (data.substr(0,1)==0xAA) console.log('0:AA');
//			if (data.substr(0,1)==0xC0) console.log('0:C0');
//			if (data.substr(1,1)==0xAA) console.log('1:AA');
//			if (data.substr(1,1)==0xC0) console.log('1:C0');
/*
			if (_dataArray.length == 2 && isNumeric(_dataArray[0]) && isNumeric(_dataArray[1]) && data[data.length-1] =='\r' ) {
				console.log('measurement: ' + _data);
				processMeasurement(_dataArray);
			} else {
				console.log('log: data gevonden maar niet herkend'); // + data);
			}
*/
		});
	});
	serialport.on('error', function(err) {
		console.log('Error: ', err.message);
	});
};

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

var processMeasurement = function(data) {

	var sensorId			= sensorId; //getSensorId(sensorId);

//	var measureMentTime		= new Date();
//	writeResults(measureMentTime, data);


  //var sortMeasurements = function(numArray) {
	//	return numArray.sort(function(a, b) {
	//		return a - b;
	//	});
	//}


	if (loopStart == undefined) {
		 loopStart 		= new Date();
		 pm25Total 	= 0;
		 pm10Total 	= 0;
		 measureMentCount = 0;
	};

	var measureMentTime		= new Date();
	var loopTime 			= measureMentTime.getTime() - loopStart.getTime();

	if (loopTime >= loopTimeMax) {
		if (measureMentCount > 0) {
			pm25Result = Math.round((pm25Total / measureMentCount)*10)/100;
			pm10Result = Math.round((pm10Total / measureMentCount)*10)/100;

			writeResults(measureMentTime, loopTime);
		}

		loopStart 		= new Date();
		pm25Total 	= 0;
		pm10Total 	= 0;
		measureMentCount = 0;
	}

//	calculate fillChannel(sensorId, measureMentTime, data);
  var pm25 = data[2]+(data[3]<<8);
	var pm10 = data[4]+(data[5]<<8);
  pm25Total += pm25;
	pm10Total += pm10;
	id         = data[6].toString(16)+data[7].toString(16);

	measureMentCount++;
  //console.log(pm25+' '+pm10+' '+id+' '+measureMentCount);

}

/*
var getSensorId = function(sId) {
	var sensorId = '' + sId;
	if (sensors[sensorId] == undefined) initSensor(sensorId);
	return sensorId;
}
*/

/*
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
*/

var writeHeaderIntoFile = function() {
	fs.appendFile(resultsFileName + '_raw' + sensorFileExtension, headerRaw, function (err) {
		if (err != null) {
			console.log('Error writing results to file: ' + err);
		}
	});
	writeHeaders	= false;
}

var writeResults	= function(measureTime, loopTime) {
	console.log('Results: ' + measureTime.toISOString() + ' count: ' + measureMentCount);


/*
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
*/


	var data			= {};
	//data.neighborhoodCode	= 'BU04390603'; //geoLocation.neighborhoodCode;
	data.foi				= 'SCRP' + unit.id;
	if (sensorKey != '') {
		data.foi	+= '_' + sensorKey;
	}
	//data.neighborhoodName	= '..'; //geoLocation.neighborhoodName;
	//data.cityCode			= 'GM0439'; //geoLocation.cityCode;
	//data.cityName			= '..'; //geoLocation.cityName;

	var recordOut 			= measureTime.toISOString() + ';' + pm25Result + ';' + pm10Result + '\n';

	fs.appendFile(resultsFileName + '_raw' + sensorFileExtension, recordOut, function (err) {
		if (err != null) {
			console.log('Error writing results to file: ' + err);
		}
	});

	data.categories			= [];
	data.observation		= 'apri-sensor-sds011-pm25:'+pm25Result+','+'apri-sensor-sds011-pm10:'+pm10Result ;

	sendData(data);

}

// send data to SOS service via OpenIoD REST service
var sendData = function(data) {
// oud //		http://openiod.com/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&inputformat=insertom&objectid=humansensor&format=xml
// oud //			&region=EHV		&lat=50.1		&lng=4.0		&category=airquality		&value=1

//http://localhost:4000/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertom&sensorsystem=apri-sensor-sds011&offering=offering_0439_initial&verbose=true&commit=true&observation=apri-sensor-sds011-pm25:12.345&neighborhoodcode=BU04390402
//https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertom&sensorsystem=apri-sensor-sds011&offering=offering_0439_initial&verbose=true&commit=true&observation=apri-sensor-sds011-pm25:12345,apri-sensor-sds011-pm10:345&neighborhoodcode=BU04390402

		var _url = openiodUrl + '/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertom&sensorsystem=apri-sensor-sds011&offering=offering_0439_initial&commit=true';
		_url = _url +
		//'&region=0439' +
		'&foi=' + data.foi +
		//'&neighborhoodcode=' + data.neighborhoodCode + '&citycode=' + data.cityCode +
		'&observation=' + data.observation ;

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

/*
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
*/


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

var getCpuInfo	= function() {
	//hostname --all-ip-address
	exec("cat /proc/cpuinfo | grep Serial | cut -d ' ' -f 2", (error, stdout, stderr) => {
		if (error) {
			console.error(`exec error: ${error}`);
			return;
		}
		unit.id = stdout.substr(0,stdout.length-1);
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


getCpuInfo();


SerialPort.list(function(err, ports) {
	console.log(ports);

	console.log('Find usb comport:');

	usbPorts	= ports;

	if (serialPortPath != deviceParam) {
		for (var i=0;i<usbPorts.length;i++) {
			console.log('searching for usb comport FTDI ' + i + ' '+ usbPorts[i].manufacturer + ' ' +  usbPorts[i].comName);
			if (usbPorts[i].manufacturer == 'FTDI' || usbPorts[i].manufacturer == 'Prolific_Technology_Inc.') {
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
