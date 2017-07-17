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
var express 			= require('express');
const SerialPort 		= require('serialport');
const fs 				= require('fs');
const io	 			= require('socket.io-client');
const exec 				= require('child_process').exec;
const execFile			= require('child_process').execFile;


var app = express();

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

var menuUrl;
var localServer = {};
localServer.ConfigMenu = {};

var initMenu	= function() {
	console.log('Init menu');
	localServer.ConfigMenu["main"] = '<http><body><h1>Hoofdmenu</h1><br/><a href="'+menuUrl+'?menu=wifi">WiFi configuratie</a></body></http>';
	localServer.ConfigMenu["wifi"] = '<http><body><h1>WiFi menu</h1><br/><a href="'+menuUrl+'?menu=wifi">WiFi configuratie</a></body></http>';
}




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

var startActionReboot = function() {
	exec("reboot", (error, stdout, stderr) => {
		if (error) {
			console.error(`exec error: ${error}`);
			return;
		}
		unit.id = stdout.substr(0,stdout.length-1);
	});
}

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
	exec("cat /sys/class/thermal/thermal_zone0/temp", (error, stdout, stderr) => {
		if (error) {
			console.error(`exec error: ${error}`);
			return;
		}
		var tempStr	= stdout.substr(0,stdout.length-1);
		var tempValue = parseFloat(tempStr);
		if (!isNaN(tempValue)) unit.cputemperature = tempValue / 1000;
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
			console.log('Network interface not available: ' + networkInterface);
			return;
		};
        macAddress[networkInterface]	= data.substr(0,data.length-1);
		console.log('MAC-Address network interface: ' + networkInterface + '  ' + data);
	});
}
var getWifiScanInfo	= function(iface, callback) {

	//hostname --all-ip-address
	exec('iwlist '+iface+' scan', (error, stdout, stderr) => {
		if (error) {
			//console.error(`exec error: ${error}`);
			wifiScan[iface]	= "";
			return;
		}
		wifiScan[iface]	= "" + stdout;
//		console.log(`stderr: ${stderr}`);	

		
		if (callback != undefined) {
			callback(iface,stdout);
		}
	});
}

var save99UsbSerialRules	= function() {
//	99-usb-serial.rules
	var content = '';
	var file = '/etc/udev/rules.d/99-usb-serial.rules';
	if (unit.id == '00000000b7e92a99' || unit.id == '000000004659c5bc') {  //'s-Gravenpolder  2e voor test
		console.log('save usb rules for unit ' + unit.id);
		content = 
			'SUBSYSTEM=="tty", ATTRS{idVendor}=="0403", ATTRS{idProduct}=="6001", ATTRS{serial}=="AL02V14T", SYMLINK+="ttyDC1100", MODE:="0666" \n' + 
		 	'SUBSYSTEM=="tty", ATTRS{idVendor}=="0403", ATTRS{idProduct}=="6001", ATTRS{serial}=="AJ03KNV9", SYMLINK+="ttyDC1700", MODE:="0666" \n' +
 			'SUBSYSTEM=="tty", ATTRS{idVendor}=="1a86", ATTRS{idProduct}=="7523", SYMLINK+="ttyArduinoNano", MODE:="0666" \n';
		fs.writeFileSync(file, content);
		console.log('     usb rules for unit ' + unit.id + ' saved. ');

	}
}

