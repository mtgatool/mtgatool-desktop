#!/bin/bash
INSTALL_DIR=/usr/share/mtgatool

mkdir $INSTALL_DIR
cp *.AppImage start.sh mtgatool.png uninstall.sh $INSTALL_DIR
cp mtgatool.desktop /usr/share/applications

cd mtga-tracker-daemon
sh install.sh
cd ..

echo "Installation complete"