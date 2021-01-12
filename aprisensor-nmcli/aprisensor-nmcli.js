/*
** Module: aprisensor-nmcli
**
** Module for Network Manager configuration (wifi connection)
**
*/

"use strict"; // This is for your code to comply with the ECMAScript 5 standard.

// activate init process config-main
const path = require('path');
const http = require('http');
const fs = require('fs');
const exec = require('child_process').exec;
const util = require('util');
const execPromise = util.promisify(require('child_process').exec);
//const execSync			= require('child_process').execSync;
//const execFile			= require('child_process').execFile;

const REQUIRED_CONTENT_TYPE = 'application/json';
const ACCEPT_ENCODING_1 = 'application/json';
const ACCEPT_ENCODING_2 = '*/*';

const defaultPassword = 'scapeler'

var processStatus = []
processStatus.hotspot = {
  code:-1  // -1=init; 100=error creating hotspot connection
  , status:''
  , statusSince: new Date()
}
processStatus.gateway = {
  status:''
  ,statusSince:new Date()
}
processStatus.timeSync = {
  status:''
  ,statusSince:new Date()
}

const entryCheck = function (req) {
  const contentType = req.headers["Content-Type"];
  if (!contentType==undefined && !contentType.includes(REQUIRED_CONTENT_TYPE)) {
    throw new Error("Sorry we only support content type as json format.");
  }

  const accept = req.headers["accept"];
  if (!(accept.includes(ACCEPT_ENCODING_1) ||
			accept.includes(ACCEPT_ENCODING_2))) {
    throw new Error("Sorry we only support accept json format.");
  }

}

const returnResultJson=function(result, req, res) {

	res.writeHead(200, { 'Content-Type': 'application/json' });
	// set response content
	res.write(JSON.stringify(result));
	//res.write('executed');
	res.end();
}

const requestListener = function (req, res) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Request-Method', '*');
	res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, DELETE, POST, PUT');
//	res.setHeader('Access-Control-Allow-Headers', 'append,delete,entries,foreach,get,has,keys,set,values,Authorization');
	res.setHeader('Access-Control-Allow-Headers', '*');

	try {
    entryCheck(req);
		const methodType = req.method.toUpperCase();
		const url = req.url;
		switch(methodType){
			case 'OPTIONS':
			  res.end();
    		break;
  		case 'GET':
				if (req.url == '/nmcli/api/v1/general') {
			    getGeneral(req,res,returnResultJson)
					break
				}
				if (req.url == '/nmcli/api/v1/connection/show') {
			    getConnectionShow(req,res,returnResultJson)
					break
				}
        if (req.url == '/nmcli/api/v1/device/hotspot') {
			    getDeviceHotspot(req,res,returnResultJson)
					break
				}
				res.writeHead(400);
				res.write(`{error:400,message: 'Invalid API-call: ${methodType} ${url}'}`);
				res.end();
    		break;
  		case 'POST':
        if (req.url == '/nmcli/api/v1/device/connect') {
          postDeviceConnect(url,req,res)
          break
        }
				res.writeHead(400);
				res.write(`{error:400,message: 'Invalid API-call: ${methodType} ${url}'}`);
				res.end();
    		break;
  		case 'PUT':
				res.writeHead(400);
				res.write(`{error:400,message: 'Invalid API-call: ${methodType} ${url}'}`);
				res.end();
				break;
  		case 'DELETE':
				if (req.url == '/nmcli/api/v1/connection/delete') {
					deleteMethodHandler(url,req,res)
					break
				}
				res.writeHead(400);
				res.write(`{error:400,message: 'Invalid API-call: ${methodType} ${url}'}`);
				res.end();
    		break;
		}
  } catch (error) {
    //res.writeHead(400);
		console.log(error.message)
    res.end(error.message);
	}
}

const server = http.createServer(requestListener);
server.listen(8080);

// **********************************************************************************

var menuUrl;
var localServer = {};
localServer.ConfigMenu = {};

