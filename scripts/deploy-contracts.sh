#!/bin/bash

# Karn Protocol - Contract Deployment Script
# Deploys all three contracts (Valocracy, Governor, Treasury) to Stellar network
# Usage: ./deploy-contracts.sh [testnet|mainnet]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NETWORK="${1:-testnet}"
CONTRACTS_DIR="karn-protocol/contracts"
OUTPUT_FILE="deployed-contracts-${NETWORK}.json"

# Validate network
if [ "$NETWORK" != "testnet" ] && [ "$NETWORK" != "mainnet" ]; then
    echo -e "${RED}Error: Network must be 'testnet' or 'mainnet'${NC}"
    echo "Usage: $0 [testnet|mainnet]"
    exit 1
fi

# Check if stellar CLI is installed
if ! command -v stellar &> /dev/null; then
    echo -e "${RED}Error: stellar CLI not found${NC}"
    echo "Install with: cargo install --locked stellar-cli --features opt"
    exit 1
fi

# Mainnet warning
if [ "$NETWORK" = "mainnet" ]; then
    echo -e "${YELLOW}═══════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}  WARNING: MAINNET DEPLOYMENT${NC}"
    echo -e "${YELLOW}═══════════════════════════════════════════════${NC}"
    echo ""
    echo "You are about to deploy to MAINNET."
    echo "This will use real XLM and is irreversible."
    echo ""
    echo "Pre-deployment checklist:"
    echo "  [ ] Security audit completed by professional firm"
    echo "  [ ] All tests passing (unit + integration + fuzzing)"
    echo "  [ ] Testnet deployment tested thoroughly"
    echo "  [ ] Founder keys secured in hardware wallet"
    echo "  [ ] Team reviewed contract code"
    echo ""
    read -p "Type 'DEPLOY TO MAINNET' to continue: " confirm
    if [ "$confirm" != "DEPLOY TO MAINNET" ]; then
        echo -e "${RED}Deployment cancelled${NC}"
        exit 1
    fi
fi

echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Karn Protocol - Contract Deployment${NC}"
echo -e "${BLUE}  Network: ${NETWORK}${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo ""

# Check for required environment variables
if [ -z "$FOUNDER_SECRET" ]; then
    echo -e "${YELLOW}Warning: FOUNDER_SECRET not set${NC}"
    read -sp "Enter founder secret key: " FOUNDER_SECRET
    echo ""
fi

# Step 1: Build contracts
echo -e "${BLUE}Step 1: Building contracts...${NC}"
cd "$CONTRACTS_DIR"

stellar contract build

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Contract build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Contracts built successfully${NC}"
echo ""

# Verify WASM files exist
VALOCRACY_WASM="target/wasm32-unknown-unknown/release/valocracy.wasm"
GOVERNOR_WASM="target/wasm32-unknown-unknown/release/governor.wasm"
TREASURY_WASM="target/wasm32-unknown-unknown/release/treasury.wasm"

if [ ! -f "$VALOCRACY_WASM" ] || [ ! -f "$GOVERNOR_WASM" ] || [ ! -f "$TREASURY_WASM" ]; then
    echo -e "${RED}Error: WASM files not found${NC}"
    exit 1
fi

# Display file sizes
echo "WASM file sizes:"
ls -lh target/wasm32-unknown-unknown/release/*.wasm
echo ""

# Step 2: Deploy Valocracy
echo -e "${BLUE}Step 2: Deploying Valocracy contract...${NC}"

VALOCRACY_ID=$(stellar contract deploy \
    --wasm "$VALOCRACY_WASM" \
    --source "$FOUNDER_SECRET" \
    --network "$NETWORK" \
    2>&1 | grep -oE 'C[A-Z0-9]{55}')

if [ -z "$VALOCRACY_ID" ]; then
    echo -e "${RED}Error: Valocracy deployment failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Valocracy deployed: ${VALOCRACY_ID}${NC}"
echo ""

# Step 3: Deploy Governor
echo -e "${BLUE}Step 3: Deploying Governor contract...${NC}"

GOVERNOR_ID=$(stellar contract deploy \
    --wasm "$GOVERNOR_WASM" \
    --source "$FOUNDER_SECRET" \
    --network "$NETWORK" \
    2>&1 | grep -oE 'C[A-Z0-9]{55}')

if [ -z "$GOVERNOR_ID" ]; then
    echo -e "${RED}Error: Governor deployment failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Governor deployed: ${GOVERNOR_ID}${NC}"
echo ""

# Step 4: Deploy Treasury
echo -e "${BLUE}Step 4: Deploying Treasury contract...${NC}"

TREASURY_ID=$(stellar contract deploy \
    --wasm "$TREASURY_WASM" \
    --source "$FOUNDER_SECRET" \
    --network "$NETWORK" \
    2>&1 | grep -oE 'C[A-Z0-9]{55}')

if [ -z "$TREASURY_ID" ]; then
    echo -e "${RED}Error: Treasury deployment failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Treasury deployed: ${TREASURY_ID}${NC}"
echo ""

# Step 5: Save deployment info
echo -e "${BLUE}Step 5: Saving deployment information...${NC}"

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

cat > "../../$OUTPUT_FILE" << EOF
{
  "network": "${NETWORK}",
  "timestamp": "${TIMESTAMP}",
  "contracts": {
    "valocracy": {
      "address": "${VALOCRACY_ID}",
      "wasm": "${VALOCRACY_WASM}"
    },
    "governor": {
      "address": "${GOVERNOR_ID}",
      "wasm": "${GOVERNOR_WASM}"
    },
    "treasury": {
      "address": "${TREASURY_ID}",
      "wasm": "${TREASURY_WASM}"
    }
  }
}
EOF

echo -e "${GREEN}✓ Deployment info saved to ${OUTPUT_FILE}${NC}"
echo ""

# Step 6: Display summary
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo "Network: ${NETWORK}"
echo ""
echo "Contract Addresses:"
echo "  Valocracy: ${VALOCRACY_ID}"
echo "  Governor:  ${GOVERNOR_ID}"
echo "  Treasury:  ${TREASURY_ID}"
echo ""
echo "Next Steps:"
echo "  1. Initialize contracts: ./initialize-contracts.sh ${NETWORK}"
echo "  2. Update frontend .env.local with contract addresses"
echo "  3. Update backend .env with contract addresses"
echo "  4. Verify deployment: ./verify-deployment.sh ${NETWORK}"
echo ""
echo -e "${YELLOW}Important: Save these addresses! You'll need them for initialization.${NC}"
echo ""

# Return to original directory
cd - > /dev/null
