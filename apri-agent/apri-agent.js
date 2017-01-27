/*
** Module: apri-agent
**
** Main system module for handling sensor system configuration and updates 
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
const request 			= require('request');
//var express 			= require('express');
const SerialPort 			= require('serialport');
const fs 					= require('fs');
const io	 				= require('socket.io-client');
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

var unit				= {}; //hardware unit, serial id, etc.
var macAddress			= {};
// USB ports
var usbPorts			= [];
var ipAddress			= '';
var wifiScan			= {};

/*
var serialPortPath		= "/dev/cu.usbmodem1411";
//var serialPortPath		= "/dev/cu.usbmodem1421";
//var serialPortPath		= "/dev/cu.wchusbserial1440";
//var serialPortPath              = "/dev/ttyACM1";
//var serialPortPath              = "/dev/ttyACM2";
//var serialPortPath              = "/dev/cu.usbserial-A1056661";  // manufacturer = 'FTDI' == Dylos



var sensorLocalPathRoot = systemFolderParent + '/sensor/';
var fileFolder 			= 'openiod-v1';


var serialport = new SerialPort(serialPortPath, {parser: SerialPort.parsers.readline('\n')} );
serialport.on('open', function(){
	console.log('Serial Port connected');
	serialport.on('data', function(data){
		var _dataArray	= data.split(';');
		if (_dataArray.length == 3 && isNumeric(_dataArray[0]) && isNumeric(_dataArray[1]) && isNumeric(_dataArray[2])) {
			//console.log('measurement: ' + data);
			//processMeasurement(_dataArray);
		} else {
			console.log('log: ' + data);
		}
	});
});
serialport.on('error', function(err) {
  console.log('Error: ', err.message);
});

*/

// send data to SOS service via OpenIoD REST service
var sendData = function(data) {
// oud //		http://openiod.com/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&inputformat=insertom&objectid=humansensor&format=xml
// oud //			&region=EHV		&lat=50.1		&lng=4.0		&category=airquality		&value=1

//http://localhost:4000/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertom&sensorsystem=scapeler_shinyei&offering=offering_0439_initial&verbose=true&commit=true&observation=scapeler_shinyei:12.345&neighborhoodcode=BU04390402
//https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertom&sensorsystem=scapeler_shinyei&offering=offering_0439_initial&verbose=true&commit=true&observation=scapeler_shinyei:12.345&neighborhoodcode=BU04390402

		var _url = openiodUrl + '/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertom&sensorsystem=scapeler_barometer&offering=offering_0439_initial&commit=true';
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

var getUsbPorts	= function() {
	SerialPort.list(function(err, ports) {
		usbPorts	= ports;
		//console.log('The usb ports of this system are: ');
		//for (var i=0;i<usbPorts.length;i++) {
		//	console.log(usbPorts[i]);
		//} 
	});
}

var getMacAddress	= function(networkInterface) {
	var fileName	= '/sys/class/net/' + networkInterface + '/address';
	fs.readFile(fileName, "utf8", function (err, data) {
        if (err) {
			macAddress[networkInterface]	= null;
			console.log('Error reading file for macaddress network interface: ' + networkInterface);
		};
        macAddress[networkInterface]	= data.substr(0,data.length-1);
		console.log('MAC-Address network interface: ' + networkInterface + '  ' + data);
	});
}
var getWifiScanInfo	= function(iface) {

	//hostname --all-ip-address
	exec('iwlist '+iface+' scan', (error, stdout, stderr) => {
		if (error) {
			console.error(`exec error: ${error}`);
			return;
		}
		wifiScan[iface]	= "" + stdout;
//		console.log(`stderr: ${stderr}`);	
	});
}

var getIpAddress	= function() {
	//hostname --all-ip-address
	exec('hostname --all-ip-address', (error, stdout, stderr) => {
		if (error) {
			console.error(`exec error: ${error}`);
			return;
		}
		var stdoutArray	= stdout.split('\n');
		ipAddress = stdoutArray[0];
//		console.log(`stderr: ${stderr}`);	
	});
};

var updateSoftware	= function() {
	const child = execFile(startFolder+'/apri-sensor-update.sh', [], (error, stdout, stderr) => {
		if (error) {
			throw error;
		}
		console.log(new Date().toISOString() + ': ' + stdout);
	});
};



var socket = io(socketUrl, {path:socketPath}); 

socket.on('connect', function (socket) {
	var currTime = new Date();
	console.log(currTime +': connected with socketio server');
	startConnection();
});
socket.on('connected', function (data) {
	var currTime = new Date();
	console.log(currTime +': connected with socketio server: ' + data.message);
});

socket.on('disconnect', function() {
	console.log('Disconnected from web-socket ');
});

	socket.on('info', function(data) {
		console.log('websocket info '+ data);
		//io.sockets.emit('aireassignal', { data: data } );
		//socket.broadcast.emit('aireassignal', { data: data } );
	});
	socket.on('apriAgentMsg', function(data) {
		console.log('Apri Agent message: '+ data);
	});
	socket.on('apriAgentBoot', function(data) {  // pong message from socket.io server
		console.log('Apri Agent Manager pong succeeded, response: ');
		console.dir(data);
	});
	socket.on('apriAgentAction', function(data) {  // pong message from socket.io server
		console.log('Apri Agent Manager action recieved: ' + data.action);
		//console.dir(data);
	});
	socket.on('apriAgentPing', function(data) {
        console.log('ApriAgent Ping message recieved ');
		socket.emit('apriAgentPong', data ); // pong, return message. 
    });
	socket.on('apriAgentPong', function(data) {
        console.log('ApriAgent Pong message recieved ');
    });


getCpuInfo();
getMacAddress('wlan0');
getIpAddress();
getUsbPorts();
getWifiScanInfo('wlan0');
getWifiScanInfo('wlan1');
updateSoftware();



var startConnection	= function() {
	// start communication with Apri Agent Manager
	console.log('Boot Apri Agent');
	//console.log(socket);
	if (socket.connected == true) {
		console.log('Socket is connected');
	} else {
		console.log('Socket is NOT connected');
	}
	socket.emit('apriAgentBoot', 
		{"action":"boot"
		, "macAddress": macAddress
		, "usbPorts": usbPorts
		, "ipAddress": ipAddress
		, "unit": unit	
		, "wifiScan": wifiScan
		}
	);
}
