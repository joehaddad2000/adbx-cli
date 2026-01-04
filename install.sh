#!/bin/bash
set -e

# adbx installer
# Usage: curl -fsSL https://raw.githubusercontent.com/joehaddad2000/adbx-cli/main/install.sh | bash

REPO="joehaddad2000/adbx-cli"
INSTALL_DIR="${ADBX_INSTALL_DIR:-$HOME/.local/bin}"
BINARY_NAME="adbx"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

info() {
    echo -e "${GREEN}$1${NC}"
}

warn() {
    echo -e "${YELLOW}$1${NC}"
}

error() {
    echo -e "${RED}$1${NC}"
    exit 1
}

# Detect platform
detect_platform() {
    local os=$(uname -s | tr '[:upper:]' '[:lower:]')
    local arch=$(uname -m)

    case "$os" in
        darwin) os="darwin" ;;
        linux) os="linux" ;;
        *) error "Unsupported OS: $os" ;;
    esac

    case "$arch" in
        x86_64) arch="x64" ;;
        aarch64|arm64) arch="arm64" ;;
        *) error "Unsupported architecture: $arch" ;;
    esac

    echo "${os}-${arch}"
}

# Get latest release version
get_latest_version() {
    curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" |
        grep '"tag_name":' |
        sed -E 's/.*"([^"]+)".*/\1/'
}

# Download and install
install() {
    local platform=$(detect_platform)
    local version=$(get_latest_version)

    if [ -z "$version" ]; then
        error "Could not determine latest version"
    fi

    info "Installing adbx ${version} for ${platform}..."

    # Create install directory
    mkdir -p "$INSTALL_DIR"

    # Download binary
    local download_url="https://github.com/${REPO}/releases/download/${version}/adbx-${platform}"

    info "Downloading from ${download_url}..."

    if ! curl -fsSL "$download_url" -o "${INSTALL_DIR}/${BINARY_NAME}"; then
        error "Failed to download binary"
    fi

    # Make executable
    chmod +x "${INSTALL_DIR}/${BINARY_NAME}"

    info "Installed to ${INSTALL_DIR}/${BINARY_NAME}"

    # Check if in PATH
    if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
        warn ""
        warn "Add this to your shell profile (.bashrc, .zshrc, etc.):"
        warn "  export PATH=\"\$PATH:$INSTALL_DIR\""
        warn ""
    fi

    info "Done! Run 'adbx --help' to get started."
}

install
