#!/bin/bash
# prepare-photos.sh - Process photos for Christmas Tree project
# Uses macOS sips for EXIF rotation and resize

SOURCE_DIR="/Users/phamminhphuc/Projects/threejs/photos"
DEST_DIR="/Users/phamminhphuc/Projects/threejs/src/christmas-tree/images"

# Create destination if not exists
mkdir -p "$DEST_DIR"

# Clear existing processed photos
rm -f "$DEST_DIR"/photo*.jpg 2>/dev/null

counter=1
for img in "$SOURCE_DIR"/*.{jpg,JPG,jpeg,JPEG,png,PNG}; do
  [ -f "$img" ] || continue

  output="$DEST_DIR/photo${counter}.jpg"

  # sips: -s format jpeg, -s formatOptions quality, -Z max dimension
  # Note: sips auto-handles EXIF rotation on macOS
  sips -s format jpeg -s formatOptions 85 -Z 1000 "$img" --out "$output" 2>/dev/null

  if [ -f "$output" ]; then
    size=$(du -h "$output" | cut -f1)
    echo "Processed: $(basename "$img") -> photo${counter}.jpg ($size)"
    ((counter++))
  else
    echo "Failed: $(basename "$img")"
  fi
done

echo ""
echo "Done! Processed $((counter-1)) photos to $DEST_DIR"
