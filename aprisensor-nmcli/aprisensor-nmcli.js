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
//const https = require('https');
const {createHttpTerminator} = require('http-terminator');
const fs = require('fs');
const exec = require('child_process').exec;
const util = require('util');
const execPromise = util.promisify(require('child_process').exec);
//const execSync			= require('child_process').execSync;
//const execFile			= require('child_process').execFile;
const crypto = require('crypto');
const lzString = require('./lz-string.js')
//var SimpleCrypto = require("simple-crypto-js").default
//const cert = require('crypto').Certificate();

//const secret = 'abcdefg';
//const hash = crypto.createHmac('sha256', secret)
//                   .update('I love cupcakes')
//                   .digest('hex');
//console.log(hash);

const REQUIRED_CONTENT_TYPE = 'application/json';
const ACCEPT_ENCODING_1 = 'application/json';
const ACCEPT_ENCODING_2 = '*/*';

const defaultPassword = 'scapeler'
var packageFile={}

var menuUrl;
var localServer = {};
localServer.ConfigMenu = {};
var apiPort = process.argv[2] || 4000 // default 4000
console.log('port: ' + apiPort)
var hotspotPassword='scapeler'
var skipStatusCheck = false

let key
const algoritm="AES-GCM"

var gpio
var gpioBlueLed
var gpioBlueLedStatus='off'
try {
  gpio = require('onoff').Gpio
}
catch (err) {
  console.log('GPIO module onoff not installed');
}
if (gpio != undefined) {
  gpioBlueLed = new gpio(19, 'out'); //use GPIO-19 pin .., and specify that it is output
  //gpioDs18b20 = new gpio(25, 'out'); //use GPIO-25 pin 22, and specify that it is output
  //gpioFan = new gpio(26, 'out'); //use GPIO-26 pin 37, and specify that it is output
  //gpioBme = new gpio(27, 'out'); //use GPIO-27 pin 13, and specify that it is output
}
var setGpioBlueLedOn = function() {
  //console.log('set blue LED GPIO on')
  gpioBlueLed.writeSync(1); //set pin state to 1 (power LED on)
  gpioBlueLedStatus='on'
}
var setGpioBlueLedOff = function() {
  //console.log('set blue LED GPIO off')
  gpioBlueLed.writeSync(0); //set pin state to 0 (power LED off)
  gpioBlueLedStatus='off'
}

var unit = {'connectionStatus':{},connection:'',connections:[] }
var unitCrypto={}

var localWifiList=[]

