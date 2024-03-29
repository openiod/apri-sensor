#!/usr/bin/bash

# Redis module for clienup archive

PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

SYSTEMCODE="SCAPE604"
SYSTEMPATH="/opt"

LOGFILE=/var/log/aprisensor/apri-sensor-redis.log
echo "Start procedure on: " `date` >>$LOGFILE

mkdir -p /var/log/aprisensor
#mkdir -p $SYSTEMPATH/$SYSTEMCODE/log


if [ -f /etc/systemd/system/SCAPE604-apri-sensor-connector-v2.service ]
then
  systemctl stop SCAPE604-apri-sensor-connector-v2
fi
if [ -f /etc/systemd/system/SCAPE604-apri-sensor-connector.service ]
then
  systemctl stop SCAPE604-apri-sensor-connector
fi

cd  $SYSTEMPATH/$SYSTEMCODE/apri-sensor

# redis database now has maxmemory and allkeys-lru policy (automatic cleanup of oldest records)
# apri-sensor-redis*.js deactivated
#export NODEPATH=`which node`
#export REDISV=$(redis-cli -v | cut -d' ' -f 2 | cut -d'.' -f 1 )
#echo $REDISV
#if [ ${REDISV} == '6' ]; then
#  $NODEPATH apri-sensor-redis/apri-sensor-redis-v2.js >>$LOGFILE 2>>$LOGFILE
#else
#  $NODEPATH apri-sensor-redis/apri-sensor-redis.js >>$LOGFILE 2>>$LOGFILE
#fi

journalctl --vacuum-time=1h

if test -n "$(find /var/log -maxdepth 1 -name '*gz' -print -quit)"
then
    rm /var/log/*gz
fi
if test -n "$(find /var/log -maxdepth 1 -name '*.1' -print -quit)"
then
    rm /var/log/*1
fi

# eenmalig voor oudere versies
#rm /opt/SCAPE604/log/apri-sensor-redis.log

# opruimen logfiles zolang winston nog niet volledig ingericht is
# ook de oude map voorlopig meenmenen (tot ApriSensorSK2)
cd /var/log/aprisensor
if [ -f SCAPE604-apri-sensor-connector.log ]
then
  mv SCAPE604-apri-sensor-connector-old1.log SCAPE604-apri-sensor-connector-old2.log
  mv SCAPE604-apri-sensor-connector.log SCAPE604-apri-sensor-connector-old1.log
fi
if [ -f SCAPE604-apri-sensor-connector-v2.log ]
then
  mv SCAPE604-apri-sensor-connector-v2-old1.log SCAPE604-apri-sensor-connector-v2-old2.log
  mv SCAPE604-apri-sensor-connector-v2.log SCAPE604-apri-sensor-connector-v2-old1.log
fi
#cd /opt/SCAPE604/log
#mv SCAPE604-apri-sensor-connector-old1.log SCAPE604-apri-sensor-connector-old2.log
#mv SCAPE604-apri-sensor-connector.log SCAPE604-apri-sensor-connector-old1.log

if [ -f /etc/systemd/system/SCAPE604-apri-sensor-connector-v2.service ]
then
  systemctl start SCAPE604-apri-sensor-connector-v2
fi
if [ -f /etc/systemd/system/SCAPE604-apri-sensor-connector.service ]
then
  systemctl start SCAPE604-apri-sensor-connector
fi


exit
