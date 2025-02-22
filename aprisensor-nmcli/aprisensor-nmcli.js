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
const { createHttpTerminator } = require('http-terminator');
const fs = require('fs');
//const parseUrl = require('url')
const exec = require('child_process').exec;
const util = require('util');
const execPromise = util.promisify(require('child_process').exec);
//const execSync			= require('child_process').execSync;
//const execFile			= require('child_process').execFile;


/*
var redis = require("redis");
const redisClient = redis.createClient();

redisClient.on("error", function (err) {
  console.log("Redis client Error " + err);
});
*/

let aprisensorType = ''  // standard: aprisensorType=='aprisensor-typ-standard'
let aprisensorTypeConfig = {}
let aprisensorDevices = {}
let systemFolderParent = '/opt/SCAPE604'
try {
  let tmpCfg = systemFolderParent + '/config/aprisensor-type.cfg'
  aprisensorType = fs.readFileSync(tmpCfg, { encoding: 'utf8' }).split('\n')[0]
  console.log('aprisensor-type: ' + aprisensorType);
}
catch (err) {
  aprisensorType = ''
  console.log('aprisensor-type.cfg not found');
}
if (aprisensorType != '') {
  try {
    aprisensorTypeConfig = JSON.parse(fs.readFileSync(systemFolderParent + '/apri-sensor/apri-config/aprisensor-types/' + aprisensorType + '.json', { encoding: 'utf8' }))
    for (let i = 0; i < aprisensorTypeConfig.devices.length; i++) {
      let _dev = aprisensorTypeConfig.devices[i]
      aprisensorDevices[_dev.deviceType] = _dev
    }
  }
  catch (err) {
    aprisensorTypeConfig = {}
    console.log('aprisensor-type ' + aprisensorType + '.json' + ' not found');
  }
}




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
var packageFile = {}

var menuUrl;
var localServer = {};
localServer.ConfigMenu = {};
var apiPort = process.argv[2] || 4000 // default 4000
console.log('port: ' + apiPort)
var hotspotPassword = 'scapeler'
var skipStatusCheck = false

let key
const algoritm = "AES-GCM"

let gpio
let gpioBlueLed
let gpioBlueLedStatus = 'off'
let gpioWifiButton
let wifiStatus
let wifiButtonStatus

try {
  gpio = require('onoff').Gpio
}
catch (err) {
  console.log('GPIO module onoff not installed');
}

let gpioNumbers = {}
var getGpioInfo = async function () {
  await execPromise("LC_ALL=C cat /sys/kernel/debug/gpio | grep '(GPIO' ")  // for internal gpio numbers
    .then((result) => {
      let tmp1 = result.stdout.split('\n')
      for (let i = 0; i < tmp1.length; i++) {
        let tmp2 = tmp1[i].split(/\s+/)
        if (tmp2.length > 3) {
          let key = tmp2[2].substring(1) // '(GPIO##' -> 'GPIO##'
          let value = Number(tmp2[1].split('-')[1])
          gpioNumbers[key] = value
        }
      }
      //console.log(result, gpioNumbers)
      gpioBlueLed = new gpio(gpioNumbers.GPIO19, 'out'); //use GPIO-19 pin 35, and specify that it is output
      gpioWifiButton = new gpio(gpioNumbers.GPIO23, 'in'); //use GPIO-23 pin 16, and specify that it is input
      //  gpioGpsLed = new gpio(536, 'out'); //use GPIO-24 pin 18, and specify that it is output
      //  gpioDs18b20 = new gpio(537, 'out'); //use GPIO-25 pin 22, and specify that it is output
      //  //gpioFan = new gpio(538, 'out'); //use GPIO-26 pin 37, and specify that it is output
      //  gpioBme = new gpio(539, 'out'); //use GPIO-27 pin 13, and specify that it is output
      gpioWifiButton.read()
        .then(value => {
          setWifiButtonStatus(value)
        })
        .catch(err => console.log(err));
      gpioWifiButton.watch((err, value) => {
        if (err) {
          throw err;
        }
        setWifiButtonStatus(value)
      });
    
    })
    .catch((error) => {
      console.log('catch GPIO info', error)
    })

};
if (gpio) getGpioInfo()


const setWifiButtonStatus = async function (value) {
  if (aprisensorDevices?.connectButton?.connectWhen == 'on') {
    if (value == 1) {
      wifiButtonStatus = 'on'
      //console.log("Wifi connect button on")
      await execPromise("LC_ALL=C nmcli radio wifi on ")
        .then((result) => {
          //console.log('Wifi service started')
          wifiStatus = 'on'
        })
        .catch((error) => {
          console.log('catch start WiFi service', error)
        })
    } else {
      wifiButtonStatus = 'off'
      //console.log("Wifi connect button off")
      await execPromise("LC_ALL=C nmcli radio wifi off ")
        .then((result) => {
          //console.log('Wifi service stopped')
          wifiStatus = 'off'
        })
        .catch((error) => {
          console.log('catch stop WiFi service', error)
        })
    }
  }
}

process.on('SIGINT', _ => {
  gpioBlueLed.unexport();
  gpioWifiButton.unexport();
});
const setGpioBlueLedOn = function () {
  //console.log('set blue LED GPIO on')
  gpioBlueLed.writeSync(1); //set pin state to 1 (power LED on)
  gpioBlueLedStatus = 'on'
}
const setGpioBlueLedOff = function () {
  //console.log('set blue LED GPIO off')
  gpioBlueLed.writeSync(0); //set pin state to 0 (power LED off)
  gpioBlueLedStatus = 'off'
}

const checkWifiSwitchStatus = async function () {
  await execPromise("LC_ALL=C systemctl status wpa_supplicant | grep running '")
    .then((result) => {
      if (result.length > 10) {
        console.log('Wifi is active/running')
        wifiStatus = 'on'
      } else {
        console.log('Wifi is inactive/stopped')
        wifiStatus = 'off'
      }
    })
    .catch((error) => {
      console.log('catch checkWifiSwitch', error)
    })
}
const checkWifiStatus = async function () {
  await execPromise("LC_ALL=C systemctl status wpa_supplicant | grep running '")
    .then((result) => {
      if (result.length > 10) {
        console.log('Wifi is active/running')
        wifiStatus = 'on'
      } else {
        console.log('Wifi is inactive/stopped')
        wifiStatus = 'off'
      }
    })
    .catch((error) => {
      console.log('catch checkWifiSwitch', error)
    })
}


var unit = {
  'connectionStatus': {}
  , connection: ''
  , connections: []
  , connectionCount: 0
  , connectionPrev: ''
  , wifiActive: true
}

var unitCrypto = {}

var localWifiList = []

var processStatus = []
processStatus.main = {
  startDate: new Date()
  , checkDate: new Date()
}
processStatus.connection = {
  code: -1  // -1=init; 100=error creating hotspot connection
  , status: ''
  , statusSince: new Date()
}
processStatus.hotspot = {
  code: -1  // -1=init; 100=error creating hotspot connection
  , status: ''
  , statusSince: new Date()
}
processStatus.gateway = {
  status: ''
  , statusSince: new Date()
}
processStatus.timeSync = {
  status: ''
  , statusSince: new Date()
  , packetCount: -1
}
processStatus.latestConnection = {
  connection: ''
  , statusSince: new Date()
}
processStatus.connectionBusy = {
  status: ''
  , statusSince: new Date()
}

const entryCheck = function (req) {
  const contentType = req.headers["Content-Type"];
  if (!contentType == undefined && !contentType.includes(REQUIRED_CONTENT_TYPE)) {
    throw new Error("Sorry we only support content type as json format.");
  }

  const accept = req.headers["accept"];
  if (!(accept.includes(ACCEPT_ENCODING_1) ||
    accept.includes(ACCEPT_ENCODING_2))) {
    throw new Error("Sorry we only support accept json format.");
  }
}

