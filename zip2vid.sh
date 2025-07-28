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

OUT_NAME="output-$(ls -1p $CWD/renders | grep -v '/$' | grep '\.mp4$' | wc -l).mp4"

# luv u gpt
cd $DIRNAME
ffmpeg -framerate 60 -start_number 0 -i frame_%04d.$FORMAT -c:v libx264 -pix_fmt yuv420p $CWD/renders/$OUT_NAME
cd ..
rm -rfd $DIRNAME

echo "exported to renders/$OUT_NAME"
