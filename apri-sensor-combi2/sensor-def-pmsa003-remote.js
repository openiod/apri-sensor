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
	  id		: 'PMSA003'
  	, sensorSystem: 'apri-sensor-pmsa003'
	, cycleFixed: true
	, cycleTimeMax: 60000
	, fileName	: 'sensor-PMSA003-result'
	, csvHeader	: 'sensor;dateiso;duration;subNr;concPM1_0_CF1;concPM2_5_CF1;concPM10_0_CF1;count\n'	
	, units		: {}	
	, result	: {}
	, record	: ''
	, initUnit		: function(unitId) {
  	    this.units[unitId] 							= {};
  	    this.units[unitId].total					= {};
		this.units[unitId].total.measurementCount	= 0;
		this.units[unitId].total.concPM1_0_CF1		= 0;						
		this.units[unitId].total.concPM2_5_CF1		= 0;
		this.units[unitId].total.concPM10_0_CF1		= 0;
	}
	, isSensorType: function(data) {
		var _dataPrefix = data[0].split('@');
		if (_dataPrefix[2] != this.id ) return false;
		if (data.length == 5 
			&& isNumeric(data[1]) && isNumeric(data[2])
			&& isNumeric(data[3]) && isNumeric(data[4])
			){
			if (this.units[data[1]] == undefined) this.initUnit(data[1]);
			return true;
		};
		return false; 
	}	
	, addMeasurement: function(data) {
		var unitId = data[1];
		if (this.units[unitId] == undefined) this.initUnit(unitId);
		this.units[unitId].total.measurementCount	++;
		this.units[unitId].total.concPM1_0_CF1	+= parseFloat(data[2])/10;						
		this.units[unitId].total.concPM2_5_CF1	+= parseFloat(data[3])/10;
		this.units[unitId].total.concPM10_0_CF1	+= parseFloat(data[4])/10;
		this.units[unitId].total.measurementTime	= new Date();
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
			this.result.concPM1_0_CF1	= Math.round((_total.concPM1_0_CF1
										/ _total.measurementCount )*100)/100;
			this.result.concPM2_5_CF1	= Math.round((_total.concPM2_5_CF1
										/ _total.measurementCount )*100)/100;
			this.result.concPM10_0_CF1	= Math.round((_total.concPM10_0_CF1
										/ _total.measurementCount )*100)/100;
			this.result.measurementCount= _total.measurementCount;
			this.result.measurementTime	= _total.measurementTime;
			this.result.loopTime			= _total.measurementTime.getTime() - _total.measurementTimeStart.getTime();
			
			this.record	= this.id + ';' + this.result.measurementTime.toISOString() + ';' + this.result.loopTime + ';' +
				this.result.concPM1_0_CF1	+ ';' +
				this.result.concPM2_5_CF1	+ ';' +
				this.result.concPM10_0_CF1	+ ';' +
				this.result.measurementCount +
				'\n';
			//console.log(record);

			this.result.observations	= 
				'apri-sensor-pmsa003-concPM1_0_CF1:' + this.result.concPM1_0_CF1 + ',' +
				'apri-sensor-pmsa003-concPM2_5_CF1:' + this.result.concPM2_5_CF1 + ',' +
				'apri-sensor-pmsa003-concPM10_0_CF1:'+ this.result.concPM10_0_CF1;
			this.result.unitid = unitId;	
			this.initUnit(unitId);						
		}
	}
}
}