var initMenu	= function() {
	console.log('Init menu');
	localServer.ConfigMenu["main"] = '<http><body><h1>Hoofdmenu</h1><br/><a href="'+menuUrl+'?menu=wifi">WiFi configuratie</a></body></http>';
	localServer.ConfigMenu["wifi"] = '<http><body><h1>WiFi menu</h1><br/><a href="'+menuUrl+'?menu=wifi">WiFi configuratie</a></body></http>';
}

var unit = {}

var columnsToJsonArray = function(columns) {
	var records = columns.split('\n')
	var resultJson=[]
	var keys=records[0].split(/[\s]+/)
	for (var i=1;i<records.length;i++) {
		if (records[i]=='') continue // skip empty (last) record
		var oneRow=records[i]
		var values=oneRow.split(/[\s]+/)
		var record={}
		for (var j=0;j<records[i].length;j++){
			if (keys[j]=='' ||keys[j]==undefined ) continue // skip empty (last) column
			var key=keys[j]
			var value=values[j]
			record[key]=value
		}
		resultJson.push(record)
	}
	return resultJson
}

const getGeneral = function(req,res,callback) {
	exec("LC_ALL=C nmcli general", (error, stdout, stderr) => {
		if (error) {
			// console.error(`exec error: ${error}`);
			return callback(resultJson, req,res);
		}
		var resultJson = columnsToJsonArray(stdout)
		return callback(resultJson[0], req,res) // only one record with info
	});
	return 'test'
}
const getConnectionShow = function(req,res,callback) {
	exec("LC_ALL=C nmcli connection show ", (error, stdout, stderr) => {
		if (error) {
			// console.error(`exec error: ${error}`);
			return callback(resultJson, req,res);
		}
		var resultJson = columnsToJsonArray(stdout)
		return callback(resultJson, req,res)
	});
}
const getDeviceHotspot = function(req,res,callback) {
  createHotspot()
  res.writeHead(200);
  res.write(`{oke:200,message: 'creation of hotspot started'}`);
  res.end();

/*
  var hotspotCommand= "LC_ALL=C nmcli connection add type wifi ifname 'wlp7s0' con-name hotspot autoconnect yes wifi.mode ap \
     ssid '"+unit.ssid+"' mode ap \
     ipv4.method shared 802-11-wireless-security.key-mgmt wpa-psk 802-11-wireless-security.psk 'iam@Home' \
     ipv6.method shared"
  console.log(`start hotspot ${unit.ssid}`)

//  nmcli connection add type wifi ifname wlan0 con-name local-ap autoconnect yes ssid test-ap mode ap
//  nmcli connection modify local-ap 802-11-wireless.mode ap 802-11-wireless-security.key-mgmt wpa-psk ipv4.method shared 802-11-wireless-security.psk 'PASSWORD'
//  nmcli connection up local-ap



//  exec("LC_ALL=C nmcli --show-secrets device wifi hotspot ssid "+ssid+" password '"+defaultPassword+"'", (error, stdout, stderr) => {
	exec(hotspotCommand, (error, stdout, stderr) => {
		if (error) {
			// console.error(`exec error: ${error}`);
      console.error(`exec error: ${error}`);
      res.writeHead(400);
      res.write(`{error:400,message: '${error}'}`);
      res.end();
			return
		}
    console.log(stdout)
		var resultJson = columnsToJsonArray(stdout)
		return callback(resultJson, req,res)
	});
*/
}
const deleteMethodHandler = ( url, req, res) => {
	let data = Buffer.alloc(0);
  req.on('data', (datum) => data = Buffer.concat([data, datum]));
  req.on('end', () => {
    console.log(data.toString('utf8'));
		var result = JSON.parse(data.toString('utf8'))
		var id =result.data.UUID
		if (result.data.key=='device') id=result.data.DEVICE
		if (result.data.key=='name') id=result.data.NAME
		if (result.data.key=='type') id=result.data.TYPE
		exec("LC_ALL=C nmcli connection delete '"+id+ "'  ", (error, stdout, stderr) => {
		//exec("LC_ALL=C nmcli connection delete  "+result.data.TYPE, (error, stdout, stderr) => {
		if (error) {
			console.error(`exec error: ${error}`);
			res.writeHead(400);
			res.write(`{error:400,message: '${error}'}`);
			res.end();
			return
		}
		if (stderr) {
			console.error(`exec stderr: ${stderr}`);
			return callback(resultJson, req,res);
		}
//		var resultJson = columnsToJsonArray(stdout)
		res.writeHead(200);
		res.write(stdout);
	  res.end(`The connection is deleted.`);
		return
	});
//  const employeeId = url.substring(1);
//  const response = deleteEmployee(employeeId);
//console.dir(res)
//  res.writeHead(200);
//  res.end(`The employee with id is deleted.`);
	})
}
const postDeviceConnect = ( url, req, res) => {
  console.log(url)
  let body = '';
    req.on('data', chunk => {
        body += chunk.toString(); // convert Buffer to string
    });
    req.on('end', () => {
//        console.log(body);
  //      res.end('ok');
//    });
		var result = JSON.parse(body)
		var id =result.data.NAME
		//if (result.data.key=='device') id=result.data.DEVICE
		//if (result.data.key=='name') id=result.data.NAME
		//if (result.data.key=='type') id=result.data.TYPE
		exec("LC_ALL=C nmcli device wifi connect '"+id+ "' password '"+result.data.password+"'", (error, stdout, stderr) => {
      //exec("LC_ALL=C nmcli connection delete  "+result.data.TYPE, (error, stdout, stderr) => {
  		if (error) {
  			console.error(`exec error: ${error}`);
  			res.writeHead(400);
  			res.write(`{error:400,message: '${error}'}`);
  			res.end();
  			return
  		}
  		if (stderr) {
        res.writeHead(401);
    		res.write(stderr);
    	  res.end(`The connection has stderr error`);
  			console.error(`exec stderr: ${stderr}`);
  			return callback(resultJson, req,res);
  		}
  //		var resultJson = columnsToJsonArray(stdout)
  		res.writeHead(200);
  		res.write(stdout);
  	  res.end(`The connection is connected to the device`);
  		return
	   });
//  const employeeId = url.substring(1);
//  const response = deleteEmployee(employeeId);
//console.dir(res)
//  res.writeHead(200);
//  res.end(`The employee with id is deleted.`);
	})
//  console.log('einde ')
}

