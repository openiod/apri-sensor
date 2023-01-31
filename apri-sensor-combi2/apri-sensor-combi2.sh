#!/bin/sh
# deze procedure is vervangen door apri-sensor-raspi* 
# deze in ieder geval voor de ATMega via RPi3 A65D in Aalten 1
# param 2 /$2 : comname for serial read sensor e.g. /dev/ttyDC1700 
cd `dirname $0`
node apri-sensor-combi2.js $2 >>$1 2>>$1
exit -1
