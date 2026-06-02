#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────
#  EdgeOrchestra — On-Device AI Installer
#  Coordinates Ollama, pulls models, and builds the sandbox.
# ──────────────────────────────────────────────────────────

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0;0m' # No Color

echo -e "${CYAN}"
echo "    ______    __            ____            __                 __  "
echo "   / ____/___/ /___  ___   / __ \_________ / /_  ___  ________/ /_  "
echo "  / __/ / __  / __ \/ _ \ / / / / ___/ __ / __ \/ _ \/ ___/ __  / __ \ "
echo " / /___/ /_/ / /_/ /  __// /_/ / /  / /_/ / / / /  __(__  ) /_/ / /_/ /"
echo "/_____/\__,_/\__, /\___/ \____/_/   \__,_/_/ /_/\___/____/\__,_/_.___/ "
echo "            /____/                                                     "
echo -e "${NC}"
echo -e "${BLUE}=== Starting EdgeOrchestra AI Setup ===${NC}\n"

# 1. Check Node.js and NPM
echo -e "Checking Node.js environment..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed. Please install Node.js (v18+) and retry.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v) detected.${NC}"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm $(npm -v) detected.${NC}\n"

# 2. Check & Install Ollama
echo -e "Checking Ollama installation..."
if ! command -v ollama &> /dev/null; then
    echo -e "${YELLOW}Ollama not found. Downloading and installing Ollama...${NC}"
    curl -fsSL https://ollama.com/install.sh | sh
else
    echo -e "${GREEN}✓ Ollama is installed.${NC}"
fi

# Ensure Ollama daemon is running
echo -e "Verifying Ollama service status..."
if ! curl -s http://localhost:11434/api/tags &> /dev/null; then
    echo -e "${YELLOW}Ollama service is not running. Starting Ollama in the background...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open -a Ollama
    else
        ollama serve > /dev/null 2>&1 &
    fi
    sleep 3
fi
echo -e "${GREEN}✓ Ollama local server is active.${NC}\n"

# 3. Pull required AI models
echo -e "Downloading local AI models (this may take a few minutes)..."
echo -e "Pulling phi4-mini..."
ollama pull phi4-mini
echo -e "Pulling qwen2.5-vl (Multimodal Vision)..."
ollama pull qwen2.5-vl
echo -e "${GREEN}✓ Local LLM & VL Models loaded.${NC}\n"

# 4. Install local dependencies
echo -e "Installing EdgeOrchestra frontend & Tauri dependencies..."
npm install
echo -e "${GREEN}✓ Dependencies installed successfully.${NC}\n"

echo -e "${GREEN}====================================================${NC}"
echo -e "${GREEN} EdgeOrchestra Setup Complete!${NC}"
echo -e " Run the following command to start the developer app:"
echo -e " ${CYAN}npm run tauri dev${NC}"
echo -e "${GREEN}====================================================${NC}"
