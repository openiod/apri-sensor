/*
** Module: apri-agent
**
** Main system module for handling sensor system configuration and updates
**
*/

"use strict"; // This is for your code to comply with the ECMAScript 5 standard.

// activate init process config-main
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
//const request 			= require('request');
//var express = require('express');
//const SerialPort 		= require('serialport');
const fs = require('fs');
const io = require('socket.io-client');
const exec = require('child_process').exec;
const execSync = require('child_process').execSync;
const execFile = require('child_process').execFile;


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
socketUrl = 'https://openiod.org'; socketPath = '/' + apriConfig.systemCode + '/socket.io';

//test:
//		socketPort	= 3010; socketUrl 	= ':'+socketPort;
//		socketPath	= apriConfig.urlSystemRoot + '/socket.io';


console.log('web-socket url: ' + socketUrl + socketPath);

//var secureSite = true;
//var siteProtocol = secureSite ? 'https://' : 'http://';
//var openiodUrl = siteProtocol + 'openiod.org/' + apriConfig.systemCode; //SCAPE604';

var unit = {}; //hardware unit, serial id, etc.
var macAddress = {};
// USB ports
var usbPorts = [];
var ipAddress = '';
var wifiScan = {};

var menuUrl;
var localServer = {};
localServer.ConfigMenu = {};

//var initMenu = function () {
//	console.log('Init menu');
//	localServer.ConfigMenu["main"] = '<http><body><h1>Hoofdmenu</h1><br/><a href="' + menuUrl + '?menu=wifi">WiFi configuratie</a></body></http>';
//	localServer.ConfigMenu["wifi"] = '<http><body><h1>WiFi menu</h1><br/><a href="' + menuUrl + '?menu=wifi">WiFi configuratie</a></body></http>';
//}

var startActionReboot = function () {
	exec("reboot", (error, stdout, stderr) => {
		if (error) {
			console.error(`exec error: ${error}`);
			return;
		}
		unit.id = stdout.substr(0, stdout.length - 1);
	});
}

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
	exec("cat /sys/class/thermal/thermal_zone0/temp", (error, stdout, stderr) => {
		if (error) {
			console.error(`exec error: ${error}`);
			return;
		}
		var tempStr = stdout.substr(0, stdout.length - 1);
		var tempValue = parseFloat(tempStr);
		if (!isNaN(tempValue)) unit.cputemperature = tempValue / 1000;
	});
};

