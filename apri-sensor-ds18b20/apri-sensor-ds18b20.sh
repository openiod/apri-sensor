#!/bin/sh

cd `dirname $0`
node apri-sensor-ds18b20.js $2 >>$1 2>>$1
exit -1