const createHotspot = function() {
  console.log(`Create hotspot for ssid ${unit.ssid}`)
  console.log('1. Delete existing hotspot connection')
  exec("LC_ALL=C nmcli connection delete '"+unit.ssid+"'  ", (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      processStatus.hotspot.code=400
      processStatus.hotspot.message=error
    }
    if (stderr) {
      console.error(`exec stderr: ${stderr}`);
      processStatus.hotspot.code=400
      processStatus.hotspot.message=error
    }
    console.log('2. Create hotspot connection')
    var hotspotCommand= "LC_ALL=C nmcli connection add type wifi ifname '"+unit.ifname+"' con-name '"+unit.ssid+"' autoconnect yes wifi.mode ap \
       ssid '"+unit.ssid+"' \
       ipv4.method shared 802-11-wireless-security.key-mgmt wpa-psk 802-11-wireless-security.psk 'iam@Home' \
       ipv6.method shared"
  //  nmcli connection add type wifi ifname wlan0 con-name local-ap autoconnect yes ssid test-ap mode ap
  //  nmcli connection modify local-ap 802-11-wireless.mode ap 802-11-wireless-security.key-mgmt wpa-psk ipv4.method shared 802-11-wireless-security.psk 'PASSWORD'
  //  nmcli connection up local-ap
  	exec(hotspotCommand, (error, stdout, stderr) => {
  		if (error) {
        console.error(`exec error: ${error}`);
        processStatus.hotspot.code=400
        processStatus.hotspot.message=error
  			return
  		}
      processStatus.hotspot.code=200
      processStatus.hotspot.message=stdout
      console.log(stdout)
      console.log('3. Activate hotspot connection')
      hotspotCommand="LC_ALL=C nmcli connection up hotspot"
      exec(hotspotCommand, (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          processStatus.hotspot.code=400
          processStatus.hotspot.message=error
          return
        }
        console.log(stdout)
        getIpAddress()
      });
  	});
  })
}