var getMacAddress = function (networkInterface) {
	var fileName = '/sys/class/net/' + networkInterface + '/address';
	fs.readFile(fileName, "utf8", function (err, data) {
		if (err || data == undefined) {
			macAddress[networkInterface] = null;
			console.log('Network interface not available: ' + networkInterface);
			return;
		};
		macAddress[networkInterface] = data.substr(0, data.length - 1);
		console.log('MAC-Address network interface: ' + networkInterface + '  ' + data);
	});
}
var getWifiScanInfo = function (iface, callback) {

	//hostname --all-ip-address
	exec('iwlist ' + iface + ' scan', (error, stdout, stderr) => {
		if (error) {
			wifiScan[iface] = "";
			return;
		}
		wifiScan[iface] = "" + stdout;

		if (callback != undefined) {
			callback(iface, stdout);
		}
	});
}
/*
var save99UsbSerialRules = function () {
	//	99-usb-serial.rules
	var content = '';
	var result;
	var file = '/etc/udev/rules.d/99-usb-serial.rules';
	if (unit.id == '0000000098e6a65d') { // Aalten
		console.log('save usb rules for unit ' + unit.id);
		content = 'SUBSYSTEM=="tty", ATTRS{idVendor}=="2341", ATTRS{idProduct}=="0042", SYMLINK+="ttyArduinoMega", MODE:="0666" \n';
		fs.writeFileSync(file, content);
		try {
			console.log('Activate usb rules');
			result = execSync('udevadm trigger');  // activate usb rules
		} catch (e) {
			console.log("Errors:", e);
		}
		console.log('     usb rules for unit ' + unit.id + ' saved and activated.');
	}
	//	if (unit.id == '00000000b7e92a99' || unit.id == '00000000ac35e5d3') {  //'s-Gravenpolder  2x
	if (unit.id == '00000000b7e92a99' || unit.id == '00000000b7710419') {  //'s-Gravenpolder  2x
		console.log('save usb rules for unit ' + unit.id);
		content = 'SUBSYSTEM=="tty", ATTRS{idVendor}=="2341", ATTRS{idProduct}=="0042", SYMLINK+="ttyArduinoMega", MODE:="0666" \n' +
			'SUBSYSTEM=="tty", ATTRS{idVendor}=="0403", ATTRS{idProduct}=="6001", ATTRS{serial}=="AL02V14T", SYMLINK+="ttyDC1100", MODE:="0666" \n' +
			'SUBSYSTEM=="tty", ATTRS{idVendor}=="0403", ATTRS{idProduct}=="6001", ATTRS{serial}=="AJ03KNV9", SYMLINK+="ttyDC1700", MODE:="0666" \n' +
			'SUBSYSTEM=="tty", ATTRS{idVendor}=="0403", ATTRS{idProduct}=="6001", ATTRS{serial}=="AL00DIQS", SYMLINK+="ttyTSI3007", MODE:="0666" \n' +
			'SUBSYSTEM=="tty", ATTRS{idVendor}=="1a86", ATTRS{idProduct}=="7523", SYMLINK+="ttyCOMBI1", MODE:="0666" \n';
		fs.writeFileSync(file, content);
		try {
			console.log('Activate usb rules');
			result = execSync('udevadm trigger');  // activate usb rules
		} catch (e) {
			console.log("Errors:", e);
		}
		console.log('     usb rules for unit ' + unit.id + ' saved and activated.');
	}
	if (unit.id == '00000000479e571b') {  // Valkenburg
		console.log('save usb rules for unit ' + unit.id);
		content = 'SUBSYSTEM=="tty", ATTRS{idVendor}=="0403", ATTRS{idProduct}=="6001", ATTRS{serial}=="AL03GQBB", SYMLINK+="ttyDC1700PM", MODE:="0666" \n';
		fs.writeFileSync(file, content);
		try {
			console.log('Activate usb rules');
			result = execSync('udevadm trigger');  // activate usb rules
		} catch (e) {
			console.log("Errors:", e);
		}
		console.log('     usb rules for unit ' + unit.id + ' saved and activated.');
	}
	//if (unit.id == '00000000b7710419' || unit.id == '000000004659c5bc') { // || unit.id == '0000000098e6a65d') {  // Purmerend / Aalten
	if (unit.id == '000000004659c5bc') { // || unit.id == '0000000098e6a65d') {  // Purmerend / Aalten
		console.log('save usb rules for unit ' + unit.id);
		content =
			'SUBSYSTEM=="tty", ATTRS{idVendor}=="1a86", ATTRS{idProduct}=="7523", SYMLINK+="ttyCOMBI2MICS6814", MODE:="0666" \n' +
			'SUBSYSTEM=="tty", ATTRS{idVendor}=="2341", ATTRS{idProduct}=="0042", SYMLINK+="ttyArduinoMega", MODE:="0666" \n';
		// ATTRS{serial}=="Arduino__www.arduino.cc__0042_556393135333519071C2"
		fs.writeFileSync(file, content);
		try {
			console.log('Activate usb rules');
			result = execSync('udevadm trigger');  // activate usb rules
		} catch (e) {
			console.log("Errors:", e);
		}
		console.log('     usb rules for unit ' + unit.id + ' saved and activated.');
	}

	file = startFolderParent + '/config/apri-sensor-usb.json';
	// /dev/ttyACM0
	if (unit.id == '0000000098e6a65d') { //  Aalten
		console.log('save usb config for unit ' + unit.id);
		content =
			'{"apri-sensor-combi2": {"comName": "/dev/ttyACM0"} }\n';
		fs.writeFileSync(file, content);
		console.log('     usb config for unit ' + unit.id + ' saved.');
	}
}
*/

