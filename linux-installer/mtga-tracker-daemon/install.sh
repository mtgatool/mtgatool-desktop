#!/bin/bash
cp -R bin /usr/share/mtga-tracker-daemon

SERVICE_NAME=mtga-trackerd.service

cp $SERVICE_NAME /etc/systemd/system
systemctl daemon-reload
sudo systemctl start $SERVICE_NAME
sudo systemctl enable $SERVICE_NAME