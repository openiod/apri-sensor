/*
** Module: apri-sensor-bam1020
**
** Main module for handling sensor measurement data via serial port

** start: 
sudo node apri-sensor-bam1020/apri-sensor-bam1020.js /dev/ttyUSB0 19200
**
*/
"use strict"; // This is for your code to comply with the ECMAScript 5 standard.

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
var request = require('request');
var fs = require('fs');
const { SerialPort } = require("serialport")
const { ReadlineParser } = require('@serialport/parser-readline')
const exec = require('child_process').exec;

var redis = require("redis");

var redisClient = redis.createClient();
const { promisify } = require('util');
//const redisGetAsync 				= promisify(redisClient.get).bind(redisClient);
//const redisSetAsync 				= promisify(redisClient.set).bind(redisClient);
const redisHmsetHashAsync = promisify(redisClient.hmset).bind(redisClient);
const redisSaddAsync = promisify(redisClient.sadd).bind(redisClient);

redisClient.on("error", function (err) {
	console.log("Redis client Error " + err);
});


// **********************************************************************************

var siteProtocol = 'https://'
var openiodUrl = siteProtocol + 'openiod.org/' + apriConfig.systemCode; //SCAPE604';

var dataDir = "../config/";
var dataLastDateFile = dataDir + "bam1020_last_date.json";

var usbPorts = [];

var serialPortPath;
var serialBaudRate;

var deviceParam = process.argv[2];
var baudrateParam = process.argv[3];
console.log('Param for serial device is ' + deviceParam + ' ' + baudrateParam);
var sensorKey = '';
if (deviceParam != undefined) {
	serialPortPath = deviceParam;
	sensorKey = serialPortPath.substring(8);  // minus '/dev/tty'
	console.log('SensorKey = ' + sensorKey);
} else {
	serialPortPath = "/dev/ttyUSB0";
}
//var serialPortPath		= "/dev/cu.usbmodem1411";
//var serialPortPath		= "/dev/cu.usbserial-A1056661";
if (baudrateParam != undefined) {
	serialBaudRate = Number(baudrateParam);
} else {
	serialBaudRate = 19200 //38400; //9600;
}


var unit = {};

var loopStart;
var loopTime = 0; // ms

var sensors = {};
var reportType = 'DA'
var attrMapBam1020 = [
	, 'CONC_A'
	, 'Q_STD'
	, 'Q_ACT'
	, 'STAB'
	, 'REF'
	, 'FLOW'
	, 'CV'
	, 'AT'
	, 'BP'
	, 'TIME'
	, 'ERRORS'
]

// create headers to only use ones in the result files
var writeHeaders = true;
var headercsv = '"dateiso","pm25","pm10"\n';

var sensorFileName = 'bam1020-result';
var sensorFileExtension = '.csv';
var sensorLocalPathRoot = systemFolderParent
var resultsFolder = sensorLocalPathRoot + "/" + 'results/';

var today = new Date();
var dateString = today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate() + "_" + today.getHours(); // + ":" + today.getMinutes();
var resultsFileName = resultsFolder + sensorFileName + '_' + dateString;
var serialInput = ''

