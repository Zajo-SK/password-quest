#!/bin/sh
# Password Quest – spustenie na macOS / Linux: lokálny server a otvorenie v prehliadači.
cd "$(dirname "$0")" || exit 1
URL=http://localhost:8080
echo "Password Quest beží na $URL (ukončíš klávesmi Ctrl+C)"
( sleep 1; (command -v xdg-open >/dev/null && xdg-open "$URL") || (command -v open >/dev/null && open "$URL") ) >/dev/null 2>&1 &
exec python3 -m http.server 8080