/*
var saveSystemServices = function () {


	if (unit.id == '0000000098e6a65d') {   // Aalten
		disableServices('apri-sensor-combi2', '');
		createService('apri-sensor-combi2', 'ArduinoMega');
		//		createService('apri-sensor-combi2','ACM0');
	}

	if (unit.id == '000000004659c5bc') {  //test 2e MICS6814 sensor
		disableServices('apri-sensor-combi-1', '');
		disableServices('apri-sensor-combi2', '');
		//		createService('apri-sensor-combi2','ArduinoMega');
		createService('apri-sensor-combi2', 'COMBI2MICS6814');
	}
	if (unit.id == '00000000b7e92a99' || unit.id == '00000000b7710419') {  //'s-Gravenpolder  2e is voor test
		disableServices('apri-sensor-dylos', '');  // met de tweede parameter kan een extra filter worden toegepast bijv. '_' om alleen dylos_DCxxx te selecteren
		disableServices('apri-sensor-combi2', '');
		disableServices('apri-sensor-tsi3007', '');
		disableServices('apri-sensor-connector', '');
		createService('apri-sensor-combi2', 'ACM0'); // ArduinoMega werkt hier (nog) niet, in Aalten wel! ?
		createService('apri-sensor-dylos', 'DC1100');
		createService('apri-sensor-dylos', 'DC1700');
		createService('apri-sensor-tsi3007', 'TSI3007');
		createService('apri-sensor-connector', '');

	}
}

var disableServices = function (sensor, separator) {
	var services;
	var stdout;
	//	ls /etc/systemd/system/SCAPE604-apri-sensor-dylos*
	try {
		stdout = execSync('ls /etc/systemd/system/' + apriConfig.systemCode + '-' + sensor + separator + '*.service');
	} catch (e) {
		//    	console.log("Errors:", e);
		console.log('No service available to revoke for ' + apriConfig.systemCode + '-' + sensor + '*.service');
		return;
	}
	console.log('Revoke services:');
	//	console.log(stdout);
	services = stdout.toString().split('\n');
	console.log(services.length);
	for (i = 0; i < services.length - 1; i++) {
		var service = services[i].split('/')[4];
		console.log(service);
		revokeService(service);
	}

}

var revokeService = function (service) {
	var result;

	try {
		console.log('Stop service ' + service);
		result = execSync('systemctl stop ' + service);
	} catch (e) {
		console.log("Errors:", e);
	}
	try {
		console.log('Disable service ' + service);
		result = execSync('systemctl disable /etc/systemd/system/' + service);
	} catch (e) {
		console.log("Errors:", e);
	}
	try {
		console.log('Remove service ' + service);
		result = execSync('rm /etc/systemd/system/' + service);
	} catch (e) {
		console.log("Errors:", e);
	}

}

var createService = function (sensor, sensorKey) {
	var file;
	var content;
	console.log('save ' + sensor + ' service for unit ' + unit.id + ' and device ' + sensorKey);
	content =
		'[Unit]\n' +
		'Desription=' + apriConfig.systemCode + '-' + sensor + ' - start or restart ' + sensor + ' ' + sensorKey + ' service, respawn\n' +
		'After=network.target\n' +
		'[Service]\n' +
		'ExecStart=/opt/' + apriConfig.systemCode + '/apri-sensor/' + sensor + '/' + sensor + '.sh /opt/' + apriConfig.systemCode + '/log/' + apriConfig.systemCode + '-' + sensor + '_' + sensorKey + '.log /dev/tty' + sensorKey + ' \n' +
		'Restart=always\n' +
		'[Install]\n' +
		'WantedBy=multi-user.target';
	file = '/etc/systemd/system/' + apriConfig.systemCode + '-' + sensor + '_' + sensorKey + '.service';
	fs.writeFileSync(file, content);
	console.log('     ' + sensor + ' service for unit ' + unit.id + ' and device ' + sensorKey + ' saved. ');
	console.log('enable ' + sensor + ' service for unit ' + unit.id + ' and device ' + sensorKey);
	exec('systemctl enable ' + apriConfig.systemCode + '-' + sensor + '_' + sensorKey + '.service', (error, stdout, stderr) => {
		if (error) {
			console.error(`exec error: ${error}`);
			return;
		}
		exec('systemctl start ' + apriConfig.systemCode + '-' + sensor + '_' + sensorKey + '.service', (error, stdout, stderr) => {
			if (error) {
				console.error(`exec error: ${error}`);
				return;
			}
		});
	});
}
*/

/*
var getUsbInfo = function (device, callback) {
	exec('udevadm info -a -p $(udevadm info -q path -n ' + device + ')', (error, stdout, stderr) => {
		if (error) {
			console.error(`exec error: ${error}`);
			return;
		}

		if (callback != undefined) {
			callback(device, stdout);
		}
	});
}
*/

var getLsUsbInfo = function (data, callback) {
	exec(data.command, (error, stdout, stderr) => {
		if (error) {
			console.error(`exec error: ${error}`);
			return;
		}
		if (callback != undefined) {
			callback(stdout);
		}
	});
}
var getLsUsbvInfo = function (callback) {
	exec('lsusb -v', (error, stdout, stderr) => {
		if (error) {
			console.error(`exec error: ${error}`);
			return;
		}
		if (callback != undefined) {
			callback(stdout);
		}
	});
}

