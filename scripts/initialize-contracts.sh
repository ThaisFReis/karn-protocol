#!/bin/bash

# Karn Protocol - Contract Initialization Script
# Initializes all deployed contracts with configuration
# Usage: ./initialize-contracts.sh [testnet|mainnet]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

NETWORK="${1:-testnet}"
DEPLOYMENT_FILE="deployed-contracts-${NETWORK}.json"

# Check if deployment file exists
if [ ! -f "$DEPLOYMENT_FILE" ]; then
    echo -e "${RED}Error: Deployment file not found: ${DEPLOYMENT_FILE}${NC}"
    echo "Run ./deploy-contracts.sh ${NETWORK} first"
    exit 1
fi

# Load contract addresses
VALOCRACY_ID=$(jq -r '.contracts.valocracy.address' "$DEPLOYMENT_FILE")
GOVERNOR_ID=$(jq -r '.contracts.governor.address' "$DEPLOYMENT_FILE")
TREASURY_ID=$(jq -r '.contracts.treasury.address' "$DEPLOYMENT_FILE")

echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Karn Protocol - Contract Initialization${NC}"
echo -e "${BLUE}  Network: ${NETWORK}${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo ""

# Check for required secrets
if [ -z "$FOUNDER_SECRET" ]; then
    echo -e "${YELLOW}Founder secret key required${NC}"
    read -sp "Enter founder secret key: " FOUNDER_SECRET
    echo ""
fi

if [ -z "$SIGNER_PUBLIC" ]; then
    echo -e "${YELLOW}Backend signer public key required${NC}"
    echo "Generate with: stellar keys generate signer"
    read -p "Enter signer public key (G...): " SIGNER_PUBLIC
    echo ""
fi

# Get founder address from secret
FOUNDER_ADDRESS=$(stellar keys address "$FOUNDER_SECRET" 2>&1 | grep -oE 'G[A-Z0-9]{55}')

if [ -z "$FOUNDER_ADDRESS" ]; then
    echo -e "${RED}Error: Could not derive founder address${NC}"
    exit 1
fi

echo "Founder Address: $FOUNDER_ADDRESS"
echo "Signer Public:   $SIGNER_PUBLIC"
echo ""

# Asset token (for Treasury)
if [ "$NETWORK" = "testnet" ]; then
    # Use Stellar testnet USDC
    ASSET_TOKEN="CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA""
else
    echo -e "${YELLOW}Enter USDC token address for mainnet:${NC}"
    read -p "Asset token address: " ASSET_TOKEN
fi

# Governance configuration
echo -e "${BLUE}Governance Configuration:${NC}"
echo "  Voting Delay:       86400 seconds (1 day)"
echo "  Voting Period:      604800 seconds (7 days)"
echo "  Quorum:             51%"
echo "  Proposal Threshold: 10 Mana"
echo ""

read -p "Use default governance config? (y/n): " use_defaults
if [ "$use_defaults" != "y" ]; then
    read -p "Voting delay (seconds): " VOTING_DELAY
    read -p "Voting period (seconds): " VOTING_PERIOD
    read -p "Quorum percentage (10-100): " QUORUM
    read -p "Proposal threshold (Mana): " THRESHOLD
else
    VOTING_DELAY=86400
    VOTING_PERIOD=604800
    QUORUM=51
    THRESHOLD=10
fi

echo ""

# Step 1: Initialize Valocracy
echo -e "${BLUE}Step 1: Initializing Valocracy...${NC}"

# Convert signer public key to bytes
SIGNER_BYTES=$(stellar strkey to-bytes "$SIGNER_PUBLIC" | jq -r '.bytes')

