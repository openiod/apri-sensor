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
	  id		: 'BMP280'
	, sensorSystem: 'apri-sensor-bmp280'
	, cycleFixed: true
	, cycleTimeMax: 60000
	, fileName	: 'sensor-BMP280-result'
	, csvHeader	: 'sensor;dateiso;duration;pressure;temperature;count\n'
	, total		: {}	
	, result	: {}
	, record	: ''
	, init		: function() {
		this.total					= {};
		this.total.measurementCount	= 0;
		this.total.pressure			= 0;						
		this.total.temperature		= 0;
		}
	, isSensorType: function(data) {
		var _dataPrefix = data[0].split('@');
		if (_dataPrefix[2] != this.id ) return false;
		// test data
		if (data.length == 5 
			&& isNumeric(data[1]) 
			&& isNumeric(data[2]) 
			&& isNumeric(data[3])
			&& isNumeric(data[4]) ) {
			if (this.total.measurementCount == undefined) this.init();
			return true;
		};
		return false; 
	}	
	, addMeasurement: function(data) {
		this.total.measurementCount		++;
		this.total.pressure				+= parseFloat(data[2])/10;						
		this.total.temperature			+= parseFloat(data[3])/10;
		this.total.measurementTime		= new Date();
		if (this.total.measurementTimeStart == undefined) this.total.measurementTimeStart = this.total.measurementTime;
	}
	, processData: function(data) {
		this.addMeasurement(data);
	}
	, processResult: function() {
		if (this.result == undefined) this.result	= {};
		this.result.observations	= '';
		if (this.total.measurementCount > 0) {
			this.result.pressure			= Math.round((this.total.pressure
											/ this.total.measurementCount )*100)/100;
			this.result.temperature			= Math.round((this.total.temperature
											/ this.total.measurementCount )*100)/100;
			this.result.measurementCount	= this.total.measurementCount;
			this.result.measurementTime		= this.total.measurementTime;
			this.result.loopTime			= this.total.measurementTime.getTime() - this.total.measurementTimeStart.getTime();
			
			this.record	= this.id + ';' + this.result.measurementTime.toISOString() + ';' + this.result.loopTime + ';' +
				this.result.pressure	+ ';' +
				this.result.temperature + ';' + 
				this.result.measurementCount +
				'\n';
			//console.log(record);

			this.result.observations	= 
				'apri-sensor-bmp280-pressure:' + this.result.pressure + ',' +
				'apri-sensor-bmp280-temperature:' + this.result.temperature; 
			this.init();						
		}
	}
}
}
