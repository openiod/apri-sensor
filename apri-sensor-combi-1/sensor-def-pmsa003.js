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
	, csvHeader	: 'sensor;dateiso;duration;rHum;temperature;count\n'	
	, total		: {}	
	, result	: {}
	, record	: ''
	, init		: function() {
		this.total					= {};
		this.total.measurementCount	= 0;
		this.total.concPM1_0_CF1	= 0;						
		this.total.concPM2_5_CF1	= 0;
		this.total.concPM10_0_CF1	= 0;
		this.total.concPM1_0_amb	= 0;
		this.total.concPM2_5_amb	= 0;
		this.total.concPM10_0_amb	= 0;
		this.total.rawGt0_3um		= 0;
		this.total.rawGt0_5um		= 0;
		this.total.rawGt1_0um		= 0;
		this.total.rawGt2_5um		= 0;
		this.total.rawGt5_0um		= 0;
		this.total.rawGt10_0um		= 0;
	}
	, isSensorType: function(data) {
		if (data[0] != this.id ) return false;
		// test data
		if (data.length == 15 
			&& isNumeric(data[1]) && isNumeric(data[2])
			&& isNumeric(data[3]) && isNumeric(data[4])
			&& isNumeric(data[5]) && isNumeric(data[6])
			&& isNumeric(data[7]) && isNumeric(data[8])
			&& isNumeric(data[9]) && isNumeric(data[10])
			&& isNumeric(data[11]) && isNumeric(data[12])
			&& isNumeric(data[13]) && isNumeric(data[14]) ){
			if (this.total.measurementCount == undefined) this.init();
			return true;
		};
		return false; 
	}	
	, addMeasurement: function(data) {
		this.total.measurementCount	++;
		this.total.concPM1_0_CF1	+= parseFloat(data[1]);						
		this.total.concPM2_5_CF1	+= parseFloat(data[2]);
		this.total.concPM10_0_CF1	+= parseFloat(data[3]);
		this.total.concPM1_0_amb	+= parseFloat(data[4]);
		this.total.concPM2_5_amb	+= parseFloat(data[5]);
		this.total.concPM10_0_amb	+= parseFloat(data[6]);
		this.total.rawGt0_3um		+= parseFloat(data[7]);
		this.total.rawGt0_5um		+= parseFloat(data[8]);
		this.total.rawGt1_0um		+= parseFloat(data[9]);
		this.total.rawGt2_5um		+= parseFloat(data[10]);
		this.total.rawGt5_0um		+= parseFloat(data[11]);
		this.total.rawGt10_0um		+= parseFloat(data[12]);
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
			this.result.concPM1_0_amb	= Math.round((this.total.concPM1_0_amb
										/ this.total.measurementCount )*100)/100;
			this.result.concPM2_5_amb	= Math.round((this.total.concPM2_5_amb
										/ this.total.measurementCount )*100)/100;
			this.result.concPM10_0_amb	= Math.round((this.total.concPM10_0_amb
										/ this.total.measurementCount )*100)/100;
			this.result.rawGt0_3um		= Math.round((this.total.rawGt0_3um
										/ this.total.measurementCount )*100)/100;
			this.result.rawGt0_5um		= Math.round((this.total.rawGt0_5um
										/ this.total.measurementCount )*100)/100;
			this.result.rawGt1_0um		= Math.round((this.total.rawGt1_0um
										/ this.total.measurementCount )*100)/100;
			this.result.rawGt2_5um		= Math.round((this.total.rawGt2_5um
										/ this.total.measurementCount )*100)/100;
			this.result.rawGt5_0um		= Math.round((this.total.rawGt5_0um
										/ this.total.measurementCount )*100)/100;
			this.result.rawGt10_0um		= Math.round((this.total.rawGt10_0um
										/ this.total.measurementCount )*100)/100;
			this.result.measurementCount= this.total.measurementCount;
			this.result.measurementTime	= this.total.measurementTime;
			this.result.loopTime			= this.total.measurementTime.getTime() - this.total.measurementTimeStart.getTime();
			
			this.record	= this.id + ';' + this.result.measurementTime.toISOString() + ';' + this.result.loopTime + ';' +
				this.result.concPM1_0_CF1	+ ';' +
				this.result.concPM2_5_CF1	+ ';' +
				this.result.concPM10_0_CF1	+ ';' +
				this.result.concPM1_0_amb	+ ';' +
				this.result.concPM2_5_amb	+ ';' +
				this.result.concPM10_0_amb	+ ';' +
				this.result.rawGt0_3um		+ ';' +
				this.result.rawGt0_5um		+ ';' +
				this.result.rawGt1_0um		+ ';' +
				this.result.rawGt2_5um		+ ';' +
				this.result.rawGt5_0um		+ ';' +
				this.result.rawGt10_0um		+ ';' +
				this.result.measurementCount +
				'\n';
			//console.log(record);

			this.result.observations	= 
				'apri-sensor-pmsa003-concPM1_0_CF1:' + this.result.concPM1_0_CF1 + ',' +
				'apri-sensor-pmsa003-concPM2_5_CF1:' + this.result.concPM2_5_CF1 + ',' +
				'apri-sensor-pmsa003-concPM10_0_CF1:'+ this.result.concPM10_0_CF1 + ',' +
				'apri-sensor-pmsa003-concPM1_0_amb:' + this.result.concPM1_0_amb + ',' +
				'apri-sensor-pmsa003-concPM2_5_amb:' + this.result.concPM2_5_amb + ',' +
				'apri-sensor-pmsa003-concPM10_0_amb:'+ this.result.concPM10_0_amb + ',' +
				'apri-sensor-pmsa003-rawGt0_3um:' 	+ this.result.rawGt0_3um + ',' +
				'apri-sensor-pmsa003-rawGt0_5um:' 	+ this.result.rawGt0_5um + ',' +
				'apri-sensor-pmsa003-rawGt1_0um:' 	+ this.result.rawGt1_0um + ',' +
				'apri-sensor-pmsa003-rawGt2_5um:' 	+ this.result.rawGt2_5um + ',' +
				'apri-sensor-pmsa003-rawGt5_0um:' 	+ this.result.rawGt5_0um + ',' +
				'apri-sensor-pmsa003-rawGt10_0um:' 	+ this.result.rawGt10_0um; 
			this.init();						
		}
	}
}
}