const returnResultJson = function (result, req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  // set response content
  res.write(JSON.stringify(result));
  //res.write('executed');
  res.end();
}
const returnError = function (error, req, res) {
  res.writeHead(400)
  // set response content

  var errorStr = 'ERROR unknown'
  try {
    errorStr = JSON.stringify(error)
  }
  catch (err) {
    console.log(err)
    errorStr = 'ERROR unknown'
  }
  res.write(errorStr);
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
    let url = req.url;
    req.urlPath = req.url.split('?')[0]
    if (req.url.split('?').length > 0) {
      req.urlQuery = req.url.split('?')[1]
    }

    switch (methodType) {
      case 'OPTIONS':
        res.end();
        break;
      case 'GET':
        if (req.url == '/nmcli/api/v1/general') {
          getGeneral(req, res)
          break
        }
        if (req.url == '/nmcli/api/v1/ip/avahi') {
          getIpAvahi(req, res)
          break
        }
        if (req.url == '/nmcli/api/v1/connection/show') {
          getConnectionShow(req, res, returnResultJson)
          break
        }
        if (req.url == '/nmcli/api/v1/device/hotspot') {
          getDeviceHotspot(req, res, returnResultJson)
          break
        }
        if (req.url == '/nmcli/api/v1/device/wifilist') {
          getDeviceWifiList(req, res)
          break
        }
        if (req.urlPath == '/nmcli/api/v1/sensor/latest') {
          getSensorLatest(req, res)
          break
        }
        //				if (req.url == '/nmcli/api/v1/device/wifilistcache') {
        //			    getDeviceWifiListCache(req,res)
        //					break
        //				}
        console.log('invalid api call', methodType, url)
        res.writeHead(400);
        res.write(`{error:400,message: 'Invalid API-call: ${methodType} ${url}'}`);
        res.end();
        break;
      case 'POST':
        if (req.url == '/nmcli/api/v1/key') {
          postPublicKey(url, req, res)
          break
        }
        if (req.url == '/nmcli/api/v1/device/connect') {
          postDeviceConnect(url, req, res)
          break
        }
        if (req.url == '/nmcli/api/v1/accesspoint/connect') {
          postApConnect(url, req, res)
          break
        }
        if (req.url == '/nmcli/api/v1/reboot') {
          postReboot(url, req, res)
          break
        }
        if (req.url == '/nmcli/api/v1/shutdown') {
          postShutDown(url, req, res)
          break
        }
        if (req.url == '/nmcli/api/v1/upgrade') {
          postUpGrade(url, req, res)
          break
        }
        console.log('invalid api call', methodType, url)
        res.writeHead(400);
        res.write(`{error:400,message: 'Invalid API-call: ${methodType} ${url}'}`);
        res.end();
        break;
      case 'PUT':
        console.log('invalid api call', methodType, url)

        res.writeHead(400);
        res.write(`{error:400,message: 'Invalid API-call: ${methodType} ${url}'}`);
        res.end();

        res.writeHead(400);
        res.write(`{error:400,message: 'Invalid API-call: ${methodType} ${url}'}`);
        res.end();

        break;
      case 'DELETE':
        if (req.url == '/nmcli/api/v1/connection/delete') {
          deleteMethodHandler(url, req, res)
          break
        }
        console.log('invalid api call', methodType, url)

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

var server
var httpTerminator
const initHttpServer = function () {
  server = http.createServer(requestListener)
  httpTerminator = createHttpTerminator({
    server,
  });
  server.listen(apiPort);
}
initHttpServer()


// **********************************************************************************

var columnsToJsonArray = function (columns) {
  var records = ('' + columns).split('\n')
  var resultJson = []
  var keyArray = []
  // split record 1 at space(s) (column labels)
  var keys = records[0].split(/[\s]+/)
  if (records.length < 2) return resultJson  // no data, may be only column labels

  var keyPrev = 0
  for (var i = 0; i < keys.length - 1; i++) {
    var key = {}
    key.name = keys[i].trim()
    key.index = records[0].indexOf(key.name, keyPrev)
    keyArray.push(key)
    var keyPrev = key.index + key.name.length
  }

  if (keyArray.length == 0) return resultJson

  //	console.dir(keyArray)
  for (var i = 0; i < keyArray.length - 1; i++) {
    keyArray[i].colWidth = keyArray[i + 1].index - keyArray[i].index
  }
  keyArray[keyArray.length - 1].colWidth = records[0].length - keyArray[keyArray.length - 1].index

  for (var i = 1; i < records.length - 1; i++) {
    var record = records[i]
    var newRecord = {}
    for (var j = 0; j < keyArray.length; j++) {
      newRecord[keyArray[j].name] = record.substr(keyArray[j].index, keyArray[j].colWidth).trim()
    }
    resultJson.push(newRecord)
  }
  return resultJson
}

const getGeneral = function (req, res, callback) {
  // keep hotspot active as long web page connected. (activate other connectio through webpage)
  if (unit.connection == unit.ssid) {
    // hotspot status will last as long as wifi-config-web page active (pulse)
    processStatus.hotspot.statusSince = new Date()
  }

  execPromise("LC_ALL=C nmcli general")
    .then((result) => {
      var resultJson = columnsToJsonArray(result.stdout)
      //		resultJson[0].iv=unitCrypto.iv
      //		resultJson[0].ivDate=unitCrypto.ivDate
      var resultData = resultJson[0]
      resultData.info = {}
      resultData.info.version = packageFile.version
      resultData.wifiActive = unit.wifiActive

      return returnResultJson(resultData, req, res);
    })
    .catch((error) => {
      return returnError(error, req, res);
    })
}
const getIpAvahi = function (req, res) {
  res.writeHead(200);
  res.write(`{"ipAvahi":"${unit.ipAddress}"}`);
  res.end();
}

const getConnectionShow = function (req, res, callback) {
  exec("LC_ALL=C nmcli connection show ", (error, stdout, stderr) => {
    if (error) {
      // console.error(`exec error: ${error}`);
      return callback(error, req, res);
    }
    var resultJson = columnsToJsonArray(stdout)

    for (var i = 0; i < resultJson.length; i++) {
      var tmpCon = resultJson[i].NAME
      if (unit.connectionStatus[tmpCon] != undefined) {
        resultJson[i].status = unit.connectionStatus[tmpCon]
      }
    }

    return callback(resultJson, req, res)
  });
}
const getDeviceHotspot = function (req, res, callback) {

  // extra time for hotspot status to allow user to connect to
  // ApriSensor hotspot SSID
  // When webapp wifi config page is connected, hotspot will maintain its status
  // until webapp is disconnected or an wifi connection is activated
  unit.hotspotTill = new Date(new Date().getTime() + 120000)
  if (unit.connection == unit.ssid) {
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
}

function sleep(ms) {
  console.log(`sleep promise ${ms}ms`)
  return new Promise(resolve => setTimeout(resolve, ms));
}

const restartNetworkManager = function () {
  console.log(`restart network-manager`)
  return execPromise("LC_ALL=C systemctl restart network-manager")
}

/*
const getDeviceWifiListCache = function(req,res) {
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
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.write(JSON.stringify(localWifiList));
    res.end();
  })
  .catch((error)=>{
    console.log(`getDeviceWifiList catch`)
    console.log(error)
    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.write(JSON.stringify(localWifiList));
    res.end();
  })
}
const getDeviceWifiList = async function(req,res) {
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

*/
/*
const retrieveWifiList = async function(){
  console.log(`retrieveWifiList`)
  await execPromise("LC_ALL=C nmcli device wifi rescan")
  .then( async (result)=>{
    console.log(`wifi rescan then`)
  })
  .catch(async (error)=>{
    console.log(`wifi rescan catch`)
  })
  return execPromise("LC_ALL=C nmcli device wifi list")
}
*/
/*
const retrieveWifiList = async function(){
  wifiScan()
  .then( async (result)=>{
    console.log(`wifi rescan then`)
    localWifiList=parseWifiScan(result.stdout)
  })
  .catch(async (error)=>{
    console.log(`iwlist scan catch`)
    localWifiList=[]
  })
}
*/
const getDeviceWifiList = function (req, res) {
  wifiScan()
    .then((result) => {
      console.log(`iwlist scan then`)
      localWifiList = parseWifiScan(result.stdout)
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.write(JSON.stringify(localWifiList));
      res.end();
    })
    .catch((error) => {
      console.log(`iwlist scan catch`)
      console.dir(error)
      localWifiList = []
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.write(JSON.stringify(localWifiList));
      res.end();
    })
}

const wifiScan = function () {
  return execPromise("LC_ALL=C iwlist wlan0 scan | egrep 'Cell|Quality|ESSID|Channel:' ")
}

const parseWifiScan = function (wifiData) {
  // XXX:
  var lines = wifiData.split('\n')
  var ssids = []
  var ssid = { "SIGNAL": '' }
  var regex = /a/;
  //console.log(wifiData)
  //console.dir(lines)
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i]
    //console.log(line)
    regex = /Cell/;
    if (line.search(regex) > 0) { // new ssid
      if (ssid.SSID) {
        ssids.push(ssid) // add ssid to ssids
      }
      ssid = { "SIGNAL": '' }
      continue
    };
    regex = /ESSID/;
    if (line.search(regex) > 0) { // ssid
      ssid.SSID = line.split('"')[1]
      continue
    };
    regex = /Quality/;
    var p = line.search(regex)
    if (p > 0) {
      ssid["SIGNAL"] = line.substr(p + 8, 5)
      continue
    };
    regex = /Channel/;
    var pc = line.search(regex)
    if (pc > 0) {
      ssid["CHAN"] = line.substr(pc + 8, 2)
      continue
    };
  }
  if (ssid.SSID) {
    ssids.push(ssid) // add (last) ssid to ssids
  }
  return ssids;
}

const deleteMethodHandler = (url, req, res) => {
  let data = Buffer.alloc(0);
  req.on('data', (datum) => data = Buffer.concat([data, datum]));
  req.on('end', async () => {
    console.log(data.toString('utf8'));
    var result = JSON.parse(data.toString('utf8'))
    var id = result.UUID
    if (result.key == 'device') id = result.DEVICE
    if (result.key == 'name') id = result.NAME
    if (result.key == 'type') id = result.TYPE
    execPromise("LC_ALL=C nmcli connection delete '" + id + "'  ")
      .then((result) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(result.stdout);
        res.end();
      })
      .catch((error) => {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify(columnsToJsonArray(error)));
        res.end();
      })
  })
}

