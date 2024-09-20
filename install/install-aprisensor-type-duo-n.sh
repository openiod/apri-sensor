#!/usr/bin/bash

# script copies files for config aprisensor-type 

echo "install-aprisensor-type-duo-n.sh start"

cp /opt/SCAPE604/git/apri-sensor/apri-config/aprisensor-types/aprisensor-type-duo-n.json /opt/SCAPE604/apri-sensor/apri-config/aprisensor-types/.
printf 'aprisensor-type-duo-n\n' > /opt/SCAPE604/config/aprisensor-type.cfg

echo "install-aprisensor-type restart SCAPE604-apri-sensor-raspi-v2"
systemctl restart SCAPE604-apri-sensor-raspi-v2

echo "install-aprisensor-type-duo-n.sh end"
