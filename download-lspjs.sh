#!/usr/bin/env bash
set -eu
# Check if lspjs exists and if its a symlink then exit
if [ -L dist/lspjs ]; then
    echo "lspjs symlink exists, not downloading as you are most likely using a local version"
    exit 0
fi
mkdir -p dist/lspjs
echo "Downloading lspjs from S3 for version $(cat ./semgrep-version)"
for var in Main.bc.js language-server-wasm.js semgrep-lsp-bindings.js semgrep-lsp.js
do
    echo "Downloading $var"
    curl "https://static.semgrep.dev/static/turbo/$(cat ./semgrep-version)/language_server/dist/$var" -o "./dist/lspjs/$var"
done
echo "Downloaded lspjs"