const postPublicKey = (url, req, res) => {
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

const postDeviceConnect = (url, req, res) => {
  console.log(url)
  if (processStatus.connectionBusy.status == true) {
    console.log('resource busy, retry later')
    res.writeHead(400);
    res.write(JSON.stringify({ error: 400, message: 'sensorkit is bezig, even wachten en dan opnieuw proberen' }));
    res.end();
    return
  }
  processStatus.connectionBusy.status = true
  processStatus.connectionBusy.statusSince = new Date()
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString(); // convert Buffer to string
  });
  req.on('end', () => {
    var result = JSON.parse(body)
    var id = result.NAME
    if (unit.connectionStatus[id] == undefined) {
      unit.connectionStatus[id] = { status: 'INIT', statusSince: new Date() }
    }
    //if (result.key=='device') id=result.DEVICE
    //if (result.key=='name') id=result.NAME
    //if (result.key=='type') id=result.TYPE
    //    exec("LC_ALL=C nmcli device wifi connect '"+id+ "' password '"+result.password+"'", (error, stdout, stderr) => {
    execPromise("LC_ALL=C nmcli -w 20 connection up '" + id + "'")
      .then((result) => {
        console.log(`postDeviceConnect then ${id} `)
        unit.connection = id
        if (unit.connectionStatus[id].status != 'OK') {
          unit.connectionStatus[id] = { status: 'OK', statusSince: new Date() }
        }
        if (id == unit.ssid) {
          processStatus.hotspot.status = 'OK'
          processStatus.hotspot.statusSince = new Date()
        }
        processStatus.connectionBusy.status = false
        processStatus.connectionBusy.statusSince = new Date()
        res.writeHead(200);
        res.write(result.stdout);
        res.end(`Device connected`);
      })
      .catch((error) => {
        console.log('id: ' + id)
        console.error(`exec error: ${error}`);
        unit.connection = ''
        if (unit.connectionStatus[id] == undefined) {
          unit.connectionStatus[id] = { status: 'ERROR', statusSince: new Date() }
        }
        if (unit.connectionStatus[id].status != 'ERROR') {
          unit.connectionStatus[id] = { status: 'ERROR', statusSince: new Date() }
        }
        unit.connectionStatus[id].message = ('' + error).split('\n')
        const regex = /password/
        if (unit.connectionStatus[id].message[1].match(regex) != null) {
          var msg = 'Wachtwoord niet juist, connectie opnieuw aanmaken.'
          //console.log('add readable text to the message: '+msg)
          //console.dir(unit.connectionStatus[id])
          unit.connectionStatus[id].message.push(msg)
        }
        //console.dir(unit.connectionStatus[id])

        processStatus.connectionBusy.status = false
        processStatus.connectionBusy.statusSince = new Date()
        res.writeHead(400);
        res.write(`{error:400,message: '${error}'}`);
        res.end();
      })
  })
}

