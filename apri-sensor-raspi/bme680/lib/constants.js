'use strict';

module.exports = class Constants {
    constructor() {
        // BME680 General config
        this.POLL_PERIOD_MS = 10;

        // BME680 I2C addresses
        this.I2C_ADDR_PRIMARY = 0x76;
        this.I2C_ADDR_SECONDARY = 0x77;

        // BME680 unique chip identifier
        this.CHIP_ID = 0x61;

        // BME680 coefficients related defines
        this.COEFF_SIZE = 41;
        this.COEFF_ADDR1_LEN = 25;
        this.COEFF_ADDR2_LEN = 16;

        // BME680 field_x related defines
        this.FIELD_LENGTH = 17;
        this.FIELD_ADDR_OFFSET = 17;

        // Soft reset command
        this.SOFT_RESET_CMD = 0xb6;

        // Error code definitions
        this.OK = 0;
        // Errors
        this.E_NULL_PTR = -1;
        this.E_COM_FAIL = -2;
        this.E_DEV_NOT_FOUND = -3;
        this.E_INVALID_LENGTH = -4;

        // Warnings
        this.W_DEFINE_PWR_MODE = 1;
        this.W_NO_NEW_DATA = 2;

        // Info's
        this.I_MIN_CORRECTION = 1;
        this.I_MAX_CORRECTION = 2;

        // Register map
        // Other coefficient's address
        this.ADDR_RES_HEAT_VAL_ADDR = 0x00;
        this.ADDR_RES_HEAT_RANGE_ADDR = 0x02;
        this.ADDR_RANGE_SW_ERR_ADDR = 0x04;
        this.ADDR_SENS_CONF_START = 0x5A;
        this.ADDR_GAS_CONF_START = 0x64;

        // Field settings
        this.FIELD0_ADDR = 0x1d;

        // Heater settings
        this.RES_HEAT0_ADDR = 0x5a;
        this.GAS_WAIT0_ADDR = 0x64;

        // Sensor configuration registers
        this.CONF_HEAT_CTRL_ADDR = 0x70;
        this.CONF_ODR_RUN_GAS_NBC_ADDR = 0x71;
        this.CONF_OS_H_ADDR = 0x72;
        this.MEM_PAGE_ADDR = 0xf3;
        this.CONF_T_P_MODE_ADDR = 0x74;
        this.CONF_ODR_FILT_ADDR = 0x75;

        // Coefficient's address
        this.COEFF_ADDR1 = 0x89;
        this.COEFF_ADDR2 = 0xe1;

        // Chip identifier
        this.CHIP_ID_ADDR = 0xd0;
        this.CHIP_VARIANT_ADDR = 0xf0

        this.VARIANT_LOW = 0x00
        this.VARIANT_HIGH = 0x01

        // Soft reset register
        this.SOFT_RESET_ADDR = 0xe0;

        // Heater control settings
        this.ENABLE_HEATER = 0x00;
        this.DISABLE_HEATER = 0x08;

        // Gas measurement settings
        this.DISABLE_GAS_MEAS = 0x00;
        /** @todo change default to -1 for auto select */
        this.ENABLE_GAS_MEAS = -1;
        this.ENABLE_GAS_MEAS_LOW = 0x01
        this.ENABLE_GAS_MEAS_HIGH = 0x02

        // Over-sampling settings
        this.OS_NONE = 0;
        this.OS_1X = 1;
        this.OS_2X = 2;
        this.OS_4X = 3;
        this.OS_8X = 4;
        this.OS_16X = 5;

        // IIR filter settings
        this.FILTER_SIZE_0 = 0;
        this.FILTER_SIZE_1 = 1;
        this.FILTER_SIZE_3 = 2;
        this.FILTER_SIZE_7 = 3;
        this.FILTER_SIZE_15 = 4;
        this.FILTER_SIZE_31 = 5;
        this.FILTER_SIZE_63 = 6;
        this.FILTER_SIZE_127 = 7;

        // Power mode settings
        this.SLEEP_MODE = 0;
        this.FORCED_MODE = 1;

        // Delay related macro declaration
        this.RESET_PERIOD = 10;

        // SPI memory page settings
        this.MEM_PAGE0 = 0x10;
        this.MEM_PAGE1 = 0x00;

        // Ambient humidity shift value for compensation
        this.HUM_REG_SHIFT_VAL = 4;

        // Run gas enable and disable settings
        this.RUN_GAS_DISABLE = 0;
        this.RUN_GAS_ENABLE = 1;

        // Buffer length macro declaration
        this.TMP_BUFFER_LENGTH = 40;
        this.REG_BUFFER_LENGTH = 6;
        this.FIELD_DATA_LENGTH = 3;
        this.GAS_REG_BUF_LENGTH = 20;
        this.GAS_HEATER_PROF_LEN_MAX = 10;

        // Settings selector
        this.OST_SEL = 1;
        this.OSP_SEL = 2;
        this.OSH_SEL = 4;
        this.GAS_MEAS_SEL = 8;
        this.FILTER_SEL = 16;
        this.HCNTRL_SEL = 32;
        this.RUN_GAS_SEL = 64;
        this.NBCONV_SEL = 128;
        this.GAS_SENSOR_SEL = this.GAS_MEAS_SEL | this.RUN_GAS_SEL | this.NBCONV_SEL;

        // Number of conversion settings
        this.NBCONV_MIN = 0;
        this.NBCONV_MAX = 9;// Was 10, but there are only 10 settings: 0 1 2 ... 8 9

        // Mask definitions
        this.GAS_MEAS_MSK = 0x30;
        this.NBCONV_MSK = 0X0F;
        this.FILTER_MSK = 0X1C;
        this.OST_MSK = 0XE0;
        this.OSP_MSK = 0X1C;
        this.OSH_MSK = 0X07;
        this.HCTRL_MSK = 0x08;
        this.RUN_GAS_MSK = 0x30;
        this.MODE_MSK = 0x03;
        this.RHRANGE_MSK = 0x30;
        this.RSERROR_MSK = 0xf0;
        this.NEW_DATA_MSK = 0x80;
        this.GAS_INDEX_MSK = 0x0f;
        this.GAS_RANGE_MSK = 0x0f;
        this.GASM_VALID_MSK = 0x20;
        this.HEAT_STAB_MSK = 0x10;
        this.MEM_PAGE_MSK = 0x10;
        this.SPI_RD_MSK = 0x80;
        this.SPI_WR_MSK = 0x7f;
        this.BIT_H1_DATA_MSK = 0x0F;

        // Bit position definitions for sensor settings
        this.GAS_MEAS_POS = 4;
        this.FILTER_POS = 2;
        this.OST_POS = 5;
        this.OSP_POS = 2;
        this.OSH_POS = 0;
        this.RUN_GAS_POS = 4;
        this.MODE_POS = 0;
        this.NBCONV_POS = 0;

        // Array Index to Field data mapping for Calibration Data
        this.setFieldData();

        // BME680 register buffer index settings
        this.REG_FILTER_INDEX = 5;
        this.REG_TEMP_INDEX = 4;
        this.REG_PRES_INDEX = 4;
        this.REG_HUM_INDEX = 2;
        this.REG_NBCONV_INDEX = 1;
        this.REG_RUN_GAS_INDEX = 1;
        this.REG_HCTRL_INDEX = 0;

        // Look up tables for the possible gas range values

        this.lookupTable1 = [
            0.0, 0.0, 0.0, 0.0, 0.0, -1.0, 0.0, -0.8,
            0.0, 0.0, -0.2, -0.5, 0.0, -1.0, 0.0, 0.0];
        this.lookupTable2 = [
            0.0, 0.0, 0.0, 0.0, 0.1, 0.7, 0.0, -0.8,
            -0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
    }

    setFieldData() {
        // Array Index to Field data mapping for Calibration Data
        this.T2_LSB_REG = 1;
        this.T2_MSB_REG = 2;
        this.T3_REG = 3;
        this.P1_LSB_REG = 5;
        this.P1_MSB_REG = 6;
        this.P2_LSB_REG = 7;
        this.P2_MSB_REG = 8;
        this.P3_REG = 9;
        this.P4_LSB_REG = 11;
        this.P4_MSB_REG = 12;
        this.P5_LSB_REG = 13;
        this.P5_MSB_REG = 14;
        this.P7_REG = 15;
        this.P6_REG = 16;
        this.P8_LSB_REG = 19;
        this.P8_MSB_REG = 20;
        this.P9_LSB_REG = 21;
        this.P9_MSB_REG = 22;
        this.P10_REG = 23;
        this.H2_MSB_REG = 25;
        this.H2_LSB_REG = 26;
        this.H1_LSB_REG = 26;
        this.H1_MSB_REG = 27;
        this.H3_REG = 28;
        this.H4_REG = 29;
        this.H5_REG = 30;
        this.H6_REG = 31;
        this.H7_REG = 32;
        this.T1_LSB_REG = 33;
        this.T1_MSB_REG = 34;
        this.GH2_LSB_REG = 35;
        this.GH2_MSB_REG = 36;
        this.GH1_REG = 37;
        this.GH3_REG = 38;
    }
};
