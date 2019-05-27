#!/bin/sh

# Redis module for clienup archive

SYSTEMCODE="SCAPE604"
SYSTEMPATH="/opt"

LOGFILE=$SYSTEMPATH/$SYSTEMCODE/log/apri-sensor-redis.log
echo "Start procedure on: " `date` >>$LOGFILE

mkdir -p $SYSTEMPATH/$SYSTEMCODE/log

cd  $SYSTEMPATH/$SYSTEMCODE/apri-sensor

/usr/bin/node apri-sensor-redis/apri-sensor-redis.js >>$LOGFILE 2>>$LOGFILE

exit
