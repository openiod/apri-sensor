#!/bin/sh

cd `dirname $0`
node apri-sensor-combi-1.js >>$1 2>>$1
exit -1
