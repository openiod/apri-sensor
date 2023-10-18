#!/bin/sh

#cd `dirname $0`

if [ ! -d /opt/SCAPE604/git/apri-sensor ]
then
  # make directory and get latest git repository
  mkdir -p /opt/SCAPE604/git
  cd /opt/SCAPE604/git
  # git clone --depth 1 instead of degit
  git clone --depth 1 https://github.com/openiod/apri-sensor.git
  cd /opt/SCAPE604/git/apri-sensor
  git config pull.rebase false
  # git clone https://github.com/openiod/apri-sensor.git
  # first clean up degit cache
  # rm -r /root/.degit/github/openiod/apri-sensor
  # npx degit openiod/apri-sensor apri-sensor
  # echo "degit ended"
  # echo "git clone ended"
fi
if [ ! -d /var/log/aprisensor ]
then 
  mkdir /var/log/aprisensor
fi

cd /opt/SCAPE604/git/apri-sensor

echo Start of update process >> /var/log/aprisensor/apri-agent-update.log
date >> /var/log/aprisensor/apri-agent-update.log

# get software updates from github
##git pull >> /var/log/aprisensor/apri-agent-update.log 2>>/var/log/aprisensor/apri-agent-update2.log

#cd /opt/SCAPE604/log
#mv /var/log/aprisensor/SCAPE604-apri-sensor-connector-old1.log /var/log/aprisensor/SCAPE604-apri-sensor-connector-old2.log
#mv /var/log/aprisensor/SCAPE604-apri-sensor-connector.log /var/log/aprisensor/SCAPE604-apri-sensor-connector-old1.log
#rm /opt/SCAPE604/log/SCAPE604-apri-sensor-connector*.log
#systemctl restart SCAPE604-apri-sensor-connector

#mv /var/log/aprisensor/SCAPE604-apri-sensor-raspi-old1.log /var/log/aprisensor/SCAPE604-apri-sensor-raspi-old2.log
#mv /var/log/aprisensor/SCAPE604-apri-sensor-raspi.log /var/log/aprisensor/SCAPE604-apri-sensor-raspi-old1.log
#rm /opt/SCAPE604/log/SCAPE604-apri-sensor-raspi*.log
#systemctl restart SCAPE604-apri-sensor-raspi

#mv /var/log/aprisensor/SCAPE604-aprisensor-nmcli-old1.log /var/log/aprisensor/SCAPE604-aprisensor-nmcli-old2.log
#mv /var/log/aprisensor/SCAPE604-aprisensor-nmcli.log /var/log/aprisensor/SCAPE604-aprisensor-nmcli-old1.log
#rm /opt/SCAPE604/log/SCAPE604-aprisensor-nmcli*.log
#systemctl restart SCAPE604-aprisensor-nmcli


# do not restart agent because loop will occur
#sudo systemctl restart SCAPE604-apri-agent.service
#sudo systemctl stop SCAPE604-apri-sensor-dylos.service
#sudo systemctl start SCAPE604-apri-sensor-dylos.service
echo End of update proces >> /var/log/aprisensor/apri-agent-update.log

exit 0