stellar contract invoke \
    --id "$VALOCRACY_ID" \
    --source "$FOUNDER_SECRET" \
    --network "$NETWORK" \
    -- initialize \
    --founder "$FOUNDER_ADDRESS" \
    --governor "$GOVERNOR_ID" \
    --treasury "$TREASURY_ID" \
    --member_valor_id 0 \
    --valor_ids '[0, 1, 10, 11, 20, 21, 22, 60, 61, 70]' \
    --valor_rarities '[5, 100, 50, 50, 20, 30, 40, 10, 15, 75]' \
    --valor_metadatas '["Member", "Founder", "Lideranca", "Guardian Mentor", "Learning Path", "Advanced Learning", "Expert Learning", "Community", "Active Community", "Governance"]' \
    --founder_valor_id 1 \
    --signer "$SIGNER_BYTES"

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Valocracy initialization failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Valocracy initialized${NC}"
echo ""

# Step 2: Initialize Governor
echo -e "${BLUE}Step 2: Initializing Governor...${NC}"

stellar contract invoke \
    --id "$GOVERNOR_ID" \
    --source "$FOUNDER_SECRET" \
    --network "$NETWORK" \
    -- initialize \
    --valocracy "$VALOCRACY_ID" \
    --voting_delay "$VOTING_DELAY" \
    --voting_period "$VOTING_PERIOD" \
    --quorum_percentage "$QUORUM" \
    --proposal_threshold "$THRESHOLD"

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Governor initialization failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Governor initialized${NC}"
echo ""

# Step 3: Initialize Treasury
echo -e "${BLUE}Step 3: Initializing Treasury...${NC}"

stellar contract invoke \
    --id "$TREASURY_ID" \
    --source "$FOUNDER_SECRET" \
    --network "$NETWORK" \
    -- initialize \
    --valocracy "$VALOCRACY_ID" \
    --governor "$GOVERNOR_ID" \
    --asset_token "$ASSET_TOKEN"

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Treasury initialization failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Treasury initialized${NC}"
echo ""

# Step 4: Verify initialization
echo -e "${BLUE}Step 4: Verifying initialization...${NC}"

# Check Valocracy founder
FOUNDER_CHECK=$(stellar contract invoke \
    --id "$VALOCRACY_ID" \
    --network "$NETWORK" \
    -- founder 2>&1 | grep -oE 'G[A-Z0-9]{55}')

if [ "$FOUNDER_CHECK" != "$FOUNDER_ADDRESS" ]; then
    echo -e "${RED}Error: Founder verification failed${NC}"
    exit 1
fi

# Check founder's Mana (should be 105 = 5 floor + 100 permanent)
FOUNDER_MANA=$(stellar contract invoke \
    --id "$VALOCRACY_ID" \
    --network "$NETWORK" \
    -- get_votes \
    --account "$FOUNDER_ADDRESS" 2>&1 | grep -oE '[0-9]+')

if [ "$FOUNDER_MANA" != "105" ]; then
    echo -e "${YELLOW}Warning: Founder Mana is ${FOUNDER_MANA}, expected 105${NC}"
fi

echo -e "${GREEN}✓ Initialization verified${NC}"
echo ""

# Step 5: Save initialization info
echo -e "${BLUE}Step 5: Saving initialization info...${NC}"

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

cat > "initialized-${NETWORK}.json" << EOF
{
  "network": "${NETWORK}",
  "timestamp": "${TIMESTAMP}",
  "founder": "${FOUNDER_ADDRESS}",
  "signer": "${SIGNER_PUBLIC}",
  "contracts": {
    "valocracy": "${VALOCRACY_ID}",
    "governor": "${GOVERNOR_ID}",
    "treasury": "${TREASURY_ID}"
  },
  "governance": {
    "voting_delay": ${VOTING_DELAY},
    "voting_period": ${VOTING_PERIOD},
    "quorum_percentage": ${QUORUM},
    "proposal_threshold": ${THRESHOLD}
  },
  "asset_token": "${ASSET_TOKEN}",
  "founder_mana": ${FOUNDER_MANA}
}
EOF

echo -e "${GREEN}✓ Initialization info saved to initialized-${NETWORK}.json${NC}"
echo ""

