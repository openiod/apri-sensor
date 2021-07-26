#
# script copies files from git/apri-sensor to apri-sensors

cd /opt/SCAPE604/git
# apri-agent only once
# cp -r apri-sensor/apri-agent ../apri-sensor/.
cp apri-sensor/apri-agent/apri-sensor-update.sh ../apri-sensor/apri-agent/.
# apri-config only once
# cp -r apri-sensor/apri-config ../apri-sensor/.

cp -r apri-sensor/apri-sensor-connector ../apri-sensor/.
cp -r apri-sensor/apri-sensor-raspi ../apri-sensor/.
cp -r apri-sensor/apri-sensor-redis ../apri-sensor/.
cp -r apri-sensor/aprisensor-netmanager-runtime ../apri-sensor/.
cp -r apri-sensor/aprisensor-nmcli ../apri-sensor/.
cp -r apri-sensor/images ../apri-sensor/.
