#
# start script onder sudo su -

# prepare sdccard on Debian laptop:
# Copy raspbian Butcher Lite img to sdcard with BalenaEtcher
# sudo touch /media/awiel/boot/ssh
# unmount sdcard from within debian Places
# start Raspberry Pi with ethernet usb adapter
# ssh to pi@ipaddress

### ===== upgrade to V2-20210726 or later
# mkdir -p /opt/SCAPE604/git
# rm -r /opt/SCAPE604/git/apri-sensor  # remove old version if exists
# cd /opt/SCAPE604/git ; npx degit openiod/apri-sensor
# sudo /opt/SCAPE604/git/apri-sensor/install/git2as.sh
### ===== end upgrade proc

#### ===== e2fsck
# df -h  # show devices
# umount /dev/sda1 /dev/sda2
# e2fsck /dev/sda2
# e2fsck -c /dev/sda2
#### ======

# make truncated img (copy) of sdcard on Debian:
# df -h  # (partitions: /dev/sda1 /dev/sda2 ; device /dev/sda)
# sudo umount /dev/sda1 /dev/sda2
# #eenmalig:sudo apt-get update && sudo apt-get install dcfldd
# controleer filesystem: e2fsck /dev/sda2
# sudo dcfldd if=/dev/sda of=aprisensor_v2-0-2.img ; sudo sync
# sudo sync
# sudo chown awiel.awiel aprisensor_####.img
# shrink img:
# # eenmalig: sudo apt-get update && sudo apt-get install gparted
# sudo fdisk -l aprisensor_####.img
# startsector of partition2 = 532480
# mount the second partition
# #sudo losetup /dev/loop0 aprisensor_####.img -o $((<STARTSECTOR>*512))
# sudo losetup /dev/loop0 aprisensor_####.img -o $((532480*512))
# sudo gparted /dev/loop0
# # select partion en menu: Partition / Resize/Move
# # change minimum size to 2430 (minimum size + +-20MB)
# click 'resize'-button
# Menu: Edit / Apply All Operations
#  Noteer the new size!
#   see log details shrink file system / resize2fs -p ... (2488320K)
# close gparted
# reset loop device to total img:
# sudo losetup -d /dev/loop0
# sudo losetup /dev/loop0 imagename.img
# sudo fdisk /dev/loop0
# p<enter> for partiion info
# d<enter>2<enter> delete partition 2
# create new partion 2 with partion start address
# do not forget the '+'
# n<enter>p<enter>2<enter>532480<enter>+2488320K<enter>
# remove signature? N(o)
#? w<enter>  write partion tabel
# show loop device and delete it:
# sudo fdisk -l /dev/loop0
# sudo losetup -d /dev/loop0
# truncate file to endsector of 2e partition:
# truncate -s $(((END+1)*512)) imagename.img
# truncate -s $(((4976640+1)*512)) imagename.img
#
# see http://www.aoakley.com/articles/2015-10-09-resizing-sd-images.php
#-----------------------------------------------

# after first boot of Raspberry Pi:
# /boot/config.txt --> dtoverlay=i2c-gpio,bus=3  (software i2c on gpio 23 sda 24 scl)
# sudo rm /opt/SCAPE604/log/*.log
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

# ID:
cat /proc/cpuinfo | grep Serial | cut -d ' ' -f 2

apt update -y
apt upgrade -y
apt autoremove -y

apt -y install network-manager
#systemctl start NetworkManager.service
#systemctl enable NetworkManager.service


#vi /etc/hosts:
# laatste regel: 127.0.1.1		ID## ID##.local
# nmcli general hostname ID##.local

# voor upgrade oudere installaties
#systemctl stop comitup
#systemctl disable comitup
#apt -y remove comitup

#avahi, redis, nginx
apt -y install avahi-utils
#see install/avahi/avahi-deamon.conf
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

apt install git -y
apt -y install nginx

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

npm install -g degit

