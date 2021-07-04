#!/bin/sh

# param 2 /$2 : comname for serial read spec sensors e.g. /dev/ttyUSB1
cd `dirname $0`
node apri-sensor-spec.js $2 >>$1 2>>$1
exit -1
