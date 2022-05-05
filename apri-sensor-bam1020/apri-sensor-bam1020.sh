#!/bin/sh

# param 2 /$2 : comname for serial read BAM1020 monitor e.g. /dev/ttyDC1700
cd `dirname $0`
node apri-sensor-bam1020.js $2 >>$1 2>>$1
exit -1
