#!/bin/sh

# Redis module for clienup archive 
cd `dirname $0`
node apri-sensor-redis.js $2 >>$1 2>>$1
exit -1
