#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Human-in-the-Loop AI Assistant ===${NC}\n"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    echo "Recommended version: 18.x or higher"
    exit 1
fi

# Display Node.js version
NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js ${NODE_VERSION} detected${NC}\n"

# Check for git updates
if command -v git &> /dev/null; then
    if [ -d .git ]; then
        echo -e "${YELLOW}Checking for updates...${NC}"
        git fetch 2>/dev/null

        # Get current branch
        CURRENT_BRANCH=$(git branch --show-current 2>/dev/null)

        if [ -n "$CURRENT_BRANCH" ]; then
            # Get local and remote commits
            LOCAL_COMMIT=$(git rev-parse "$CURRENT_BRANCH" 2>/dev/null)
            REMOTE_COMMIT=$(git rev-parse "origin/$CURRENT_BRANCH" 2>/dev/null)

            if [ "$LOCAL_COMMIT" != "$REMOTE_COMMIT" ]; then
                # Check if local is behind remote
                BEHIND_COUNT=$(git rev-list --count "$CURRENT_BRANCH..origin/$CURRENT_BRANCH" 2>/dev/null)

                if [ "$BEHIND_COUNT" -gt 0 ]; then
                    echo -e "${YELLOW}There are $BEHIND_COUNT new commit(s) available on origin/$CURRENT_BRANCH.${NC}"
                    read -p "Would you like to pull the updates? (y/n): " -n 1 -r
                    echo
                    if [[ $REPLY =~ ^[Yy]$ ]]; then
                        echo -e "${YELLOW}Pulling updates...${NC}"
                        git pull
                        echo -e "${GREEN}✓ Updates applied successfully${NC}\n"
                    else
                        echo -e "${YELLOW}Continuing without pulling updates.${NC}\n"
                    fi
                else
                    echo -e "${GREEN}✓ No updates available${NC}\n"
                fi
            else
                echo -e "${GREEN}✓ No updates available${NC}\n"
            fi
        fi
    fi
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed${NC}"
    echo "Please install npm (usually comes with Node.js)"
    exit 1
fi

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to install dependencies${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Dependencies installed${NC}\n"

# Start the development server
echo -e "${YELLOW}Starting development server...${NC}"
echo -e "The application will open in your browser automatically.\n"

# Open browser after a short delay (in background)
(sleep 3 && open http://localhost:3000) &

# Start the dev server
npm run dev
