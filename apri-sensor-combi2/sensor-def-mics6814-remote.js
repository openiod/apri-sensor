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
	  id		: '91'  // MICS6814 CO, NH3, NO2
	, sensorSystem: 'apri-sensor-mics6814'
	, cycleFixed: true
	, cycleTimeMax: 60000
	, fileName	: 'sensor-MICS6814-result'
	, csvHeader	: 'sensor;dateiso;duration;CO;NH3;NO2;count\n'
	, units		: {}
	, result	: {}
	, record	: ''
	, initUnit		: function(unitId) {
  	this.units[unitId] 							          = {};
  	this.units[unitId].total					        = {};
		this.units[unitId].total.measurementCount	= 0;
		this.units[unitId].total.co			          = 0;
		this.units[unitId].total.nh3		          = 0;
    this.units[unitId].total.no2		          = 0;
	}
//	, init		: function() {
//		this.total					= {};
//		this.total.measurementCount	= 0;
//		this.total.pressure			= 0;
//		this.total.temperature		= 0;
//		}
	, isSensorType: function(data) {
		var _dataPrefix = data[0].split('@');
    //console.log(this.id);
    //console.log(_dataPrefix[2]);
    //console.log(data.length);
		if (_dataPrefix[2] != this.id ) return false;
		if (data.length == 5
			&& isNumeric(data[1])
			&& isNumeric(data[2])
			&& isNumeric(data[3])
      && isNumeric(data[4]) ) {
      if(_dataPrefix[1]=='' || _dataPrefix[1]=='M/U') { //messageId / unitId
        data.unitId='MAIN';
      } else {
        data.unitId=_dataPrefix[1].split('/')[1];
      }
      if (this.units[data.unitId] == undefined) this.initUnit(data.unitId);
			return true;
		};
		return false;
	}
	, addMeasurement: function(data) {
		var unitId = data.unitId;
		if (this.units[unitId] == undefined) this.initUnit(unitId);
		this.units[unitId].total.measurementCount		++;
		this.units[unitId].total.co			    	      += parseFloat(data[1])/100;
		this.units[unitId].total.nh3  	 		        += parseFloat(data[2])/100;
    this.units[unitId].total.no2    	      		+= parseFloat(data[3])/100;
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
			this.result.co			        = Math.round((_total.co
											/ _total.measurementCount )*100)/100;
			this.result.nh3			        = Math.round((_total.nh3
											/ _total.measurementCount )*100)/100;
      this.result.no2 			      = Math.round((_total.no2
            					/ _total.measurementCount )*100)/100;
			this.result.measurementCount	= _total.measurementCount;
			this.result.measurementTime		= _total.measurementTime;
			this.result.loopTime			= _total.measurementTime.getTime() - _total.measurementTimeStart.getTime();

			this.record	= this.id + ';' +
			  this.result.measurementTime.toISOString() + ';' +
			  this.result.loopTime + ';' +
				this.result.co	+ ';' +
				this.result.nh3 + ';' +
        this.result.no2 + ';' +
				this.result.measurementCount +
				'\n';
			//console.log(record);

			this.result.observations	=
				'apri-sensor-mics6814-co:' + this.result.co + ',' +
        'apri-sensor-mics6814-nh3:' + this.result.nh3 + ',' +
				'apri-sensor-mics6814-no2:' + this.result.no2;
			this.result.unitid = unitId;
			this.initUnit(unitId);
		}
	}
}
}
