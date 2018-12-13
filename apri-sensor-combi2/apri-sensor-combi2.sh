#!/bin/sh

# param 2 /$2 : comname for serial read sensor e.g. /dev/ttyDC1700 
cd `dirname $0`
node apri-sensor-combi2.js $2 >>$1 2>>$1
exit -1