var saveSystemServices	= function() {
	if (unit.id == '00000000b7e92a99' || unit.id == '000000004659c5bc') {  //'s-Gravenpolder  2e voor test
		disableServices('apri-sensor-dylos');
		createService('apri-sensor-dylos','DC1100');
		createService('apri-sensor-dylos','DC1700');

/*
		sensorKey	= 'DC1700';
		console.log('save Dylos service for unit ' + unit.id  + ' and device Dylos ' + sensorKey);
		content =
			'[Unit]\n' +
			'Desription=SCAPE604-apri-sensor-dylos - start or restart apri-sensor-dylos '+ sensorKey + ' service, respawn\n' +
			'After=network.target\n' +
			'[Service]\n' +
			'ExecStart=/opt/SCAPE604/apri-sensor/apri-sensor-dylos/apri-sensor-dylos.sh /opt/SCAPE604/log/SCAPE604-apri-sensor-dylos_' + sensorKey + '.log /dev/ttyDylos1700 \n' +
			'Restart=always\n'+
			'[Install]\n' +
			'WantedBy=multi-user.target';
		file = '/etc/systemd/system/SCAPE604-apri-sensor-dylos_' + sensorKey + '.service';
		fs.writeFileSync(file, content);
		console.log('     Dylos service for unit ' + unit.id + ' and device Dylos ' + sensorKey + ' saved. ');
		console.log('enable Dylos service for unit ' + unit.id  + ' and device Dylos ' + sensorKey);
		exec('systemctl enable SCAPE604-apri-sensor-dylos_' + sensorKey + '.service', (error, stdout, stderr) => {
			if (error) {
				console.error(`exec error: ${error}`);
				return;
			}
//			console.log(`stderr: ${stderr}`);	

//			if (callback != undefined) {
//				callback(device,stdout);
//			}
		});

		sensorKey	= 'DC1100';
		console.log('save Dylos service for unit ' + unit.id  + ' and device Dylos ' + sensorKey);
		content =
			'[Unit]\n' +
			'Desription=SCAPE604-apri-sensor-dylos - start or restart apri-sensor-dylos '+ sensorKey + ' service, respawn\n' +
			'After=network.target\n' +
			'[Service]\n' +
			'ExecStart=/opt/SCAPE604/apri-sensor/apri-sensor-dylos/apri-sensor-dylos.sh /opt/SCAPE604/log/SCAPE604-apri-sensor-dylos_' + sensorKey + '.log /dev/ttyDylos1100 \n' +
			'Restart=always\n'+
			'[Install]\n' +
			'WantedBy=multi-user.target';
		file = '/etc/systemd/system/SCAPE604-apri-sensor-dylos_' + sensorKey + '.service';
		fs.writeFileSync(file, content);
		console.log('     Dylos service for unit ' + unit.id + ' and device Dylos ' + sensorKey + ' saved. ');
		console.log('enable Dylos service for unit ' + unit.id  + ' and device Dylos ' + sensorKey);
		exec('systemctl enable SCAPE604-apri-sensor-dylos_' + sensorKey + '.service', (error, stdout, stderr) => {
			if (error) {
				console.error(`exec error: ${error}`);
				return;
			}
//			console.log(`stderr: ${stderr}`);	

//			if (callback != undefined) {
//				callback(device,stdout);
//			}
		});
*/
	}
}

var disableServices 	= function(sensor) {
//	ls /etc/systemd/system/SCAPE604-apri-sensor-dylos*
	exec('ls /etc/systemd/system/'+apriConfig.systemCode+'-'+sensor+'*.service', (error, stdout, stderr) => {
		if (error) {
			console.error(`exec error: ${error}`);
			return;
		}
		console.log(stdout);
		var services = stdout.split('\n');
		console.log(services.length);
		for (i=0;i<services.length;i++) {
			var service = services[i].split('/')[3];
			console.log(service);
		}
		
		
//		sudo systemctl stop SCAPE604-apri-sensor-dylos_DC1100.service
//		sudo systemctl disable /etc/systemd/system/SCAPE604-apri-sensor-dylos_DC1100.service
//		sudo rm /etc/systemd/system/SCAPE604-apri-sensor-dylos_DC1100.service

		
//		console.log(`stderr: ${stderr}`);	

//		if (callback != undefined) {
//			callback(device,stdout);
//		}
	});
}

var createService	= function(sensor, sensorKey) {
	var file;
	var content;
	console.log('save Dylos service for unit ' + unit.id  + ' and device Dylos ' + sensorKey);
	content =
		'[Unit]\n' +
		'Desription='+apriConfig.systemCode+'-'+sensor+' - start or restart '+sensor+' '+ sensorKey + ' service, respawn\n' +
		'After=network.target\n' +
		'[Service]\n' +
		'ExecStart=/opt/'+apriConfig.systemCode+'/apri-sensor/'+sensor+'/'+sensor+'.sh /opt/'+apriConfig.systemCode+'/log/'+apriConfig.systemCode+'-'+sensor+'_' + sensorKey + '.log /dev/tty'+sensorKey+' \n' +
		'Restart=always\n'+
		'[Install]\n' +
		'WantedBy=multi-user.target';
	file = '/etc/systemd/system/'+apriConfig.systemCode+'-'+sensor+'_' + sensorKey + '.service';
	fs.writeFileSync(file, content);
	console.log('     '+sensor+' service for unit ' + unit.id + ' and device ' + sensorKey + ' saved. ');
	console.log('enable '+sensor+' service for unit ' + unit.id  + ' and device ' + sensorKey);
	exec('systemctl enable '+apriConfig.systemCode+'-'+sensor+'_' + sensorKey + '.service', (error, stdout, stderr) => {
		if (error) {
			console.error(`exec error: ${error}`);
			return;
		}
//		console.log(`stderr: ${stderr}`);	

//		if (callback != undefined) {
//			callback(device,stdout);
//		}
	});
}



