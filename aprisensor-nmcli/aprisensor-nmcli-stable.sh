#!/bin/sh

#cd `dirname $0`
cd /opt/SCAPE604/aprisensor-nmcli-stable/aprisensor-nmcli.js
node aprisensor-nmcli-stable.js 3999 >>$1 2>>$1
exit -1