// connect to accesspoint
const postApConnect = async (url, req, res) => {
  if (processStatus.connectionBusy.status == true) {
    res.writeHead(400);
    let msgBody = { error: 400, message: 'sensorkit is bezig, probeer later nog eens' + result.error }
    res.write(JSON.stringify(msgBody));
    res.end()
    return
  }
  console.log(url)
  processStatus.connectionBusy.status = true
  processStatus.connectionBusy.statusSince = new Date()

  let body = '';
  req.on('data', chunk => {
    body += chunk.toString(); // convert Buffer to string
  });
  req.on('end', async () => {
    var result = {}
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
      result = { error: 'json' }
    }
    //    }
    if (result == null || result.error != undefined) {
      processStatus.connectionBusy.status = false
      processStatus.connectionBusy.statusSince = new Date()
      res.writeHead(400);
      let msgBody = { error: 400, message: 'invalid data, ' + result.error }
      res.write(JSON.stringify(msgBody));
      res.end()
      return
    }
    if (result.ssid == undefined || result.ssid == '') {
      res.writeHead(400);
      let msgBody = { error: 400, message: 'invalid data, no SSID received' }
      res.write(JSON.stringify(msgBody));
      res.end()
      return
    }
    var ssid = result.ssid
    var passwd = result.passwd
    if (result.passwd.substr(0, 3) == 'SCP') {
      passwd = result.passwd.substr(3)
    }
    let passphrase
    console.log('connection down')
    await execPromise("LC_ALL=C nmcli connection down '" + ssid + "'")
      .then((result) => { console.log('then connection down') })
      .catch((error) => { console.log('catch connection down') })
    console.log('connection deactivated when active')
    await execPromise("LC_ALL=C nmcli connection delete '" + ssid + "'")
      .then((result) => { console.log('then connection delete') })
      .catch((error) => { console.log('catch connection delete') })
    // get passphrase
    await execPromise("LC_ALL=C wpa_passphrase '" + ssid + "' '" + passwd + "'")
      .then((result) => {
        try {
          let stdout = result.stdout
          let t1 = stdout.split('\n')
          let t2 = t1[3].split('=')
          passphrase = t2[1]
        } catch (error) {
          console.log('error passphrase', error)
        }
      })
      .catch((error) => { console.log('catch wpa_passphrase', error) })
    if (!passphrase) {
      res.writeHead(400);
      let msgBody = { error: 400, message: 'error while creating passphrase' }
      res.write(JSON.stringify(msgBody));
      res.end()
      return
    }
    console.log('connection create')
    //    var createCommand= "LC_ALL=C nmcli connection  type wifi ifname '"+unit.ifname+"' con-name '"+ssid+"' autoconnect yes  \
    //ipv4.method shared 802-11-wireless-security.key-mgmt wpa-psk 802-11-wireless-security.psk '"+passwd+"' \
    //      802-1x.eap pwd 802-1x.password '"+passwd+"' \
    //ipv4.method shared ipv6.method shared \
    var createCommand = "LC_ALL=C nmcli connection add type wifi ifname '" + unit.ifname + "' con-name '" + ssid + "' autoconnect yes  \
      ssid '"+ ssid + "' 802-11-wireless.powersave 2 \
      802-11-wireless-security.key-mgmt wpa-psk 802-11-wireless-security.psk '"+ passphrase + "' \
      wifi-sec.key-mgmt wpa-psk wifi-sec.psk '"+ passphrase + "' "
    //console.log(createCommand)
    execPromise(createCommand)
      .then((result) => {
        console.log('nmcli connection add then')
        //			console.log(result)
        processStatus.connectionBusy.status = false
        processStatus.connectionBusy.statusSince = new Date()
        res.writeHead(200);
        res.write(result.stdout);
        res.end(`The accesspoint is connected to the device`);
      })
      .catch((error) => {
        console.log(error)
        unit.connection = ''
        processStatus.connectionBusy.status = false
        processStatus.connectionBusy.statusSince = new Date()
        res.writeHead(400);
        res.write(`{error:400,message: '${error}'}`);
        res.end();
      })

    /*
        console.log('connection up')
        await execPromise("LC_ALL=C nmcli -w 20 connection up '"+ssid+ "'")
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
const postReboot = async (url, req, res) => {
  console.log(`Reboot`)
  return exec("LC_ALL=C reboot ")
}
// shutdown Raspberry Pi
const postShutDown = async (url, req, res) => {
  console.log(`Shutdown`)
  return exec("LC_ALL=C shutdown -h now ")
}
// shutdown Raspberry Pi
const postUpGrade = async (url, req, res) => {
  console.log(`Upgrade`)
  return exec("LC_ALL=C /opt/SCAPE604/git/apri-sensor/install/git2as.sh ")
}

const hotspotDown = function () {
  // down hotspot
  console.log(`set hotspot down`)
  return execPromise("LC_ALL=C nmcli connection down '" + unit.ssid + "'")
}
const hotspotDelete = function () {
  // delete hotspot
  //console.log(`delete hotspot`)
  return execPromise("LC_ALL=C nmcli connection delete '" + unit.ssid + "'")
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
  execPromise("LC_ALL=C nmcli -w 20 connection up '"+unit.connections[index]+"'")
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

const tryCandidateConnection2 = function (conIndex) {
  let _conIndex = conIndex

  // no (more) connections to try
  if (_conIndex > unit.connections.length - 1) {
    console.log('0. Activate hotspot connection')
    execPromise("LC_ALL=C nmcli -w 20 connection up '" + unit.ssid + "'")
      .then((result) => {
        setHotspotStatus('OK', 200)
        unit.connection = unit.ssid
        processStatus.hotspot.statusSince = new Date()
        processStatus.connectionBusy.status = false
        processStatus.connectionBusy.statusSince = new Date()
        processStatus.gateway.status = 'INIT'
        processStatus.gateway.statusSince = new Date()
      })
      .catch((error) => {
        createHotspot()
      })
    return
  }

  // ignore hotspot connection
  if (unit.connections[_conIndex] == unit.ssid) {
    tryCandidateConnection2(_conIndex + 1)
    return
  }

  // If connection mode is ap, remove the connection
  execPromise("LC_ALL=C nmcli --fields 802-11-wireless.mode connection show '" + unit.connections[_conIndex] + "'")
    .then((result) => {
      let tmp = result.stdout.split('\n')[0]
      // console.log('overcomplete accesspoint (mode = ap) delete check',unit.connections[_conIndex],tmp )
      if (tmp.split(':')[1].trim() == 'ap') {
        // delete overcomplete hotspot
        console.log("LC_ALL=C nmcli connection delete '" + unit.connections[_conIndex] + "'")
        execPromise("LC_ALL=C nmcli connection delete '" + unit.connections[_conIndex] + "'")
          .then((result) => {
            console.log('overcomplete accesspoint (mode = ap) deleted', unit.connections[_conIndex])
          })
          .catch((error) => {
            console.log('overcomplete accesspoint (mode = ap) delete error', unit.connections[_conIndex], error)
          })
      }
    })
    .catch((error) => {
    })

  var tmpConnection = unit.connections[_conIndex]
  if (unit.connectionStatus[tmpConnection] == undefined) {
    unit.connectionStatus[tmpConnection] = { status: null }
  }

  // todo: delete connection when password error??
  if (unit.connectionStatus[tmpConnection].passwordError == true &&
    new Date() - unit.connectionStatus[tmpConnection].statusSince < 120000) {
    console.log('Wait time for connection ' + tmpConnection + ' less than 120 seconds (password error) ')
    tryCandidateConnection2(_conIndex + 1)
    return
  }

  if (unit.connectionStatus[tmpConnection].status == 'ERROR' &&
    new Date() - unit.connectionStatus[tmpConnection].statusSince < 120000) {
    tryCandidateConnection2(_conIndex + 1)
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
  if (unit.connectionStatus[tmpConnection].status != 'INIT') {
    unit.connectionStatus[tmpConnection] = {
      status: 'INIT'
      , statusSince: new Date()
      , message: ''
    }
  }

  console.log(`tryCandidateConnection2 ${_conIndex} ${unit.connections[_conIndex]}`)
  console.log(unit.connectionStatus[tmpConnection])
  execPromise("LC_ALL=C nmcli -w 20 connection up '" + unit.connections[_conIndex] + "'")
    .then((result) => {
      unit.connection = unit.connections[_conIndex]
      if (unit.connectionStatus[tmpConnection].status != 'OK') {
        unit.connectionStatus[tmpConnection] = {
          status: 'OK'
          , statusSince: new Date()
          , message: ''
        }
      }
      console.log(`tryCandidateConnection2 then ${_conIndex} ${unit.connections[_conIndex]}`)
      // give processing some time
      processStatus.gateway.status = 'INIT'
      processStatus.gateway.statusSince = new Date()

      if (processStatus.connection.status != 'OK') {
        processStatus.connection.status = 'OK'
        processStatus.connection.statusSince = new Date()
        processStatus.connection.code = 200
        processStatus.connection.message = ''
      }
      processStatus.connectionBusy.status = false
      processStatus.connectionBusy.statusSince = new Date()
    })
    .catch((error) => {
      console.log(`tryCandidateConnection2 catch ${_conIndex} ${unit.connections[_conIndex]}`)
      console.error(`exec error: ${error}`);
      if (unit.connectionStatus[tmpConnection].status != 'ERROR') {
        unit.connectionStatus[tmpConnection] = {
          status: 'ERROR'
          , statusSince: new Date()
        }
      }
      unit.connectionStatus[tmpConnection].message = ('' + error).split('\n')
      const regex = /password/
      if (unit.connectionStatus[tmpConnection].message[1].match(regex) != null) {
        var msg = 'Wachtwoord niet juist, connectie opnieuw aanmaken a.u.b.'
        unit.connectionStatus[tmpConnection].message.push(msg)
        unit.connectionStatus[tmpConnection].passwordError = true
        // delete connection with password error
        // console.log("LC_ALL=C nmcli connection delete '" + unit.connections[_conIndex] + "'")
        execPromise("LC_ALL=C nmcli connection delete '" + unit.connections[_conIndex] + "'")
          .then((result) => {
            console.log('password error, connection deleted', unit.connections[_conIndex])
          })
          .catch((error) => {
            console.log('password error, connection deleted error', unit.connections[_conIndex], error)
          })
      }

      tryCandidateConnection2(_conIndex + 1)
    })
}

const createHotspot = function () {
  console.log(`Create hotspot for ssid ${unit.ssid}`)
  console.log('1. "Up" existing hotspot connection')
  if (processStatus.connectionBusy.status == false) {
    processStatus.connectionBusy.status = true
    processStatus.connectionBusy.statusSince = new Date()
  }
  processStatus.hotspot.status = 'INIT'
  processStatus.hotspot.statusSince = new Date()
  processStatus.hotspot.message = ''

  // extra time for hotspot status to allow user to connect to
  // ApriSensor hotspot SSID
  // When webapp wifi config page is connected, hotspot will maintain its status
  // until webapp is disconnected or an wifi connection is activated
  unit.hotspotTill = new Date(new Date().getTime() + 120000)


  // done: connection up instead of delete?
  // done:  resolve then: do nothing?
  execPromise("LC_ALL=C nmcli -w 20 connection up '" + unit.ssid + "'")
    .then((result) => {
      setHotspotStatus('OK', 200)
      unit.connection = unit.ssid
      processStatus.hotspot.statusSince = new Date()
      processStatus.connectionBusy.status = false
      processStatus.connectionBusy.statusSince = new Date()
      processStatus.gateway.status = 'INIT'
      processStatus.gateway.statusSince = new Date()
    })
    .catch((error) => {
      createHotspotConnection()
    })
}
const createHotspotConnection = function () {
  console.log('2. Create hotspot connection')
  //  var hotspotCommand= "LC_ALL=C nmcli connection add type wifi ifname '"+
  //    unit.ifname+"' con-name '"+unit.ssid+"' autoconnect no wifi.mode ap ssid '"+
  //    unit.ssid+"' ipv4.method shared 802-11-wireless-security.key-mgmt wpa-psk 802-11-wireless-security.psk '"+
  //    hotspotPassword+"' ipv6.method shared"
  var hotspotCommand = "LC_ALL=C nmcli connection add type wifi ifname '" +
    unit.ifname + "' con-name '" + unit.ssid + "' autoconnect yes wifi.mode ap ssid '" +
    unit.ssid + "' ipv4.method shared 802-11-wireless.powersave 2 " +
    " 802-11-wireless.mode ap 802-11-wireless-security.key-mgmt wpa-psk 802-11-wireless-security.psk '" +
    hotspotPassword + "'"

  //nmcli connection
  // add type wifi ifname wlan0 con-name local-ap autoconnect yes ssid test-ap mode ap
  // modify con-name 802-11-wireless.mode ap 802-11-wireless-security.key-mgmt wpa-psk
  //   ipv4.method shared 802-11-wireless-security.psk 'PASSWORD'

  execPromise(hotspotCommand)
    .then((result) => {
      //setHotspotStatus('OK',200)
      setHotspotUp()
    })
    .catch((error) => {
      setHotspotStatus('ERROR', 400, error)
      processStatus.connectionBusy.status = false
      processStatus.connectionBusy.statusSince = new Date()
    })
}

const setHotspotUp = function () {
  console.log('3. Activate hotspot connection')
  execPromise("LC_ALL=C nmcli -w 20 connection up '" + unit.ssid + "'")
    .then((result) => {
      setHotspotStatus('OK', 200)
      unit.connection = unit.ssid
      processStatus.connectionBusy.status = false
      processStatus.connectionBusy.statusSince = new Date()
      processStatus.gateway.status = 'INIT'
      processStatus.gateway.statusSince = new Date()
      //    getIpAddress()
    })
    .catch((error) => {
      unit.connection = ''
      processStatus.connectionBusy.status = false
      processStatus.connectionBusy.statusSince = new Date()
      // give processing some time
      //    processStatus.gateway.statusSince=new Date()
      setHotspotStatus('ERROR', 400, error)
    })
}
const setHotspotStatus = function (s, code, error) {
  if (processStatus.hotspot.status != s) {
    processStatus.hotspot.status = s
    processStatus.hotspot.statusSince = new Date()
  }
  processStatus.hotspot.code = code
  if (error == undefined) processStatus.hotspot.message = ''
  else processStatus.hotspot.message = error
}

var startActionReboot = function () {
  exec("reboot", (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
  });
}

const actions = []
actions.push(function () {
  var packageFileName = __dirname + "/../package.json"
  console.log(packageFileName)
  fs.readFile(packageFileName, 'utf8', function (err, data) {
    if (err) {
      console.log('package file not found')
    } else {
      try {
        packageFile = JSON.parse(data)
      }
      catch {
        console.log('package file json parse error')
        console.log(packageFile)
      }
    }
  })
  nextAction()
})
actions.push(function () {
  //  console.log('getHostname 1')
  exec("hostname", (error, stdout, stderr) => {
    //    console.log('getHostname')
    if (error) {
      console.error(`exec error: ${error}`);
    } else {
      unit.hostname = stdout.substr(0, stdout.length - 1)
      //console.log(`hostname: ->${unit.hostname}<-'`)  //raspberry pi serial
    }
    nextAction()
  })
})
actions.push(function () {
  //  console.log('get wireless device name')
  exec("ls /sys/class/ieee80211/*/device/net/", (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      unit.ifname = 'wlan0'
      unit.wifiActive = false  // no wifi device found
    } else {
      unit.ifname = stdout.substr(0, stdout.length - 1)
    }
    nextAction()
  })
})

