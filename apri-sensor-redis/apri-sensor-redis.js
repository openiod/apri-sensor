/*
** Module: apri-sensor-redis
**
** Module for Redis actions like clean-up archive
**
*/

"use strict"; // This is for your code to comply with the ECMAScript 5 standard.

// activate init process config-main
var path = require('path');
var startFolder 						= __dirname;
var startFolderParent				= path.resolve(__dirname,'../..');
var configServerModulePath	= startFolder + '/../apri-config/apri-config';

console.log("Start of Config Main ", configServerModulePath);
var apriConfig 							= require(configServerModulePath)

var systemFolder 						= __dirname;
var systemFolderParent			= path.resolve(__dirname,'../..');
var systemFolderRoot				= path.resolve(systemFolderParent,'..');
var systemModuleFolderName 	= path.basename(systemFolder);
var systemModuleName 				= path.basename(__filename);
var systemBaseCode 					= path.basename(systemFolderParent);

var initResult 							= apriConfig.init(systemModuleFolderName+"/"+systemModuleName);

// **********************************************************************************

// add module specific requires
var fs 											= require('fs');
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

redisClient.on("error", function (err) {
    console.log("Redis client Error " + err);
});

var log = function(message){
	console.log(new Date().toISOString()+' | '+message);
}
var logDir = function(object){
	console.log(object);
}

// **********************************************************************************

var maxNrOfArchiveRecords = 28000; //40000;
log('start Redis clean-up archive');

var removeHash = function(key) {
  var _key = key;
  redisDel(_key);
  .then(function(res) {
    log('key deleted '+_key+ ' ' + res);
      redisSRem('archive',_key)
      .then(function(res) {
        log('key remove from archive set '+_key+ ' ' + res);
      })
      .catch((error) => {
        log(error);
      });
  })
  .catch((error) => {
    log(error);
  });
}
var selectKeys = function() {
  redisSCard('archive')
  .then(function(res) {
      var nrOfArchiveRecords = res;
      log(nrOfArchiveRecords);
      if (nrOfArchiveRecords > maxNrOfArchiveRecords) { // 38.880 per 3 days
        redisSort('archive','alpha','limit','0','50','asc')
        .then(function(res) {
          logDir(res);
          for (var i=0;i<res.lenght;i++) {
            removeHash(res[i]);
          }
        })
        .catch((error) => {
          log(error);
        });
      }
  })
  .catch((error) => {
    log(error);
  });
}

selectKeys();

return;
