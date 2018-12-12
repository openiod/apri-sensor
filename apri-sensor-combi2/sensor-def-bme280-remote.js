/*
** Module: apri-sensor-xxxx-def sensor definition / class
**
**
*/

"use strict"; // This is for your code to comply with the ECMAScript 5 standard.

var latestMeasurementTime, loopTime;

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

module.exports = {

sensor	: {
	  id		: '72'  //BME280
	, sensorSystem: 'apri-sensor-bme280'
	, cycleFixed: true
	, cycleTimeMax: 60000
	, fileName	: 'sensor-BME280-result'
	, csvHeader	: 'sensor;dateiso;duration;pressure;temperature;rHum;count\n'
	, units		: {}
	, result	: {}
	, record	: ''
	, initUnit		: function(unitId) {
  	this.units[unitId] 							          = {};
  	this.units[unitId].total					        = {};
		this.units[unitId].total.measurementCount	= 0;
		this.units[unitId].total.pressure			    = 0;
		this.units[unitId].total.temperature		  = 0;
    this.units[unitId].total.rHum		          = 0;
	}
//	, init		: function() {
//		this.total					= {};
//		this.total.measurementCount	= 0;
//		this.total.pressure			= 0;
//		this.total.temperature		= 0;
//		}
	, isSensorType: function(data) {
		var _dataPrefix = data[0].split('@');
    console.log(this.id);
    console.log(_dataPrefix[2]);
    console.log(data.length);
		if (_dataPrefix[2] != this.id ) return false;
		if (data.length == 6
			&& isNumeric(data[1])
			&& isNumeric(data[2])
			&& isNumeric(data[3])
      && isNumeric(data[4])
			&& isNumeric(data[5]) ) {
			data.unitId=_dataPrefix[1];
			if (this.units[data.unitId] == undefined) this.initUnit(data.unitId);
			return true;
		};
		return false;
	}
	, addMeasurement: function(data) {
		var unitId = data.unitId;
		if (this.units[unitId] == undefined) this.initUnit(unitId);
		this.units[unitId].total.measurementCount		++;
		this.units[unitId].total.pressure			  	+= parseFloat(data[2])/10;
		this.units[unitId].total.temperature			+= parseFloat(data[3])/10;
    this.units[unitId].total.rHumAvg    			+= parseFloat(data[4])/10;
		this.units[unitId].total.measurementTime		= new Date();
		if (this.units[unitId].total.measurementTimeStart == undefined) this.units[unitId].total.measurementTimeStart = this.units[unitId].total.measurementTime;
	}
	, processData: function(data) {
		this.addMeasurement(data);
	}
	, processResult: function(unitId) {
		if (this.result == undefined) this.result	= {};
		this.result.observations	= '';
		var _total = this.units[unitId].total;
		if (_total.measurementCount > 0) {
			this.result.pressure			= Math.round((_total.pressure
											/ _total.measurementCount )*100)/100;
			this.result.temperature			= Math.round((_total.temperature
											/ _total.measurementCount )*100)/100;
      this.result.rHum 			      = Math.round((_total.rHum
            					/ _total.measurementCount )*100)/100;
			this.result.measurementCount	= _total.measurementCount;
			this.result.measurementTime		= _total.measurementTime;
			this.result.loopTime			= _total.measurementTime.getTime() - _total.measurementTimeStart.getTime();

			this.record	= this.id + ';' +
			  this.result.measurementTime.toISOString() + ';' +
			  this.result.loopTime + ';' +
				this.result.pressure	+ ';' +
				this.result.temperature + ';' +
        this.result.rHum + ';' +
				this.result.measurementCount +
				'\n';
			//console.log(record);

			this.result.observations	=
				'apri-sensor-bme280-pressure:' + this.result.pressure + ',' +
        'apri-sensor-bme280-rHum:' + this.result.rHum + ',' +
				'apri-sensor-bme280-temperature:' + this.result.temperature;
			this.result.unitid = unitId;
			this.initUnit(unitId);
		}
	}
}
}
