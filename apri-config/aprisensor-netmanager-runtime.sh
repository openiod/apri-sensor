#!/bin/sh

#cd `dirname $0`
cd /opt/SCAPE604/aprisensor-netmanager-runtime/
node index.js >>$1 2>>$1
exit -1
