#!/bin/bash

SERVICE_NAME=mtga-trackerd.service

sudo systemctl stop $SERVICE_NAME
sudo systemctl disable $SERVICE_NAME

rm -rf /usr/share/mtga-tracker-daemon
rm /etc/systemd/system/$SERVICE_NAME

systemctl daemon-reload