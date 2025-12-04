#!/bin/bash
# Setup script for linking private repo to public repo
# Run this after cloning both repos

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PUBLIC_REPO="$(dirname "$SCRIPT_DIR")"
PRIVATE_REPO="$(dirname "$PUBLIC_REPO")/traveller-VTT-private"

echo "Setting up private repo link..."
echo "Public repo: $PUBLIC_REPO"
echo "Private repo: $PRIVATE_REPO"

# Check if private repo exists
if [ ! -d "$PRIVATE_REPO" ]; then
    echo "ERROR: Private repo not found at $PRIVATE_REPO"
    echo "Please clone it first:"
    echo "  git clone git@github.com:energyscholar/traveller-VTT-private.git $PRIVATE_REPO"
    exit 1
fi

# Remove existing .claude and CLAUDE.md if they exist (not symlinks)
if [ -d "$PUBLIC_REPO/.claude" ] && [ ! -L "$PUBLIC_REPO/.claude" ]; then
    echo "Removing existing .claude directory..."
    rm -rf "$PUBLIC_REPO/.claude"
fi

if [ -f "$PUBLIC_REPO/CLAUDE.md" ] && [ ! -L "$PUBLIC_REPO/CLAUDE.md" ]; then
    echo "Removing existing CLAUDE.md..."
    rm "$PUBLIC_REPO/CLAUDE.md"
fi

# Create symlinks
echo "Creating symlinks..."
ln -sf "../traveller-VTT-private/.claude" "$PUBLIC_REPO/.claude"
ln -sf "../traveller-VTT-private/CLAUDE.md" "$PUBLIC_REPO/CLAUDE.md"

# Install git hooks
echo "Installing git hooks..."
cp "$SCRIPT_DIR/git-hooks/pre-commit" "$PUBLIC_REPO/.git/hooks/pre-commit"
chmod +x "$PUBLIC_REPO/.git/hooks/pre-commit"

echo "Done! Private repo linked successfully."
echo ""
echo "The following are now symlinked to private repo:"
echo "  .claude/ -> ../traveller-VTT-private/.claude/"
echo "  CLAUDE.md -> ../traveller-VTT-private/CLAUDE.md"
echo ""
echo "Git hooks installed for auto-sync on commit."
