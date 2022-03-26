
# upgrade steps sensorkits between 01-01-2021 and 20-02-2021
# execute as su

mkdir -p /opt/SCAPE604/git ; rm -r /opt/SCAPE604/git/apri-sensor
cd /opt/SCAPE604/git ; git clone --depth 1 https://github.com/openiod/apri-sensor.git

/opt/SCAPE604/git/apri-sensor/install/git2as.sh

#cp /opt/SCAPE604/git/apri-sensor/apri-agent/apri-sensor-update.sh /opt/SCAPE604/apri-sensor/apri-agent/.

#rm -r /opt/SCAPE604/aprisensor-netmanager-runtime-stable
#cp -r /opt/SCAPE604/apri-sensor/aprisensor-netmanager-runtime /opt/SCAPE604/aprisensor-netmanager-runtime-stable

#rm -r /opt/SCAPE604/aprisensor-nmcli-stable
#cp -r /opt/SCAPE604/apri-sensor/aprisensor-nmcli /opt/SCAPE604/aprisensor-nmcli-stable
#cd /opt/SCAPE604/aprisensor-nmcli-stable

#npm install http-terminator
#systemctl restart SCAPE604-aprisensor-nmcli.service
