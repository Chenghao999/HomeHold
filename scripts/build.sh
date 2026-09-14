#!/usr/bin/env bash
#
# Builds an installable Firefox package (.xpi) from the extension sources.
#
# The version is read from manifest.json rather than duplicated here, so the
# artifact name always matches the version Firefox will report.

set -euo pipefail

cd "$(dirname "$0")/.."

WEB_EXT="./node_modules/.bin/web-ext"
if [ ! -x "$WEB_EXT" ]; then
  echo "web-ext is not installed. Run: npm install" >&2
  exit 1
fi

VERSION="$(node -p "require('./manifest.json').version")"
NAME="homehold-${VERSION}.xpi"

"$WEB_EXT" build --filename "$NAME"

echo
echo "Built: dist/${NAME}"
echo "Install: about:addons -> gear icon -> Install Add-on From File..."
