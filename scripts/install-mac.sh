#!/bin/sh
# Copies the built app (from `npm run app:build`) into Applications and opens it.
# Run via: npm run app:install
set -e

APP_NAME="Numbers Don't Lie.app"
BUILT=$(find release -maxdepth 2 -name "$APP_NAME" -type d | head -n 1)

if [ -z "$BUILT" ]; then
  echo "Couldn't find the built app in release/. Run: npm run app:build" >&2
  exit 1
fi

# /Applications if we can write to it, otherwise the user's own Applications folder.
if [ -w /Applications ]; then DEST=/Applications; else DEST="$HOME/Applications"; mkdir -p "$DEST"; fi

rm -rf "$DEST/$APP_NAME"
cp -R "$BUILT" "$DEST/"
echo "Installed: $DEST/$APP_NAME"
echo "Tip: once it's open, right-click its Dock icon → Options → Keep in Dock."
open "$DEST/$APP_NAME"