var mainProcess = function () {

	var dateFile = JSON.parse(fs.readFileSync(dataLastDateFile, { encoding: 'utf8' }))
	var lastDateIso = dateFile.lastDate  // yyyy-mm-ddThh:mm:ss
	var lastDateDate = new Date(lastDateIso)
	console.log(lastDateDate)
	//	var newDate = new Date(lastDateDate.getTime()+600000)   // plus 10 minutes
	//	var newDateIso = newDate.toISOString()
	//	console.log(newDateIso)

	console.log('Found usb comname: ' + serialPortPath);
	console.log('Reporttype: ' + reportType);

	//	var serialport = new SerialPort(serialPortPath, {parser: SerialPort.parsers.readline('\n')} );
	var serialport = new SerialPort({ path: serialPortPath, baudRate: serialBaudRate });
	//const parser = serialport.pipe(new ReadlineParser({ delimiter: '\n\r' }))
	/*
	serialport.on('open', function(){
		console.log('Serial Port connected');
		if (writeHeaders == true) writeHeaderIntoFile();
		// three times <enter> for activating communication on BAM1020
		// disconnect after couple of minutes
		// should respond with '*' as confirmation
		// may be won't work when BAM1020 not in main menu

//                serialport.write('\r\n\r\n\r\n')

//              serialport.write('')
//              serialport.write('\x1BRV \r')  // Firmware Version
//              serialport.write('\x1BH\r')  // esc menu command
//              serialport.write('\x1BPR 0\r')  // status overzicht

		// execute query Gesytec (Bayern-Hessen) Protocol
		serialport.write('\x02DA\r')


		serialport.on('data', function(data){
			serialInput+=data.toString()
			console.log('data ontvangen: "' + serialInput+'"')
			var _dataArray	= serialInput.split('\r');
			if (_dataArray.length>1) {
				serialInput=serialInput.substr(_dataArray[0].length+2)
				var _data = _dataArray[0]
//				if (_dataArray2.length == 2 && isNumeric(_dataArray2[0]) && isNumeric(_dataArray2[1]) ) {
//					console.log('measurement: ' + _dataArray2[0] + ' ' + _dataArray2[1]);
				processMeasurement(_data)
//				} else {
//					console.log('data fout: "' + serialInput+'"')
//				}
			} else {
				// console.log('data nog onvolledig: "' + serialInput+'"')
				return
			}
		});
	});
	*/
	serialport.on('open', function () {
		console.log('Serial Port connected');
		if (writeHeaders == true) writeHeaderIntoFile();

		// REPEAT TO RECONNECT TO THE BAM1020 !! disconnect after couple of minutes
		// 3-times enter to check communication with BAM1020
		// BAM1020 response is '*' when oke
		//alleen rs232 poort?           console.log('<enter><enter><enter> -> * ??')
		// next enter 'h' for menu with downloadable datasets
		// choose dataset from menu with corresponding character
		// menu: 3 - Display new data

		// menu: 6 csv reports
		// submenu is repsonse with last character '<'
		//  submenu 3: last data
		//  reponse: first line = station ID
		//    next: measurements and error bits

		//              serialport.write('\x1BRV \r')  // Firmware Version

		//reportType='menu'; serialport.write('\x1BH\r\n')  // esc menu command
		//reportType='menu'; serialport.write('\x1BH\r\n')  // esc menu command

		// reportType='PR';  serialport.write('\x1BPR 0\r')  // status overzicht
		// reportType='PR';  serialport.write('\x1BPR 1\r')  // data overzicht
		reportType = 'PR'; serialport.write('\x1BPR 1 8\r')  // data overzicht laatste 4 uren
		// reportType='PR';  serialport.write('\x1BPR 1 3\r')  // data overzicht laatste 4 uren
		// reportType='PR';  serialport.write('\x1BPR 2\r')  // error overzicht
		// reportType='PR';  serialport.write('\x1BPR 3\r')  // flow statistics
		// reportType='PR';  serialport.write('\x1BPR 4\r')  // 5-minute flow statistics


		//              serialport.write('\x1BPR 1 \r')  // data overzicht alles

		// reportType='DA';              serialport.write('\x02DA\r')  // status overzicht

		//              serialport.write('\x02DA001\r')  // status overzicht
		//              serialport.write('\x02DA  1\r')  // status overzicht
		//              serialport.write('\x02DA  1\r')  // status overzicht

		// next enter 'h' for menu with downloadable datasets
		// choose dataset from menu with corresponding character
		// menu: 3 - Display new data
		//reportType='menu'; serialport.write('h')
		//serialport.write('63')
		//              serialport.write('6\r\n')

		// menu: 6 csv reports
		// submenu is repsonse with last character '<'
		//  submenu 3: last data
		//  reponse: first line = station ID

		//    next: measurements and error bits
		// test
		////                serialport.write('\x1BPR 0\r')  // esc menu command
		//              serialport.write('\x02DA001\x0D')

		//            serialport.write('\r\n\r\n\r\n\r\n\r\n\r\n\r\n') // commando afsluitende enters?

		serialport.on('data', function (data) {
			serialInput += data.toString()
			// var tst=data.toString()
			// var tst2=tst.replace(/\n/g, "<-nl->");
			// var tst3=tst2.replace(/\r/g, "<-cr->");
			//      console.log('<data: "' + tst3+'" end data>')
			var _dataArray = serialInput.split('\r\n');
			var cont = true;
			while (cont == true) {
				if (_dataArray.length > 1) {
					var _data = _dataArray[0] // +'\r\n'  //data.toString().substr(0,data.length-1);
					processMeasurement(_data)
					serialInput = serialInput.substr(_dataArray[0].length + 2)
					_dataArray = serialInput.split('\r\n');
					//   console.log(''+ _data)
					continue
				}
				cont = false;
				if (_dataArray.length == 1) {
					// var _data = _dataArray[0] // +'\r\n'  //data.toString().substr(0,data.length-1);
					// processMeasurement(_data)
					// serialInput=''
					//   console.log('<rest>'+ _data+'<\\rest>')
				} else {
					console.log('data nog onvolledig: "' + serialInput + '"')
				}
			}
		});
		//serialport.on('readable', function () {
		//  console.log('Data:', serialport.read())
		//  console.log('Data is readable')
		//})
	});



	serialport.on('error', function (err) {
		console.log('Error: ', err.message);
	});
};