var startActionReboot = function() {
	exec("reboot", (error, stdout, stderr) => {
		if (error) {
			console.error(`exec error: ${error}`);
			return;
		}
//		unit.id = stdout.substr(0,stdout.length-1);
	});
}

const actions = []
actions.push(function() {
//  console.log('getHostname 1')
	exec("hostname", (error, stdout, stderr) => {
//    console.log('getHostname')
		if (error) {
			console.error(`exec error: ${error}`);
		} else {
      unit.hostname = stdout.substr(0,stdout.length-1)
  		//console.log(`hostname: ->${unit.hostname}<-'`)  //raspberry pi serial
    }
    nextAction()
	})
})
actions.push(function() {
//  console.log('get wireless device name')
	exec("ls /sys/class/ieee80211/*/device/net/", (error, stdout, stderr) => {
		if (error) {
			console.error(`exec error: ${error}`);
      unit.ifname = 'wlan0'
		} else {
      unit.ifname = stdout.substr(0,stdout.length-1)
    }
    nextAction()
	})
})

actions.push(function() {
	//hostname --all-ip-address
//  console.log('getCpuInfo A1')
	exec("cat /proc/cpuinfo | grep Serial | cut -d ' ' -f 2", (error, stdout, stderr) => {
//    console.log('getCpuInfo A')
		if (error) {
			console.error(`exec error: ${error}`);
		} else {
      var serial = stdout.substr(0,stdout.length-1)
  		if (serial =='') {
  			unit.serial = unit.hostname
  		} else {
  			unit.serial='SCRP'+serial
  		}
      unit.ssid = unit.serial.substr(unit.serial.length-4,unit.serial.length-1).toUpperCase()
//      unit.ifname= 'wlp7s0'
  		//sudo hostnamectl set-hostname raspberrypi2
    }
    nextAction()
	}
)})
actions.push(function() {
//  console.log('getCpuInfo B1')
	exec("cat /proc/cpuinfo | grep Hardware | cut -d ' ' -f 2", (error, stdout, stderr) => {
//    console.log('getCpuInfo B')
		if (error) {
			console.error(`exec error: ${error}`);
		} else {
      unit.hardware = stdout.substr(0,stdout.length-1);
    }
    nextAction()
	})
})
actions.push(function() {
//  console.log('getCpuInfo C1')
	exec("cat /proc/cpuinfo | grep Revision | cut -d ' ' -f 2", (error, stdout, stderr) => {
//    console.log('getCpuInfo C')
		if (error) {
			console.error(`exec error: ${error}`);
		} else {
      unit.revision = stdout.substr(0,stdout.length-1);
    }
    nextAction()
	})
})
actions.push(function() {
//  console.log('getCpuInfo D1')
	exec("cat /sys/class/thermal/thermal_zone0/temp", (error, stdout, stderr) => {
//    console.log('getCpuInfo D')
		if (error) {
			console.error(`exec error: ${error}`);
		} else {
      var tempStr	= stdout.substr(0,stdout.length-1);
  		var tempValue = parseFloat(tempStr);
  		if (!isNaN(tempValue)) unit.cputemperature = tempValue / 1000;
    }
    nextAction()
	})
})

async function readFile(path) {
    return new Promise((resolve, reject) => {
      fs.readFile(path, 'utf8', function (err, data) {
        if (err) {
          reject(err);
        }
        resolve(data);
      });
    });
  }


