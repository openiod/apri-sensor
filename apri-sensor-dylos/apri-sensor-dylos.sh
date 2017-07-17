#!/bin/sh

# param 2 /$2 : comname for serial read Dylos sensor e.g. ttyDC1700 (excl. /dev/)
cd `dirname $0`
node apri-sensor-dylos.js $2 >>$1 2>>$1
exit -1
