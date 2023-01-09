/*
** Module: apri-sensor-redis
**
** Module for Redis actions like clean-up archive
**
*/

"use strict"; // This is for your code to comply with the ECMAScript 5 standard.

// activate init process config-main
var path = require('path');
var startFolder = __dirname;
var startFolderParent = path.resolve(__dirname, '../..');
var configServerModulePath = startFolder + '/../apri-config/apri-config';

console.log("Start of Config Main ", configServerModulePath);
var apriConfig = require(configServerModulePath)

var systemFolder = __dirname;
var systemFolderParent = path.resolve(__dirname, '../..');
var systemFolderRoot = path.resolve(systemFolderParent, '..');
var systemModuleFolderName = path.basename(systemFolder);
var systemModuleName = path.basename(__filename);
var systemBaseCode = path.basename(systemFolderParent);

var initResult = apriConfig.init(systemModuleFolderName + "/" + systemModuleName);

// **********************************************************************************

// add module specific requires
var fs = require('fs');

/*
var redis										= require("redis");
var redisClient 						= redis.createClient();
const {promisify} 					= require('util');
//const redisGetAsync 				= promisify(redisClient.get).bind(redisClient);
//const redisSetAsync 				= promisify(redisClient.set).bind(redisClient);
const redisHmsetHashAsync 	= promisify(redisClient.hmset).bind(redisClient);
const redisSaddAsync 				= promisify(redisClient.sadd).bind(redisClient);
const redisSCard     				= promisify(redisClient.scard).bind(redisClient);
const redisSort     				= promisify(redisClient.sort).bind(redisClient);
const redisDel       				= promisify(redisClient.del).bind(redisClient);
const redisSRem     				= promisify(redisClient.srem).bind(redisClient);
*/

const redis = require('redis')
const redisClient = redis.createClient();

redisClient.on("error", err => {
  console.log("Redis client Error " + err);
});

var log = function (message) {
  console.log(new Date().toISOString() + ' | ' + message);
}
var logDir = function (object) {
  console.log(object);
}

// **********************************************************************************

var maxNrOfArchiveRecords = 40000;  // +- 3 days?
log('start Redis clean-up archive');

var removeHash = function (key, lastKey) {
  // log('start removeHash');
  var _key = key;
  var _lastKey = lastKey;
  //redisDel(_key)
  redisClient.DEL(_key)
    .then(function (res) {
      //log('key deleted '+_key+ ' ' + res);
      //redisSRem('archive',_key)
      redisClient.SREM('archive', _key)
        .then(function (res) {
          // log('key remove from archive set '+_key+ ' ' + res);
          if (_lastKey) {
            redisClient.quit();
            log('last key deleted and removed from set: ' + _key);
          };
        })
        .catch((error) => {
          log(error);
          if (_lastKey) {
            redisClient.quit();
          };
        });
    })
    .catch((error) => {
      log(error);
      if (_lastKey) {
        redisClient.quit();
      };
    });
  // log('end removeHash');
};

var selectOldestRecords = function () {
  // log('start selectOldestRecords');
  //redisSort('archive','alpha','limit','0','200','asc')  // select max 200 records
  redisClient.SORT('archive', 'alpha', 'limit', '0', '200', 'asc')  // select max 200 records
    .then(function (res) {
      var _res = res;
      if (_res.length == 0) {
        log('client quit 1');
        redisClient.quit();
      } else {
        log(_res.length);
        for (var i = 0; i < _res.length; i++) {
          // log('rec: '+i);
          if (i == _res.length - 1) {
            removeHash(_res[i], true);
          } else {
            removeHash(_res[i], false);
          }
        }
      }
    })
    .catch((error) => {
      log(error);
      log('client quit 2');
      redisClient.quit();
    });
  //  log('end selectOldestRecords');
}

var selectKeys = function () {
  //  log('start selectKeys');
  //  redisSCard('archive')
  redisClient.SCARD('archive')
    .then(function (res) {
      var nrOfArchiveRecords = res;
      log(nrOfArchiveRecords);
      if (nrOfArchiveRecords > maxNrOfArchiveRecords) { // 38.880 per 3 days
        selectOldestRecords();
      } else {
        log('No removeable records available');
        redisClient.quit();
      }
    })
    .catch((error) => {
      log(error);
      log('client quit 3');
      redisClient.quit();
    });
  //  log('end selectKeys');

}

selectKeys();