const getMacAdress = async function() {
  //console.log('getMacAdress 2')
  if (unit.macAdress==undefined) unit.macAddress ={}
  var fileName	= '/sys/class/net/' + unit.ifname + '/address';
  await readFile(fileName)
  .then((data) => {
    unit.macAddress[unit.ifname]	= data.substr(0,data.length-1);
    //console.log('MAC-Address network interface: ' + unit.ifname + '  ' + data);
  })
  .catch((err) => {
    unit.macAddress[unit.ifname]	= '';
    //console.log('Network interface not available: ' + unit.ifname);
  })
/*
  try {
    let res= await  fs.readFile(fileName, "utf8", function (err, data) {
        //    console.log('getMacAddress')
        console.log('getMacAdress 3')
        if (unit.macAdress==undefined) unit.macAddress ={}
        if (err || data == undefined) {
    			unit.macAddress[unit.ifname]	= '';
    			console.log('Network interface not available: ' + unit.ifname);
    		} else {
          unit.macAddress[unit.ifname]	= data.substr(0,data.length-1);
    		  console.log('MAC-Address network interface: ' + unit.ifname + '  ' + data);
        }
        console.log('getMacAdress 4')
    	})
  } else {
  )
  catch {

  }
*/
  //console.log('getMacAdress 5')
}
actions.push(async function() {
  //console.log('getMacAdress 1')
  await getMacAdress()
  //console.log('getMacAddress 1')
  //console.log('getMacAdress NextAction')
  nextAction()
})

async function getIpAddress() {
  unit.ipAddress=[]
  var result = await execPromise('hostname --all-ip-address')
  var stdoutArray	= result.stdout.split('\n');
  for (var i=0;i<stdoutArray.length-1;i++) {
    var idx = stdoutArray[i].indexOf(' ', 8)
    if (stdoutArray[i]!='') unit.ipAddress.push(stdoutArray[i].substr(0,idx))
  }
}
actions.push(async function() {
  await getIpAddress()
  nextAction()
});
actions.push(async function() {
  await getGateway()
  nextAction()
});
actions.push(async function() {
  await checkHotspotActivation()
  nextAction()
});
actions.push(function() {
  checkTimeSync()
  nextAction()
});


const nextAction=function(){
  console.log(`next action ${action+1}/${actions.length}`)
  if (action<actions.length-1) {
    action++
    actions[action]()
  } else {
    console.dir(unit)
  }
}

// trigger initialization actions
var action =-1
nextAction()

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

var disableServices 	= function(sensor, separator) {
	var services;
	var stdout;
//	ls /etc/systemd/system/SCAPE604-apri-sensor-dylos*
	try {
		stdout = execSync('ls /etc/systemd/system/'+apriConfig.systemCode+'-'+sensor+separator+'*.service');
	} catch (e) {
//    	console.log("Errors:", e);
		console.log('No service available to revoke for '+apriConfig.systemCode+'-'+sensor+'*.service');
		return;
  	}
	console.log('Revoke services:');
//	console.log(stdout);
	services = stdout.toString().split('\n');
	console.log(services.length);
	for (i=0;i<services.length-1;i++) {
		var service = services[i].split('/')[4];
		console.log(service);
		revokeService(service);
	}
}

var revokeService	= function(service) {
	var result;
//		sudo systemctl stop SCAPE604-apri-sensor-dylos_DC1100.service
//		sudo systemctl disable /etc/systemd/system/SCAPE604-apri-sensor-dylos_DC1100.service
//		sudo rm /etc/systemd/system/SCAPE604-apri-sensor-dylos_DC1100.service

	try {
		console.log('Stop service '+service);
		result	= execSync('systemctl stop '+service);
	} catch (e) {
    	console.log("Errors:", e);
  	}
	try {
		console.log('Disable service '+service);
		result	= execSync('systemctl disable /etc/systemd/system/'+service);
	} catch (e) {
    	console.log("Errors:", e);
  	}
	try {
		console.log('Remove service '+service);
		result	= execSync('rm /etc/systemd/system/'+service);
	} catch (e) {
    	console.log("Errors:", e);
  	}
}

