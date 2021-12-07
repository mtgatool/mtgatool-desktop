#!/bin/bash
INSTALL_PATH=/usr/share/mtga-tracker-daemon
if [ -f "$INSTALL_PATH" ]; then
    echo "$INSTALL_PATH already exist, daemon cannot be installed."
else
    cp -R bin $INSTALL_PATH
    cp uninstall.sh $INSTALL_PATH
    
    SERVICE_NAME=mtga-trackerd.service

    cp $SERVICE_NAME /etc/systemd/system
    systemctl daemon-reload
    sudo systemctl start $SERVICE_NAME
    sudo systemctl enable $SERVICE_NAME

    echo "Daemon installed successfuly"
fi