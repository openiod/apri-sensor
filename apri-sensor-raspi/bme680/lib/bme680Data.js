'use strict';

const FieldData = require('./fieldData');
const CalibrationData = require('./calibrationData');
const TPHSettings = require('./tphSettings');
const GasSettings = require('./gasSettings');
const Constants = require('./constants');
const constants = new Constants();

// BME680 device structure

module.exports = class BME680Data {
    constructor() {
        // Chip Id
        this.chip_id = null;
        // Chip variant (high - BM688 or low - BME680)
        this.chip_variant = null;
        // Device Id
        this.dev_id = null;
        // SPI/I2C interface
        this.intf = null;
        // Memory page used
        this.mem_page = null;
        // Ambient temperature in Degree C
        this.ambient_temperature = null;
        // Field Data
        this.data = new FieldData();
        // Sensor calibration data
        this.calibration_data = new CalibrationData();
        // Sensor settings
        this.tph_settings = new TPHSettings();
        // Gas Sensor settings
        this.gas_settings = new GasSettings();
        // Sensor power modes
        this.power_mode = null;
        // New sensor fields
        this.new_fields = null;
    }

    get chip_name() {
        return this.chip_variant === constants.VARIANT_LOW ? 'bme680' : 'bme688';
    }

};
