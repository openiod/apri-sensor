#!/bin/sh

cd `dirname $0`
cd ..

echo Start of update proces >> ../log/apri-agent-update.log
date >> ../log/apri-agent-update.log
# get software updates from github
git checkout package-lock.json
git pull >> ../log/apri-agent-update.log

cd /opt/SCAPE604/log
mv SCAPE604-apri-sensor-connector-old1.log SCAPE604-apri-sensor-connector-old2.log
mv SCAPE604-apri-sensor-connector.log SCAPE604-apri-sensor-connector-old1.log
systemctl restart SCAPE604-apri-sensor-connector

mv SCAPE604-apri-sensor-raspi-old1.log SCAPE604-apri-sensor-raspi-old2.log
mv SCAPE604-apri-sensor-raspi.log SCAPE604-apri-sensor-raspi-old1.log
systemctl restart SCAPE604-apri-sensor-raspi

# do not restart agent because loop will occur
#sudo systemctl restart SCAPE604-apri-agent.service
#sudo systemctl stop SCAPE604-apri-sensor-dylos.service
#sudo systemctl start SCAPE604-apri-sensor-dylos.service
echo End of update proces >> ../log/apri-agent-update.log

exit 0
