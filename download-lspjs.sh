#!/usr/bin/env bash
set -eu
# Check if lspjs exists and if its a symlink then exit
if [ -L lspjs ]; then
    echo "lspjs symlink exists, not downloading as you are most likely using a local version"
    exit 0
fi
mkdir -p lspjs/dist
for var in "$@"
do
    curl https://static.semgrep.dev/static/turbo/$(cat ./semgrep-version)/language_server/dist/$var -o ./lspjs/dist/$var
done
