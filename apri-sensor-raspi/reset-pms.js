// reset pmsx003 sensor
// test function

// before running stop raspi process

"use strict"; // This is for your code to comply with the ECMAScript 5 standard.

var gpio
var gpioPmsReset
try {
    gpio = require('onoff').Gpio
}
catch (err) {
    console.log('GPIO module onoff not installed');
}
if (gpio != undefined) {
    gpioPmsReset = new gpio(22, 'out'); //use GPIO-22 as output
}


/*


const raspi = require('raspi');
const Serial = require('raspi-serial').Serial;

var serialDevices = [
    {
      device: '/dev/ttyAMA0'
      , baudRate: 9600
      , initiated: false
      , validData: false
      , deviceType: 'pmsa003'
    }
  ]
  


var initSerial = function (serialDeviceIndex) {
    logger.info('init serial ' + serialDevices[serialDeviceIndex].device + ' ' +
      serialDevices[serialDeviceIndex].deviceType)
    raspi.init(() => {
      var options = { portId: serialDevices[serialDeviceIndex].device, baudRate: serialDevices[serialDeviceIndex].baudRate }
      try {
        serialDevices[serialDeviceIndex].serial = new Serial(options);
      } catch (error) {
        console.log('Error: create new Serial for:')
        console.log(options);
        return
      }
      serialDevices[serialDeviceIndex].serial.serialDeviceIndex = serialDeviceIndex
      try {
        serialDevices[serialDeviceIndex].serial.open(() => {
          //logger.info('serial open')
          if (serialDevices[serialDeviceIndex].deviceType == 'pmsa003' || serialDevices[serialDeviceIndex].deviceType == 'pms7003') {
            logger.info('serial device for pmsa003/pms7003 opened')
            serialDevices[serialDeviceIndex].serial.on('data', (data) => {
              //logger.info('serial on data')
              //logger.info(data)
              //printHex(data,'T');
              for (var i = 0; i < data.length; i++) {
                processRaspiSerialData(data[i]);
              }
            });
          }
        }); // end of serial open
      } catch (error) {
        console.log('Error: create new Serial for:')
        console.log(options);
        return
      }
  
    });  // end of raspi init
  }
  


  if (aprisensorDevices.pmsa003) {
    var newDevice = {
      device: aprisensorDevices.pmsa003.device
      , baudRate: aprisensorDevices.pmsa003.baudRate
      , initiated: false
      , validData: false
      , deviceType: aprisensorDevices.pmsa003.deviceType
    }
    serialDevices.push(newDevice)
    scanSerialDevices()
    let timerSerialDevices = setInterval(scanSerialDevices, 10000)
  }
  if (aprisensorDevices.pms7003) {
    var newDevice = {
      device: aprisensorDevices.pms7003.device
      , baudRate: aprisensorDevices.pms7003.baudRate
      , initiated: false
      , validData: false
      , deviceType: aprisensorDevices.pms7003.deviceType
    }
    serialDevices.push(newDevice)
    scanSerialDevices()
    let timerSerialDevices = setInterval(scanSerialDevices, 10000)
  }
  
initSerial(0)
*/

const sleepFunction = function (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


var setGpioPmsResetActive = function () {
    gpioPmsReset.writeSync(0); //set pin state to 0 (activate reset)
}
var setGpioPmsResetInactive = function () {
    gpioPmsReset.writeSync(1); //set pin state to 1 (deactivate reset)
}


console.log('reset pms')
setGpioPmsResetActive()
console.log('sleep')
sleepFunction(30000)
    .then(function (res) {
        console.log('activate pms')
        setGpioPmsResetInactive()
        console.log('end of reset')
    })
    .catch(function (error) {
        console.log('catch in sleep')
        console.log(error)
    });
console.log('end of application')