var getUsbInfo	= function(device, callback) {


//sudo udevadm trigger	

	//hostname --all-ip-address
	exec('udevadm info -a -p $(udevadm info -q path -n '+device+')', (error, stdout, stderr) => {
		if (error) {
			console.error(`exec error: ${error}`);
			return;
		}
//		console.log(`stderr: ${stderr}`);	

		if (callback != undefined) {
			callback(device,stdout);
		}
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
		var logDate	= "" + new Date().toISOString();
		console.log(logDate + ': ' + stdout);
	});
};

var sendClientWifiInfo	= function(iface, stdout) {
	socket.emit('apriClientActionResponse', 
		{"action":"getClientWifiInfo"
		, "unit": unit	
		, "device": iface
		, "wifiScan": stdout
		}
	);
}

var sendClientUsbInfo	= function(device, stdout) {
	console.log('Send apriClientActionResponse for device %s', device);
	socket.emit('apriClientActionResponse', 
		{"action":"getClientUsbInfo"
		, "unit": unit	
		, "device": device
		, "usbInfo": stdout
		}
	);
}

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
	socket.on('apriClientAction', function(data) {  // pong message from socket.io server
		console.log('Apri Agent Manager action recieved: ' + data.action);
		console.dir(data);
		if (data.action == 'getClientWifiInfo') {
			getWifiScanInfo('wlan0',sendClientWifiInfo);
			getWifiScanInfo('wlan1',sendClientWifiInfo);
		}
		if (data.action == 'getClientUsbInfo') {
			//getUsbPorts();
			getUsbInfo('/dev/ttyUSB0',sendClientUsbInfo);
			getUsbInfo('/dev/ttyUSB1',sendClientUsbInfo);
			save99UsbSerialRules();
			saveSystemServices();
		}
		if (data.action == 'reboot') {
			startActionReboot();
		}
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

console.log('Start web-application handling');
app.all('/*', function(req, res, next) {
  console.log("app.all/: " + req.url + " ; systemCode: " + apriConfig.systemCode );
    console.log('Init menu ?????');
  	console.log(localServer.ConfigMenu);
	if (localServer.ConfigMenu.main == undefined ) {
		menuUrl			= 'http://' +req.headers.host + '/' + apriConfig.systemCode+ '/menu';
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
app.get('/'+apriConfig.systemCode+'/', function(req, res) {
  console.log("Reqparam: " + req.url);
  res.send("ok");
});


// test url for systemcode
app.get('/'+apriConfig.systemCode+'/menu', function(req, res) {
  console.log("Local server config menu: " + req.url);
  var status = 200;
  var body = "";
  if (localServer.ConfigMenu[req.query.menu]==undefined) {
  	body	= 'sorry, menu not found: ' + req.query.menu;
	status = 500;
	console.dir(localServer.ConfigMenu);
	res.status(status).send(body);
  } else {
  	body	= localServer.ConfigMenu[req.query.menu];
	console.log(body);
	res.status(status).send(body);
  }
});

// url not correct?
app.get('/*', function(req, res) {
  console.log("URL not correct, try " + req.url + apriConfig.systemCode);
  //console.dir(req);
  res.send("URL niet juist of onvolledig correct, probeer " + '<a href="http://' +req.headers.host + '/' + apriConfig.systemCode+ '/menu?menu=main">' + 'http://' +req.headers.host + '/' + apriConfig.systemCode+ '/menu?menu=main</a>');
});


app.listen(apriConfig.systemListenPort);
console.log('listening to http://proxyintern: ' + apriConfig.systemListenPort);


