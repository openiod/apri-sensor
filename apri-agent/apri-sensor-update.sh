#!/bin/sh

cd `dirname $0`
cd ..

echo Start of update proces
date >> ../log/apri-agent-update.log
# get software updates from github
git pull >> ../log/apri-agent-update.log

# do not restart agent because loop will occur
#sudo systemctl restart SCAPE604-apri-agent.service
sudo systemctl stop SCAPE604-apri-sensor-dylos.service
sudo systemctl start SCAPE604-apri-sensor-dylos.service
echo End of update proces

exit 0
