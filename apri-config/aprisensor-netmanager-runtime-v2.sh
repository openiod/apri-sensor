#!/bin/sh

#cd `dirname $0`
cd /opt/SCAPE604/aprisensor-netmanager-runtime-v2/build
PORT=80 node index.js >>$1 2>>$1
exit -1
