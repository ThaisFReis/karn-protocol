#!/bin/bash

# Karn Protocol - Development Environment Setup
# Sets up local development environment with database, contracts, backend, and frontend
# Usage: ./setup-dev.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Karn Protocol - Development Setup${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo ""

# Step 1: Check prerequisites
echo -e "${BLUE}Step 1: Checking prerequisites...${NC}"

MISSING_DEPS=()

if ! command -v node &> /dev/null; then
    MISSING_DEPS+=("Node.js 18+")
fi

if ! command -v cargo &> /dev/null; then
    MISSING_DEPS+=("Rust")
fi

if ! command -v stellar &> /dev/null; then
    MISSING_DEPS+=("Stellar CLI")
fi

if ! command -v docker &> /dev/null; then
    MISSING_DEPS+=("Docker (optional, for local database)")
fi

if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
    echo -e "${YELLOW}Missing dependencies:${NC}"
    for dep in "${MISSING_DEPS[@]}"; do
        echo "  - $dep"
    done
    echo ""
    echo "Install them and run this script again."
    exit 1
fi

echo -e "${GREEN}✓ All prerequisites installed${NC}"
echo ""

# Step 2: Clone repository (if not already cloned)
if [ ! -d "karn-protocol" ]; then
    echo -e "${BLUE}Step 2: Cloning repository...${NC}"
    git clone https://github.com/karn-protocol/karn.git .
    echo -e "${GREEN}✓ Repository cloned${NC}"
else
    echo -e "${GREEN}✓ Repository already cloned${NC}"
fi
echo ""

# Step 3: Set up database
echo -e "${BLUE}Step 3: Setting up database...${NC}"
echo "Choose database option:"
echo "  1) Docker PostgreSQL (local, easy)"
echo "  2) Supabase (cloud, recommended)"
echo "  3) Skip (I already have a database)"
read -p "Choice (1-3): " db_choice

case $db_choice in
    1)
        echo "Starting PostgreSQL container..."
        docker run -d \
            --name karn-postgres \
            -e POSTGRES_PASSWORD=karn \
            -e POSTGRES_DB=karn \
            -p 5432:5432 \
            postgres:14-alpine

        sleep 3
        DATABASE_URL="postgresql://postgres:karn@localhost:5432/karn"
        echo -e "${GREEN}✓ PostgreSQL started on localhost:5432${NC}"
        ;;
    2)
        echo "Create a Supabase project at https://supabase.com"
        read -p "Enter your Supabase connection string: " DATABASE_URL
        ;;
    3)
        read -p "Enter your database connection string: " DATABASE_URL
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac
echo ""

# Step 4: Generate keys
echo -e "${BLUE}Step 4: Generating keys...${NC}"

if [ ! -f ".dev-keys" ]; then
    echo "Generating founder keypair..."
    stellar keys generate founder > /dev/null 2>&1
    FOUNDER_SECRET=$(stellar keys show founder | grep "Secret key" | awk '{print $3}')
    FOUNDER_PUBLIC=$(stellar keys address founder)

    echo "Generating signer keypair..."
    stellar keys generate signer > /dev/null 2>&1
    SIGNER_SECRET=$(stellar keys show signer | grep "Secret key" | awk '{print $3}')
    SIGNER_PUBLIC=$(stellar keys address signer)

    # Save keys
    cat > ".dev-keys" << EOF
# Karn Development Keys
# WARNING: Never use these on mainnet!

FOUNDER_SECRET=${FOUNDER_SECRET}
FOUNDER_PUBLIC=${FOUNDER_PUBLIC}

SIGNER_SECRET=${SIGNER_SECRET}
SIGNER_PUBLIC=${SIGNER_PUBLIC}
EOF

    chmod 600 .dev-keys
    echo -e "${GREEN}✓ Keys generated and saved to .dev-keys${NC}"
else
    source .dev-keys
    echo -e "${GREEN}✓ Using existing keys from .dev-keys${NC}"
fi

echo "  Founder: $FOUNDER_PUBLIC"
echo "  Signer:  $SIGNER_PUBLIC"
echo ""

# Step 5: Fund founder account (testnet)
echo -e "${BLUE}Step 5: Funding founder account...${NC}"
echo "Requesting XLM from friendbot..."

curl -X POST "https://friendbot.stellar.org?addr=${FOUNDER_PUBLIC}" \
    -H "Content-Type: application/json" \
    > /dev/null 2>&1

sleep 2
echo -e "${GREEN}✓ Founder account funded with test XLM${NC}"
echo ""

# Step 6: Build and deploy contracts
echo -e "${BLUE}Step 6: Building and deploying contracts...${NC}"

cd karn-protocol/contracts
stellar contract build

echo "Deploying Valocracy..."
VALOCRACY_ID=$(stellar contract deploy \
    --wasm target/wasm32-unknown-unknown/release/valocracy.wasm \
    --source founder \
    --network testnet 2>&1 | grep -oE 'C[A-Z0-9]{55}')

echo "Deploying Governor..."
GOVERNOR_ID=$(stellar contract deploy \
    --wasm target/wasm32-unknown-unknown/release/governor.wasm \
    --source founder \
    --network testnet 2>&1 | grep -oE 'C[A-Z0-9]{55}')

echo "Deploying Treasury..."
TREASURY_ID=$(stellar contract deploy \
    --wasm target/wasm32-unknown-unknown/release/treasury.wasm \
    --source founder \
    --network testnet 2>&1 | grep -oE 'C[A-Z0-9]{55}')

echo -e "${GREEN}✓ Contracts deployed${NC}"
echo "  Valocracy: $VALOCRACY_ID"
echo "  Governor:  $GOVERNOR_ID"
echo "  Treasury:  $TREASURY_ID"

