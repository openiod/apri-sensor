#!/usr/bin/sh

# Redis module for clienup archive

PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

SYSTEMCODE="SCAPE604"
SYSTEMPATH="/opt"

LOGFILE=/var/log/aprisensor/apri-sensor-redis.log
echo "Start procedure on: " `date` >>$LOGFILE

mkdir -p /var/log/aprisensor
#mkdir -p $SYSTEMPATH/$SYSTEMCODE/log

systemctl stop SCAPE604-apri-sensor-connector

cd  $SYSTEMPATH/$SYSTEMCODE/apri-sensor

export NODEPATH=`which node`
$NODEPATH apri-sensor-redis/apri-sensor-redis.js >>$LOGFILE 2>>$LOGFILE

rm /var/log/*gz
rm /var/log/*.1
# eenmalig voor oudere versies
#rm /opt/SCAPE604/log/apri-sensor-redis.log

# opruimen logfiles zolang winston nog niet volledig ingericht is
# ook de oude map voorlopig meenmenen (tot ApriSensorSK2)
cd /var/log/aprisensor
mv SCAPE604-apri-sensor-connector-old1.log SCAPE604-apri-sensor-connector-old2.log
mv SCAPE604-apri-sensor-connector.log SCAPE604-apri-sensor-connector-old1.log
#cd /opt/SCAPE604/log
#mv SCAPE604-apri-sensor-connector-old1.log SCAPE604-apri-sensor-connector-old2.log
#mv SCAPE604-apri-sensor-connector.log SCAPE604-apri-sensor-connector-old1.log

systemctl start SCAPE604-apri-sensor-connector


exit
