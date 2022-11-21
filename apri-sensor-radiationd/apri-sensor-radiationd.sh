#!/bin/sh

# param 2 /$2 : comname for serial read radiationd sensor e.g. /dev/ttyUSB0
cd `dirname $0`
node apri-sensor-radiationd.js /dev/ttyUSB0 9600 >>$1 2>>$1
exit -1

