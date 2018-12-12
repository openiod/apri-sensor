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
	  id		: '82' // 'PMSA003'
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
    this.units[unitId].total.concPM1_0_amb		= 0;
		this.units[unitId].total.concPM2_5_amb		= 0;
		this.units[unitId].total.concPM10_0_amb 	= 0;
    this.units[unitId].total.rawGt0_3um   		= 0;
    this.units[unitId].total.rawGt0_5um   		= 0;
    this.units[unitId].total.rawGt1_0um   		= 0;
    this.units[unitId].total.rawGt2_5um   		= 0;
    this.units[unitId].total.rawGt5_0um   		= 0;
    this.units[unitId].total.rawGt10_0um   		= 0;
	}
	, isSensorType: function(data) {
		var _dataPrefix = data[0].split('@');
		if (_dataPrefix[2] != this.id ) return false;
		if (data.length == 14
			&& isNumeric(data[1])
      && isNumeric(data[2])
			&& isNumeric(data[3])
      && isNumeric(data[4])
      && isNumeric(data[5])
      && isNumeric(data[6])
			&& isNumeric(data[7])
      && isNumeric(data[8])
      && isNumeric(data[9])
			&& isNumeric(data[10])
      && isNumeric(data[11])
      && isNumeric(data[12])
			&& isNumeric(data[13])
			){
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
		this.units[unitId].total.measurementCount	++;
		this.units[unitId].total.concPM1_0_CF1	+= parseFloat(data[2])/10;
		this.units[unitId].total.concPM2_5_CF1	+= parseFloat(data[3])/10;
		this.units[unitId].total.concPM10_0_CF1	+= parseFloat(data[4])/10;
    this.units[unitId].total.concPM1_0_amb	+= parseFloat(data[5])/10;
		this.units[unitId].total.concPM2_5_amb	+= parseFloat(data[6])/10;
		this.units[unitId].total.concPM10_0_amb	+= parseFloat(data[7])/10;
    this.units[unitId].total.rawGt0_3um	    += parseFloat(data[8])/10;
		this.units[unitId].total.rawGt0_5um	    += parseFloat(data[9])/10;
		this.units[unitId].total.rawGt1_0um	    += parseFloat(data[10])/10;
    this.units[unitId].total.rawGt2_5um	    += parseFloat(data[11])/10;
		this.units[unitId].total.rawGt5_0um	    += parseFloat(data[12])/10;
		this.units[unitId].total.rawGt10_0um	  += parseFloat(data[13])/10;
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
			this.result.concPM1_0_CF1	   = Math.round((_total.concPM1_0_CF1
										/ _total.measurementCount )*100)/100;
			this.result.concPM2_5_CF1	   = Math.round((_total.concPM2_5_CF1
										/ _total.measurementCount )*100)/100;
			this.result.concPM10_0_CF1	 = Math.round((_total.concPM10_0_CF1
										/ _total.measurementCount )*100)/100;
      this.result.concPM1_0_amb	   = Math.round((_total.concPM1_0_amb
										/ _total.measurementCount )*100)/100;
			this.result.concPM2_5_amb	   = Math.round((_total.concPM2_5_amb
										/ _total.measurementCount )*100)/100;
			this.result.concPM10_0_amb	 = Math.round((_total.concPM10_0_amb
              			/ _total.measurementCount )*100)/100;
      this.result.rawGt0_3um	     = Math.round((_total.rawGt0_3um
              			/ _total.measurementCount )*100)/100;
      this.result.rawGt0_5um	     = Math.round((_total.rawGt0_5um
              			/ _total.measurementCount )*100)/100;
      this.result.rawGt1_0um	     = Math.round((_total.rawGt1_0um
              			/ _total.measurementCount )*100)/100;
      this.result.rawGt2_5um	     = Math.round((_total.rawGt2_5um
              			/ _total.measurementCount )*100)/100;
      this.result.rawGt5_0um	     = Math.round((_total.rawGt5_0um
              			/ _total.measurementCount )*100)/100;
      this.result.rawGt10_0um	     = Math.round((_total.rawGt10_0um
              			/ _total.measurementCount )*100)/100;

			this.result.measurementCount= _total.measurementCount;
			this.result.measurementTime	= _total.measurementTime;
			this.result.loopTime			= _total.measurementTime.getTime() - _total.measurementTimeStart.getTime();

			this.record	= this.id + ';' +
			    this.result.measurementTime.toISOString() + ';' +
			    this.result.loopTime + ';' +
				this.result.concPM1_0_CF1	+ ';' +
				this.result.concPM2_5_CF1	+ ';' +
				this.result.concPM10_0_CF1	+ ';' +
        this.result.concPM1_0_amb	+ ';' +
				this.result.concPM2_5_amb	+ ';' +
				this.result.concPM10_0_amb	+ ';' +
        this.result.rawGt0_3um	+ ';' +
				this.result.rawGt0_5um	+ ';' +
				this.result.rawGt1_0um	+ ';' +
        this.result.rawGt2_5um	+ ';' +
				this.result.rawGt5_0um	+ ';' +
				this.result.rawGt10_0um	+ ';' +
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
        'apri-sensor-pmsa003-rawGt0_3um:'    + this.result.rawGt0_3um + ',' +
				'apri-sensor-pmsa003-rawGt0_5um:'    + this.result.rawGt0_5um + ',' +
				'apri-sensor-pmsa003-rawGt1_0um:'    + this.result.rawGt1_0um + ',' +
        'apri-sensor-pmsa003-rawGt2_5um:'    + this.result.rawGt2_5um + ',' +
				'apri-sensor-pmsa003-rawGt5_0um:'    + this.result.rawGt5_0um + ',' +
				'apri-sensor-pmsa003-rawGt10_0um:'   + this.result.rawGt10_0um;
			this.result.unitid = unitId;
			this.initUnit(unitId);
		}
	}
}
}
