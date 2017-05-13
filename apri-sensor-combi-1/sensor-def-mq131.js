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
	  id		: 'MQ131'
	, sensorSystem: 'apri-sensor-mq131'
	, cycleFixed: true
	, cycleTimeMax: 60000
	, fileName	: 'sensor-MQ131-result'
	, csvHeader	: 'sensor;dateiso;duration;ozone;count\n'	
	, total		: {}	
	, result	: {}
	, record	: ''
	, init		: function() {
		this.total					= {};
		this.total.measurementCount	= 0;
		this.total.ozone			= 0;
		}
	, isSensorType: function(data) {
		if (data[0] != this.id ) return false;
		// test data
		if (data.length == 2 && isNumeric(data[1]) ) {
			if (this.total.measurementCount == undefined) this.init();
			return true;
		};
		return false; 
	}	
	, addMeasurement: function(data) {
		this.total.measurementCount	++;
		this.total.ozone			+= parseFloat(data[1]);
		this.total.measurementTime	= new Date();
		if (this.total.measurementTimeStart == undefined) this.total.measurementTimeStart = this.total.measurementTime;
	}
	, processData: function(data) {
		this.addMeasurement(data);
	}
	, processResult: function() {
		if (this.result == undefined) this.result	= {};
		this.result.observations	= '';
		if (this.total.measurementCount > 0) {
			this.result.ozone				= Math.round((this.total.ozone
												/ this.total.measurementCount )*100)/100;
			this.result.measurementCount	= this.total.measurementCount;
			this.result.measurementTime		= this.total.measurementTime;
			this.result.loopTime			= this.total.measurementTime.getTime() - this.total.measurementTimeStart.getTime();
			
			this.record	= this.id + ';' + this.result.measurementTime.toISOString() + ';' + this.result.loopTime + ';' +
				this.result.ozone + ';' + 
				this.result.measurementCount +
				'\n';
			//console.log(record);

			this.result.observations		= 
				'apri-sensor-mq131-ozone:'+this.result.ozone; 
			this.init();
		}
	}
}
}
