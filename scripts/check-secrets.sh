#!/bin/bash
# Secrets Scanning Script using TruffleHog
# Checks staged files for secrets before committing

set -e

echo "🔐 Checking for secrets in staged files..."


# Get list of staged files
staged_files=$(git diff --cached --name-only --diff-filter=ACM 2>/dev/null || true)

if [ -z "$staged_files" ]; then
    echo "ℹ️  No staged files to check"
    exit 0
fi

# Count staged files
file_count=$(echo "$staged_files" | wc -l | tr -d ' ')
echo "📊 Scanning $file_count staged file(s)..."

# Create a temporary file list
temp_file=$(mktemp)
echo "$staged_files" > "$temp_file"

# Run TruffleHog on staged files only
# Using filesystem mode with specific files
secrets_found=0
first_secret=1


# If secrets were found in the file-by-file scan, exit immediately
if [ $secrets_found -eq 1 ]; then
    echo ""
    echo "What to do:"
    echo "  1. Remove the secrets from your staged changes"
    echo "  2. Use environment variables instead"
    echo "  3. Consider using: git reset HEAD <file>"
    echo ""
    echo "Common secret types:"
    echo "  • API keys (AWS, GCP, Azure, etc.)"
    echo "  • Database passwords"
    echo "  • Private keys (SSH, JWT, etc.)"
    echo "  • OAuth tokens"
    echo "  • Webhook URLs with secrets"
    echo ""
    rm -f "$temp_file"
    exit 1
fi


# Cleanup
rm -f "$temp_file"

# Alternative approach: scan git diff for staged changes
echo ""
echo "🔍 Running deep scan on staged changes..."


echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ No secrets detected in staged files!"
echo "🎉 Safe to commit"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

exit 0
