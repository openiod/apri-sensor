# 2.4.0
# nieuwe apri-agent (zonder http & minder logging ; diverse aanpassingen)
# bij upgrade:
cd /opt/SCAPE604/git/apri-sensor ; sudo git pull
sudo cp -r /opt/SCAPE604/git/apri-sensor/apri-agent /opt/SCAPE604/apri-sensor/.
sudo cp -r /opt/SCAPE604/git/apri-sensor/apri-config /opt/SCAPE604/apri-sensor/.
sudo cp /opt/SCAPE604/git/apri-sensor/apri-sensor-redis/apri-sensor-redis.sh /opt/SCAPE604/apri-sensor/apri-sensor-redis/.
# redis opschonen gaat nu automatisch (maxmemory&allkeys-lru) daarom het opschonen in apri-sensor-redis.sh gedeactiveerd
# bug in apri-sensor-redis.sh (bin/sh -> bin/bash) & dubbele start redis.js verwijderd
# reduced logging (websocket) in apri-sensor-connector*.js
# automatisch geplaatst na git update en install/git2as.sh

# 2.3.2 logrotate daily: 
sudo sed -i 's/weekly/daily/g' /etc/logrotate.conf
sudo sed -i 's/rotate 4/rotate 1/g' /etc/logrotate.conf
#  - daily
#  - rotate 1

#  Redis: sudo vi /etc/redis/redis.conf  of 
#  - maxmemory 50mb
#  - maxmemory-policy allkeys-lru
#  - maxmemory-samples 5
#  - syslog-enabled yes 
#  - syslog-ident redis
# of
sudo sed -i 's/^# maxmemory <bytes>/maxmemory 50mb/g' /etc/redis/redis.conf ; 
sudo sed -i 's/^# maxmemory-policy noeviction/maxmemory-policy allkeys-lru/g' /etc/redis/redis.conf ; 
sudo sed -i 's/^# maxmemory-samples 5/maxmemory-samples 5/g' /etc/redis/redis.conf ;  
sudo sed -i 's/^# syslog-enabled no/syslog-enabled yes/g' /etc/redis/redis.conf ;  
sudo sed -i 's/^# syslog-ident redis/syslog-ident redis/g' /etc/redis/redis.conf ;
sudo sed -i 's/weekly/daily/g' /etc/logrotate.d/redis-server ;
sudo sed -i 's/rotate 12/rotate 0/g' /etc/logrotate.d/redis-server ;

# systemctl restart redis

# 2.3.1
- connector axios timeout 4 -> 15 sec
- redis sort limit 60 -> 1000
- CO2 sensor in raspi-v2
# 2.3.0
- node version 16 ! 
- Redis version 6 !
- sveltekit 1
- new aprisensor-netmanager(-runtime-v2). Now node service (not html webservice via nginx)
- new apri-sensor-raspi-v2, apri-sensor-connector-v2, apri-sensor-redis-v2 with Redis v6
- nginx removed, no more webservices (aprisensor-netmanager-runtime-v2=node service)# 2.3.? 
- crontab update for redis cleanup & connector*log:
    vi /etc/cron.d/apri-sensor-redis
    PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
    */15 * * * * root /opt/SCAPE604/apri-sensor/apri-sensor-redis/apri-sensor-redis.sh > /dev/null 2>&1
- Pi3 nog op oude Redis versie
- Pi3 nog op oude socketio versie
- Pi3 remove wpa_supplicant.conf (gedaan op 2-2-3-pi3)
- Pi3 disable SCAPE604-aprisensor-nmcli (default)  (gedaan op 2-2-3-pi3)
- Pi3 printf '[logging ...' etc  (gedaan op 2-2-3-pi3)
- Pi3 cp ... install/avahi/avahi-daemon.conf ... etc  (gedaan op 2-2-3-pi3)
- Pi3 ATMega via raspi  (gedaan op 2-2-3-pi3)
- Pi3 aanpassen package.json versienrs (let op Redis en socketio) (gedaan op 2-2-3-pi3)
- Pi3 sudo npm install winston-daily-rotate-file winston (gedaan op 2-2-3-pi3)

