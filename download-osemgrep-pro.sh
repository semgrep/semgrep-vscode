#!/usr/bin/env bash
set -eu
uname=$1
case "${uname}" in
    linux-x64*)    machine=manylinux;;
    linux-arm64*)   machine=linux-arm64;;
    darwin-x64*)   machine=osx;;
    darwin-arm64)    machine=osx-m1;;
    *)    machine=manylinux;;
esac
# NOT the same as the semgrep version!!!!
release_char_count=$(echo "release-" | wc -c)
OSEMGREP_PRO_VERSION=$(cat ./semgrep-version | cut -c $((release_char_count))-)
BINARY=semgrep-core-proprietary-${machine}-${OSEMGREP_PRO_VERSION}
# Check if osemgrep-pro exists and if its a symlink then exit
if [ -L dist/osemgrep-pro ]; then
    echo "osemgrep-pro symlink exists, not downloading as you are most likely using a local version"
    exit 0
fi
mkdir -p dist
echo "Downloading osemgrep-pro binary from S3 for version ${machine}-${OSEMGREP_PRO_VERSION}"
aws s3 cp s3://deep-semgrep-artifacts/${BINARY} dist/osemgrep-pro
echo "Downloaded osemgrep-pro binary"
echo "Making osemgrep-pro binary executable"
chmod +x dist/osemgrep-pro