actions.push(function () {
  //hostname --all-ip-address
  //  console.log('getCpuInfo A1')
  exec("cat /proc/cpuinfo | grep Serial | cut -d ' ' -f 2", (error, stdout, stderr) => {
    //    console.log('getCpuInfo A')
    if (error) {
      console.error(`exec error: ${error}`);
      unit.ssid = 'NOTAPRISENSOR'
    } else {
      var serial = stdout.substr(0, stdout.length - 1)
      if (serial == '') {
        unit.serial = unit.hostname
      } else {
        unit.serial = 'SCRP' + serial
      }
      unit.ssid = unit.serial.substr(unit.serial.length - 4, unit.serial.length - 1).toUpperCase()
      //      unit.ifname= 'wlp7s0'
      //sudo hostnamectl set-hostname raspberrypi2
    }
    nextAction()
  }
  )
})
actions.push(function () {
  console.log('delete hotspot')
  hotspotDelete()
    .then(async (result) => {
      console.log(`hotspot delete then`)
      //restartHotspot=true
      //await sleep(2000);
      nextAction()
    })
    .catch(async (error) => {
      console.log(`hotspot delete catch`)
      //restartHotspot=true
      //await sleep(2000);
      nextAction()
    })
})
actions.push(function () {
  // reset /etc/hosts filw
  var hostsFileStandard = "127.0.0.1 localhost " + unit.ssid + " " + unit.ssid + ".local\n" +
    "::1		localhost ip6-localhost ip6-loopback\n" +
    "ff02::1		ip6-allnodes\n" +
    "ff02::2		ip6-allrouters\n" +
    "127.0.1.1 " + unit.ssid + "\n"
  fs.readFile("/etc/hosts", 'utf8', function (err, data) {
    if (err || data != hostsFileStandard) {
      console.log('/etc/hosts file rewritten')
      console.log(hostsFileStandard)
      fs.writeFile('/etc/hosts', hostsFileStandard, 'utf8', (err) => { });
    }
  });
  nextAction()
})
actions.push(async function () {
  //  console.log('getHostname 1')
  exec("nmcli general hostname " + unit.ssid + ".local", async (error, stdout, stderr) => {
    //    console.log('getHostname')
    if (error) {
      console.error(`exec error: ${error}`);
      console.log('restart service NetworkManager!!')
      await restartNetworkManager()
        .then(async (result) => {
          console.log(`restart network-manager then`)
        })
        .catch(async (error) => {
          console.log(`restart network-manager catch`)
        })
    } else {
      console.log("nmcli general hostname " + unit.ssid + ".local")
    }
    nextAction()
  })
})
actions.push(function () {
  //  console.log('getCpuInfo B1')
  exec("cat /proc/cpuinfo | grep Hardware | cut -d ' ' -f 2", (error, stdout, stderr) => {
    //    console.log('getCpuInfo B')
    if (error) {
      console.error(`exec error: ${error}`);
    } else {
      unit.hardware = stdout.substr(0, stdout.length - 1);
    }
    nextAction()
  })
})
actions.push(function () {
  //  console.log('getCpuInfo C1')
  exec("cat /proc/cpuinfo | grep Revision | cut -d ' ' -f 2", (error, stdout, stderr) => {
    //    console.log('getCpuInfo C')
    if (error) {
      console.error(`exec error: ${error}`);
    } else {
      unit.revision = stdout.substr(0, stdout.length - 1);
    }
    nextAction()
  })
})
actions.push(function () {
  //  console.log('getCpuInfo D1')
  exec("cat /sys/class/thermal/thermal_zone0/temp", (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
    } else {
      var tempStr = stdout.substr(0, stdout.length - 1);
      var tempValue = parseFloat(tempStr);
      if (!isNaN(tempValue)) unit.cputemperature = tempValue / 1000;
    }
    nextAction()
  })
})

