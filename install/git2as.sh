#!/usr/bin/bash

# script copies files from git/apri-sensor to apri-sensors

echo "git2as.sh start"

if [ -d /opt/SCAPE604/git/apri-sensor ]
then
  echo "git2as.sh then /opt/SCAPE604/git/apri-sensor "
  # apri-agent only once
  # cp -r /opt/SCAPE604/git/apri-sensor/apri-agent /opt/SCAPE604/apri-sensor/.

  cp /opt/SCAPE604/git/apri-sensor/apri-agent/apri-sensor-update.sh /opt/SCAPE604/apri-sensor/apri-agent/.
  # apri-config only once
  # cp -r /opt/SCAPE604/git/apri-sensor/apri-config /opt/SCAPE604/apri-sensor/.

# package alleen bij eerste installatie, later kan dit alleen tot verstoring leiden (met voorzicht gebruiken)
#  cp -r /opt/SCAPE604/git/apri-sensor/package.json /opt/SCAPE604/apri-sensor/.
#  cp -r /opt/SCAPE604/git/apri-sensor/apri-config/aprisensor-types /opt/SCAPE604/apri-sensor/apri-config/.

  cp -r /opt/SCAPE604/git/apri-sensor/apri-sensor-connector /opt/SCAPE604/apri-sensor/.
  cp -r /opt/SCAPE604/git/apri-sensor/apri-sensor-raspi /opt/SCAPE604/apri-sensor/.
  cp -r /opt/SCAPE604/git/apri-sensor/apri-sensor-redis /opt/SCAPE604/apri-sensor/.
  cp -r /opt/SCAPE604/git/apri-sensor/aprisensor-nmcli /opt/SCAPE604/apri-sensor/.
  cp -r /opt/SCAPE604/git/apri-sensor/images /opt/SCAPE604/apri-sensor/.
  cp -r /opt/SCAPE604/git/apri-sensor/apri-config/aprisensor-types /opt/SCAPE604/apri-sensor/apri-config/aprisensor-types

  if [ -f /etc/systemd/system/SCAPE604-aprisensor-nmcli.service ]
  then
    echo "git2as restart SCAPE604-aprisensor-nmcli"
    systemctl restart SCAPE604-aprisensor-nmcli
  fi
  # sudo cp -r /opt/SCAPE604/git/apri-sensor/apri-sensor-bam1020 /opt/SCAPE604/apri-sensor/.
  # sudo cp /opt/SCAPE604/git/apri-sensor/apri-config/apri-config.js /opt/SCAPE604/apri-sensor/apri-config/.
  ## niet meer voor image versie > v2.3
  if [ -f /opt/SCAPE604/git/apri-sensor/aprisensor-netmanager-runtime ]
  then
    cp -r /opt/SCAPE604/git/apri-sensor/aprisensor-netmanager-runtime /opt/SCAPE604/apri-sensor/.
  fi
fi
echo "git2as files copied"