- printf '[logging]\ndomains=ALL:WARN\n' > /etc/NetworkManager/conf.d/aprisensor.conf ; systemctl restart NetworkManager

# 2.2.1 - rm /var/hdd.log/* /var/log/* /var/hdd.log/* /var/log/hdd.log/aprisensor/*
#         as last step preparingfresh SD-card
# 2.2.0 - sockect removed from apri-sensor-raspi
#         device type changes for aprisensor-type-standard (pmsa003/bme280/ds18b20)
#         in apri-sensor-raspi
# 2.1.9 - introduced nmcli device wifi rescan - before wifi list
# 2.1.7 - workaround cleanup log in redis.sh (crontab 15 minutes)
# 2.1.7 - introduced winston as log manager (not all processes)
#         depends on available package (not for older images)

# prepare sd-card as replacement SD-card
Balena Etcher img-> sdcard
start Pi zero with sd-card
ssh pi@<id>.local
cd /opt/SCAPE604/git/apri-sensor
sudo git pull
sudo ./install/git2as.sh
sudo /opt/SCAPE604/apri-sensor/apri-agent/apri-sensor-update.sh
sudo systemctl stop SCAPE604-apri-sensor-raspi
sudo systemctl stop SCAPE604-apri-sensor-connector
sudo systemctl stop SCAPE604-aprisensor-nmcli
redis-cli flushdb
sudo rm /opt/SCAPE604/log/*
sudo rm /var/log/aprisensor/*
sudo rm /var/log/*
sudo rm /var/hdd.log/*
sudo rm /var/hdd.log/aprisensor/*
on pi with  connected keyboard / monitor:
nmcli c s
sudo nmcli c delete .. alle connections deleten, hotspot als laatste
sudo shutdown -h now
# dan sd-kaart verwijderen en kopie maken met nieuw versienummer

# start script onder sudo su -

# preparations for building new image
# assuming: latest software installed and package.json in place
# start met sd-kaart op pi zero met directe aansluiting (keyboard/monitor)
 
sudo systemctl stop SCAPE604-apri-sensor-raspi
sudo systemctl stop SCAPE604-apri-sensor-connector
sudo systemctl stop SCAPE604-aprisensor-nmcli
of
sudo systemctl stop SCAPE604-apri-sensor-raspi-v2
sudo systemctl stop SCAPE604-apri-sensor-connector-v2
sudo systemctl stop SCAPE604-aprisensor-nmcli
redis-cli flushdb
sudo rm /var/log/aprisensor/*
sudo rm /var/log/*
sudo rm /var/hdd.log/*
sudo rm /var/hdd.log/aprisensor/*
nmcli c s
sudo nmcli c delete .. alle connections deleten, hotspot als laatste
``````sudo nmcli c delete ap-24 ; sudo shutdown -h now``````
# dan sd-kaart verwijderen en kopie maken met nieuw versienummer

# prepare tested sensorkit for sending to client:
# ssh pi <id>.local
sudo systemctl stop SCAPE604-apri-sensor-raspi-v2
sudo systemctl stop SCAPE604-apri-sensor-connector-v2
sudo systemctl stop SCAPE604-aprisensor-nmcli
of
sudo systemctl stop SCAPE604-apri-sensor-raspi
sudo systemctl stop SCAPE604-apri-sensor-connector
sudo systemctl stop SCAPE604-aprisensor-nmcli

sudo rm /var/log/aprisensor/*
sudo rm /var/log/*
sudo rm /var/hdd.log/aprisensor/*
sudo rm  /var/hdd.log/*
#sudo mkdir /var/log/nginx /var/hdd.log/nginx
#sudo mkdir /var/log/redis /var/hdd.log/redis
#sudo chown -R redis:redis /var/log/redis /var/hdd.log/redis
#sudo systemctl start SCAPE604-aprisensor-nmcli
sudo nmcli c s
sudo nmcli c delete <hier alles wat nog aanwezig is behalve connected router>
sudo nmcli c delete <connected router> ; sudo shutdown -h now
# dit niet als hiervoor al shutdown is gedaan: daarna via mobiel (als accesspoint) shutdown uitvoeren
# foto maken
# inpakken
# postnl pakket
# versturen

# prepare duplicate of sd-card with new image:
# Balena Etcher img-> sdcard
# start Pi with sd-card
# ssh pi@<id>.local
# cd /opt/SCAPE604/git/apri-sensor
# sudo git pull
# ./install/git2as.sh
# /opt/SCAPE604/apri-sensor/apri-agent/apri-sensor-update.sh

# prepare sdcard on Debian laptop for initial install OS:
# Copy raspbian Butcher Lite img to sdcard with BalenaEtcher
# sudo touch /media/awiel/boot/ssh
# unmount sdcard from within debian Places
# start Raspberry Pi with ethernet usb adapter
# ssh to pi@ipaddress
# sudo apt update
# sudo apt upgrade
# vanaf hier alle installatie stappen voor software doorlopen

### ===== upgrade to V2-20210726 or later
# sudo mkdir -p /opt/SCAPE604/git
# sudo rm -r /opt/SCAPE604/git/apri-sensor  # remove old version if exists
# cd /opt/SCAPE604/git ; sudo git clone --depth 1 https://github.com/openiod/apri-sensor.git
# sudo /opt/SCAPE604/git/apri-sensor/install/git2as.sh
### ===== end upgrade proc

#### kopieer SD-kaart naar image bestand
! verwijder eerst de nmcli connections
! en leegmaken /var/log /var/log/aprisensor 
# plaats sd-kaart met nieuwe versie in usb-adapter
#===== e2fsck (controle of fs ok is)
# df -h  # show devices
# umount /dev/sda1 /dev/sda2
# sudo e2fsck /dev/sda2  (rootfs=clean is ok)
# sudo e2fsck -c /dev/sda2 (duurt 15 minuten voor 32GB)
#### ======
# make truncated img (copy) of sdcard on Debian:
# df -h  # (partitions: /dev/sda1 /dev/sda2 ; device /dev/sda)
# sudo umount /dev/sda1 /dev/sda2
# #eenmalig:sudo apt-get update && sudo apt-get install dcfldd
# controleer filesystem: sudo e2fsck /dev/sda2
# cd ~/opt/raspberrypi_image
# mv apri* old-images/.
# sudo dcfldd if=/dev/sda of=aprisensor_v2-3-x.img ; sudo sync
# sudo sync
# sudo chown awiel:awiel aprisensor_v2-3-x.img
# shrink img:
# # eenmalig: sudo apt-get update && sudo apt-get install gparted
# sudo fdisk -l aprisensor_v2-3-x.img
# startsector of partition2 = 532480
# mount the second partition
# #sudo losetup /dev/loop10 aprisensor_####.img -o $((<STARTSECTOR>*512))
# sudo losetup /dev/loop10 aprisensor_v2-2-x.img -o $((532480*512))
# sudo gparted /dev/loop10
# # select partion en menu: Partition / Resize/Move
# # change New size to 3900 (minimum size + +-20MB) #of 3500 voor standaard voldoende ruimte!!
# click 'resize'-button
# Menu: Edit / Apply All Operations
#  Noteer the new size!
#   see log details shrink file system / resize2fs -p 3993600K (3584000K of 3072000K of 2488320K of 3584000K)
# close and quit gparted
# reset loop device to total img:
# sudo losetup -d /dev/loop10
# sudo losetup /dev/loop10 aprisensor_v2-3-x.img
# sudo fdisk /dev/loop10
# p<enter> for partion info
# d<enter>2<enter> delete partition 2
# create new partion 2 with partion start address
# do not forget the '+'
# ##n<enter>p<enter>2<enter>532480<enter>+2488320K<enter>
# n<enter>p<enter>2<enter>532480<enter>+3993600K<enter>
# remove signature? N(o)
#? w<enter>  write partion tabel
# show loop device and delete it:
# sudo fdisk -l /dev/loop10
# sudo losetup -d /dev/loop10
# truncate file to ENDsector of 2e partition:
# #truncate -s $(((END+1)*512)) aprisensor_v2-1-5.img
# ###truncate -s $(((4976640+1)*512)) aprisensor_v2-1-5.img
# ###truncate -s $(((7700479+1)*512)) aprisensor_v2-2-x.img
# truncate -s $(((8519679+1)*512)) aprisensor_v2-3-x.img
# mv aprisensor_v2-3-x.img aprisensor_v2-3-0.img
#
# see http://www.aoakley.com/articles/2015-10-09-resizing-sd-images.php
#-----------------------------------------------
# verplaats img daarna naar proxy2 (best met netwerkkabel aangesloten)
# scp aprisensor_v2-2-x.img proxy2:.
# op proxy2: mv ~/aprisensor_v2-2-x.img /var/www/img.aprisensor.nl/public/img
# wordpress webpagina aanpassen voor nieuwe versie

# after first boot of Raspberry Pi:

Dit is nog een keer uit te proberen:
dtoverlay=i2c-gpio,bus=4,i2c_gpio_delay_us=1,i2c_gpio_sda=23,i2c_gpio_scl=24
This line will create an aditional i2c bus (bus 4) on GPIO 23 as SDA and GPIO 24 as SCL (GPIO 23 and 24 is defaults)
eventueel meerdere: volgorde moet dan van hoog naar laag zijn (eerst bus 4 dan 3) en niet lager dan 3
dtoverlay=i2c-gpio,bus=3,i2c_gpio_delay_us=1,i2c_gpio_sda=17,i2c_gpio_scl=27
sudo i2cdetect -y 3 (voor bus 3 in dit voorbeeld)
zie ook /sys/devices/platform/soc/*i2c
of check het signaal met de oscilloscoop

# /boot/config.txt --> dtoverlay=i2c-gpio,bus=3  (software i2c on gpio 23 sda 24 scl)
# /boot/config.txt --> dtoverlay=disable-bt (serial wordt dan ttyAMA0 ipv ttyS0, is beter)
# deze mag weg voor ApriSensorSK2 sudo rm /opt/SCAPE604/log/*.log
# ApriSensorSK2-> sudo rm /var/log/aprisensor/*.log
# sudo raspi-config --expand-rootfs
# sudo reboot
# check ID: cat /proc/cpuinfo | grep Serial | cut -d ' ' -f 2
#### dit niet meer nodig, gaat automatisch:
#### vi /etc/hosts:
#### eerste regel: 127.0.0.1       localhost #### ####.local
#### dit niet: laatste regel: 127.0.1.1		ID## ID##.local
#### dit gaat automatisch bij starten: sudo nmcli general hostname ID##.local
#### hoeft niet meer: wijzig de Redis configuratie
# update na connect met internet de apri-sensor software
# cd /opt/SCAPE604/git/apri-sensor
# sudo git status
# sudo git pull

# sudo raspi-config
# advanced split-memory 0-> GPU

# ID:
cat /proc/cpuinfo | grep Serial | cut -d ' ' -f 2

apt update -y
apt upgrade -y
apt autoremove -y
sudo reboot

apt -y install network-manager
#systemctl start NetworkManager.service
systemctl enable NetworkManager.service

sudo vi /etc/systemd/journald.conf
SystemMaxUse=10M

# for Raspberry Pi 3: ivm conflict network-manager en nmcli c up 'hotspot'
# ook voor Pi Zero met node 16+ ????
apt purge openresolv dhcpcd5

# log2ram https://github.com/azlux/log2ram
Buster:
echo "deb http://packages.azlux.fr/debian/ buster main" | sudo tee /etc/apt/sources.list.d/azlux.list
wget -qO - https://azlux.fr/repo.gpg.key | sudo apt-key add -
Bullseye:
echo "deb [signed-by=/usr/share/keyrings/azlux-archive-keyring.gpg] http://packages.azlux.fr/debian/ bullseye main" | sudo tee /etc/apt/sources.list.d/azlux.list
sudo wget -O /usr/share/keyrings/azlux-archive-keyring.gpg  https://azlux.fr/repo.gpg
sudo apt update
sudo apt install log2ram
# wijzig /etc/log2ram.conf
# SIZE=60M
# deze vervalt voor ApriSensorSK2-> PATH='/var/log;/opt/SCAPE604/log'
# PATH='/var/log'

#vi /etc/hosts:
# laatste regel: 127.0.1.1		ID## ID##.local
# eg 127.0.1.1     41BD  41BD.local
# nmcli general hostname ID##.local

# voor upgrade oudere installaties
#systemctl stop comitup
#systemctl disable comitup
#apt -y remove comitup

#avahi, redis, nginx
sudo apt -y install avahi-utils
#see install/avahi/avahi-deamon.conf
sudo apt -y install redis-server

#todo
## Edit the Redis configuration file to setup caching.
#sudo vi /etc/redis/redis.conf
#-->
#stop-writes-on-bgsave-error no
#maxmemory 50M
#maxmemory-policy allkeys-lru
#maxmemory-samples 5
#syslog-enabled yes 
#syslog-ident redis
#--<
#sudo vi /etc/sysctl.conf
#--> vm.overcommit_memory = 1
#!! # WARNING: The TCP backlog setting of 511 cannot be enforced because /proc/sys/net/core/somaxconn is set to the lower value of 128.
#sudo vi /etc/logrotate.d/redis-server 
#  sed -i 's/weekly/daily/g' /etc/logrotate.d/redis-server ;
#  sed -i 's/rotate 12/rotate 0/g' /etc/logrotate.d/redis-server ;
#<--
apt install git -y
apt -y install nginx

#reinstall node/npm:
#sudo apt remove nodered -y
#sudo apt remove node nodejs nodejs-legacy -y
#sudo apt remove npm -y
#sudo apt remove --purge node
#sudo rm -rf /root/.node-gyp
#sudo rm /usr/local/bin/node  #remove old version (10.x)
#sudo npm install -g npm
## for Raspberry Pi 3:
#| curl -sL http://deb.nodesource.com/setup_14.x | sudo bash -
#| #curl -sL http://deb.nodesource.com/setup_14.x | sudo bash -
#| sudo apt-get install -y nodejs
#| sudo apt autoremove

# for Raspberry Pi Zero:
#curl -sL https://deb.nodesource.com/setup_17.x | sudo -E bash -
curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
sudo apt install -y nodejs

# for Raspberry Pi 3:
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install nodejs

# for Raspberry Pi Zero W:
sudo mkdir /opt/nodejs
cd /opt/nodejs
wget https://nodejs.org/dist/v10.24.1/node-v10.24.1-linux-armv6l.tar.gz
tar -C /usr/local --strip-components 1 -xzf node-v10.24.1-linux-armv6l.tar.gz

# niet echt noodzakelijk
# npm install -g npm

node -v
npm -v

#PMSA003:
# disable bluetooth:
systemctl stop hciuart
systemctl disable hciuart
systemctl status hciuart
usermod -a -G dialout pi

###npm install -g degit

sudo mkdir -p /var/log/aprisensor
# de volgende kan weg in ApriSensorSK2 (sensorkit versie 2 / 2022)
#mkdir -p /opt/SCAPE604/log
sudo mkdir -p /opt/SCAPE604/config/
sudo mkdir /opt/SCAPE604/git
sudo mkdir /opt/SCAPE604/apri-sensor/
sudo mkdir /opt/SCAPE604/apri-sensor/apri-config
cd /opt/SCAPE604/git
sudo git clone --depth 1 https://github.com/openiod/apri-sensor.git
cd /opt/SCAPE604/git/apri-sensor
sudo git config pull.rebase false (eenmalige 'default' actie, nog uitzoek waarvoor)
# voor Pi Zero:
sudo /opt/SCAPE604/git/apri-sensor/install/git2as.sh
#bij upgrade kan deze rm nog wel eens een blokkade voorkomen
#rm package-lock.json
#git pull
sudo cp -r /opt/SCAPE604/git/apri-sensor/apri-agent /opt/SCAPE604/apri-sensor/.
sudo cp apri-config/apri-system-example.json /opt/SCAPE604/config/apri-system.json
sudo cp package.json /opt/SCAPE604/apri-sensor/.
#onderstaande onder root uitvoeren (sudo is niet voldoende)
sudo su -
cd /opt/SCAPE604/apri-sensor
npm install
exit  # exit root
sudo cp /opt/SCAPE604/git/apri-sensor/install/avahi/avahi-daemon.conf /etc/avahi/avahi-daemon.conf


## DEZE MOET ANDERS VOOR NIEUWE NETMANAGER (via nodejs service ipv html webservice via nginx )
## # eenmalig, als runtime stable is
## sudo rm -r /opt/SCAPE604/aprisensor-netmanager-runtime-stable
## sudo cp -r /opt/SCAPE604/apri-sensor/aprisensor-netmanager-runtime /opt/SCAPE604/aprisensor-netmanager-runtime-stable
## sudo cp /opt/SCAPE604/git/apri-sensor/install/aprisensor-netmanager/aprisensor-netmanager-nginx-site-default.conf /etc/nginx/sites-available/default
## #ln -s /etc/nginx/sites-available/default /etc/nginx/sites-enabled/
## #sudo vi /etc/nginx/sites-available/default
## #sudo nginx -t

sudo rm -r /opt/SCAPE604/aprisensor-nmcli-stable
sudo cp -r /opt/SCAPE604/git/apri-sensor/aprisensor-nmcli /opt/SCAPE604/aprisensor-nmcli-stable
cd /opt/SCAPE604/aprisensor-nmcli-stable
sudo npm install http-terminator

sudo service nginx restart

#Voor opschonen Redis archive set and wifi check:
sudo crontab -e
#-->
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

# cleanup redis archive
*/15 * * * * /opt/SCAPE604/apri-sensor/apri-sensor-redis/apri-sensor-redis.sh
<--

