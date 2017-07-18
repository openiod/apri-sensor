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
	, total		: {}	
	, result	: {}
	, record	: ''
	, init		: function() {
		this.total					= {};
		this.total.measurementCount	= 0;
		this.total.concPM1_0_CF1	= 0;						
		this.total.concPM2_5_CF1	= 0;
		this.total.concPM10_0_CF1	= 0;
	}
	, isSensorType: function(data) {
//		console.log('Try 1: '+ data[1]);
		if (data[1] != this.id ) return false;
		// test data
//		console.log('Try 2: '+ data.length);
		if (data.length == 6 
			&& isNumeric(data[0]) && isNumeric(data[2])
			&& isNumeric(data[3]) && isNumeric(data[4])
			&& isNumeric(data[5])
			){
			if (this.total.measurementCount == undefined) this.init();
			return true;
		};
		return false; 
	}	
	, addMeasurement: function(data) {
		this.total.measurementCount	++;
		this.total.concPM1_0_CF1	+= parseFloat(data[3]);						
		this.total.concPM2_5_CF1	+= parseFloat(data[4]);
		this.total.concPM10_0_CF1	+= parseFloat(data[5]);
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
			this.result.concPM1_0_CF1	= Math.round((this.total.concPM1_0_CF1
										/ this.total.measurementCount )*100)/100;
			this.result.concPM2_5_CF1	= Math.round((this.total.concPM2_5_CF1
										/ this.total.measurementCount )*100)/100;
			this.result.concPM10_0_CF1	= Math.round((this.total.concPM10_0_CF1
										/ this.total.measurementCount )*100)/100;
			this.result.measurementCount= this.total.measurementCount;
			this.result.measurementTime	= this.total.measurementTime;
			this.result.loopTime			= this.total.measurementTime.getTime() - this.total.measurementTimeStart.getTime();
			
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
				'apri-sensor-pmsa003-concPM10_0_CF1:'+ this.result.concPM10_0_CF1,
			this.init();						
		}
	}
}
}

