#!/bin/bash
if [ -z "$1" ]; then
    echo "wher da zip lmao"
    exit 1
fi

CWD=$(pwd)
PATH_TO_ZIP="$CWD/$1"
DIRNAME="/tmp/animap-frames-$(openssl rand -hex 4)"

mkdir $DIRNAME
unzip -q "$PATH_TO_ZIP" -d "$DIRNAME"
FORMAT=$(ls $DIRNAME | head -n 1 | sed "s/^.*\.//")

# luv u gpt
cd $DIRNAME
ffmpeg -framerate 60 -start_number 0 -i frame_%04d.$FORMAT -c:v libx264 -pix_fmt yuv420p $CWD/output.mp4
cd ..
rm -rfd $DIRNAME

echo "exported to output.mp4"