function isNumeric(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}

var processMeasurement = function (data) {
	/*
		var dataArray	= data.split(' ');
		//MD11
		// 001 -1500-02 82 00 001 000000
		// 002 +7116-01 82 00 001 000000
		// 003 +7015-01 82 00 001 000000
		// 004 -4065-03 82 00 001 000000
		// 005 +7976-01 82 00 001 000000
		// 006 +0000+00 82 40 001 000000
		// 007 +3238-02 82 00 001 000000
		// 008 +2099+01 82 00 001 000000
		// 009 +5352+01 82 00 001 000000
		// 010 +7595+02 82 00 001 000000
		// 011 +0000+00 82 00 001 000000
	
	
		var nrAttr = parseInt(dataArray[0].substring(3),10);
		var sensorId                     = sensorId; //getSensorId(sensorId);
		var measureMentTime              = new Date();
		for (var i=1;i<dataArray.length-6;i=i+6) {
			console.log(dataArray[i]+' '+dataArray[i+1]+' '+dataArray[i+2]+' '+dataArray[i+3]+' '+dataArray[i+4]+' '+dataArray[i+5])
		}
	*/
	if (reportType == 'menu') {
		console.log(data)
	}
	if (reportType == 'PR') {
		var _dataArray = serialInput.split(',');
		var datumTmp = _dataArray[0].split(':');
		if (datumTmp[1] == '00') {
			var refUg = parseFloat(_dataArray[10]);
			if (refUg != 0) {
				console.log(data)
				var datumTmp2 = datumTmp[0]
				var datumTmp3 = datumTmp2.split(' ')
				var datumTmp4 = datumTmp3[0].split('/')
				var datum = '20' + datumTmp4[2] + '-' + datumTmp4[1] + '-' + datumTmp4[0] + 'T' + datumTmp3[1] + ':00:00'
				var year = 2000 + parseInt(datumTmp4[2])
				var month = parseInt(datumTmp4[0]) - 1
				var day = parseInt(datumTmp4[1])
				var hour = parseInt(datumTmp3[1])
				var minute = 0
				var datum2 = new Date(year, month, day, hour, minute);
				var datumUtc = new Date(datum2.getTime() + datum2.getTimezoneOffset() * 60000);
				var pm25 = parseFloat(_dataArray[1]);
				var rHum = parseFloat(_dataArray[6]);
				var temperature = parseFloat(_dataArray[8]);
				//console.log('heel uur')
				var result = {
					datum: datum
					, datumUtc: datumUtc
					, pm25: pm25
					, rHum: rHum
					, temperature: temperature
					, refUg: refUg
				}
				console.log(result);
				writeResults(result);
			}
		} //else console.log(datum)
	}
	if (reportType == 'DA') {
		var dataArray = data.split(' ');
		//MD11
		// 001 -1500-02 82 00 001 000000
		// 002 +7116-01 82 00 001 000000
		// 003 +7015-01 82 00 001 000000
		// 004 -4065-03 82 00 001 000000
		// 005 +7976-01 82 00 001 000000
		// 006 +0000+00 82 40 001 000000
		// 007 +3238-02 82 00 001 000000
		// 008 +2099+01 82 00 001 000000
		// 009 +5352+01 82 00 001 000000
		// 010 +7595+02 82 00 001 000000
		// 011 +0000+00 82 00 001 000000

		var nrAttr = parseInt(dataArray[0].substring(3), 10);
		var sensorId = sensorId; //getSensorId(sensorId);
		var measureMentTime = new Date();
		var j = 0
		for (var i = 1; i < dataArray.length - 6; i = i + 6) {
			console.log(attrMapBam1020[j] + ':' +  //dataArray[i]+ //=address/seqencenr
				' value(as float):' + dataArray[i + 1] +
				' operation status:' + dataArray[i + 2] +
				' error status:' + dataArray[i + 3] +
				' serialnr:' + dataArray[i + 4] //+
				//   ' '+dataArray[i+5] // not in use
			)
			j++
		}
	}

	//writeResults(measureMentTime, data);

}

