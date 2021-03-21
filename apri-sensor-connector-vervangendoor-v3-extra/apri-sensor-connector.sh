#!/bin/sh
cd `dirname $0`
node apri-sensor-connector.js $2 >>$1 2>>$1
exit -1