/*
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
*/
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

const getMacAdress = async function () {
  //console.log('getMacAdress 2')
  if (unit.macAdress == undefined) unit.macAddress = {}
  var fileName = '/sys/class/net/' + unit.ifname + '/address';
  await readFile(fileName)
    .then((data) => {
      unit.macAddress[unit.ifname] = data.substr(0, data.length - 1);
      //console.log('MAC-Address network interface: ' + unit.ifname + '  ' + data);
    })
    .catch((err) => {
      unit.macAddress[unit.ifname] = '';
      //console.log('Network interface not available: ' + unit.ifname);
    })
}

actions.push(async function () {
  //console.log('getMacAdress 1')
  await getMacAdress()
  nextAction()
})

actions.push(async function () {
  if (unit.wifiActive) {
    statusCheck()
    setInterval(statusCheck, 10000);
  }

  nextAction()
})


function getIpAddress() {
  //console.log('getIpAddress')
  execPromise('hostname --all-ip-address')
    .then((result) => {
      var stdoutArray = result.stdout.split('\n');
      unit.ipAddress = []
      for (var i = 0; i < stdoutArray.length - 1; i++) {
        var idx = stdoutArray[i].indexOf(' ', 8)
        if (stdoutArray[i] != '') {
          unit.ipAddress.push(stdoutArray[i].substr(0, idx))
        }
      }
    })
    .catch((error) => {
      consolelog('getIpAddress error')
    })

}

actions.push(function () {
  let t = unit.ssid + 'ScapelerApriSensor' + "                                "
  key = t.substr(0, 32)
  //	console.log(algoritm)
  //	console.log(inKey)
  //	key=crypto.createHash(algoritm)
  //	.update(inKey)
  //	.digest()
  updateCrypto()
  nextAction()
})

const nextAction = function () {
  console.log(`next action ${action + 1}/${actions.length}`)
  if (action < actions.length - 1) {
    action++
    actions[action]()
  } else {
    console.dir(unit)
  }
}


// trigger initialization actions
var action = -1
nextAction()

var getWifiScanInfo = function (iface, callback) {

  //hostname --all-ip-address
  exec('iwlist ' + iface + ' scan', (error, stdout, stderr) => {
    if (error) {
      //console.error(`exec error: ${error}`);
      wifiScan[iface] = "";
      return;
    }
    wifiScan[iface] = "" + stdout;
    //		console.log(`stderr: ${stderr}`);


    if (callback != undefined) {
      callback(iface, stdout);
    }
  });
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
  //		sudo systemctl stop SCAPE604-apri-sensor-dylos_DC1100.service
  //		sudo systemctl disable /etc/systemd/system/SCAPE604-apri-sensor-dylos_DC1100.service
  //		sudo rm /etc/systemd/system/SCAPE604-apri-sensor-dylos_DC1100.service

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
    'Description=' + apriConfig.systemCode + '-' + sensor + ' - start or restart ' + sensor + ' ' + sensorKey + ' service, respawn\n' +
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
    //		console.log(`stderr: ${stderr}`);

    //		if (callback != undefined) {
    //			callback(device,stdout);
    //		}
  });
}