cd ../..
echo ""

# Step 7: Initialize contracts
echo -e "${BLUE}Step 7: Initializing contracts...${NC}"

# Convert signer to bytes
SIGNER_BYTES=$(stellar strkey to-bytes "$SIGNER_PUBLIC" | jq -r '.bytes')

# Initialize Valocracy
stellar contract invoke \
    --id "$VALOCRACY_ID" \
    --source founder \
    --network testnet \
    -- initialize \
    --founder "$FOUNDER_PUBLIC" \
    --governor "$GOVERNOR_ID" \
    --treasury "$TREASURY_ID" \
    --member_valor_id 0 \
    --valor_ids '[0, 1, 10, 20, 60, 70]' \
    --valor_rarities '[5, 100, 50, 20, 10, 75]' \
    --valor_metadatas '["Member", "Founder", "Lideranca", "Learning Path", "Community", "Governance"]' \
    --founder_valor_id 1 \
    --signer "$SIGNER_BYTES" \
    > /dev/null 2>&1

# Initialize Governor
stellar contract invoke \
    --id "$GOVERNOR_ID" \
    --source founder \
    --network testnet \
    -- initialize \
    --valocracy "$VALOCRACY_ID" \
    --voting_delay 300 \
    --voting_period 600 \
    --quorum_percentage 30 \
    --proposal_threshold 5 \
    > /dev/null 2>&1

# Initialize Treasury
USDC_TESTNET="CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA""
stellar contract invoke \
    --id "$TREASURY_ID" \
    --source founder \
    --network testnet \
    -- initialize \
    --valocracy "$VALOCRACY_ID" \
    --governor "$GOVERNOR_ID" \
    --asset_token "$USDC_TESTNET" \
    > /dev/null 2>&1

echo -e "${GREEN}✓ Contracts initialized${NC}"
echo ""

# Step 8: Set up backend
echo -e "${BLUE}Step 8: Setting up backend...${NC}"

cd dapp-karn-ecosystem/backend

# Create .env
cat > .env << EOF
DATABASE_URL=${DATABASE_URL}

SIGNER_SECRET=${SIGNER_SECRET}
SIGNER_PUBLIC=${SIGNER_PUBLIC}

ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
STELLAR_RPC_URL=https://soroban-testnet.stellar.org

VALOCRACY_CONTRACT=${VALOCRACY_ID}
GOVERNOR_CONTRACT=${GOVERNOR_ID}
TREASURY_CONTRACT=${TREASURY_ID}

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

# Install dependencies
npm install

# Push database schema
npx prisma db push > /dev/null 2>&1

echo -e "${GREEN}✓ Backend configured${NC}"

cd ../..
echo ""

# Step 9: Set up frontend
echo -e "${BLUE}Step 9: Setting up frontend...${NC}"

cd dapp-karn-ecosystem/frontend

# Create .env.local
cat > .env.local << EOF
NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org

NEXT_PUBLIC_VALOCRACY_CONTRACT=${VALOCRACY_ID}
NEXT_PUBLIC_GOVERNOR_CONTRACT=${GOVERNOR_ID}
NEXT_PUBLIC_TREASURY_CONTRACT=${TREASURY_ID}

NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
EOF

# Install dependencies
npm install

echo -e "${GREEN}✓ Frontend configured${NC}"

cd ../..
echo ""

# Step 10: Create start script
echo -e "${BLUE}Step 10: Creating start script...${NC}"

cat > start-dev.sh << 'EOF'
#!/bin/bash

# Start Karn development servers

trap "trap - SIGTERM && kill -- -$$" SIGINT SIGTERM EXIT

echo "Starting Karn development servers..."
echo ""

# Start backend
cd dapp-karn-ecosystem/backend
echo "Starting backend on http://localhost:3001..."
npm run dev > backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend
cd ../frontend
echo "Starting frontend on http://localhost:3000..."
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

echo ""
echo "✓ Development servers started!"
echo ""
echo "  Backend:  http://localhost:3001"
echo "  Frontend: http://localhost:3000"
echo ""
echo "  Backend logs:  dapp-karn-ecosystem/backend/backend.log"
echo "  Frontend logs: dapp-karn-ecosystem/frontend/frontend.log"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for processes
wait
EOF

chmod +x start-dev.sh

echo -e "${GREEN}✓ Start script created${NC}"
echo ""

# Display summary
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Development Environment Ready!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo "Contracts (Testnet):"
echo "  Valocracy: $VALOCRACY_ID"
echo "  Governor:  $GOVERNOR_ID"
echo "  Treasury:  $TREASURY_ID"
echo ""
echo "Founder Account:"
echo "  Address: $FOUNDER_PUBLIC"
echo "  Mana:    105 (5 floor + 100 permanent)"
echo ""
echo "Database:"
echo "  $DATABASE_URL"
echo ""
echo "To start development servers:"
echo "  ./start-dev.sh"
echo ""
echo "Or start manually:"
echo "  # Terminal 1: Backend"
echo "  cd dapp-karn-ecosystem/backend && npm run dev"
echo ""
echo "  # Terminal 2: Frontend"
echo "  cd dapp-karn-ecosystem/frontend && npm run dev"
echo ""
echo -e "${YELLOW}Important Files:${NC}"
echo "  .dev-keys              - Development keypairs (DO NOT COMMIT)"
echo "  backend/.env           - Backend configuration"
echo "  frontend/.env.local    - Frontend configuration"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Start servers: ./start-dev.sh"
echo "  2. Visit http://localhost:3000"
echo "  3. Connect wallet (Freighter recommended)"
echo "  4. Start building!"
echo ""
