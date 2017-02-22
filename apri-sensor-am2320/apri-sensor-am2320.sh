#!/bin/sh

cd `dirname $0`
node apri-sensor-am2320.js >>$1 2>>$1
exit -1
