#!/bin/sh

# Redis module for clienup archive

SYSTEMCODE="SCAPE604"
SYSTEMPATH="/opt"

LOGFILE=$SYSTEMPATH/$SYSTEMCODE/log/apri-sensor-redis.log
echo "Start procedure on: " `date` >>$LOGFILE

mkdir -p $SYSTEMPATH/$SYSTEMCODE/log

cd  $SYSTEMPATH/$SYSTEMCODE/apri-sensor

node apri-sensor-redis/apri-sensor-redis.js >>$LOGFILE 2>>$LOGFILE

rm /var/log/*gz
rm /var/log/*.1

cd /opt/SCAPE604/log
systemctl stop SCAPE604-apri-sensor-connector
mv SCAPE604-apri-sensor-connector-old1.log SCAPE604-apri-sensor-connector-old2.log
mv SCAPE604-apri-sensor-connector.log SCAPE604-apri-sensor-connector-old1.log
systemctl start SCAPE604-apri-sensor-connector


exit
