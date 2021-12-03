#!/bin/bash
INSTALL_DIR=/usr/share/mtgatool

rm -rf $INSTALL_DIR /usr/share/applications/mtgatool.desktop
sh /usr/share/mtga-tracker-daemon/uninstall.sh

echo "Done"