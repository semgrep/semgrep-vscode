#!/usr/bin/env bash
set -eu
uname=$1
case "${uname}" in
    linux-x64*)    machine=manylinux;;
    linux-arm64*)   machine=linux-arm64;;
    darwin-x64*)   machine=osx;;
    darwin-arm64)    machine=osx-m1;;
    win32-x64*)   machine=windows;;
    *)    machine=manylinux;;
esac
# NOT the same as the semgrep version!!!!
release_char_count=$(echo "release-" | wc -c)
OSEMGREP_PRO_VERSION=$(cat ./semgrep-version | cut -c $((release_char_count))-)
BINARY=semgrep-core-proprietary-${machine}-${OSEMGREP_PRO_VERSION}
if [ "${machine}" = "windows" ]; then
    EXT=".exe"
else
    EXT=""
fi
# Check if osemgrep-pro exists and if its a symlink then exit
if [ -L dist/osemgrep-pro${EXT} ]; then
    echo "osemgrep-pro symlink exists, not downloading as you are most likely using a local version"
    exit 0
fi
mkdir -p dist
echo "Downloading osemgrep-pro binary from S3 for version ${machine}-${OSEMGREP_PRO_VERSION}"
aws s3 cp "s3://deep-semgrep-artifacts/${BINARY}${EXT}" dist/osemgrep-pro${EXT}
echo "Downloaded osemgrep-pro binary"
if [ "${machine}" = "windows" ]; then
    echo "Downloading the Windows wheel for the DLLs"
    PLATFORM="win_amd64"
    pip download "semgrep==${OSEMGREP_PRO_VERSION}" --no-deps --platform ${PLATFORM} -d /tmp/
    echo "Unzipping the Windows wheel"
    unzip -q -o /tmp/"semgrep-${OSEMGREP_PRO_VERSION}"-*-${PLATFORM}.whl -d /tmp/
    echo "Copying the DLLs to the dist directory"
    cp -r /tmp/"semgrep-${OSEMGREP_PRO_VERSION}.data"/purelib/semgrep/bin/*.dll dist/
else
    echo "Making osemgrep-pro binary executable"
    chmod +x dist/osemgrep-pro
fi
