#!/bin/bash

# 🚂 Railway Deployment Helper Script
# This script helps prepare your app for Railway deployment

set -e  # Exit on error

echo "🚂 Railway Deployment Helper"
echo "=============================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if git is initialized
if [ ! -d .git ]; then
    echo -e "${RED}❌ Error: Not a git repository${NC}"
    echo "Run: git init"
    exit 1
fi

echo -e "${GREEN}✓${NC} Git repository found"

# Check if there are uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}⚠${NC}  You have uncommitted changes"
    echo ""
    git status -s
    echo ""
    read -p "Commit these changes? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter commit message: " commit_msg
        git add .
        git commit -m "$commit_msg"
        echo -e "${GREEN}✓${NC} Changes committed"
    fi
else
    echo -e "${GREEN}✓${NC} No uncommitted changes"
fi

# Check if remote is set
if ! git remote | grep -q 'origin'; then
    echo -e "${YELLOW}⚠${NC}  No git remote 'origin' found"
    read -p "Enter your GitHub repository URL: " repo_url
    git remote add origin "$repo_url"
    echo -e "${GREEN}✓${NC} Remote added"
else
    echo -e "${GREEN}✓${NC} Git remote configured"
fi

# Run tests
echo ""
echo "Running tests..."
if npm test; then
    echo -e "${GREEN}✓${NC} Tests passed"
else
    echo -e "${RED}❌ Tests failed${NC}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Build the project
echo ""
echo "Building project..."
if npm run build; then
    echo -e "${GREEN}✓${NC} Build successful"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# Push to GitHub
echo ""
read -p "Push to GitHub? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    BRANCH=$(git branch --show-current)
    echo "Pushing to branch: $BRANCH"
    git push origin "$BRANCH"
    echo -e "${GREEN}✓${NC} Pushed to GitHub"
fi

# Display next steps
echo ""
echo "=============================="
echo -e "${GREEN}✅ Ready for Railway Deployment!${NC}"
echo "=============================="
echo ""
echo "Next steps:"
echo ""
echo "1. Go to https://railway.app"
echo "2. Sign in with GitHub"
echo "3. Click 'New Project' → 'Deploy from GitHub repo'"
echo "4. Select your repository"
echo "5. Add environment variables:"
echo "   - NODE_ENV=production"
echo "   - CLOUDINARY_CLOUD_NAME=your_cloud_name"
echo "   - CLOUDINARY_API_KEY=your_api_key"
echo "   - CLOUDINARY_API_SECRET=your_api_secret"
echo "6. Generate domain in Settings → Domains"
echo "7. Add ALLOWED_ORIGINS variable with your Railway URL"
echo ""
echo "📚 See RAILWAY_DEPLOYMENT_GUIDE.md for detailed instructions"
echo "✅ See RAILWAY_CHECKLIST.md for deployment checklist"
echo ""
