#
# script copies files from git/apri-sensor to apri-sensors

# apri-agent only once
# cp -r /opt/SCAPE604/git/apri-sensor/apri-agent /opt/SCAPE604/apri-sensor/.
cp /opt/SCAPE604/git/apri-sensor/apri-agent/apri-sensor-update.sh /opt/SCAPE604/apri-sensor/apri-agent/.
# apri-config only once
# cp -r /opt/SCAPE604/git/apri-sensor/apri-config /opt/SCAPE604/apri-sensor/.

cp -r /opt/SCAPE604/git/apri-sensor/package.json /opt/SCAPE604/apri-sensor/.
cp -r /opt/SCAPE604/git/apri-sensor/apri-sensor-connector /opt/SCAPE604/apri-sensor/.
cp -r /opt/SCAPE604/git/apri-sensor/apri-sensor-raspi /opt/SCAPE604/apri-sensor/.
cp -r /opt/SCAPE604/git/apri-sensor/apri-sensor-redis /opt/SCAPE604/apri-sensor/.
cp -r /opt/SCAPE604/git/apri-sensor/aprisensor-netmanager-runtime /opt/SCAPE604/apri-sensor/.
cp -r /opt/SCAPE604/git/apri-sensor/aprisensor-nmcli /opt/SCAPE604/apri-sensor/.
cp -r /opt/SCAPE604/git/apri-sensor/images /opt/SCAPE604/apri-sensor/.

sudo systemctl restart SCAPE604-aprisensor-nmcli
