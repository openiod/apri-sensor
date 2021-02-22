
# upgrade steps sensorkits between 01-01-2021 and 20-02-2021
# execute as su
cd /opt/SCAPE604/apri-sensor
git pull

rm -r /opt/SCAPE604/aprisensor-netmanager-runtime-stable
cp -r /opt/SCAPE604/apri-sensor/aprisensor-netmanager-runtime /opt/SCAPE604/aprisensor-netmanager-runtime-stable

rm -r /opt/SCAPE604/aprisensor-nmcli-stable
cp -r /opt/SCAPE604/apri-sensor/aprisensor-nmcli /opt/SCAPE604/aprisensor-nmcli-stable
cd /opt/SCAPE604/aprisensor-nmcli-stable
npm install http-terminator