var createService	= function(sensor, sensorKey) {
	var file;
	var content;
	console.log('save '+sensor+' service for unit ' + unit.id  + ' and device ' + sensorKey);
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
		exec('systemctl start '+apriConfig.systemCode+'-'+sensor+'_' + sensorKey + '.service', (error, stdout, stderr) => {
			if (error) {
				console.error(`exec error: ${error}`);
				return;
			}
		});
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

var getLsUsbInfo	= function(data,callback) {
		console.dir(data);
		exec(data.command, (error, stdout, stderr) => {
//	exec('/bin/sh /opt/SCAPE604/apri-sensor/apri-sensor-combi2/apri-sensor-combi2.sh /opt/SCAPE604/log/SCAPE604-apri-sensor-combi2_ArduinoMega.log /dev/ttyACM0', (error, stdout, stderr) => {
//	exec('ls -l /opt/SCAPE604/log', (error, stdout, stderr) => {
//		exec('ls -l /dev/tty*', (error, stdout, stderr) => {
//	exec('lsusb', (error, stdout, stderr) => {
		if (error) {
			console.error(`exec error: ${error}`);
			return;
		}
		if (callback != undefined) {
			callback(stdout);
		}
	});
}
var getLsUsbvInfo	= function(callback) {
	exec('lsusb -v', (error, stdout, stderr) => {
		if (error) {
			console.error(`exec error: ${error}`);
			return;
		}
//		console.log(`stderr: ${stderr}`);
		if (callback != undefined) {
			callback(stdout);
		}
	});
}

var getCmd	= function(data, callback) {
	console.log('execute command: ' + data.command)
	console.dir(data);
	if (data.command != undefined) {
		exec(data.command, (error, stdout, stderr) => {
			if (error) {
				console.error(`exec error: ${error}`);
				return;
			}
	//		console.log(`stderr: ${stderr}`);
			if (callback != undefined) {
				callback(stdout);
			}
		});
	} else {
		console.log('No command given')
	}
}

const checkHotspotActivation= async function() {
  if (unit.serial.substr(0,4) == 'SCRP') {
    console.log(`ApriSensor unit, starting hotspot for ${unit.serial} with ssid ${unit.ssid}`)
    await getGateway()
    if (unit.gateway!='') {
      console.log(`gateway: ${unit.gateway}`)
      createHotspot()
    } else {
      console.log(`ping gateway: ${unit.gateway}`)
    }
  } else {
    console.log(`Not an ApriSensor unit, no automatic start as hotspot for ${unit.serial}`)
  }
}

// when online no automatic activation of the hotspot necessary
const getGateway = async function() {
  unit.gateway=''
  var result = await execPromise('ip route | grep "default via" ')
  .then((result)=>{
    var stdoutArray	= result.stdout.split(' ');
    unit.gateway=stdoutArray[2]
    if (processStatus.gateway.status!='OK') {
      processStatus.gateway.status='OK'
      processStatus.gateway.statusSince=new Date()
    }
  })
  .catch((error)=>{
    console.log('catch gateway')
    console.dir(error)
    if (processStatus.gateway.status!='ERROR') {
      processStatus.gateway.status='ERROR'
      processStatus.gateway.statusSince=new Date()
    }
  })
}

const checkTimeSync = function() {
  // get file attributes for last time synchronization datetime
  fs.stat("/var/lib/systemd/timesync/clock", (err, stat) => {
    if (err) {
      if (processStatus.timeSync.status!='ERROR') {
        processStatus.timeSync.status='ERROR'
        processStatus.timeSync.statusSince=new Date()
      }
    } else {
      //console.log(stat);
      if (processStatus.timeSync.status!='OK') {
        processStatus.timeSync.status='OK'
        processStatus.timeSync.statusSince=new Date()
      }
      processStatus.timeSync.syncDatetime=new Date(stat.atime)
    }
  });

// ntp synchronized ?
// de datum/tijd van dit bestand geeft het moment van laatste synchronisatie weer
// /var/lib/systemd/timesync/clock
// cmd: timedatectl
// cmd: timedatectl status
// cmd: timedatectl show
// cmd: timedatectl timesync-status
// cmd: timedatectl show-timesync
/*
Since systemd 239 there is a systemd-time-wait-sync.service available that you
can just use in your systemd service to start After=systemd-time-wait-sync.service.
For further information look at How can I delay the startup of systemd services
until the datetime is set (no RTC on the Raspberry Pi).
Raspbian Buster comes with systemd 241.
*/
// https://raspberrypi.stackexchange.com/questions/94635/how-can-i-delay-the-startup-of-systemd-services-until-the-datetime-is-set-no-rt/95195#95195
}

const statusCheck = function() {
  console.log('statusCheck')
  console.dir(processStatus)
  getGateway()
  checkTimeSync()
}

var statusCheckTimer = setInterval(statusCheck, 10000);
