/*
** Module: apri-sensor-solar
**
** Main module for handling sensor measurement data via serial port
**
*/
"use strict"; // This is for your code to comply with the ECMAScript 5 standard.

var path = require('path');
var startFolder	= __dirname;
var startFolderParent	= path.resolve(__dirname,'../..');
var configServerModulePath = startFolder + '/../apri-config/apri-config';
console.log("Start of Config Main ", configServerModulePath);
var apriConfig = require(configServerModulePath)

var systemFolder = __dirname;
var systemFolderParent = path.resolve(__dirname,'../..');
var systemFolderRoot = path.resolve(systemFolderParent,'..');
var systemModuleFolderName = path.basename(systemFolder);
var systemModuleName = path.basename(__filename);
var systemBaseCode = path.basename(systemFolderParent);

var initResult = apriConfig.init(systemModuleFolderName+"/"+systemModuleName);

// **********************************************************************************

// add module specific requires
var request = require('request');
var fs = require('fs');
const { SerialPort } = require("serialport")
const { ReadlineParser } = require('@serialport/parser-readline')
const exec = require('child_process').exec;

// **********************************************************************************

var siteProtocol = 'https://'
var openiodUrl = siteProtocol + 'openiod.org/' + apriConfig.systemCode; //SCAPE604';

var usbPorts = [];

var serialPortPath;
var serialBaudRate;

var deviceParam	= process.argv[2];
var baudrateParam	= process.argv[3];
console.log('Param for serial device is ' + deviceParam + ' ' + baudrateParam);
var sensorKey	= '';
if (deviceParam != undefined) {
	serialPortPath = deviceParam;
	sensorKey	= serialPortPath.substring(8);  // minus '/dev/tty'
	console.log('SensorKey = ' + sensorKey);
} else {
	serialPortPath		= "/dev/ttyACM0";
}
if (baudrateParam != undefined) {
  serialBaudRate = Number(baudrateParam);
} else {
  serialBaudRate = 115200;
}

var unit				= {};

var loopStart;
var loopTime			= 0; // ms

var sensors				= {};

// create headers to only use ones in the result files
var writeHeaders		= true;
var headercsv			= '"dateiso","xxx","yyy"\r\n';

var sensorFileName 		= 'solar-result';
var sensorFileExtension	= '.csv';
var sensorLocalPathRoot = systemFolderParent
var resultsFolder 		= sensorLocalPathRoot + "/" + 'results/';

var today				= new Date();
var dateString = today.getFullYear() + "-" + (today.getMonth()+1) + "-" +  today.getDate() + "_" + today.getHours(); // + ":" + today.getMinutes();
var resultsFileName = resultsFolder + sensorFileName + '_' + dateString;
var serialInput = ''

var mainProcess = function() {
  console.log('Found usb comname: ' + serialPortPath );

	var serialport = new SerialPort({path:serialPortPath, baudRate: serialBaudRate } );
  const parser = serialport.pipe(new ReadlineParser({ delimiter: '\r\n' }))
	parser.on('open', function(){
		console.log('Serial Port connected');
		if (writeHeaders == true) writeHeaderIntoFile();
	});
	parser.on('data', function(data){
		//console.log(data)
		var _dataArray	= data.split(';');
		if (_dataArray.length == 7) {
			var inputOK=false
			var inRec={}
			for (var i=0; i<_dataArray.length;i++) {
				var inputAttr = _dataArray[i].split(':')
				if (input.length=2) {
					var attrName=inputAttr[0]
					if (isNumeric(inputAttr[1])) {
						inRec[attrName]=parseFloat(inputAttr[1])
					} else inRec[attrName]=undefined
				} else break
			}
			if (
				inRec.irradiance!=undefined &&
				inRec.raw!=undefined &&
				inRec.amplified!=undefined &&
				inRec.sensor!=undefined &&
				inRec.offset!=undefined &&
				inRec.Vfactor!=undefined &&
				inRec.s!=undefined
			) {
				processMeasurement(inRec)
			} else {
				console.log('data attr fout : "' + data+'"')
			}
		} else {
				console.log('data fout: "' + data+'"')
		}
	});
	serialport.on('error', function(err) {
		console.log('Error: ', err.message);
	});
};

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

var processMeasurement = function(data) {
	data.sensorId= sensorId;
	data.observationDate= new Date();
  writeResults(data);
}

var writeHeaderIntoFile = function() {
	fs.appendFile(resultsFileName + '_pm' + sensorFileExtension, headercsv, function (err) {
		if (err != null) {
			console.log('Error writing results to file: ' + err);
		}
	});
	writeHeaders	= false;
}

var writeResults	= function(dataIn) {
	var data			= {};
	data.foi				= 'SCRP' + dataIn.sensorId;


	data.observation=
	 'irradiance:' + dataIn.irradiance +
	 ',raw:' + dataIn.raw +
	 ',amplified:' + dataIn.amplified +
	 ',sensor:' + dataIn.sensor +
	 ',offset:' + dataIn.offset +
	 ',Vfactor:' + dataIn.Vfactor +
	 ',s:' + dataIn.s

//	fs.appendFile(resultsFileName + sensorFileExtension, recordOut, function (err) {
//		if (err != null) {
//			console.log('Error writing results to file: ' + err);
//		}
//	});

	sendData(data);
}

// send data to SOS service via OpenIoD REST service
var sendData = function(data) {

//write to Redis database!!
return

// oud //		http://openiod.com/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&inputformat=insertom&objectid=humansensor&format=xml
// oud //			&region=EHV		&lat=50.1		&lng=4.0		&category=airquality		&value=1

//http://localhost:4000/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertom&sensorsystem=scapeler_solar&offering=offering_0439_initial&verbose=true&commit=true&observation=scapeler_solar:12.345&neighborhoodcode=BU04390402
//https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertom&sensorsystem=scapeler_solar&offering=offering_0439_initial&verbose=true&commit=true&observation=scapeler_solar_pm25:12345,scapeler_solar_pm10:345&neighborhoodcode=BU04390402

		var _url = openiodUrl + '/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertom';
		_url = _url +
		  '&foi=' + data.foi +
		  '&observation=' + data.observation ;

		console.log(_url);
		return
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

mainProcess()