var processStatus = []
processStatus.main = {
  startDate :new Date()
  ,checkDate : new Date()
}
processStatus.connection = {
  code:-1  // -1=init; 100=error creating hotspot connection
  ,status:''
  ,statusSince: new Date()
}
processStatus.hotspot = {
  code:-1  // -1=init; 100=error creating hotspot connection
  ,status:''
  ,statusSince: new Date()
}
processStatus.gateway = {
  status:''
  ,statusSince:new Date()
}
processStatus.timeSync = {
  status:''
  ,statusSince:new Date()
  ,packetCount:-1
}
processStatus.latestConnection = {
  connection:''
  ,statusSince:new Date()
}
processStatus.connectionBusy = {
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
const returnError=function(error, req, res) {
	res.writeHead(400)
	// set response content
	res.write(error);
	//res.write('executed');
	res.end();
}

const requestListener = function (req, res) {
	//console.dir(req)
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Request-Method', '*');
	res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, DELETE, POST, PUT');
//	res.setHeader('Access-Control-Allow-Headers', 'append,delete,entries,foreach,get,has,keys,set,values,Authorization');
//	res.setHeader('Access-Control-Allow-Headers', 'authorization,content-type');
	res.setHeader('Access-Control-Allow-Headers', '*');
//	Access-Control-Allow-Headers: Accept
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
			    getGeneral(req,res)
					break
				}
        if (req.url == '/nmcli/api/v1/ip/avahi') {
			    getIpAvahi(req,res)
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
        if (req.url == '/nmcli/api/v1/device/wifilist') {
			    getDeviceWifiList(req,res)
					break
				}
				if (req.url == '/nmcli/api/v1/device/wifilistcache') {
			    getDeviceWifiListCache(req,res)
					break
				}
				res.writeHead(400);
				res.write(`{error:400,message: 'Invalid API-call: ${methodType} ${url}'}`);
				res.end();
    		break;
  		case 'POST':
				if (req.url == '/nmcli/api/v1/key') {
					postPublicKey(url,req,res)
					break
				}
        if (req.url == '/nmcli/api/v1/device/connect') {
          postDeviceConnect(url,req,res)
          break
        }
        if (req.url == '/nmcli/api/v1/accesspoint/connect') {
          postApConnect(url,req,res)
          break
        }
        if (req.url == '/nmcli/api/v1/reboot') {
          postReboot(url,req,res)
          break
        }
        if (req.url == '/nmcli/api/v1/shutdown') {
          postShutDown(url,req,res)
          break
        }
        if (req.url == '/nmcli/api/v1/upgrade') {
          postUpGrade(url,req,res)
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

//const server = http.createServer(requestListener);
//const httpTerminator = createHttpTerminator({
//  server,
//});
var server
var httpTerminator
const initHttpServer = function() {
	server = http.createServer(requestListener)
//	server = https.createServer(httpsOptions,requestListener)
	httpTerminator = createHttpTerminator({
	  server,
	});
	server.listen(apiPort);
}
initHttpServer()


// **********************************************************************************

var columnsToJsonArray = function(columns) {
	var records = (''+columns).split('\n')
	var resultJson=[]
  var keyArray=[]
	// split record 1 at space(s) (column labels)
	var keys=records[0].split(/[\s]+/)
	if (records.length<2) return resultJson  // no data, may be only column labels

  var keyPrev=0
  for (var i=0;i<keys.length-1;i++){
    var key ={}
    key.name=keys[i].trim()
    key.index=records[0].indexOf(key.name,keyPrev)
    keyArray.push(key)
    var keyPrev=key.index+key.name.length
  }

  if (keyArray.length==0) return resultJson

//	console.dir(keyArray)
  for (var i=0;i<keyArray.length-1;i++){
    keyArray[i].colWidth=keyArray[i+1].index-keyArray[i].index
  }
  keyArray[keyArray.length-1].colWidth=records[0].length-keyArray[keyArray.length-1].index

  for (var i=1;i<records.length-1;i++) {
    var record = records[i]
    var newRecord={}
    for (var j=0;j<keyArray.length;j++){
      newRecord[keyArray[j].name]=record.substr(keyArray[j].index,keyArray[j].colWidth).trim()
    }
		resultJson.push(newRecord)
	}
	return resultJson
}

const getGeneral = function(req,res,callback) {
  // keep hotspot active as long web page connected. (activate other connectio through webpage)
  if (unit.connection==unit.ssid){
    // hotspot status will last as long as wifi-config-web page active (pulse)
    processStatus.hotspot.statusSince = new Date()
  }

	execPromise("LC_ALL=C nmcli general")
	.then((result)=>{
		var resultJson = columnsToJsonArray(result.stdout)
//		resultJson[0].iv=unitCrypto.iv
//		resultJson[0].ivDate=unitCrypto.ivDate
    var resultData = resultJson[0]
    resultData.info={}
    resultData.info.version=packageFile.version
	 	return returnResultJson(resultData, req,res);
	})
	.catch((error)=>{
		return returnError(error, req,res);
	})
}
const getIpAvahi = function(req,res) {
  res.writeHead(200);
  res.write(`{"ipAvahi":"${unit.ipAddress}"}`);
  res.end();
}

const getConnectionShow = function(req,res,callback) {
	exec("LC_ALL=C nmcli connection show ", (error, stdout, stderr) => {
		if (error) {
			// console.error(`exec error: ${error}`);
			return callback(error, req,res);
		}
    if (stdout=='') {
      console.log('No connections available, hotspot will be created')
      createHotspot()
    }
		var resultJson = columnsToJsonArray(stdout)
//    console.log(resultJson)
    for (var i=0;i<resultJson.length;i++) {
      var tmpCon = resultJson[i].NAME
      if (unit.connectionStatus[tmpCon]!=undefined) {
        resultJson[i].status = unit.connectionStatus[tmpCon]
      }
//      console.dir(unit.connectionStatus[tmpCon])
    }
//    console.dir(resultJson)

		return callback(resultJson, req,res)
	});
}
const getDeviceHotspot = function(req,res,callback) {

  // extra time for hotspot status to allow user to connect to
  // ApriSensor hotspot SSID
  // When webapp wifi config page is connected, hotspot will maintain its status
  // until webapp is disconnected or an wifi connection is activated
  unit.hotspotTill=new Date(new Date().getTime()+120000 )
  if (unit.connection==unit.ssid){
    //console.log('Hotspot connection is active')
    res.writeHead(400);
    res.write(`{status:400,message: 'Hotspot ${unit.connection} already active'}`);
    res.end();
    return
  }
  if (new Date().getTime() - processStatus.hotspot.statusSince.getTime() < 15000) {
    console.log('A gateway problem maybe a problem, timesync or just mobile use')
    res.writeHead(400);
    res.write(`{status:400,message: 'Creation of hotspot maybe still busy, check or try again later'}`);
    res.end();
  } else {
		res.writeHead(200);
    res.write(`{oke:200,message: 'Creation of hotspot started'}`);
    res.end();
    createHotspot()
  }

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

function sleep(ms) {
	console.log(`sleep promise ${ms}ms`)
  return new Promise(resolve => setTimeout(resolve, ms));
}

const getDeviceWifiListCache = function(req,res) {
	res.writeHead(200, { 'Content-Type': 'application/json' });
	res.write(JSON.stringify(localWifiList));
	res.end();
}
const getDeviceWifiList = async function(req,res) {
//  console.log(`getDeviceWifiList`)
  var restartHotspot=false

  if (unit.ssid==unit.connection) { //hotspot active
    console.log("deactivate hotspot")
    processStatus.connectionBusy.status=true
    processStatus.connectionBusy.statusSince=new Date()

		try { // response to client. Client has to wait for result and then refresh list
			res.writeHead(210, { 'Content-Type': 'application/json' });
	  	res.write(JSON.stringify(localWifiList));
	  	res.end();
		}	catch(e){}

//		await sleep(1000);
		//await hotspotDown()

    // all http connections must be terminated to allow disable hotspot
		await httpTerminator.terminate()
		.then((result) =>{
			console.log('http server terminated')
			//console.dir(result)
		})
		.catch((error) =>{
			console.log('http server terminating error')
		})
    await hotspotDelete()
    .then( async (result)=>{
      console.log(`hotspot delete then`)
      restartHotspot=true
			await sleep(2000);
    })
    .catch(async (error)=>{
			console.log(`hotspot delete catch`)
      restartHotspot=true
			await sleep(2000);
    })
    await restartNetworkManager()
    .then( async (result)=>{
      console.log(`restart network-manager then`)
			await sleep(2000);
    })
    .catch(async (error)=>{
      console.log(`restart network-manager catch`)
			await sleep(2000);
    })
    await sleep(1000);
  }

	await sleep(2000)
  console.log('retrieveWifiList()')
  retrieveWifiList()
  .then((result) => {
    console.log(`retrieveWifiList then`)
//    console.log(result.stdout)
    var tmpList=columnsToJsonArray(result.stdout)
    if (tmpList.length!=0) {
      console.log('============================')
      localWifiList=tmpList
      console.log(localWifiList)
    } else {
      console.log('----------------------------')
      console.log(result.stdout)
    }
    if (restartHotspot==true) {
//      console.log(`getDeviceWifiList reactivate hotspot`)
      createHotspotConnection()
      console.log('http server restart')
      //server.listen(apiPort);

      initHttpServer()

      return
    }
    // when restarting as hotspot the connection is broken,
    // writes to res have do not succeed.
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.write(JSON.stringify(localWifiList));
    res.end();
  })
  .catch((error)=>{
    console.log(`getDeviceWifiList catch`)
    console.log(error)

    if (restartHotspot==true) {
      console.log(`getDeviceWifiList reactivate hotspot`)
      createHotspotConnection()
      console.log('http server restart')
      //server.listen(apiPort);
      initHttpServer()
      return
    }
    // when restarting as hotspot the connection is broken,
    // writes to res have do not succeed.
    // return latest known wifi list
    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.write(JSON.stringify(localWifiList));
    res.end();
  })
}
const restartNetworkManager = function(){
	console.log(`restart network-manager`)
	return execPromise("LC_ALL=C systemctl restart network-manager")
}
const retrieveWifiList = function(){
	console.log(`retrieveWifiList`)
	return execPromise("LC_ALL=C nmcli device wifi list")
}

const deleteMethodHandler = ( url, req, res) => {
	let data = Buffer.alloc(0);
  req.on('data', (datum) => data = Buffer.concat([data, datum]));
  req.on('end', async () => {
    console.log(data.toString('utf8'));
		var result = JSON.parse(data.toString('utf8'))
		var id =result.UUID
		if (result.key=='device') id=result.DEVICE
		if (result.key=='name') id=result.NAME
		if (result.key=='type') id=result.TYPE
		execPromise("LC_ALL=C nmcli connection delete '"+id+ "'  ")
    .then((result) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
    	res.write(result.stdout);
    	res.end();
    })
    .catch((error)=>{
      res.writeHead(400, { 'Content-Type': 'application/json' });
    	res.write(JSON.stringify(columnsToJsonArray(error)));
    	res.end();
    })
	})
}

const postPublicKey = ( url, req, res) => {
  console.log(url)
	let body = '';
  req.on('data', chunk => {
    body += chunk.toString(); // convert Buffer to string
  });
  req.on('end', async () => {
		var result = JSON.parse(body)
		console.dir(result)
  		res.writeHead(200);
  	  res.end(`key recieved`);
	})
};

const postDeviceConnect = ( url, req, res) => {
  console.log(url)
  if (processStatus.connectionBusy.status == true) {
    console.log('resource busy, retry later')
  	res.writeHead(400);
		res.write(JSON.stringify({error:400,message: 'sensorkit is bezig, even wachten en dan opnieuw proberen'}));
		res.end();
    return
  }
	processStatus.connectionBusy.status=true
  processStatus.connectionBusy.statusSince=new Date()
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString(); // convert Buffer to string
  });
  req.on('end', () => {
		var result = JSON.parse(body)
		var id =result.NAME
    if (unit.connectionStatus[id]==undefined) {
      unit.connectionStatus[id]={status:'INIT',statusSince:new Date()}
    }
		//if (result.key=='device') id=result.DEVICE
		//if (result.key=='name') id=result.NAME
		//if (result.key=='type') id=result.TYPE
//    exec("LC_ALL=C nmcli device wifi connect '"+id+ "' password '"+result.password+"'", (error, stdout, stderr) => {
	  execPromise("LC_ALL=C nmcli connection up '"+id+"'")
    .then((result)=> {
      console.log(`postDeviceConnect then ${id} `)
      unit.connection=id
      if (unit.connectionStatus[id].status!='OK') {
        unit.connectionStatus[id]={status:'OK',statusSince:new Date()}
      }
      if (id==unit.ssid) {
        processStatus.hotspot.status='OK'
        processStatus.hotspot.statusSince=new Date()
      }
			processStatus.connectionBusy.status=false
      processStatus.connectionBusy.statusSince=new Date()
  		res.writeHead(200);
  		res.write(result.stdout);
  	  res.end(`Device connected`);
    })
    .catch((error)=>{
      console.log('id: '+id)
      console.error(`exec error: ${error}`);
      unit.connection=''
      if (unit.connectionStatus[id]==undefined) {
        unit.connectionStatus[id]={status:'ERROR',statusSince:new Date()}
      }
      if (unit.connectionStatus[id].status!='ERROR') {
        unit.connectionStatus[id]={status:'ERROR',statusSince:new Date()}
      }
      unit.connectionStatus[id].message=(''+error).split('\n')
      const regex = /password/
      if (unit.connectionStatus[id].message[1].match(regex) !=null) {
        var msg='Wachtwoord niet juist, connectie opnieuw aanmaken.'
        //console.log('add readable text to the message: '+msg)
        //console.dir(unit.connectionStatus[id])
        unit.connectionStatus[id].message.push(msg)
      }
      //console.dir(unit.connectionStatus[id])

			processStatus.connectionBusy.status=false
      processStatus.connectionBusy.statusSince=new Date()
			res.writeHead(400);
			res.write(`{error:400,message: '${error}'}`);
			res.end();
    })
	})
}

// connect to accesspoint
const postApConnect = async ( url, req, res) => {
  if (processStatus.connectionBusy.status==true) {
    res.writeHead(400);
    let msgBody={error:400,message: 'sensorkit is bezig, probeer later nog eens' + result.error }
    res.write(JSON.stringify(msgBody));
    res.end()
    return
  }
  console.log(url)
  processStatus.connectionBusy.status=true
  processStatus.connectionBusy.statusSince=new Date()

  let body = '';
  req.on('data', chunk => {
      body += chunk.toString(); // convert Buffer to string
  });
  req.on('end', async () => {
    var result ={}
/*
    try {
      result = JSON.parse(lzString.decompress(body))
      //console.log(result)
    }
    catch {
      console.log('** catch decompress ********************')
      //console.log(body)
      //console.log(lzString.decompress(body))
      result={error:'decompress'}
    }
    //console.log(body)
*/
//    if (result == null || result.error=='decompress') {
//      console.log('try uncompressed')
      try {
        result = JSON.parse(body)
      }
      catch {
        console.log('** catch uncompressed ********************')
        result={error:'json'}
      }
//    }
    if (result == null || result.error!=undefined) {
      processStatus.connectionBusy.status=false
			processStatus.connectionBusy.statusSince=new Date()
			res.writeHead(400);
      let msgBody={error:400,message: 'invalid data, ' + result.error }
			res.write(JSON.stringify(msgBody));
			res.end()
			return
    }
//		if (result.ssid==undefined) {
//		}
    var ssid =result.ssid
    var passwd=result.passwd
    if (result.passwd.substr(0,3)=='SCP') {
      passwd=result.passwd.substr(3)
    }
    console.log('connection down')
    await execPromise("LC_ALL=C nmcli connection down '"+ssid+"'")
    .then((result)=>{console.log('then connection down')})
    .catch((error)=>{console.log('catch connection down')})
    console.log('connection deactivated when active')
    await execPromise("LC_ALL=C nmcli connection delete '"+ssid+"'")
    .then((result)=>{console.log('then connection delete')})
    .catch((error)=>{console.log('catch connection delete')})
    console.log('connection create')
//    var createCommand= "LC_ALL=C nmcli connection  type wifi ifname '"+unit.ifname+"' con-name '"+ssid+"' autoconnect yes  \
//ipv4.method shared 802-11-wireless-security.key-mgmt wpa-psk 802-11-wireless-security.psk '"+passwd+"' \
//      802-1x.eap pwd 802-1x.password '"+passwd+"' \
//ipv4.method shared ipv6.method shared \
    var createCommand= "LC_ALL=C nmcli connection add type wifi ifname '"+unit.ifname+"' con-name '"+ssid+"' autoconnect yes  \
      ssid '"+ssid+"' 802-11-wireless.powersave 2 \
      802-11-wireless-security.key-mgmt wpa-psk 802-11-wireless-security.psk '"+passwd+"' \
      wifi-sec.key-mgmt wpa-psk wifi-sec.psk '"+passwd+"' "
    //console.log(createCommand)
    execPromise(createCommand)
    .then((result)=>{
			console.log('nmcli connection add then')
//			console.log(result)
			processStatus.connectionBusy.status=false
      processStatus.connectionBusy.statusSince=new Date()
      res.writeHead(200);
      res.write(result.stdout);
      res.end(`The accesspoint is connected to the device`);
		})
    .catch((error)=>{
			console.log(error)
      unit.connection=''
			processStatus.connectionBusy.status=false
      processStatus.connectionBusy.statusSince=new Date()
			res.writeHead(400);
      res.write(`{error:400,message: '${error}'}`);
      res.end();
		})

/*
    console.log('connection up')
    await execPromise("LC_ALL=C nmcli connection up '"+ssid+ "'")
    .then((result)=>{
      console.log('connection up then')
      console.log(result)
      res.writeHead(200);
      res.write(result.stdout);
      res.end(`The accesspoint is connected to the device`);
      processStatus.connectionBusy.status=false
      processStatus.connectionBusy.statusSince=new Date()
    })
    .catch((error)=>{
      console.log('connection up catch')
      console.log(error)
      res.writeHead(400);
      res.write(`{error:400,message: '${error}'}`);
      res.end();
      processStatus.connectionBusy.status=false
      processStatus.connectionBusy.statusSince=new Date()
    });
		*/
  })
}

// reboot Raspberry Pi
const postReboot = async ( url, req, res) => {
  console.log(`Reboot`)
  return exec("LC_ALL=C reboot ")
}
// shutdown Raspberry Pi
const postShutDown = async ( url, req, res) => {
  console.log(`Shutdown`)
  return exec("LC_ALL=C shutdown -h now ")
}
// shutdown Raspberry Pi
const postUpGrade = async ( url, req, res) => {
  console.log(`Upgrade`)
  return exec("LC_ALL=C /opt/SCAPE604/git/apri-sensor/install/git2as.sh ")
}

const hotspotDown = function() {
  // down hotspot
  console.log(`set hotspot down`)
  return execPromise("LC_ALL=C nmcli connection down '"+unit.ssid+"'")
}
const hotspotDelete = function() {
  // delete hotspot
  console.log(`delete hotspot`)
  return execPromise("LC_ALL=C nmcli connection delete '"+unit.ssid+"'")
}

/*
const tryCandidateConnection = function(index) {
  // give processing some time
  processStatus.gateway.statusSince=new Date()

	if (processStatus.connectionBusy.status==false) {
		processStatus.connectionBusy.status=true
		processStatus.connectionBusy.statusSince=new Date()
	}
  if (index > unit.connections.length-1) {
    processStatus.connectionBusy.status=false
    processStatus.connectionBusy.statusSince=new Date()
    return
  }
	// ignore hotspot connection
	if (unit.connections[index]==unit.ssid) {
		tryCandidateConnection(index+1)
		return
	}
  var tmpConnection = unit.connections[index]
  if (unit.connectionStatus[tmpConnection]==undefined) {
    unit.connectionStatus[tmpConnection]={status:null}
  }
  // ignore connection already tried less then 5 minutes ago
	if (unit.connectionStatus[tmpConnection].status=='ERROR') {
    if (new Date() - unit.connectionStatus[tmpConnection].statusLatest< 300000) {
      tryCandidateConnection(index+1)
		  return
    }
	}
  if (unit.connectionStatus[tmpConnection] ==undefined) unit.connectionStatus[tmpConnection]={}
  console.log(`tryCandidateConnection ${index} ${unit.connections[index]}`)
  execPromise("LC_ALL=C nmcli connection up '"+unit.connections[index]+"'")
  .then((result)=>{
    console.log(`tryCandidateConnection then ${index} ${unit.connections[index]}`)
    if (unit.connectionStatus[tmpConnection].status!='OK') {
      unit.connectionStatus[tmpConnection]={status:'OK',statusSince:new Date()}
    }
    processStatus.connectionBusy.status=false
    processStatus.connectionBusy.statusSince=new Date()
  })
  .catch((error)=>{
    console.log(`tryCandidateConnection catch ${index} ${unit.connections[index]}`)
    console.error(`exec error: ${error}`);
    if (unit.connectionStatus[tmpConnection].status!='ERROR') {
      unit.connectionStatus[tmpConnection]={status:'ERROR',statusSince:new Date()}
    }
    unit.connectionStatus[tmpConnection].message=error.split('\n')
    tryCandidateConnection(index+1)
  })
}
*/

const tryCandidateConnection2 =function(conIndex) {
  let _conIndex = conIndex

  // no (more) connections to try
  if (_conIndex > unit.connections.length-1) {
    console.log('0. Activate hotspot connection')
    execPromise("LC_ALL=C nmcli connection up '"+unit.ssid+"'")
    .then( (result)=>{
      setHotspotStatus('OK',200)
      unit.connection=unit.ssid
      processStatus.hotspot.statusSince=new Date()
      processStatus.connectionBusy.status=false
      processStatus.connectionBusy.statusSince=new Date()
      processStatus.gateway.status='INIT'
      processStatus.gateway.statusSince=new Date()
    })
    .catch( (error)=>{
      createHotspot()
    })
    return
  }

	// ignore hotspot connection
	if (unit.connections[_conIndex]==unit.ssid) {
		tryCandidateConnection2(_conIndex + 1)
		return
	}

  var tmpConnection = unit.connections[_conIndex]
  if (unit.connectionStatus[tmpConnection]==undefined) {
    unit.connectionStatus[tmpConnection]={status:null}
  }

  if (unit.connectionStatus[tmpConnection].passwordError == true &&
    new Date() - unit.connectionStatus[tmpConnection].statusSince< 120000) {
    console.log('Wait time for connection '+tmpConnection+' less than 120 seconds (password error) ')
    tryCandidateConnection2(_conIndex+1)
		return
  }
  //// give processing some time
  //processStatus.gateway.statusSince=new Date()

  /*
  // ignore connection already tried less then 5 minutes ago
	if (unit.connectionStatus[tmpConnection].status=='ERROR') {
    if (new Date() - unit.connectionStatus[tmpConnection].statusLatest< 300000) {
      tryCandidateConnection2(index+1)
		  return
    }
	}
  */

  console.log(`tryCandidateConnection2 ${_conIndex} ${unit.connections[_conIndex]}`)
  console.log(unit.connectionStatus[tmpConnection])
  execPromise("LC_ALL=C nmcli connection up '"+unit.connections[_conIndex]+"'")
  .then((result)=>{
    unit.connection=unit.connections[_conIndex]
    if (unit.connectionStatus[tmpConnection].status!='OK') {
      unit.connectionStatus[tmpConnection]={status:'OK',statusSince:new Date(),message:''}
    }
    console.log(`tryCandidateConnection2 then ${_conIndex} ${unit.connections[_conIndex]}`)
    // give processing some time
    processStatus.gateway.status='INIT'
    processStatus.gateway.statusSince=new Date()

    if (processStatus.connection.status!='OK') {
      processStatus.connection.status='OK'
      processStatus.connection.statusSince=new Date()
      processStatus.connection.code=200
      processStatus.connection.message=''
    }
    processStatus.connectionBusy.status=false
    processStatus.connectionBusy.statusSince=new Date()
  })
  .catch((error)=>{
    console.log(`tryCandidateConnection2 catch ${_conIndex} ${unit.connections[_conIndex]}`)
    console.error(`exec error: ${error}`);
    if (unit.connectionStatus[tmpConnection].status!='ERROR') {
      unit.connectionStatus[tmpConnection]={status:'ERROR',statusSince:new Date()}
    }
    unit.connectionStatus[tmpConnection].message=(''+error).split('\n')
    const regex = /password/
    if (unit.connectionStatus[tmpConnection].message[1].match(regex) !=null) {
      var msg='Wachtwoord niet juist, connectie opnieuw aanmaken a.u.b.'
      unit.connectionStatus[tmpConnection].message.push(msg)
      unit.connectionStatus[tmpConnection].passwordError = true
    }

    tryCandidateConnection2(_conIndex+1)
  })
}

const createHotspot = function() {
  console.log(`Create hotspot for ssid ${unit.ssid}`)
  console.log('1. Delete existing hotspot connection')
  if (processStatus.connectionBusy.status==false){
    processStatus.connectionBusy.status=true
    processStatus.connectionBusy.statusSince=new Date()
  }
  processStatus.hotspot.status='INIT'
  processStatus.hotspot.statusSince=new Date()
  processStatus.hotspot.message=''

  // extra time for hotspot status to allow user to connect to
  // ApriSensor hotspot SSID
  // When webapp wifi config page is connected, hotspot will maintain its status
  // until webapp is disconnected or an wifi connection is activated
  unit.hotspotTill=new Date(new Date().getTime()+120000 )

  execPromise("LC_ALL=C nmcli connection delete '"+unit.ssid+"'")
  .then((result)=>{
    createHotspotConnection()
  })
  .catch((error)=>{
    createHotspotConnection()
  })
}
const createHotspotConnection=function(){
  console.log('2. Create hotspot connection')
//  var hotspotCommand= "LC_ALL=C nmcli connection add type wifi ifname '"+
//    unit.ifname+"' con-name '"+unit.ssid+"' autoconnect no wifi.mode ap ssid '"+
//    unit.ssid+"' ipv4.method shared 802-11-wireless-security.key-mgmt wpa-psk 802-11-wireless-security.psk '"+
//    hotspotPassword+"' ipv6.method shared"
  var hotspotCommand= "LC_ALL=C nmcli connection add type wifi ifname '"+
    unit.ifname+"' con-name '"+unit.ssid+"' autoconnect yes wifi.mode ap ssid '"+
    unit.ssid+"' ipv4.method shared" +
    " 802-11-wireless.mode ap 802-11-wireless-security.key-mgmt wpa-psk 802-11-wireless-security.psk '"+
    hotspotPassword+"'"

//nmcli connection
// add type wifi ifname wlan0 con-name local-ap autoconnect yes ssid test-ap mode ap
// modify con-name 802-11-wireless.mode ap 802-11-wireless-security.key-mgmt wpa-psk
//   ipv4.method shared 802-11-wireless-security.psk 'PASSWORD'

  execPromise(hotspotCommand)
  .then((result)=>{
    //setHotspotStatus('OK',200)
    setHotspotUp()
  })
  .catch((error)=>{
    setHotspotStatus('ERROR',400,error)
    processStatus.connectionBusy.status=false
    processStatus.connectionBusy.statusSince=new Date()
  })
}

const setHotspotUp = function() {
  console.log('3. Activate hotspot connection')
  execPromise("LC_ALL=C nmcli connection up '"+unit.ssid+"'")
  .then( (result)=>{
    setHotspotStatus('OK',200)
    unit.connection=unit.ssid
    processStatus.connectionBusy.status=false
    processStatus.connectionBusy.statusSince=new Date()
    processStatus.gateway.status='INIT'
    processStatus.gateway.statusSince=new Date()
//    getIpAddress()
  })
  .catch( (error)=>{
    unit.connection=''
    processStatus.connectionBusy.status=false
    processStatus.connectionBusy.statusSince=new Date()
    // give processing some time
//    processStatus.gateway.statusSince=new Date()
    setHotspotStatus('ERROR',400,error)
  })
}
const setHotspotStatus=function(s,code,error){
  if (processStatus.hotspot.status!=s) {
    processStatus.hotspot.status=s
    processStatus.hotspot.statusSince=new Date()
  }
  processStatus.hotspot.code=code
  if (error == undefined) processStatus.hotspot.message=''
  else processStatus.hotspot.message=error
}

var startActionReboot = function() {
	exec("reboot", (error, stdout, stderr) => {
		if (error) {
			console.error(`exec error: ${error}`);
			return;
		}
	});
}

const actions = []
actions.push(function() {
  var packageFileName = __dirname+"/../package.json"
  console.log(packageFileName)
  fs.readFile(packageFileName, 'utf8', function (err, data) {
    if (err) {
      console.log('package file not found')
    } else {
      try{
        packageFile = JSON.parse(data)
      }
      catch{
        console.log('package file json parse error')
        console.log(packageFile)
      }
    }
  })
  nextAction()
})
/*
actions.push(function() {
  // restart avahi-daemon for correct ####.local
	exec("systemctl stop avahi-daemon ; systemctl start avahi-daemon ", (error, stdout, stderr) => {
		if (error) {
			console.error(`exec error: ${error}`);
		} else {
  		console.log('avahi-daemon restart')
    }
    nextAction()
	})
})
*/
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
      unit.ssid='NOTAPRISENSOR'
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
  // reset /etc/hosts filw
  var hostsFileStandard = "127.0.0.1 localhost "+unit.ssid+" "+unit.ssid+".local\n" +
    "::1		localhost ip6-localhost ip6-loopback\n" +
    "ff02::1		ip6-allnodes\n" +
    "ff02::2		ip6-allrouters\n" +
    "127.0.1.1 raspberry\n"
  fs.readFile("/etc/hosts", 'utf8', function (err, data) {
    if (err || data != hostsFileStandard) {
      console.log('/etc/hosts file rewritten')
      console.log(hostsFileStandard)
      fs.writeFile('/etc/hosts', hostsFileStandard, 'utf8',(err) => {});
    }
  });
  nextAction()
})
actions.push(function() {
//  console.log('getHostname 1')
	exec("nmcli general hostname "+unit.ssid+".local", (error, stdout, stderr) => {
//    console.log('getHostname')
		if (error) {
			console.error(`exec error: ${error}`);
		} else {
      console.log("nmcli general hostname "+unit.ssid+".local")
    }
    nextAction()
	})
})
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

