#
# start script onder sudo su -

apt-get update -y
apt-get upgrade -y
apt-get autoremove -y

apt-get -y install network-manager
systemctl start NetworkManager.service
systemctl enable NetworkManager.service

#avahi:
apt-get install avahi-utils

#Install Redis:
apt -y install redis-server

#todo
## Edit the Redis configuration file to setup caching.
#sudo vi /etc/redis/redis.conf
#-->
#stop-writes-on-bgsave-error no
#??maxmemory 50M
#??maxmemory-policy allkeys-lru
#--<
#sudo vi /etc/sysctl.conf
#--> vm.overcommit_memory = 1
#!! # WARNING: The TCP backlog setting of 511 cannot be enforced because /proc/sys/net/core/somaxconn is set to the lower value of 128.

apt-get install git -y

#reinstall node/npm:
#sudo apt remove nodered -y
#sudo apt remove node nodejs nodejs-legacy -y
#sudo apt remove npm -y
#sudo apt remove --purge node
#sudo rm -rf /root/.node-gyp
## for Raspberry Pi 3:
#| curl -sL http://deb.nodesource.com/setup_10.x | sudo bash -
#| #curl -sL http://deb.nodesource.com/setup_12.x | sudo bash -
#| sudo apt-get install -y nodejs
#| sudo apt autoremove

# for Raspberry Pi Zero W:
mkdir /opt/nodejs
cd /opt/nodejs
wget https://nodejs.org/dist/v10.16.2/node-v10.16.2-linux-armv6l.tar.gz
tar -C /usr/local --strip-components 1 -xzf node-v10.16.2-linux-armv6l.tar.gz

node -v
npm -v

#PMSA003:
# disable bluetooth:
systemctl stop hciuart
systemctl disable hciuart
systemctl status hciuart
usermod -a -G dialout pi

mkdir -p /opt/SCAPE604/log
mkdir /opt/SCAPE604/config/
cd /opt/SCAPE604
git clone https://github.com/openiod/apri-sensor.git
cd /opt/SCAPE604/apri-sensor
cp apri-config/apri-system-example.json /opt/SCAPE604/config/apri-system.json
#sudo su -
cd /opt/SCAPE604/apri-sensor
npm install

cp /opt/SCAPE604/apri-sensor/install/avahi/avahi-daemon.conf /etc/avahi/avahi-daemon.conf

cd /opt/SCAPE604/apri-sensor/install

rm /opt/SCAPE604/aprisensor-netmanager-runtime-stable
cp -r /opt/SCAPE604/apri-sensor/aprisensor-netmanager-runtime /opt/SCAPE604/aprisensor-netmanager-runtime-stable

cp /opt/SCAPE604/apri-sensor/install/aprisensor-netmanager/aprisensor-netmanager-nginx-site-default.conf /etc/nginx/sites-available/default
ln -s /etc/nginx/sites-available/default /etc/nginx/sites-enabled/
#sudo vi /etc/nginx/sites-available/default
#sudo nginx -t





service nginx restart

cp /opt/SCAPE604/apri-sensor/apri-config/SCAPE604-apri-agent.service.org /etc/systemd/system/SCAPE604-apri-agent.service
systemctl enable SCAPE604-apri-agent.service
systemctl start SCAPE604-apri-agent.service

cp /opt/SCAPE604/apri-sensor/apri-config/SCAPE604-aprisensor-nmcli.service.org /etc/systemd/system/SCAPE604-aprisensor-nmcli.service
systemctl enable SCAPE604-aprisensor-nmcli.service
systemctl start SCAPE604-aprisensor-nmcli.service
cp /opt/SCAPE604/apri-sensor/apri-config/SCAPE604-aprisensor-nmcli-stable.service.org /etc/systemd/system/SCAPE604-aprisensor-nmcli-stable.service
systemctl enable SCAPE604-aprisensor-nmcli-stable.service
systemctl start SCAPE604-aprisensor-nmcli-stable.service

cp /opt/SCAPE604/apri-sensor/apri-config/SCAPE604-apri-sensor-connector.service.org /etc/systemd/system/SCAPE604-apri-sensor-connector.service
systemctl enable SCAPE604-apri-sensor-connector.service
systemctl start SCAPE604-apri-sensor-connector.service

cp /opt/SCAPE604/apri-sensor/apri-config/SCAPE604-apri-sensor-raspi.service.org /etc/systemd/system/SCAPE604-apri-sensor-raspi.service
systemctl enable SCAPE604-apri-sensor-raspi.service
systemctl start SCAPE604-apri-sensor-raspi.service

#cp /opt/SCAPE604/apri-sensor/apri-config/SCAPE604-apri-sensor-tsi3007.service.org /etc/systemd/system/SCAPE604-apri-sensor-tsi3007.service
#systemctl enable SCAPE604-apri-sensor-tsi3007.service
#systemctl start SCAPE604-apri-sensor-tsi3007.service
