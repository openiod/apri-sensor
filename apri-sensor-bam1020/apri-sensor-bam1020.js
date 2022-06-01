/*
** Module: apri-sensor-bam1020
**
** Main module for handling sensor measurement data via serial port
**
*/
"use strict"; // This is for your code to comply with the ECMAScript 5 standard.

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
var request 		= require('request');
var fs 					= require('fs');
const { SerialPort } 	= require("serialport")
const { ReadlineParser } = require('@serialport/parser-readline')
const exec 			= require('child_process').exec;

// **********************************************************************************

var siteProtocol 		= 'https://'
var openiodUrl			= siteProtocol + 'openiod.org/' + apriConfig.systemCode; //SCAPE604';

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
	serialPortPath		= "/dev/ttyUSB0";
}
//var serialPortPath		= "/dev/cu.usbmodem1411";
//var serialPortPath		= "/dev/cu.usbserial-A1056661";

var unit				= {};

var loopStart;
var loopTime			= 0; // ms

var sensors				= {};

// create headers to only use ones in the result files
var writeHeaders		= true;
var headercsv			= '"dateiso","pm25","pm10"\n';

var sensorFileName 		= 'bam1020-result';
var sensorFileExtension	= '.csv';
var sensorLocalPathRoot = systemFolderParent
var resultsFolder 		= sensorLocalPathRoot + "/" + 'results/';

var today				= new Date();
var dateString = today.getFullYear() + "-" + (today.getMonth()+1) + "-" +  today.getDate() + "_" + today.getHours(); // + ":" + today.getMinutes();
var resultsFileName = resultsFolder + sensorFileName + '_' + dateString;
var serialInput = ''

var mainProcess = function() {
	console.log('Found usb comname: ' + serialPortPath );

//	var serialport = new SerialPort(serialPortPath, {parser: SerialPort.parsers.readline('\n')} );
	var serialport = new SerialPort({path:serialPortPath, baudRate: 9600 } );
	//const parser = serialport.pipe(new ReadlineParser({ delimiter: '\n\r' }))
	serialport.on('open', function(){
		console.log('Serial Port connected');
		if (writeHeaders == true) writeHeaderIntoFile();

		// REPEAT TO RECONNECT TO THE BAM1020 !! disconnect after couple of minutes
		// 3-times enter to check communication with BAM1020
		// BAM1020 response is '*' when oke
		console.log('<enter><enter><enter> -> * ??')
		serialport.write('\n\n\n')
		// next enter 'h' for menu with downloadable datasets
		// choose dataset from menu with corresponding character
		// menu: 3 - Display new data

		// menu: 6 csv reports
		// submenu is repsonse with last character '<'
		//  submenu 3: last data
		//  reponse: first line = station ID
    //    next: measurements and error bits

		serialport.on('data', function(data){
			serialInput+=data.toString()
			var _dataArray	= serialInput.split('\r\n');
			if (_dataArray.length>1) {
				serialInput=serialInput.substr(_dataArray[0].length+2)
				var _data = _dataArray[0] //data.toString().substr(0,data.length-1);
				var _dataArray2	= _data.split(',');
				if (_dataArray2.length == 2 && isNumeric(_dataArray2[0]) && isNumeric(_dataArray2[1]) ) {
					console.log('measurement: ' + _dataArray2[0] + ' ' + _dataArray2[1]);
					processMeasurement(_dataArray2)
				} else {
					console.log('data fout: "' + serialInput+'"')
				}
			} else {
				// console.log('data nog onvolledig: "' + serialInput+'"')
				return
			}
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

	var measureMentTime		= new Date();
	writeResults(measureMentTime, data);

}

var writeHeaderIntoFile = function() {
	fs.appendFile(resultsFileName + '_pm' + sensorFileExtension, headercsv, function (err) {
		if (err != null) {
			console.log('Error writing results to file: ' + err);
		}
	});
	writeHeaders	= false;
}

var writeResults	= function(measureTime, dataIn) {
	console.log('Results: ' + measureTime.toISOString() );

	var data			= {};
	data.neighborhoodCode	= 'BU04390603'; //geoLocation.neighborhoodCode;
	data.foi				= 'SCRP' + unit.id;
	if (sensorKey != '') {
		data.foi	+= '_' + sensorKey;
	}

	var pm25				= dataIn[0];
	var pm10				= dataIn[1];

	var recordOut 			= measureTime.toISOString() + ',' + pm25 + ',' + pm10 + '\n';

	fs.appendFile(resultsFileName + sensorFileExtension, recordOut, function (err) {
		if (err != null) {
			console.log('Error writing results to file: ' + err);
		}
	});

	data.categories			= [];
	data.observation		= 'pm25:'+pm25+','+'pm10:'+pm10 ;

	sendData(data);
}

// send data to SOS service via OpenIoD REST service
var sendData = function(data) {
// oud //		http://openiod.com/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&inputformat=insertom&objectid=humansensor&format=xml
// oud //			&region=EHV		&lat=50.1		&lng=4.0		&category=airquality		&value=1

//http://localhost:4000/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertom&sensorsystem=scapeler_bam1020&offering=offering_0439_initial&verbose=true&commit=true&observation=scapeler_bam1020:12.345&neighborhoodcode=BU04390402
//https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertom&sensorsystem=scapeler_bam1020&offering=offering_0439_initial&verbose=true&commit=true&observation=scapeler_bam1020_pm25:12345,scapeler_bam1020_pm10:345&neighborhoodcode=BU04390402

		var _url = openiodUrl + '/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertom';
		_url = _url +
		  '&foi=' + data.foi +
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

/*
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
*/

mainProcess()
