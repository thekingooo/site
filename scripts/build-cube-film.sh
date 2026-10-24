#!/usr/bin/env bash
set -euo pipefail
if [ "$#" -ne 2 ]; then
  echo 'Usage: bash scripts/build-cube-film.sh /path/to/cafe.mp4 /path/to/office.mp4' >&2
  exit 1
fi
# Inputs are the original 1280x864 cafe and 1280x960 office films at 30 fps.
# Run from the repository root. No audio is carried into the web asset.
mkdir -p public/video/spaces public/images/spaces
ffmpeg -v error -i "$1" -i "$2" \
  -filter_complex '[0:v]pad=1280:960:0:48:color=0x141616,setsar=1,trim=end=3.35,setpts=PTS-STARTPTS,fps=30,settb=1/30[a];[1:v]trim=start=3,setpts=PTS-STARTPTS,setsar=1,fps=30,settb=1/30[b];[a][b]xfade=transition=diagbr:duration=0.35:offset=3,format=yuv420p[out]' \
  -map '[out]' -an -c:v libx264 -preset slow -crf 21 -g 1 -keyint_min 1 \
  -sc_threshold 0 -movflags +faststart -y public/video/spaces/cafe-to-office.mp4
ffmpeg -v error -i public/video/spaces/cafe-to-office.mp4 -frames:v 1 -q:v 2 -y public/images/spaces/cafe.jpg
ffmpeg -v error -ss 5.3 -i public/video/spaces/cafe-to-office.mp4 -frames:v 1 -q:v 2 -y public/images/spaces/office.jpg
