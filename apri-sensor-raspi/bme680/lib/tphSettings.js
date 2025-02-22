'use strict';

module.exports = class TPHSettings {
    constructor() {
        // Humidity oversampling
        this.os_hum = null
        // Temperature oversampling
        this.os_temp = null
        // Pressure oversampling
        this.os_pres = null
        // Filter coefficient
        this.filter = null
    }
};
