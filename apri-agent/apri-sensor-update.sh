#!/bin/sh

#cd `dirname $0`

if [ ! -d /opt/SCAPE604/git/apri-sensor ]
then
    mkdir -p /opt/SCAPE604/git
    cd /opt/SCAPE604/git
    git clone https://github.com/openiod/apri-sensor.git
    echo "git clone ended"
fi
cd /opt/SCAPE604/git


echo Start of update proces >> /opt/SCAPE604/log/apri-agent-update.log
date >> /opt/SCAPE604/log/apri-agent-update.log
# get software updates from github
# git checkout package-lock.json
git pull >> /opt/SCAPE604/log/apri-agent-update.log 2>>/opt/SCAPE604/log/apri-agent-update2.log

cd /opt/SCAPE604/log
mv SCAPE604-apri-sensor-connector-old1.log SCAPE604-apri-sensor-connector-old2.log
mv SCAPE604-apri-sensor-connector.log SCAPE604-apri-sensor-connector-old1.log
systemctl restart SCAPE604-apri-sensor-connector

mv SCAPE604-apri-sensor-raspi-old1.log SCAPE604-apri-sensor-raspi-old2.log
mv SCAPE604-apri-sensor-raspi.log SCAPE604-apri-sensor-raspi-old1.log
systemctl restart SCAPE604-apri-sensor-raspi

mv SCAPE604-aprisensor-nmcli-old1.log SCAPE604-aprisensor-nmcli-old2.log
mv SCAPE604-aprisensor-nmcli.log SCAPE604-aprisensor-nmcli-old1.log
systemctl restart SCAPE604-aprisensor-nmcli


# do not restart agent because loop will occur
#sudo systemctl restart SCAPE604-apri-agent.service
#sudo systemctl stop SCAPE604-apri-sensor-dylos.service
#sudo systemctl start SCAPE604-apri-sensor-dylos.service
echo End of update proces >> /opt/SCAPE604/log/apri-agent-update.log

exit 0