var getCmd = function (data, callback) {
	console.log('execute command: ' + data.command)
	if (data.command != undefined) {
		exec(data.command, (error, stdout, stderr) => {
			if (error) {
				console.error(`exec error: ${error}`);
				return;
			}
			if (callback != undefined) {
				callback(stdout);
			}
		});
	}
}

var getIpAddress = function () {
	exec('hostname --all-ip-address', (error, stdout, stderr) => {
		if (error) {
			console.error(`exec error: ${error}`);
			return;
		}
		var stdoutArray = stdout.split('\n');
		ipAddress = stdoutArray[0];
	});
};

var updateSoftware = function () {
	const child = execFile(startFolder + '/apri-sensor-update.sh', [], (error, stdout, stderr) => {
		if (error) {
			throw error;
		}
		var logDate = "" + new Date().toISOString();
		console.log(logDate + ': ' + stdout);
	});
};

var checkVarLogSize = function () {

	const child = execFile("df | grep /var/log | awk '{print $5}' ", [], (error, stdout, stderr) => {
		let cleanUp = false
		let size = 0
		if (error) {
			throw error;
		}
		let logDate = "" + new Date().toISOString();
		let p = stdout.split('%')
		if (p.length == 2) {
			let size = Number(p[0])
			if (size > 75) {
				cleanUp = true
			}
		} else cleanUp = true
		if (cleanUp == true) {
			unit.idShort= unit.id.substring(str.length - 4).toUpperCase()
			console.log(logDate + ': cleanUp activated for ' + unit.idShort + ' with /var/log at ' + size + '%');
			//const child = execFile("rm /var/log/* ; rm /var/log/aprisensor/* ; rm /etc/NetworkManager/system-connections/" + idShort+'-* ', [], (error, stdout, stderr) => {
			//});
		}
	});
}

var sendClientWifiInfo = function (iface, stdout) {
	socket.emit('apriClientActionResponse',
		{
			"action": "getClientWifiInfo"
			, "unit": unit
			, "device": iface
			, "wifiScan": stdout
		}
	);
}

var sendClientUsbInfo = function (device, stdout) {
	console.log('Send apriClientActionResponse for device %s', device);
	socket.emit('apriClientActionResponse',
		{
			"action": "getClientUsbInfo"
			, "unit": unit
			, "device": device
			, "usbInfo": stdout
		}
	);
}
var sendClientLsUsbInfo = function (stdout) {
	console.log('Send apriClientActionResponse');
	console.log(stdout);
	socket.emit('apriClientActionResponse',
		{
			"action": "getClientLsUsbInfo"
			, "unit": unit
			, "usbInfo": stdout
		}
	);
}
var sendSocketBinary = function (data) {
	//console.log('Send socket binary');
	var bufArr = new ArrayBuffer(data.length);
	var bufView = new Uint8Array(bufArr);
	for (var i = 0; i < data.length; i++) {
		bufView[i] = data.charCodeAt(i);
	}
	socket.emit('apriSocketBinary', bufArr);
}

var sendClientLsUsbvInfo = function (stdout) {
	//console.log('Send apriClientActionResponse');
	socket.emit('apriClientActionResponse',
		{
			"action": "getClientLsUsbvInfo"
			, "unit": unit
			, "usbInfo": 'Next socket binary data response' // stdout
		}
	);
	sendSocketBinary(stdout);
}

var sendClientCmd = function (data) {
	//console.log('Send apriClientCmdResponse');
	socket.emit('apriClientCmdResponse',
		{
			"action": "getClientCmd"
			, "unit": unit
			, "usbInfo": 'Next socket binary data response' // stdout
		}
	);
	sendSocketBinary(data);
}

var socket = io(socketUrl, { path: socketPath });

socket.on('connect', function (socket) {
	var currTime = new Date();
	//console.log(currTime + ': connected with socketio server');
	startConnection();
});
socket.on('connected', function (data) {
	var currTime = new Date();
	//console.log(currTime + ': connected with socketio server: ' + data.message);
});

socket.on('disconnect', function () {
	//console.log('Disconnected from web-socket ');
});

