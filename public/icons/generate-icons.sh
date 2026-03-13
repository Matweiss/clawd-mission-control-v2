#!/bin/bash
# Generate iOS app icons from SVG

SIZES=(72 96 128 144 152 192 384 512)

for size in "${SIZES[@]}"; do
  convert -background "#0a0a0a" -fill white -gravity center -pointsize $((size/3)) -font Arial label:"🦞" icon-${size}x${size}.png
done

echo "Icons generated!"
