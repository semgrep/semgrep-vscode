#!/usr/bin/env bash
set -eu
uname=$1
is_musl() {
    ldd --version 2>&1 | grep -q musl
}
# NOTE: the `machine=` naming is a historic artifact from when we used to only publish
# a statically linked binary that didn't depend on the user's libc
#
# NOTE: the pypi tags MUST match the pypi tags we publish in pypi; if we modify
# the released tags we must make sure they match
case "${uname}" in
    linux-x64*)
        if is_musl; then
            # NOTE: not manylinux! this is a musl binary
            machine=manylinux
            PLATFORM="musllinux_1_2_x86_64"
        else
            machine=manylinux-x86
            PLATFORM="manylinux_2_35_x86_64"
        fi
        ;;
    linux-arm64*)
        if is_musl; then
            machine=linux-arm64
            PLATFORM="musllinux_1_2_aarch64"
        else
            machine=manylinux-arm64
            PLATFORM="manylinux_2_35_aarch64"
        fi
        ;;
    darwin-x64*)   machine=osx;   PLATFORM="macosx_10_14_x86_64";;
    darwin-arm64)  machine=osx-m1; PLATFORM="macosx_11_0_arm64";;
    win32-x64*)    machine=windows; PLATFORM="win_amd64";;
    *)             machine=manylinux; PLATFORM="manylinux_2_35_x86_64";;
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

version_gt() {
    [ "$(printf '%s\n' "$1" "$2" | sort -V | tail -n1)" = "$1" ] && [ "$1" != "$2" ]
}

if [ "${machine}" = "windows" ]; then
    echo "Downloading the Windows wheel for the DLLs"
    pip download "semgrep==${OSEMGREP_PRO_VERSION}" --no-deps --platform ${PLATFORM} -d /tmp/
    echo "Unzipping the Windows wheel"
    unzip -q -o /tmp/"semgrep-${OSEMGREP_PRO_VERSION}"-*.whl -d /tmp/
    echo "Copying the DLLs to the dist directory"
    cp -r /tmp/"semgrep-${OSEMGREP_PRO_VERSION}.data"/purelib/semgrep/bin/*.dll dist/
else
    echo "Making osemgrep-pro binary executable"
    chmod +x dist/osemgrep-pro
    # preserve backwards compatibility with statically linked macos/linux
    # binaries
    if version_gt "${OSEMGREP_PRO_VERSION}" "1.157.0"; then
        echo "Downloading the wheel for the shared libraries"
        pip download "semgrep==${OSEMGREP_PRO_VERSION}" --no-deps --platform ${PLATFORM} -d /tmp/
        echo "Extracting the wheel"
        unzip -q -o /tmp/"semgrep-${OSEMGREP_PRO_VERSION}"-*.whl -d /tmp/
        echo "Copying the shared libraries to the dist directory"
        cp -LR /tmp/"semgrep-${OSEMGREP_PRO_VERSION}.data"/purelib/semgrep/bin/libs dist/libs
    fi
fi
