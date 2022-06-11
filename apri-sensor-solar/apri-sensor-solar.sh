#!/bin/sh

# param 2 /$2 : comname for serial read solar/pyranometer apri-sensor-solar unit
# param 3 /$3 : baudrate for serial read solar/pyranometer apri-sensor-solar unit
cd `dirname $0`
node apri-sensor-solar.js $2 $3 >>$1 2>>$1
exit -1
