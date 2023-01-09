#!/bin/sh

# param 2 /$2 : comname for serialport e.g /dev/ttyDylos-DC1700
cd `dirname $0`
node apri-sensor-raspi-v2.js $2 >>$1 2>>$1
exit -1
