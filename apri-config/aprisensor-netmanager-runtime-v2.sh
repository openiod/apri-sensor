#!/bin/sh

#cd `dirname $0`
cd /opt/SCAPE604/aprisensor-netmanager-v2/build
PORT=8080 node index.js >>$1 2>>$1
exit -1