actions.push(function() {
//  console.log('Retrieve wifilist')
	retrieveWifiList()
	.then((result) => {
//		console.log(`getDeviceWifiList then`)
		localWifiList=columnsToJsonArray(result.stdout)
//		console.log(localWifiList)
	})
	.catch((error)=>{
		console.log(`getDeviceWifiList catch`)
		console.log(error)
	})
	nextAction()
}
)

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

actions.push(async function() {
  statusCheck()
	setInterval(statusCheck, 7000);

	nextAction()
})


function getIpAddress() {
	//console.log('getIpAddress')
  execPromise('hostname --all-ip-address')
	.then((result)=> {
	  var stdoutArray	= result.stdout.split('\n');
		unit.ipAddress=[]
	  for (var i=0;i<stdoutArray.length-1;i++) {
	    var idx = stdoutArray[i].indexOf(' ', 8)
	    if (stdoutArray[i]!='') {
				unit.ipAddress.push(stdoutArray[i].substr(0,idx))
			}
	  }
	})
	.catch((error)=> {
		consolelog('getIpAddress error')
	})

}

actions.push(function() {
	let t=unit.ssid+'ScapelerApriSensor'+"                                "
	key=t.substr(0,32)
//	console.log(algoritm)
//	console.log(inKey)
//	key=crypto.createHash(algoritm)
//	.update(inKey)
//	.digest()
	updateCrypto()
	nextAction()
})

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
		'Description='+apriConfig.systemCode+'-'+sensor+' - start or restart '+sensor+' '+ sensorKey + ' service, respawn\n' +
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