mkdir -p /opt/SCAPE604/log
mkdir /opt/SCAPE604/config/
mkdir /opt/SCAPE604/git/
mkdir /opt/SCAPE604/apri-sensor/
cd /opt/SCAPE604/git
npx degit openiod/apri-sensor apri-sensor
# git clone https://github.com/openiod/apri-sensor.git
/opt/SCAPE604/apri-sensor/install/git2as.sh
cd /opt/SCAPE604/apri-sensor/
#bij upgrade kan deze rm nog wel eens een blockade voorkomen
#rm package-lock.json
#git pull
cp apri-config/apri-system-example.json /opt/SCAPE604/config/apri-system.json
#onderstaande onder root uitvoeren (sudo is niet voldoende)
sudo su -
cd /opt/SCAPE604/apri-sensor
npm install
exit  # exit root
cp /opt/SCAPE604/git/apri-sensor/install/avahi/avahi-daemon.conf /etc/avahi/avahi-daemon.conf


# eenmalig, als runtime stable is
rm -r /opt/SCAPE604/aprisensor-netmanager-runtime-stable
cp -r /opt/SCAPE604/apri-sensor/aprisensor-netmanager-runtime /opt/SCAPE604/aprisensor-netmanager-runtime-stable
cp /opt/SCAPE604/git/apri-sensor/install/aprisensor-netmanager/aprisensor-netmanager-nginx-site-default.conf /etc/nginx/sites-available/default
#ln -s /etc/nginx/sites-available/default /etc/nginx/sites-enabled/
#sudo vi /etc/nginx/sites-available/default
#sudo nginx -t

rm -r /opt/SCAPE604/aprisensor-nmcli-stable
cp -r /opt/SCAPE604/git/apri-sensor/aprisensor-nmcli /opt/SCAPE604/aprisensor-nmcli-stable
cd /opt/SCAPE604/aprisensor-nmcli-stable
npm install http-terminator

service nginx restart

#Voor opschonen Redis archive set and wifi check:
sudo crontab -e
#-->
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

# cleanup redis archive
*/15 * * * * /opt/SCAPE604/apri-sensor/apri-sensor-redis/apri-sensor-redis.sh
<--

cp /opt/SCAPE604/apri-sensor/apri-config/SCAPE604-apri-agent.service.org /etc/systemd/system/SCAPE604-apri-agent.service
systemctl enable SCAPE604-apri-agent.service
#systemctl start SCAPE604-apri-agent.service

cp /opt/SCAPE604/apri-sensor/apri-config/SCAPE604-aprisensor-nmcli.service.org /etc/systemd/system/SCAPE604-aprisensor-nmcli.service
systemctl enable SCAPE604-aprisensor-nmcli.service
#systemctl start SCAPE604-aprisensor-nmcli.service
# depending on hardware swicth (HW-switch) disable one of these services
cp /opt/SCAPE604/apri-sensor/apri-config/SCAPE604-aprisensor-nmcli-stable.service.org /etc/systemd/system/SCAPE604-aprisensor-nmcli-stable.service
#systemctl enable SCAPE604-aprisensor-nmcli-stable.service
#systemctl start SCAPE604-aprisensor-nmcli-stable.service

cp /opt/SCAPE604/apri-sensor/apri-config/SCAPE604-apri-sensor-connector.service.org /etc/systemd/system/SCAPE604-apri-sensor-connector.service
systemctl enable SCAPE604-apri-sensor-connector.service
#systemctl start SCAPE604-apri-sensor-connector.service

cp /opt/SCAPE604/apri-sensor/apri-config/SCAPE604-apri-sensor-raspi.service.org /etc/systemd/system/SCAPE604-apri-sensor-raspi.service
systemctl enable SCAPE604-apri-sensor-raspi.service
#systemctl start SCAPE604-apri-sensor-raspi.service

#cp /opt/SCAPE604/apri-sensor/apri-config/SCAPE604-apri-sensor-tsi3007.service.org /etc/systemd/system/SCAPE604-apri-sensor-tsi3007.service
#systemctl enable SCAPE604-apri-sensor-tsi3007.service
#systemctl start SCAPE604-apri-sensor-tsi3007.service

# when installed via eth0 this file will block nmcli from connecting to wifi
rm /etc/wpa_supplicant/wpa_supplicant.conf
cp /opt/SCAPE604/git/apri-sensor/install/interfaces.org /etc/network/interfaces
