#!/bin/sh

# param 2 /$2 : comname for serial read TSI3007 UFP sensor e.g. /dev/ttyTSI3007
cd `dirname $0`
node apri-sensor-tsi3007.js $2 >>$1 2>>$1
exit -1
