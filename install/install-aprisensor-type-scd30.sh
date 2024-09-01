#!/usr/bin/bash

# script copies files for config aprisensor-type 

echo "install-aprisensor-type-scd30.sh start"

cp /opt/SCAPE604/git/apri-sensor/apri-config/aprisensor-types/aprisensor-type-scd30.json /opt/SCAPE604/apri-sensor/apri-config/aprisensor-types/.
printf 'aprisensor-type-scd30\n' > /opt/SCAPE604/config/aprisensor-type.cfg

echo "install-aprisensor-type restart SCAPE604-apri-sensor-raspi-v2"
systemctl restart SCAPE604-apri-sensor-raspi-v2

echo "install-aprisensor-type-scd30.sh end"
