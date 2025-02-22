'use strict';

// Sensor field data structure
module.exports = class FieldData {
    constructor() {
        // Contains new_data, gasm_valid & heat_stab
        this.status = null;
        this.heat_stable = false;
        // The index of the heater profile used
        this.gas_index = null;
        // Measurement index to track order
        this.meas_index = null;
        // Temperature in degree celsius x100
        this.temperature = null;
        // Pressure in Pascal
        this.pressure = null;
        // Humidity in % relative humidity x1000
        this.humidity = null;
        // Gas resistance in Ohms
        this.gas_resistance = null;
    }
};
