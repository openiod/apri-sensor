#!/bin/sh

cd `dirname $0`
node aprisensor-nmcli.js >>$1 2>>$1
exit -1
