#!/bin/bash
INSTALL_DIR=/usr/share/mtgatool

mkdir $INSTALL_DIR
cp *.AppImage start.sh mtgatool.png uninstall.sh $INSTALL_DIR
cp mtgatool.desktop /usr/share/applications

echo "Installation complete"