const checkTimeSync = async function () {
  // get file attributes for last time synchronization date & time
  fs.stat("/var/lib/systemd/timesync/clock", async (err, stat) => {
    if (err) {
      if (processStatus.timeSync.status != 'ERROR') {
        processStatus.timeSync.status = 'ERROR'
        processStatus.timeSync.statusSince = new Date()
      }
    } else {
      var result = await execPromise('timedatectl timesync-status|grep "Packet count:"')
        .then((result) => {
          var stdoutArray = result.stdout.split(' ');
          var packetCount = parseFloat(stdoutArray[3])
          if (processStatus.timeSync.packetCount != packetCount) {
            processStatus.timeSync.packetCount = packetCount
            processStatus.timeSync.status = 'OK'
            processStatus.timeSync.statusSince = new Date()
          }
        })
        .catch((error) => {
          if (processStatus.timeSync.status != 'ERROR') {
            processStatus.timeSync.status = 'ERROR'
            processStatus.timeSync.statusSince = new Date()
            processStatus.timeSync.packetCount = -1
          }
        })
      processStatus.timeSync.syncDate = new Date(stat.atime)
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

const getActiveConnection = function () {
  //  var result = await execPromise('LC_ALL=C nmcli c show --active ')
  return execPromise('LC_ALL=C nmcli d show ' + unit.ifname + ' |grep GENERAL.CONNECTION')
}
const getActiveConnectionEth0 = function () {
  //  var result = await execPromise('LC_ALL=C nmcli c show --active ')
  return execPromise('LC_ALL=C nmcli d show eth0 | grep GENERAL.STATE | grep 100')
}


const initiateConnectionOrHotspot = function () {
  console.log('initiateConnectionOrHotspot')
  console.log('SSID:' + unit.ssid + ' con:' + unit.connection + ' cons:' + JSON.stringify(unit.connections))

  //    if (unit.connections.length > 0 ){
  console.log('tryCandidateConnection starting with index 0')
  if (processStatus.connectionBusy.status == false) {
    processStatus.connectionBusy.status = true
    processStatus.connectionBusy.statusSince = new Date()
    tryCandidateConnection2(0)
  }

}

var nrTimesBlink = 0

const blinkLed = function (nr) {
  if (nr != undefined) {
    nrTimesBlink = nr
  }
  if (nrTimesBlink <= 1) {
    nrTimesBlink = 0
    setGpioBlueLedOff()
    return
  }

  if (nrTimesBlink % 2 == 0) {
    setGpioBlueLedOff()
  } else {
    setGpioBlueLedOn()
  }
  if (nrTimesBlink > 0) {
    nrTimesBlink = nrTimesBlink - 1
    setTimeout(() => {
      blinkLed()
    }, 150)
  }
}

const avahiCheck = function () {
  // test avahi and restart when needed
  execPromise('LC_ALL=C avahi-browse -at | grep IPv4 | grep ' + unit.ssid + ' | head -1 ')
    .then((result) => {
      //    console.log('avahi check then')
      //    console.log(result)
      let regex = new RegExp(unit.ssid)
      //    console.log(''+result.stdout.match(regex))
      //    console.log(result.stdout.match(regex))
      if ('' + result.stdout.match(regex) != unit.ssid) {
        console.log('SSID ' + unit.ssid + ' not found with avahi-browse, restart avahi-daemon')
        avahiRestart()
      }
    })
    .catch((error) => {
      console.log('avahi check catch, restart avahi daemon')
      avahiRestart()
    })
}

const avahiRestart = function () {
  execPromise("systemctl stop avahi-daemon ; systemctl start avahi-daemon ")
    .then((result) => {
      console.log('restart avahi then')
    })
    .catch((error) => {
      console.log('restart avahi catch')
    })
}

const nginxCheck = function () {
  // test nginx and restart when needed
  execPromise('LC_ALL=C systemctl is-active nginx ')
    .then((result) => {
      //console.log('nginx check then ')
      let tmpResult = ('' + result.stdout).split('\n')
      if (tmpResult[0] != 'active') {
        execPromise('LC_ALL=C systemctl restart nginx ')
          .then((result) => {
            console.log('nginx restart then ')
          })
          .catch((error) => {
            console.log('nginx restart catch ')
          })
      }
    })
    .catch((error) => {
      console.log('nginx check catch, restart nginx')
      execPromise('LC_ALL=C systemctl restart nginx ')
        .then((result) => {
          console.log('nginx restart then ')
        })
        .catch((error) => {
          console.log('nginx restart catch ')
        })
    })
}

const statusCheck = async function () {

  // internet connected via eth0 ? (wired) 
  let eth0Ok = false
  await getActiveConnectionEth0()
    .then(async (result) => {
      //console.log("getActiveConnectionEth0 then")
      var stdoutArray = result.stdout.split(/(\s+)/);
      if (stdoutArray[2] == '100') {
        eth0Ok = true
        // blink 3 times showing process is active for eth0
        blinkLed(7)
        //console.log('eth0 connected')
        await hotspotDelete()
          .then(async (result) => {
            //              console.log("hotspot delete then")
            return
          })
          .catch(async (error) => {
            //              console.log("hotspot delete catch")
            return
          })
        return
      }
    })
    .catch((error) => {
      //console.log("getActiveConnectionEth0 catch")
    })

  if (eth0Ok == true) {
    //console.log('eth0 ok, break')
    return
  }

  // off only when device connect button and on.
  if (aprisensorDevices?.connectButton?.connectWhen == "on") {
    if (wifiStatus == 'off') {
      setGpioBlueLedOff()
      return
    }
  }

  if (processStatus.connectionBusy.status == true ||
    (processStatus.connectionBusy.status == false &&
      new Date().getTime() - processStatus.connectionBusy.statusSince.getTime() < 10000
    )
  ) {
    // blink led
    blinkLed(47)
    console.log('waiting,processStatus.connectionBusy.status==true')
    return
  }
  if (unit.connection == unit.ssid) {
    // set blue led on
    blinkLed(0)
    setGpioBlueLedOn()
  } else {
    // blink once showing process is active
    blinkLed(2)
  }

  getIpAddress()
  if (processStatus.timeSync.status != 'OK') checkTimeSync()  // only untill first OK

  avahiCheck()
  // not for V2  nginxCheck()

  // retrieve all wifi connections
  await execPromise('LC_ALL=C nmcli -f name,type connection| grep wifi')
    .then((result) => {
      //console.log('status check get all connections then')
      var stdoutArray = result.stdout.split('\n');
      unit.connections = []
      for (var i = 0; i < stdoutArray.length - 1; i++) {
        var pos = stdoutArray[i].indexOf("wifi")
        var tmp = stdoutArray[i].substr(0, pos - 1).trim()
        if (tmp != unit.ssid) {
          unit.connections.push(tmp)
        }
      }
      getActiveConnection()
        .then((result) => {
          //console.log("getActiveConnection then")
          var stdoutArray = result.stdout.split(' ');
          var tmp = stdoutArray[stdoutArray.length - 1]
          unit.connection = tmp.split('\n')[0]
        })
        .catch((error) => {
          console.log("getActiveConnection catch")
          unit.connection = ''
        })
    })
    .catch((error) => {
      console.log('status check get all connections catch')
      unit.connections = []
      unit.connection = ''
    })

  if (unit.connection == unit.ssid &&
    unit.connections.length == 0) {
    console.log('hotspot active and no wifi configurations configured yet')
    return
  }
  if (unit.connection == '' &&
    unit.connections.length == 0) {
    console.log('no active connection and no wifi configurations configured yet, create hotspot')
    createHotspot()
    return
  }
  // let hotspot continue for some time
  if (unit.ssid == unit.connection) {
    if (unit.hotspotTill != undefined && unit.hotspotTill != NaN) {
      var tmpTime = (unit.hotspotTill.getTime()) - (new Date().getTime())
      if (tmpTime > 0) {
        console.log('Hotspot will stay for ' + tmpTime + ' msec')
        return
      }
    }
  }

  if (processStatus.gateway.status == 'INIT' &&
    new Date().getTime() - processStatus.gateway.statusSince.getTime() < 10000) {
    console.log('Connection just initiated, wait 10 secs before first gateway check (' + tmpTime + ' msec)')
    return
  }

  // try ping to test if connection to internet is active
  await execPromise("LC_ALL=C ping -q -w 1 -c 1 8.8.8.8 > /dev/null")
    .then((result) => {
      unit.connectionCount++
      // log when connection changed or every x-times succesfull ping test
      if (unit.connection != unit.connectionPrev || unit.connectionCount > 200) {
        process.stdout.write("\nSSID:" + unit.ssid + "\n")
        console.log(unit.connections)
        process.stdout.write(unit.connectionPrev + '->' + unit.connection);
        unit.connectionPrev = unit.connection
        unit.connectionCount = 1
      }
      process.stdout.write(".");
      if (processStatus.gateway.status != 'OK') {
        processStatus.gateway.status = 'OK'
        processStatus.gateway.statusSince = new Date()
      }
      // blink twice showing process is active and gateway OK
      blinkLed(5)
      //      console.log('status gateway OK since '+ processStatus.gateway.statusSince.toISOString()+
      //        ' SSID:'+unit.ssid+' con:'+unit.connection+' cons:'+JSON.stringify(unit.connections))
      return
    }).catch((error) => {
      // not connected to internet
      console.log('statusCheck catch: ' + error)

      // minimal one previous internet connection check was successfull ?
      if (unit.connectionCount > 0) {
        // give connection time to recover
        unit.connectionCount = 0
        processStatus.gateway.status = 'RECOVER'
        processStatus.gateway.statusSince = new Date()
        process.stdout.write("R")
        return
      }

      if (processStatus.gateway.status == 'RECOVER') {
        if (new Date().getTime() - processStatus.gateway.statusSince.getTime() < 45000) {
          // Internet connectivity problem less then 45 seconds ago, give some time to recover
          process.stdout.write("R")
          return
        }
      }

      unit.gateway = ''
      if (processStatus.gateway.status != 'ERROR') {
        processStatus.gateway.status = 'ERROR'
        processStatus.gateway.statusSince = new Date()
      }

      console.log('Hotspot status: ' + processStatus.hotspot.status)
      var tmpWaitTime = new Date().getTime() - processStatus.hotspot.statusSince.getTime()
      console.log('Hotspot time: ' + tmpWaitTime)
      console.log(unit.connection + ' ' + unit.ssid)
      if (unit.connection == unit.ssid &&
        tmpWaitTime < 60000) {
        console.log('hotspot active wait minimal 60 seconds')
        return
      }
      //
      if (unit.connection != unit.ssid && unit.connection != '') {
        tmpWaitTime = new Date().getTime() - processStatus.gateway.statusSince.getTime()
        if (tmpWaitTime < 15000) {
          console.log('gateway problem less then 15 seconds ago, wait for next round')
          return
        }
      }

      initiateConnectionOrHotspot()

    })
}
const updateCrypto = function () {
  unitCrypto.key = key
}
const encrypt = function (data) {
  var encrypted = unitCrypto.cipher.update(data, 'utf8', 'hex')
  encrypted += unitCrypto.cipher.final('hex')
  return encrypted
}
const decrypt = function (data) {
  console.log(data)
  try {
    var decrypted = unitCrypto.decipher.update(data, 'hex', 'utf8')
    decrypted += unitCrypto.decipher.final('utf8')
  } catch (error) {
    console.log('no valid post data')
    console.log(error)
    decrypted = '{}'
  }
  return decrypted
}

let latestSensorData = []
let localLatestResultFolder = '/var/log/aprisensor/latest-results'

const getSensorLatest = async function (req, res) {

  let urlQuery = {}
  let urlQueryTmp = req.urlQuery.split('&')
  //console.log(urlQueryTmp)
  for (let i = 0; i < urlQueryTmp.length; i++) {
    let qry = urlQueryTmp[i].split('=')
    let key = qry[0]
    let val = qry[1]
    urlQuery[key] = val
  }

  const returnError = function (message) {
    res.writeHead(400);
    res.write(JSON.stringify({ "error": message }));
    res.end();
  }

  if (!urlQuery.sensorType) {
    returnError("parameter sensorType missing");
    return
  }

  try {
    let latestResultFilePath = localLatestResultFolder + '/' + urlQuery.sensorType + '.csv'
    //console.log(latestResultFilePath)
    fs.readFile(latestResultFilePath, 'utf8', (err, data) => {
      if (err) {
        returnError("sensorType not found");
        return
      }

      if (!data) {
        returnError("No data found for sensorType", urlQuery.sensorType);
        return
      }

      let tmp1 = data.split('\n')
      let keys = tmp1[0].split(',')
      let values = tmp1[1].split(',')
      let result = {}
      let key
      let value
      for (let i = 0; i < keys.length; i++) {
        key = keys[i].replace(/^"(.*)"$/, '$1')  // remove quotes at start and end
        value = values[i].replace(/^"(.*)"$/, '$1')  // remove quotes at start and end
        if (i > 2) {
          value = Number.isNaN(value) ? value : Number(value)
        }
        result[key] = value
      }

      res.writeHead(200);
      res.write(JSON.stringify(result));
      res.end();

    })
  }
  catch (err) {
    returnError("sensorType not found; read file error");
    return
  }

}


/*
const getSensorLatestOld = async function (req, res) {

  latestSensorData = []

  if (redisClient.isOpen == false) {
    await redisClient.connect()
      .then(function (res) {
      })
      .catch(function (err) {
        console.log('Redis connect catch, not connected?')
        console.log(err)
      })
  }

  //console.log('sort new')
  // Find record in 'new' subset (not yet written to server )  
  await redisClient.SORT('new', { 'ALPHA': true, 'LIMIT': { 'offset': 0, 'count': 4 }, 'DIRECTION': 'DESC' })
    .then(async function (redisResult) {
      if (redisResult.length > 0) {
        //console.log('New record available:', redisResult.length, redisResult[0]);
        for (let j = 0; j < redisResult.length; j++) {
          let rNew = await getRedisData(redisResult[j])
          if (rNew) {
            latestSensorData.push(rNew)
          }
        }
      }
      //console.log('new verwerkt')
    })
    .catch(function (error) {
      console.log(error)
    });

  //console.log('sort archive')

  if (latestSensorData.length < 4) {
    await redisClient.SORT('archive', { 'ALPHA': true, 'LIMIT': { 'offset': 0, 'count': 4 }, 'DIRECTION': 'DESC' })
      .then(async function (redisResult) {
        if (redisResult.length > 0) {
          //console.log('Archive record available:', redisResult.length, redisResult[0]);
          for (let j = 0; j < redisResult.length; j++) {
            let rArchive = await getRedisData(redisResult[j])
            if (rArchive) {
              latestSensorData.push(rArchive)
            }
          }
        }
        //console.log('archive verwerkt')
      })
      .catch(function (error) {
        console.log(error)
      });
  }

  //console.log('process data', latestSensorData.length)

//  parseUrl.parse(req.url,true

  let endResult = {}
  //console.log(latestSensorData)
  let sorted = latestSensorData.sort((a, b) => a.dateObserved - b.dateObserved)
  console.log(req.urlQuery) // sensorType=pmsa003
  let sensorType
  if (req.urlQuery.split('=')[0]=='sensorType') {
    sensorType = req.urlQuery.split('=')[1]
  }
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].sensorType == sensorType) {
      endResult = sorted[i]
      break
    }
  }

  console.log('response')
  res.writeHead(200);
  res.write(JSON.stringify(endResult));
  res.end();

}

var getRedisData = async function (redisKey) {
  //console.log('Proces RedisData ' + redisKey)
  let keySplit = redisKey.split(':');
  let lastEntry = keySplit.length - 1;
  let dateObserved = redisKey.substring(0, redisKey.length - keySplit[lastEntry].length - 1);
  let rec

  await redisClient.HGETALL(redisKey)
    .then(function (res) {
      //console.log(res)
      rec = {}
      if (res) {
        rec.dateObserved = dateObserved
        rec.sensorId = res.foi
        rec.sensorType = keySplit[lastEntry]
        switch (rec.sensorType) {
          case 'bme280':
            rec.temperature = Number(res.temperature)
            rec.pressure = Number(res.pressure)
            rec.rHum = Number(res.rHum)
            break;
          case 'bme680':
            rec.temperature = Number(res.temperature)
            rec.pressure = Number(res.pressure)
            rec.rHum = Number(res.rHum)
            rec.gasResistance = Number(res.gasResistance)
            break;
          case 'pmsa003':
            rec.pm1 = Number(res.pm1)
            rec.pm25 = Number(res.pm25)
            rec.pm10 = Number(res.pm10)
            break;
          case 'ds18b20':
            rec.temperature = Number(res.temperature)
            break;
          case 'tsi3007':
            rec.part = Number(res.part)
            break;
          case 'tgs5042':
            rec.co = Number(res.co)
            break;
          case 'sps30':
            rec.pm1 = Number(res.pm1)
            rec.pm25 = Number(res.pm25)
            rec.pm4 = Number(res.pm4)
            rec.pm10 = Number(res.pm10)
            break;
          case 'ips7100':
            rec.pm01 = Number(res.pm01)
            rec.pm03 = Number(res.pm03)
            rec.pm05 = Number(res.pm05)
            rec.pm1 = Number(res.pm1)
            rec.pm25 = Number(res.pm25)
            rec.pm5 = Number(res.pm5)
            rec.pm10 = Number(res.pm10)
            break;
          case 'scd30':
            rec.temperature = Number(res.temperature)
            rec.co2 = Number(res.co2)
            rec.rHum = Number(res.rHum)
            break;
          case 'solar':
            rec.irradiance = Number(res.irradiance)
            break;
          case 'bam1020':
            rec.temperature = Number(res.temperature)
            rec.pm25 = Number(res.pm25)
            rec.rHum = Number(res.rHum)
            break;
          case 'radiationd':
            rec.rad = Number(res.rad)
            break;
          case 'nextpm':
            rec.pm1 = Number(res.pm1)
            rec.pm25 = Number(res.pm25)
            rec.pm10 = Number(res.pm10)
            break;
          default:
            console.log('ERROR: redis entry unknown: ' + redisKey);
        };
      }
    })
    .catch(function (error) {
      console.log(error)
    })

  return rec
}
*/

