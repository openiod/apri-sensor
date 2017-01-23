#!/bin/sh

cd `dirname $0`
cd ..

# get software updates from github
git pull >> ../log/apri-agent-update.log

sudo systemctl restart SCAPE604-apri-agent.service
sudo systemctl restart SCAPE604-apri-sensor-dylos.service

exit -1
