#!/bin/bash

touch /var/log/aprisensor/monitor-wlan0.log
date >> /var/log/aprisensor/monitor-wlan0.log
nmcli device monitor wlan0 >> /var/log/aprisensor/monitor-wlan0.log &
