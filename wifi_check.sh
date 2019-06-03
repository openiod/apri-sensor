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

# find default router:
GATEWAY="$(route | awk '/default /{print substr($2,1)}')"
echo 'Gateway: ' $GATEWAY >>$LOGFILE

[ $GATEWAY = "0.0.0.0" ];echo 'gateway' $GATEWAY 'equal to 0.0.0.0?' $? >>$LOGFILE

# test gateway connection
ping -c4 $GATEWAY > /dev/null
if [ $? != 0 ]
then
  echo "No network connection, restarting wlan0" >>$LOGFILE
  /sbin/ifdown 'wlan0' >>$LOGFILE
  sleep 5
  /sbin/ifup --force 'wlan0' >>$LOGFILE
else
  echo "Connected to gateway " $GATEWAY >>$LOGFILE
fi

# always power of wlan0 will reduce problems with wifi
iwconfig wlan0 power off

echo "End   procedure on: " `date` >>$LOGFILE
exit 0
