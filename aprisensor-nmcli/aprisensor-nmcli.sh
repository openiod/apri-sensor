#!/bin/sh

cd `dirname $0`
# clean up logfile and journal history
rm /var/log/aprisensor/SCAPE604-aprisensor-nmcli.log
journalctl --vacuum-time=30m 
node aprisensor-nmcli.js 4000 >>$1 2>>$1
exit -1
