#!/bin/sh

cd `dirname $0`
node apri-sensor-radiationd.js >>$1 2>>$1
exit -1
