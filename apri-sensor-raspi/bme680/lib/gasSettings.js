'use strict';

// BME680 gas sensor which comprises of gas settings
//// and status parameters

module.exports = class GasSettings {
    constructor() {
        // Variable to store nb conversion
        this.nb_conv = null;
        // Variable to store heater control
        this.heatr_ctrl = null;
        // Run gas enable value
        this.run_gas = null;
        // Pointer to store heater temperature
        this.heatr_temp = null;
        // Pointer to store duration profile
        this.heatr_dur = null
    }
};