socket.on('info', function (data) {
	//console.log('websocket info: ');
	/*
		try {
			var dataStr = JSON.stringify(data);
			console.log(dataStr);
		}
		catch (err) {
			console.dir(data);
		}
	*/
	//io.sockets.emit('aireassignal', { data: data } );
	//socket.broadcast.emit('aireassignal', { data: data } );
});
socket.on('apriAgentMsg', function (data) {
	//console.log('Apri Agent message: ' + data);
});
socket.on('apriAgentBoot', function (data) {  // pong message from socket.io server
	//console.log('Apri Agent Manager pong succeeded, response: ');
});
socket.on('apriAgentAction', function (data) {  // pong message from socket.io server
	//console.log('Apri Agent Manager action recieved: ' + data.action);
});
socket.on('apriClientAction', function (data) {  // pong message from socket.io server
	//console.log('Apri Agent Manager action recieved: ' + data.action);
	if (data.action == 'getClientWifiInfo') {
		getWifiScanInfo('wlan0', sendClientWifiInfo);
		getWifiScanInfo('wlan1', sendClientWifiInfo);
	}
	//if (data.action == 'getClientUsbInfo') {
	//getUsbInfo('/dev/ttyUSB0', sendClientUsbInfo);
	//getUsbInfo('/dev/ttyUSB1', sendClientUsbInfo);
	//getUsbInfo('/dev/ttyArduinoMega', sendClientUsbInfo);
	//save99UsbSerialRules();
	//saveSystemServices();
	//}
	if (data.action == 'getClientLsUsbInfo') {
		getLsUsbInfo(data, sendClientLsUsbInfo);
	}
	if (data.action == 'getClientCmd') {
		getCmd(data, sendClientCmd);
	}
	if (data.action == 'getClientLsUsbvInfo') {
		getLsUsbvInfo(sendClientLsUsbvInfo);
	}
	if (data.action == 'reboot') {
		startActionReboot();
	}
});
socket.on('apriAgentPing', function (data) {
	//console.log('ApriAgent Ping message recieved ');
	socket.emit('apriAgentPong', data); // pong, return message.
});
socket.on('apriAgentPong', function (data) {
	//console.log('ApriAgent Pong message recieved ');
});


getCpuInfo();
getMacAddress('wlan0');
getIpAddress();
getWifiScanInfo('wlan0');
getWifiScanInfo('wlan1');
updateSoftware();



var startConnection = function () {
	// start communication with Apri Agent Manager
	console.log('Boot Apri Agent');
	//console.log(socket);
	if (socket.connected == true) {
		console.log('Socket is connected');
	} else {
		console.log('Socket is NOT connected');
	}
	socket.emit('apriAgentBoot',
		{
			"action": "boot"
			, "macAddress": macAddress
			, "usbPorts": usbPorts
			, "ipAddress": ipAddress
			, "unit": unit
			, "wifiScan": wifiScan
		}
	);
}

/*
console.log('Start web-application handling');
app.all('/*', function (req, res, next) {
	console.log("app.all/: " + req.url + " ; systemCode: " + apriConfig.systemCode);
	console.log('Init menu ?????');
	console.log(localServer.ConfigMenu);
	if (localServer.ConfigMenu.main == undefined) {
		menuUrl = 'http://' + req.headers.host + '/' + apriConfig.systemCode + '/menu';
		initMenu();
		console.log('YES init menu! ');
		console.dir(localServer.ConfigMenu);
	} else {
		console.log('NO init menu! (already done?)');
	}

	//  res.header("Access-Control-Allow-Origin", "*");
	//  res.header("Access-Control-Allow-Headers", "X-Requested-With");
	next();
});


// test url for systemcode
app.get('/' + apriConfig.systemCode + '/', function (req, res) {
	console.log("Reqparam: " + req.url);
	res.send("ok");
});


// test url for systemcode
app.get('/' + apriConfig.systemCode + '/menu', function (req, res) {
	console.log("Local server config menu: " + req.url);
	var status = 200;
	var body = "";
	if (localServer.ConfigMenu[req.query.menu] == undefined) {
		body = 'sorry, menu not found: ' + req.query.menu;
		status = 500;
		console.dir(localServer.ConfigMenu);
		res.status(status).send(body);
	} else {
		body = localServer.ConfigMenu[req.query.menu];
		console.log(body);
		res.status(status).send(body);
	}
});

// url not correct?
app.get('/*', function (req, res) {
	console.log("URL not correct, try " + req.url + apriConfig.systemCode);
	//console.dir(req);
	res.send("URL niet juist of onvolledig correct, probeer " + '<a href="http://' + req.headers.host + '/' + apriConfig.systemCode + '/menu?menu=main">' + 'http://' + req.headers.host + '/' + apriConfig.systemCode + '/menu?menu=main</a>');
});


app.listen(apriConfig.systemListenPort);
console.log('listening to http://proxyintern: ' + apriConfig.systemListenPort);
*/