sudo cp /opt/SCAPE604/git/apri-sensor/apri-config/SCAPE604-apri-agent.service.org /etc/systemd/system/SCAPE604-apri-agent.service
sudo systemctl enable SCAPE604-apri-agent.service
#systemctl start SCAPE604-apri-agent.service

sudo cp /opt/SCAPE604/git/apri-sensor/apri-config/SCAPE604-aprisensor-nmcli.service.org /etc/systemd/system/SCAPE604-aprisensor-nmcli.service
sudo systemctl enable SCAPE604-aprisensor-nmcli.service
#systemctl start SCAPE604-aprisensor-nmcli.service
# depending on hardware swicth (HW-switch) disable one of these services
sudo cp /opt/SCAPE604/git/apri-sensor/apri-config/SCAPE604-aprisensor-nmcli-stable.service.org /etc/systemd/system/SCAPE604-aprisensor-nmcli-stable.service
#systemctl enable SCAPE604-aprisensor-nmcli-stable.service
#systemctl start SCAPE604-aprisensor-nmcli-stable.service

sudo cp /opt/SCAPE604/git/apri-sensor/apri-config/SCAPE604-apri-sensor-connector.service.org /etc/systemd/system/SCAPE604-apri-sensor-connector.service
sudo systemctl enable SCAPE604-apri-sensor-connector.service
#systemctl start SCAPE604-apri-sensor-connector.service

