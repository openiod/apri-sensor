#!/bin/sh

#cd `dirname $0`
cd /opt/SCAPE604/aprisensor-nmcli-stable
node aprisensor-nmcli.js 3999 >>$1 2>>$1
exit -1
