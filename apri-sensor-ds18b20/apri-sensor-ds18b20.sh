#!/bin/sh

# param 2 /$2 : comname for serial read Dylos sensor e.g. /dev/ttyDC1700
cd `dirname $0`
node apri-sensor-ds18b20.js $2 >>$1 2>>$1
exit -1