var writeHeaderIntoFile = function () {
	fs.appendFile(resultsFileName + '_pm' + sensorFileExtension, headercsv, function (err) {
		if (err != null) {
			console.log('Error writing results to file: ' + err);
		}
	});
	writeHeaders = false;
}

var writeResults = function (result) {
	console.log('Results: ' + result.datumUtc);

	sendData(result);
}

// send data to SOS service via OpenIoD REST service
var sendData = function (data) {
	var url = '';
	redisHmsetHashAsync(data.datumUtc.toISOString() + ':bam1020'
		, 'foi', 'SCRP' + unit.id
		, 'pm25', data.pm25
		, 'rHum', data.rHum
		, 'temperature', data.temperature
	)
		.then(function (res) {
			var _res = res;
			redisSaddAsync('new', data.datumUtc.toISOString() + ':bam1020')
				.then(function (res2) {
					var _res2 = res2;					//	redisSaddAsync('pmsa003', timeStamp.toISOString()+':pmsa003')
					console.log('bam1020 ', data.datumUtc.toISOString() + ':bam1020' + _res2);
				});
			console.log(data.datumUtc.toString() + ':bam1020' + _res);
		});
};

var getCpuInfo = function () {
	//hostname --all-ip-address
	exec("cat /proc/cpuinfo | grep Serial | cut -d ' ' -f 2", (error, stdout, stderr) => {
		if (error) {
			console.error(`exec error: ${error}`);
			return;
		}
		unit.id = stdout.substr(0, stdout.length - 1);
	});
	exec("cat /proc/cpuinfo | grep Hardware | cut -d ' ' -f 2", (error, stdout, stderr) => {
		if (error) {
			console.error(`exec error: ${error}`);
			return;
		}
		unit.hardware = stdout.substr(0, stdout.length - 1);
	});
	exec("cat /proc/cpuinfo | grep Revision | cut -d ' ' -f 2", (error, stdout, stderr) => {
		if (error) {
			console.error(`exec error: ${error}`);
			return;
		}
		unit.revision = stdout.substr(0, stdout.length - 1);
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
