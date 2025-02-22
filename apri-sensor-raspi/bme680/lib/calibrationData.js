'use strict';

const Constants = require('./constants');
const constants = new Constants();

// Structure to hold the Calibration data
module.exports = class CalibrationData {
    constructor() {
        this.par_h1 = null
        this.par_h2 = null
        this.par_h3 = null
        this.par_h4 = null
        this.par_h5 = null
        this.par_h6 = null
        this.par_h7 = null
        this.par_gh1 = null
        this.par_gh2 = null
        this.par_gh3 = null
        this.par_t1 = null
        this.par_t2 = null
        this.par_t3 = null
        this.par_p1 = null
        this.par_p2 = null
        this.par_p3 = null
        this.par_p4 = null
        this.par_p5 = null
        this.par_p6 = null
        this.par_p7 = null
        this.par_p8 = null
        this.par_p9 = null
        this.par_p10 = null
        // Variable to store t_fine size
        this.t_fine = null
        // Variable to store heater resistance range
        this.res_heat_range = null
        // Variable to store heater resistance value
        this.res_heat_val = null
        // Variable to store error range
        this.range_sw_err = null
    }


    static bytes_to_word(msb, lsb, bits = 16, signed = false) {
        let word = (msb << 8) | lsb;
        if (signed) {
            word = CalibrationData.twos_comp(word, bits);
        }
        return word;
    }

    static twos_comp(val, bits = 16) {
        bits = +bits || 32;
        if (bits > 32) throw new RangeError('uintToInt only supports ints up to 32 bits');
        val <<= 32 - bits;
        val >>= 32 - bits;
        return val;
    }

    setFromArray(calibration) {
        // Temperature related coefficients
        this.par_t1 = CalibrationData.bytes_to_word(calibration[constants.T1_MSB_REG], calibration[constants.T1_LSB_REG]);
        this.par_t2 = CalibrationData.bytes_to_word(calibration[constants.T2_MSB_REG], calibration[constants.T2_LSB_REG], 16, true);
        this.par_t3 = CalibrationData.twos_comp(calibration[constants.T3_REG], 8);

        // Pressure related coefficients
        this.par_p1 = CalibrationData.bytes_to_word(calibration[constants.P1_MSB_REG], calibration[constants.P1_LSB_REG]);
        this.par_p2 = CalibrationData.bytes_to_word(calibration[constants.P2_MSB_REG], calibration[constants.P2_LSB_REG], 16, true);
        this.par_p3 = CalibrationData.twos_comp(calibration[constants.P3_REG], 8);
        this.par_p4 = CalibrationData.bytes_to_word(calibration[constants.P4_MSB_REG], calibration[constants.P4_LSB_REG], 16, true);
        this.par_p5 = CalibrationData.bytes_to_word(calibration[constants.P5_MSB_REG], calibration[constants.P5_LSB_REG], 16, true);
        this.par_p6 = CalibrationData.twos_comp(calibration[constants.P6_REG], 8);
        this.par_p7 = CalibrationData.twos_comp(calibration[constants.P7_REG], 8);
        this.par_p8 = CalibrationData.bytes_to_word(calibration[constants.P8_MSB_REG], calibration[constants.P8_LSB_REG], 16, true);
        this.par_p9 = CalibrationData.bytes_to_word(calibration[constants.P9_MSB_REG], calibration[constants.P9_LSB_REG], 16, true);
        this.par_p10 = calibration[constants.P10_REG];

        // Humidity related coefficients
        this.par_h1 = (calibration[constants.H1_MSB_REG] << constants.HUM_REG_SHIFT_VAL) | (calibration[constants.H1_LSB_REG] & constants.BIT_H1_DATA_MSK)
        this.par_h2 = (calibration[constants.H2_MSB_REG] << constants.HUM_REG_SHIFT_VAL) | (calibration[constants.H2_LSB_REG] >> constants.HUM_REG_SHIFT_VAL)
        this.par_h3 = CalibrationData.twos_comp(calibration[constants.H3_REG], 8)
        this.par_h4 = CalibrationData.twos_comp(calibration[constants.H4_REG], 8)
        this.par_h5 = CalibrationData.twos_comp(calibration[constants.H5_REG], 8)
        this.par_h6 = calibration[constants.H6_REG]
        this.par_h7 = CalibrationData.twos_comp(calibration[constants.H7_REG], 8)

        // Gas heater related coefficients
        this.par_gh1 = CalibrationData.twos_comp(calibration[constants.GH1_REG], 8)
        this.par_gh2 = CalibrationData.bytes_to_word(calibration[constants.GH2_MSB_REG], calibration[constants.GH2_LSB_REG], 16, true)
        this.par_gh3 = CalibrationData.twos_comp(calibration[constants.GH3_REG], 8)
    }


    setOther(heat_range, heat_value, sw_error) {
        this.res_heat_range =Math.floor( (heat_range & constants.RHRANGE_MSK) / 16);
        this.res_heat_val = heat_value;
        this.range_sw_err =Math.floor( (sw_error & constants.RSERROR_MSK) )/ 16;
    }
};