# volgende niet standaard voor raspberry pi 3/4
sudo cp /opt/SCAPE604/git/apri-sensor/apri-config/SCAPE604-apri-sensor-raspi.service.org /etc/systemd/system/SCAPE604-apri-sensor-raspi.service
sudo systemctl enable SCAPE604-apri-sensor-raspi.service
#systemctl start SCAPE604-apri-sensor-raspi.service

#sudo cp /opt/SCAPE604/git/apri-sensor/apri-config/SCAPE604-apri-sensor-tsi3007.service.org /etc/systemd/system/SCAPE604-apri-sensor-tsi3007.service
#sudo systemctl enable SCAPE604-apri-sensor-tsi3007.service
#sudo systemctl start SCAPE604-apri-sensor-tsi3007.service

#sudo mkdir /opt/SCAPE604/results/
#sudo cp /opt/SCAPE604/git/apri-sensor/apri-config/SCAPE604-apri-sensor-bam1020.service.org /etc/systemd/system/SCAPE604-apri-sensor-bam1020.service
#sudo systemctl enable SCAPE604-apri-sensor-bam1020.service
#sudo systemctl start SCAPE604-apri-sensor-bam1020.service

# for o.a. ATMega gekoppeld aan Pi3 (PMSA003/BME280) werkt via raspi!!