const checkHotspotActivation= async function() {
  // hotspot only for ApriSensor (SCRP*)
//  if (unit.serial.substr(0,4) == 'SCRP') {
//    await getGateway()
//    if (processStatus.gateway.status != 'OK') {
//      if (processStatus.timeSync.status!='ERROR') {
//        processStatus.timeSync.status='ERROR'
//        processStatus.timeSync.statusSince=new Date()
//      }
      console.log(`ApriSensor unit, starting hotspot for ${unit.serial} with ssid ${unit.ssid}`)
      createHotspot()
//    } else {
//      console.log(`gateway: ${unit.gateway}`)
//    }

//  } else {
//    console.log(`Not an ApriSensor unit, no automatic start as hotspot for ${unit.serial}`)
//  }
}

/*
// when online no automatic activation of the hotspot necessary
const getGateway = async function() {
  await execPromise('ip route | grep "default via" ')
  .then((result)=>{
    var stdoutArray	= result.stdout.split(' ');
    unit.gateway=stdoutArray[2]
    if (processStatus.gateway.status!='OK') {
      processStatus.gateway.status='OK'
      processStatus.gateway.statusSince=new Date()
    }
  })
  .catch((error)=>{
//    console.log('catch gateway')
//    console.dir(error)
    unit.gateway=''
    if (processStatus.gateway.status!='ERROR') {
      processStatus.gateway.status='ERROR'
      processStatus.gateway.statusSince=new Date()
    }
  })
}
*/
const checkTimeSync = async function() {
  // get file attributes for last time synchronization date & time
  fs.stat("/var/lib/systemd/timesync/clock", async (err, stat) => {
    if (err) {
      if (processStatus.timeSync.status!='ERROR') {
        processStatus.timeSync.status='ERROR'
        processStatus.timeSync.statusSince=new Date()
      }
    } else {
      var result = await execPromise('timedatectl timesync-status|grep "Packet count:"')
      .then((result)=>{
        var stdoutArray	= result.stdout.split(' ');
        var packetCount = parseFloat(stdoutArray[3])
        if (processStatus.timeSync.packetCount != packetCount) {
          processStatus.timeSync.packetCount = packetCount
          processStatus.timeSync.status='OK'
          processStatus.timeSync.statusSince=new Date()
        }
      })
      .catch((error)=>{
        if (processStatus.timeSync.status!='ERROR') {
          processStatus.timeSync.status='ERROR'
          processStatus.timeSync.statusSince=new Date()
          processStatus.timeSync.packetCount = -1
        }
      })
      processStatus.timeSync.syncDate=new Date(stat.atime)
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

const getActiveConnection = function() {
//  var result = await execPromise('LC_ALL=C nmcli c show --active ')
  return execPromise('LC_ALL=C nmcli d show '+unit.ifname+' |grep GENERAL.CONNECTION')
}

const initiateConnectionOrHotspot = function() {
  console.log('SSID:'+unit.ssid+' con:'+unit.connection+' cons:'+JSON.stringify(unit.connections))


/*
  if (unit.connection==''){
    console.log('No connection, checkHotspotActivation')
    // give process some time
//    processStatus.gateway.statusSince=new Date()
//    checkHotspotActivation()
    createHotspot()

    return
  }
  */
/*
  if (unit.connection!=unit.ssid){
//    console.log('No gateway for ' + unit.connection)
//    if (new Date().getTime() - processStatus.gateway.statusSince.getTime() > 20000) {
      console.log('No gateway for ' + unit.connection + ', activating hotspot')
      // give process some time
//      processStatus.gateway.statusSince=new Date()
//      checkHotspotActivation()
      createHotspot()
//    }
    return
  }
*/
//  if (unit.connection==unit.ssid){
    // hotspot status will last at least x time and will stay active as long wifi-config-web page active


//    if (unit.connections.length > 0 ){
      console.log('tryCandidateConnection starting with index 0')
    if (processStatus.connectionBusy.status==false) {
        processStatus.connectionBusy.status=true
        processStatus.connectionBusy.statusSince=new Date()
        tryCandidateConnection2(0)
    }

}

var nrTimesBlink=0

const blinkLed = function(nr) {
  if (nr!=undefined) {
    nrTimesBlink=nr
  }
  if (nrTimesBlink <= 1) {
    nrTimesBlink=0
    setGpioBlueLedOff()
    return
  }

  if (nrTimesBlink%2==0) {
    setGpioBlueLedOff()
  } else {
    setGpioBlueLedOn()
  }
  if (nrTimesBlink>0) {
    nrTimesBlink=nrTimesBlink-1
    setTimeout(() => {
      blinkLed()
    }, 150)
  }
}

const avahiCheck = function() {
  // test avahi and restart when needed
  execPromise('LC_ALL=C avahi-browse -at | grep IPv4 | grep ' + unit.ssid + ' | head -1 ')
  .then((result)=>{
//    console.log('avahi check then')
//    console.log(result)
    let regex = new RegExp(unit.ssid)
//    console.log(''+result.stdout.match(regex))
//    console.log(result.stdout.match(regex))
    if (''+result.stdout.match(regex) !=unit.ssid) {
      console.log('SSID '+unit.ssid+' not found with avahi-browse, restart avahi-daemon')
      avahiRestart()
    }
  })
  .catch((error)=>{
    console.log('avahi check catch, restart avahi daemon')
    avahiRestart()
  })
}

const avahiRestart = function() {
  execPromise("systemctl stop avahi-daemon ; systemctl start avahi-daemon ")
  .then((result)=>{
    console.log('restart avahi then')
  })
  .catch((error)=>{
    console.log('restart avahi catch')
  })
}

const nginxCheck = function() {
  // test nginx and restart when needed
  execPromise('LC_ALL=C systemctl is-active nginx ')
  .then((result)=>{
    //console.log('nginx check then ')
    let tmpResult=(''+result.stdout).split('\n')
    if (tmpResult[0]!='active') {
      execPromise('LC_ALL=C systemctl restart nginx ')
      .then((result)=>{
        console.log('nginx restart then ')
      })
      .catch((error)=>{
        console.log('nginx restart catch ')
      })
    }
  })
  .catch((error)=>{
    console.log('nginx check catch, restart nginx')
    execPromise('LC_ALL=C systemctl restart nginx ')
    .then((result)=>{
      console.log('nginx restart then ')
    })
    .catch((error)=>{
      console.log('nginx restart catch ')
    })
  })
}

const statusCheck = async function() {

  if (processStatus.connectionBusy.status==true ||
      (processStatus.connectionBusy.status==false &&
        new Date().getTime() - processStatus.connectionBusy.statusSince.getTime() < 10000
      )
  ) {
    // blink led
    blinkLed(47)
    console.log('waiting,processStatus.connectionBusy.status==true')
    return
  }
  if (unit.connection==unit.ssid){
    blinkLed(0)
    setGpioBlueLedOn()
  } else {
    // blink once showing process is active
    blinkLed(2)
  }


/*
  // test if nginx process is running, if not start service
  fs.readFile("/var/run/nginx.pid", 'utf8', function (err, data) {
    if (err) {
      console.log('nginx not running, starting nginx')
      execPromise('LC_ALL=C systemctl start nginx')
      .then((result)=>{
      })
      .catch((error)=>{
      })
    }
  });
*/

  getIpAddress()
	if (processStatus.timeSync.status!='OK') checkTimeSync()  // only untill first OK

  avahiCheck()
  nginxCheck()

  // retrieve all wifi connections
  await execPromise('LC_ALL=C nmcli -f name,type connection| grep wifi')
  .then((result)=>{
    //console.log('status check get all connections then')
    var stdoutArray	= result.stdout.split('\n');
    unit.connections=[]
    for (var i=0;i<stdoutArray.length-1;i++) {
      var pos = stdoutArray[i].indexOf("wifi")
      var tmp=stdoutArray[i].substr(0,pos-1).trim()
      if (tmp!=unit.ssid) {
        unit.connections.push(tmp)
      }
    }
    getActiveConnection()
    .then((result)=>{
      //console.log("getActiveConnection then")
      var stdoutArray	= result.stdout.split(' ');
      var tmp=stdoutArray[stdoutArray.length-1]
      unit.connection=tmp.split('\n')[0]
    })
    .catch((error)=>{
      console.log("getActiveConnection catch")
      unit.connection=''
    })
  })
  .catch((error)=>{
    console.log('status check get all connections catch')
    unit.connections=[]
    unit.connection=''
  })

  if (unit.connection==unit.ssid &&
    unit.connections.length==0) {
    console.log('hotspot active and no wifi configurations configured yet')
    return
  }
  if (unit.connection=='' &&
    unit.connections.length==0) {
    console.log('no active connection and no wifi configurations configured yet, create hotspot')
    createHotspot()
    return
  }
  // let hotspot continue for some time
  if (unit.ssid == unit.connection) {
    if (unit.hotspotTill!=undefined && unit.hotspotTill!=NaN ) {
      var tmpTime=(unit.hotspotTill.getTime()) - (new Date().getTime())
      if (tmpTime>0) {
        console.log('Hotspot will stay for ' + tmpTime +' msec')
        return
      }
    }
  }


  if (processStatus.gateway.status=='INIT' &&
        new Date().getTime() - processStatus.gateway.statusSince.getTime() < 10000) {
    console.log('Connection just initiated, wait 10 secs before first gateway check (' + tmpTime +' msec)')
    return
  }
  // determine with result of ping to (default) gateway if connection is active
//  execPromise("ping -q -w 1 -c 1 `ip r | grep default | head -1 | cut -d ' ' -f 3` > /dev/null")

/*
  await execPromise("LC_ALL=C nmcli networking connectivity check")
  .then((result)=>{
    console.log('nmcli networking connectivity check then '+ result)
  }).catch((error)=>{
    console.log('nmcli networking connectivity check catch '+ error)
  })
*/
//  execPromise("LC_ALL=C ping -q -w 1 -c 1 8.8.8.8 > /dev/null")
  await execPromise("LC_ALL=C nmcli networking connectivity check")
  .then((result)=>{
    if (unit.connectionCount==undefined ) {
      unit.connectionCount=0
      unit.connectionPrev=''
    }
    unit.connectionCount++
    if(unit.connection!=unit.connectionPrev || unit.connectionCount>200) {
      process.stdout.write("\nSSID:"+unit.ssid+"\n")
      console.log(unit.connections)
      process.stdout.write(unit.connectionPrev+'->'+unit.connection);
      unit.connectionPrev=unit.connection
      unit.connectionCount=0
    }

    if (result.stdout=='full\n') {
      process.stdout.write("F");
      // process.stdout.write("Downloading " + data.length + " bytes\r");
      if (processStatus.gateway.status!='OK') {
        processStatus.gateway.status='OK'
        processStatus.gateway.statusSince=new Date()
      }
      // blink twice showing process is active and gateway OK
      blinkLed(5)
//      console.log('status gateway OK since '+ processStatus.gateway.statusSince.toISOString()+
//        ' SSID:'+unit.ssid+' con:'+unit.connection+' cons:'+JSON.stringify(unit.connections))
      return
    }
    if (result.stdout=='limited\n') {
      process.stdout.write("L");
      if (processStatus.gateway.status!='OK') {
        processStatus.gateway.status='OK'
        processStatus.gateway.statusSince=new Date()
      }
      // blink twice showing process is active and gateway OK
      blinkLed(5)
      return
    }

    process.stdout.write("\n"+result.stdout+': ');
    unit.gateway=''
		if (processStatus.gateway.status!='ERROR') {
			processStatus.gateway.status='ERROR'
			processStatus.gateway.statusSince=new Date()
		}

    console.log('Hotspot status: '+processStatus.hotspot.status)
    var tmpWaitTime = new Date().getTime() - processStatus.hotspot.statusSince.getTime()
    console.log('Hotspot time: '+ tmpWaitTime)
    console.log(unit.connection +' '+unit.ssid)
    if (unit.connection==unit.ssid &&
      tmpWaitTime < 50000) {
      console.log('hotspot active wait minimal 50 seconds')
      return
    }
    if (unit.connection!=unit.ssid && unit.connection !='') {
      tmpWaitTime = new Date().getTime() - processStatus.gateway.statusSince.getTime()
      if (tmpWaitTime < 15000) {
        console.log('gateway problem less then 15 seconds ago, wait for next round')
        return
      }
    }

    initiateConnectionOrHotspot()
    return
  }).catch((error)=>{
    console.log('statusCheck catch: '+error)
    unit.gateway=''
		if (processStatus.gateway.status!='ERROR') {
			processStatus.gateway.status='ERROR'
			processStatus.gateway.statusSince=new Date()
		}

    console.log('Hotspot status: '+processStatus.hotspot.status)
    var tmpWaitTime = new Date().getTime() - processStatus.hotspot.statusSince.getTime()
    console.log('Hotspot time: '+ tmpWaitTime)
    console.log(unit.connection +' '+unit.ssid)
    if (unit.connection==unit.ssid &&
      tmpWaitTime < 50000) {
      console.log('hotspot active wait minimal 50 seconds')
      return
    }
    if (unit.connection!=unit.ssid && unit.connection !='') {
      tmpWaitTime = new Date().getTime() - processStatus.gateway.statusSince.getTime()
      if (tmpWaitTime < 15000) {
        console.log('gateway problem less then 15 seconds ago, wait for next round')
        return
      }
    }

    initiateConnectionOrHotspot()

  })
}
/*
//}
//############################

//  ping -q -w 1 -c 1 `ip r | grep default | cut -d ' ' -f 3` > /dev/null && echo ok || echo error

	if (skipStatusCheck==true) return
	getIpAddress()
	checkTimeSync()
	//await getGateway()
	await execPromise("ping -q -w 1 -c 1 `ip r | grep default | head -1 | cut -d ' ' -f 3` > /dev/null")
	.then( async (result)=>{
		var stdoutArray	= result.stdout.split(' ');
		unit.gateway=stdoutArray[2]
		if (processStatus.gateway.status!='OK') {
			processStatus.gateway.status='OK'
			processStatus.gateway.statusSince=new Date()
		}
		// gateway oke then rest for one minute
		skipStatusCheck=true
		await sleep(60000)
		.then((result)=> {
			skipStatusCheck=false
		})
		.catch((error)=> {
			skipStatusCheck=false
		})
		return
	})
	.catch((error)=>{
		unit.gateway=''
		if (processStatus.gateway.status!='ERROR') {
			processStatus.gateway.status='ERROR'
			processStatus.gateway.statusSince=new Date()
		}
	})

	var tmp = new Date().getTime()-processStatus.connectionBusy.statusSince.getTime();
	if (new Date().getTime() - processStatus.connectionBusy.statusSince.getTime() > 20000){
		// do not wait too long ;-)
		// forced reset of Busy state
		processStatus.connectionBusy.status='interupted'
		processStatus.connectionBusy.statusSince=new Date()
		return
	}
	if(processStatus.connectionBusy.status=='interupted') {
		processStatus.connectionBusy.status=''
	}
  if (processStatus.connectionBusy.status==true) {
    console.log(`No status check because waiting for connection to complete, now ${tmp} millisecs`)
    return
  }
	if (processStatus.connectionBusy.status != '' && new Date().getTime() - processStatus.connectionBusy.statusSince.getTime() < 4000) {
    console.log(`No status check because to soon after connection completed, now ${tmp} millisecs`)
    return
  }

  console.log('statusCheck')
	// retrieve all wifi connections (no await)
  execPromise('LC_ALL=C nmcli -f name,type connection| grep wifi')
  .then((result)=>{
    //console.log('status check get all connections then')
    var stdoutArray	= result.stdout.split('\n');
    unit.connections=[]
    for (var i=0;i<stdoutArray.length-1;i++) {
			var pos = stdoutArray[i].indexOf("wifi")
      var tmp=stdoutArray[i].substr(0,pos-1).trim()
      if (tmp!=unit.ssid) {
        unit.connections.push(tmp)
      }
    }
  })
  .catch((error)=>{
    console.log('status check get all connections catch')
    unit.connections=[]
  })

	// retrieve active connection
  await getActiveConnection()
	.then((result)=>{
		var stdoutArray	= result.stdout.split(' ');
		var tmp=stdoutArray[stdoutArray.length-1]
		unit.connection=tmp.split('\n')[0]
		//console.log(unit.connection)
	})
	.catch((error)=>{
		//console.log("getActiveConnection error")
		unit.connection=''
	})

  console.dir(processStatus)
  console.dir(unit)

//  if (processStatus.timeSync.status != 'OK') {
//    if (new Date().getTime() - processStatus.timeSync.syncDate.getTime() > 3600000) {
//        console.log('maybe a problem, timesync or just mobile use')
//    }
//  }
    if (unit.connection!=unit.ssid){
      //setGpioBlueLedOff()
      //console.log('Hotspot is not active)')
      if (processStatus.gateway.status != 'OK') {
        // console.log('No gateway so no standard connection')
        if (new Date().getTime() - processStatus.gateway.statusSince.getTime() > 20000) {
          if (new Date().getTime() - processStatus.hotspot.statusSince.getTime() > 20000) {
            console.log('A gateway problem maybe a problem, timesync or just mobile use')
            checkHotspotActivation()
          }
        }
      }
			return
    }
//  }
//  if (processStatus.hotspot.status=='OK') {
  // hotspot active?
  if (unit.connection==unit.ssid){
    //setGpioBlueLedOn()
    //if (processStatus.hotspot.status=='OK') {
     // after 120 sec. stop hotspot and try standard connection
    if (new Date().getTime() - processStatus.hotspot.statusSince.getTime() >300000){
//      if (processStatus.connectionBusy.status==false) {
//        if (new Date().getTime() - processStatus.connectionBusy.statusSince.getTime() >10000){
          if (unit.connections.length > 0 ){
        //    if (unit.ssid != unit.connection){ // do not try hotspot
              connectionsIndex=0
              tryCandidateConnection(connectionsIndex)
        //    }
          }
//        }
//      }
    }
  }
}
*/
const updateCrypto = function(){
	unitCrypto.key = 	key

/*
	unitCrypto.iv = crypto.randomBytes(16);
	unitCrypto.ivDate=new Date()
	unitCrypto.cipher = crypto.createCipheriv(algoritm, Buffer.from(key), unitCrypto.iv)
	unitCrypto.decipher = crypto.createDecipheriv(algoritm, Buffer.from(key), unitCrypto.iv)
*/

}
const encrypt=function(data){
	var encrypted = unitCrypto.cipher.update(data,'utf8','hex')
	encrypted += unitCrypto.cipher.final('hex')
	return encrypted
}
const decrypt=function(data){
	console.log(data)
	try {
		var decrypted = unitCrypto.decipher.update(data,'hex','utf8')
		decrypted += unitCrypto.decipher.final('utf8')
	} catch(error) {
		console.log('no valid post data')
		console.log(error)
		decrypted='{}'
	}
	return decrypted
}
