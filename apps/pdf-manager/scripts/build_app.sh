#!/bin/zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_DIR="$ROOT_DIR/dist/PDF Manager.app"
DMG_PATH="$ROOT_DIR/dist/PDF-Manager-1.0.0.dmg"

cd "$ROOT_DIR"
swift build -c release --product PDFManager

rm -rf "$APP_DIR"
mkdir -p "$APP_DIR/Contents/MacOS" "$APP_DIR/Contents/Resources"
cp ".build/release/PDFManager" "$APP_DIR/Contents/MacOS/PDFManager"
cp "Resources/Info.plist" "$APP_DIR/Contents/Info.plist"
chmod +x "$APP_DIR/Contents/MacOS/PDFManager"

codesign --force --deep --sign - "$APP_DIR"

rm -f "$DMG_PATH"
hdiutil create \
    -volname "PDF Manager" \
    -srcfolder "$APP_DIR" \
    -ov \
    -format UDZO \
    "$DMG_PATH"

codesign --verify --deep --strict --verbose=2 "$APP_DIR"
echo "Built: $APP_DIR"
echo "Installer: $DMG_PATH"