# when installed via eth0 this file will block nmcli from connecting to wifi
rm /etc/wpa_supplicant/wpa_supplicant.conf
cp /opt/SCAPE604/git/apri-sensor/install/interfaces.org /etc/network/interfaces

# make alias for usb devices:
!! Reconnect the usb-device to activate the alias of 
!! sudo udevadm trigger
!! voeg dialout toe aan /etc/group -> dialout:x:20:<username>  (usermod -a -G dialout <username>)

lsusb ; list usb-devices (after connecting a serial device)
->Bus 001 Device 021: ID 067b:2303 Prolific Technology, Inc. PL2303 Serial Port
ID vendor=067b
ID product=2303
(voorbeeld pico van solar: ID 2e8a:000a Raspberry Pi Pico -> vendor:2e8a product:000a)

lsusb -t ;
of device via ls -l /dev/serial/by-id/.  (bij bam zo uitgevoerd)

sudo udevadm info /dev/ttyUSB0 ;
udevadm info -a -p  $(udevadm info -q path -n /dev/ttyUSB0)
ls -l /dev/serial/by-id/
-> usb-Prolific_Technology_Inc._USB-Serial_Controller_D-if00-port0 -> ../../ttyUSB0
sudo vi /etc/udev/rules.d/99-usb-serial.rules
-> 
# BAM1020 via usb poort bam is niet stabiel dus nu de serieel-usb adapter van de Dylos in gebruik: DC1700 / AJ03KNV9

#ACTION=="add", SUBSYSTEM=="tty", ATTRS{idVendor}=="10c4", ATTRS{idProduct}=="ea60", ATTRS{serial}=="0000:00:14.0", SYMLINK+="ttybam1020"
#ACTION=="add", SUBSYSTEM=="tty", ATTRS{idVendor}=="067b", ATTRS{idProduct}=="2303", ATTRS{serial}=="3f980000.usb", SYMLINK+="ttybam1020A"
#ACTION=="add", SUBSYSTEM=="tty", ATTRS{idVendor}=="067b", ATTRS{idProduct}=="2303", SYMLINK+="ttybam1020"

ACTION=="add", SUBSYSTEM=="tty", ATTRS{idVendor}=="1a86", ATTRS{idProduct}=="7523", SYMLINK+="ttyRadiationd", GROUP="plugdev"