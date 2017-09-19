#!/bin/sh

cd `dirname $0`
node apri-sensor-combi21.js >>$1 2>>$1
exit -1
