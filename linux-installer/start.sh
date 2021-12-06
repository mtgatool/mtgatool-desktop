#!/usr/bin/env bash
LAST_VERSION=$(ls mtgatool-desktop-* | sort -t. -k 1,1n -k 2,2n -k 3,3n -k 4,4n | tail --lines=1)
./$LAST_VERSION

