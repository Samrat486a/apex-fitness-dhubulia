#!/usr/bin/env bash
# Copies the backend into XAMPP:  public/ → htdocs/apex/api/   app/ → xamppfiles/apex_app/
# (Run again after every backend change.)
set -euo pipefail
cd "$(dirname "$0")/.."
XAMPP=/Applications/XAMPP/xamppfiles
mkdir -p "$XAMPP/htdocs/apex/api" "$XAMPP/apex_app"
rsync -a --delete public/ "$XAMPP/htdocs/apex/api/"
rsync -a --exclude 'storage/logs/*' --exclude 'storage/sessions/*' app/ "$XAMPP/apex_app/"
chmod -R 777 "$XAMPP/apex_app/storage"
echo "✓ Backend synced. Check http://localhost/apex/api/"
