#!/bin/sh


PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

SYSTEMCODE="SCAPE604"
SYSTEMPATH="/opt"

LOGFILE=$SYSTEMPATH/$SYSTEMCODE/log/wifi_check.log
echo "Start procedure on: " `date` >>$LOGFILE

# get SSID
iwgetid >>$LOGFILE

# find ip-address:
ifconfig wlan0 |awk '/inet /{print substr($2,1)}' >>$LOGFILE
IP="$(ifconfig wlan0 |awk '/inet /{print substr($2,1)}')"
echo 'IP-address: ' $IP >>$LOGFILE
if [ $IP = "10.42.0.1" ]
then
  echo 'IP is comitup-IP so stop wifi-check: ' >>$LOGFILE
  echo "End   procedure on: " `date` >>$LOGFILE
  exit 0
fi

# find default router:
GATEWAY="$(route | awk '/default /{print substr($2,1)}' | awk 'NR==1 {print substr($1,1)}' )"
echo 'Gateway: ' $GATEWAY >>$LOGFILE

if [ $GATEWAY = "0.0.0.0" ]
then
  echo 'gateway' $GATEWAY 'equal to 0.0.0.0?' $? >>$LOGFILE
  echo "No gateway so restarting wlan0" >>$LOGFILE
  #/sbin/ifdown 'wlan0' >>$LOGFILE
  #sleep 5
  #/sbin/ifup --force 'wlan0' >>$LOGFILE
  ip link set wlan0 down
  sleep 2
  iw reg set NL
  iwconfig wlan0 power off
  sleep 2
  ip link set wlan0 up
fi

# test gateway connection
echo 'ping to gateway ' $GATEWAY >>$LOGFILE
ping -c4 $GATEWAY > /dev/null
if [ $? != 0 ]
then
  echo "No network connection, restarting wlan0" >>$LOGFILE
  #/sbin/ifdown 'wlan0' >>$LOGFILE
  #sleep 5
  #/sbin/ifup --force 'wlan0' >>$LOGFILE
  ip link set wlan0 down
  sleep 2
  iw reg set NL
  iwconfig wlan0 power off
  sleep 2
  ip link set wlan0 up
else
  echo "Connected to gateway " $GATEWAY >>$LOGFILE
fi

# always power of wlan0 will reduce problems with wifi
sleep 2
iw reg get

echo "End   procedure on: " `date` >>$LOGFILE
exit 0
