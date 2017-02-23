 
/**
 * The apri-config module for init and config apri-sensor system
 * @module apri-config
 */
module.exports = {

	systemStart: null,
	os: null,
	request: null,
	fs: null,
	path: null,
	systemFolderParent: null,
	systemCode: null,
	systemBaseCode: null,
	mainSystemCode: null,
	systemEnv: null,
	systemMainModuleName: null,
	systemListenPort: null,
//	systemRepositoryHttpServer: null,
	apps:null,


	init: function (systemMainModuleName) {
		var _module;

		console.log (systemMainModuleName);
		this.systemStart = new Date();
		this.path = require('path');
		this.os = require('os');
		this.fs = require('fs');

		var systemHostName			= this.os.hostname();
		var systemFolder 			= __dirname;
		this.systemFolderParent		= this.path.resolve(__dirname,'../..');
		this.systemMainModuleName 	= systemMainModuleName;
		this.systemBaseCode 		= this.path.basename(this.systemFolderParent);

		var systemConfigLocalPath 	= this.systemFolderParent +'/config/';
		var systemConfigStr 		= this.fs.readFileSync(systemConfigLocalPath + "apri-system.json");
		var systemConfig 			= JSON.parse(systemConfigStr);
		
		var sensorUsbConfigStr 		= this.fs.readFileSync(systemConfigLocalPath + "apri-sensor-usb.json");
		this.sensorUsbConfig 		= JSON.parse(sensorUsbConfigStr);

		// IMPORTANT: SYSTEM CONFIGURATION VALUES !!!
		var systemName 				= systemConfig.system.systemName;
		this.systemCode 			= systemConfig.system.systemCode;
		this.mainSystemCode 		= systemConfig.system.systemCode;
		this.systemEnv 				= systemConfig.system.systemEnv;
		this.systemListenPort 		= systemConfig.system.systemListenPort;
		var systemVersionL1 		= systemConfig.system.version.l1;
		var systemVersionL2 		= systemConfig.system.version.l2;
		var systemVersionL3 		= systemConfig.system.version.l3;
		var systemVersion 			= systemVersionL1 + '.' + systemVersionL2 + '.' + systemVersionL3;
		var systemServiceType 		= systemConfig.system.serviceType;
		
		// Applications
		this.apps					= systemConfig.apps;

		// Parameters
//		this.systemRepositoryHttpServer = systemConfig.parameter.repositoryHttpServer;   //  ! geen systemCode, direct access !
//		var systemRepositoryHttpProxy  	= systemConfig.parameter.repositoryHttpProxy  + "/" + this.systemBaseCode;
		this.parameter					= systemConfig.parameter;


//		if (systemListenPortName) {
//			this.systemListenPort 		= systemConfig.listenPorts[systemListenPortName];
//		} else {
//			this.systemListenPort 		= systemConfig.listenPorts["systemListenPort"];
//		}

		// module overrules default config
		if (systemConfig.modules) {
			for (i=0;i<systemConfig.modules.length;i++) {
				_module = systemConfig.modules[i];
				if (_module.moduleName == this.systemMainModuleName)  {
					if (_module.systemCode) {
						this.systemCode = _module.systemCode;
					}
					if (_module.systemListenPort) {
						this.systemListenPort = _module.systemListenPort;
					}
					if (_module.systemEnv) {
						this.systemEnv = _module.systemEnv;
					}
					break;
				}
			}
		}


		console.log('\n=================================================================');
		console.log();
		console.log('Start systemname         :', systemName);
		console.log(' Systemmaincode / subcode:', this.mainSystemCode, this.systemCode );
		console.log(' Systemversion           :', systemVersion);
		console.log(' Systemhost              :', systemHostName);
		console.log(' System environment      :', this.systemEnv);
		console.log(' System config folder    :', systemFolder);
		console.log(' System Main modulename  :', this.systemMainModuleName);
		console.log(' Servicetype             :', systemServiceType);
		console.log(' Listening port          :', this.systemListenPort);
//		console.log(' Repository prefix       :', this.systemRepositoryHttpServer);
//		console.log(' Repository proxy prefix :', systemRepositoryHttpProxy);
		console.log(' System start            :', this.systemStart.toISOString());
		console.log('=================================================================\n');

		if (this.mainSystemCode != this.systemBaseCode) {
			console.log('ERROR: SYSTEMCODE OF CONFIG FILE NOT EQUAL TO SYSTEM BASECODE (', this.systemCode, 'vs', this.systemBaseCode, ')');
			return -1;
		}


	},  // end of init

	getSystemListenPort: function () {
		return this.systemListenPort;
	},
	getSensorUsbComName: function () {
		console.log()
		return this.sensorUsbConfig;
	}


} // end of module.exports
