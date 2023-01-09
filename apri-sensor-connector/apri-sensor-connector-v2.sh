#!/bin/sh
cd `dirname $0`
node apri-sensor-connector-v2.js $2 >>$1 2>>$1
exit -1
