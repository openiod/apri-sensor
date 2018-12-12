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
	  id		: 'BME280'
	, sensorSystem: 'apri-sensor-bme280'
	, cycleFixed: true
	, cycleTimeMax: 60000
	, fileName	: 'sensor-BME280-result'
	, csvHeader	: 'sensor;dateiso;duration;pressure;temperature;rhum;count\n'
	, total		: {}
	, result	: {}
	, record	: ''
	, init		: function() {
		this.total					        = {};
		this.total.measurementCount	= 0;
		this.total.pressure			    = 0;
		this.total.temperature		  = 0;
    this.total.rHumAvg  		    = 0;
		}
	, isSensorType: function(data) {
		if (data[0] != this.id ) return false;
		// test data
		if (data.length == 4
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
		this.total.measurementCount	++;
		this.total.temperature			 += parseFloat(data[1]);
		this.total.pressure				   += parseFloat(data[2]);
    this.total.rHum				       += parseFloat(data[3]);
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
			this.result.pressure			          = Math.round((this.total.pressure
											                       / this.total.measurementCount )*100)/100;
			this.result.temperature			        = Math.round((this.total.temperature
											                       / this.total.measurementCount )*100)/100;
      this.result.rHum			              = Math.round((this.total.rHum
                											       / this.total.measurementCount )*100)/100;
      this.result.measurementCount	      = this.total.measurementCount;
			this.result.measurementTime		      = this.total.measurementTime;
			this.result.loopTime			          = this.total.measurementTime.getTime() - this.total.measurementTimeStart.getTime();

			this.record	= this.id + ';' + this.result.measurementTime.toISOString() + ';' + this.result.loopTime + ';' +
				this.result.pressure	+ ';' +
				this.result.temperature + ';' +
        this.result.rHum + ';' +
				this.result.measurementCount +
				'\n';
			//console.log(record);

			this.result.observations	=
				'apri-sensor-bme280-pressure:' + this.result.pressure + ',' +
				'apri-sensor-bme280-temperature:' + this.result.temperature + ',' +
        'apri-sensor-bme280-rHum:' + this.result.rHum;
			this.init();
		}
	}
}
}
