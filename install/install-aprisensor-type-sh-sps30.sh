#!/usr/bin/bash

# script copies files for config aprisensor-type 

echo "install-aprisensor-type-sh-sps30.sh start"

cp /opt/SCAPE604/git/apri-sensor/apri-config/aprisensor-types/aprisensor-type-sh-sps30.json /opt/SCAPE604/apri-sensor/apri-config/aprisensor-types/.
printf 'aprisensor-type-sh-sps30\n' > /opt/SCAPE604/config/aprisensor-type.cfg

echo "install-aprisensor-type restart SCAPE604-apri-sensor-raspi-v2"
systemctl restart SCAPE604-apri-sensor-raspi-v2

echo "install-aprisensor-type-sh-sps30.sh end"