# Step 6: Generate env files
echo -e "${BLUE}Step 6: Generating environment files...${NC}"

# Frontend .env.local
cat > ".env.local.${NETWORK}" << EOF
# Karn Protocol - Frontend Environment (${NETWORK})
# Generated: ${TIMESTAMP}

# Network Configuration
NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE=$([ "$NETWORK" = "testnet" ] && echo "Test SDF Network ; September 2015" || echo "Public Global Stellar Network ; September 2015")
NEXT_PUBLIC_STELLAR_RPC_URL=$([ "$NETWORK" = "testnet" ] && echo "https://soroban-testnet.stellar.org" || echo "https://soroban-mainnet.stellar.org")

# Contract Addresses
NEXT_PUBLIC_VALOCRACY_CONTRACT=${VALOCRACY_ID}
NEXT_PUBLIC_GOVERNOR_CONTRACT=${GOVERNOR_ID}
NEXT_PUBLIC_TREASURY_CONTRACT=${TREASURY_ID}

# Backend API (Update this with your backend URL)
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
EOF

# Backend .env
cat > ".env.backend.${NETWORK}" << EOF
# Karn Protocol - Backend Environment (${NETWORK})
# Generated: ${TIMESTAMP}

# Database (Update with your database URL)
DATABASE_URL=postgresql://user:password@localhost:5432/karn

# Ed25519 Signer
# WARNING: Never commit this file to Git!
SIGNER_SECRET=<YOUR_SIGNER_SECRET_HERE>
SIGNER_PUBLIC=${SIGNER_PUBLIC}

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# Network
STELLAR_NETWORK_PASSPHRASE=$([ "$NETWORK" = "testnet" ] && echo "Test SDF Network ; September 2015" || echo "Public Global Stellar Network ; September 2015")
STELLAR_RPC_URL=$([ "$NETWORK" = "testnet" ] && echo "https://soroban-testnet.stellar.org" || echo "https://soroban-mainnet.stellar.org")

# Contracts
VALOCRACY_CONTRACT=${VALOCRACY_ID}
GOVERNOR_CONTRACT=${GOVERNOR_ID}
TREASURY_CONTRACT=${TREASURY_ID}

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

echo -e "${GREEN}✓ Environment files generated${NC}"
echo ""

# Display summary
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Initialization Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo "Network: ${NETWORK}"
echo ""
echo "Contracts:"
echo "  Valocracy: ${VALOCRACY_ID}"
echo "  Governor:  ${GOVERNOR_ID}"
echo "  Treasury:  ${TREASURY_ID}"
echo ""
echo "Founder:"
echo "  Address: ${FOUNDER_ADDRESS}"
echo "  Mana:    ${FOUNDER_MANA}"
echo ""
echo "Governance:"
echo "  Voting Delay:  ${VOTING_DELAY}s"
echo "  Voting Period: ${VOTING_PERIOD}s"
echo "  Quorum:        ${QUORUM}%"
echo "  Threshold:     ${THRESHOLD} Mana"
echo ""
echo "Environment Files:"
echo "  Frontend: .env.local.${NETWORK}"
echo "  Backend:  .env.backend.${NETWORK}"
echo ""
echo "Next Steps:"
echo "  1. Copy .env.local.${NETWORK} to frontend/.env.local"
echo "  2. Copy .env.backend.${NETWORK} to backend/.env"
echo "  3. Update backend .env with your database URL and signer secret"
echo "  4. Update frontend .env.local with your backend URL"
echo "  5. Deploy backend: ./deploy-backend.sh"
echo "  6. Deploy frontend: ./deploy-frontend.sh"
echo ""
echo -e "${YELLOW}IMPORTANT:${NC}"
echo "  - Never commit .env files to Git"
echo "  - Keep founder secret key secure"
echo "  - Keep signer secret key secure"
echo "  - Backup initialization files in a safe location"
echo ""
