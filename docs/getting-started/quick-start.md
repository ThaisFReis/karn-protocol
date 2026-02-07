# Quick Start Guide

Get started with Karn Protocol in 5 minutes using our automated deployment scripts.

## Prerequisites

Before you begin, ensure you have:

- **Node.js** 18+ ([nodejs.org](https://nodejs.org))
- **Rust** ([rustup.rs](https://rustup.rs))
- **Stellar CLI** (latest version)
- **Git** (for cloning)
- **jq** (JSON processor)

### Install Stellar CLI

```bash
cargo install --locked stellar-cli --features opt
```

### Install jq

```bash
# Ubuntu/Debian
sudo apt-get install jq

# macOS
brew install jq
```

---

## Option 1: Automated Setup (Recommended)

Use our automated script for complete local development environment setup:

```bash
# Clone the repository
git clone https://github.com/your-org/karn-protocol.git
cd karn-protocol

# Run automated setup
./scripts/setup-dev.sh
```

**What this does:**
1. Checks prerequisites
2. Sets up PostgreSQL database (Docker or Supabase)
3. Generates development keypairs
4. Funds founder account on testnet
5. Builds and deploys contracts to testnet
6. Initializes contracts with default configuration
7. Configures backend environment
8. Configures frontend environment
9. Creates start script

**Time:** ~5 minutes

After setup completes:

```bash
# Start all services
./start-dev.sh

# Backend runs on: http://localhost:3001
# Frontend runs on: http://localhost:3000
```

---

## Option 2: Manual Setup

### 1. Clone and Install

```bash
git clone https://github.com/your-org/karn-protocol.git
cd karn-protocol

# Install SDK dependencies
cd sdk && npm install && cd ..
```

### 2. Deploy Contracts to Testnet

```bash
# Set your founder secret key
export FOUNDER_SECRET=S...

# Deploy contracts
./scripts/deploy-contracts.sh testnet
```

This deploys:
- Valocracy contract (IDNFT + Mana)
- Governor contract (Proposals + Voting)
- Treasury contract (Funds + Scholarships)

### 3. Initialize Contracts

```bash
# Initialize with default configuration
export SIGNER_PUBLIC=G...  # Your backend signer public key

./scripts/initialize-contracts.sh testnet
```

This:
- Registers 10 default badge types
- Sets governance parameters (7-day voting period, 51% quorum)
- Configures founder as initial admin
- Auto-generates `.env` files

### 4. Verify Deployment

```bash
./scripts/verify-deployment.sh testnet
```

Runs 18+ automated tests to verify:
- Contracts initialized correctly
- Founder has correct Mana
- Cross-contract integrations work
- Governance parameters configured

---

## Next Steps

### For Developers

1. **Read Contract Reference** — [`../contracts/CONTRACT_REFERENCE.md`](../contracts/CONTRACT_REFERENCE.md)
   - Understand all contract functions
   - Learn access control rules
   - See code examples

2. **Explore Examples** — [`../../examples/`](../../examples/)
   - Start with `simple-integration/` (vanilla JS)
   - Try `badge-viewer/` (React)
   - Build with `mana-calculator/` (decay logic)

3. **Use SDK** — [`../../sdk/README.md`](../../sdk/README.md)
   - Install: `npm install @karn/protocol-sdk`
   - React hooks for easy integration
   - TypeScript support

### For Organizations

1. **Customize Your Instance** — [`deploy-your-own.md`](deploy-your-own.md)
   - Deploy to your own infrastructure
   - Customize governance parameters
   - Configure custom badges

2. **Read Deployment Guide** — [`../guides/CUSTOMIZATION_DEPLOYMENT_GUIDE.md`](../guides/CUSTOMIZATION_DEPLOYMENT_GUIDE.md)
   - Production deployment checklist
   - Security hardening
   - Monitoring and maintenance

### For Community Leaders

1. **Understand Core Concepts** — [`../../CORE_CONCEPTS.md`](../../CORE_CONCEPTS.md)
   - What is Valocracia?
   - How Mana decay works
   - Badge system explained

2. **Plan Your Governance** — [`../architecture/ARCHITECTURE_DIAGRAMS.md`](../architecture/ARCHITECTURE_DIAGRAMS.md)
   - Visualize governance flows
   - Understand proposal lifecycle
   - Treasury management

---

## Troubleshooting

### "stellar: command not found"

**Solution:** Install Stellar CLI:
```bash
cargo install --locked stellar-cli --features opt
```

### "jq: command not found"

**Solution:** Install jq:
```bash
# Ubuntu/Debian
sudo apt-get install jq

# macOS
brew install jq
```

### "Failed to deploy contracts"

**Possible causes:**
1. Insufficient XLM balance
2. Network issues
3. Invalid founder secret key

**Solution:**
```bash
# Check founder balance
stellar keys address FOUNDER

# Fund account on testnet
stellar keys fund FOUNDER --network testnet

# Retry deployment
./scripts/deploy-contracts.sh testnet
```

### "Database connection failed"

**Solution:** Ensure PostgreSQL is running:
```bash
# If using Docker
docker ps | grep postgres

# If using Supabase
# Check your DATABASE_URL in backend/.env
```

### "Contracts initialized but frontend shows errors"

**Solution:** Check contract addresses in frontend `.env.local`:
```bash
cat frontend/.env.local

# Should show:
# NEXT_PUBLIC_VALOCRACY_CONTRACT=C...
# NEXT_PUBLIC_GOVERNOR_CONTRACT=C...
# NEXT_PUBLIC_TREASURY_CONTRACT=C...
```

---

## Configuration Files

After setup, you'll have:

**Backend** (`backend/.env`):
```env
DATABASE_URL=postgresql://...
SIGNER_SECRET=S...
SIGNER_PUBLIC=G...
VALOCRACY_CONTRACT=C...
GOVERNOR_CONTRACT=C...
TREASURY_CONTRACT=C...
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_VALOCRACY_CONTRACT=C...
NEXT_PUBLIC_GOVERNOR_CONTRACT=C...
NEXT_PUBLIC_TREASURY_CONTRACT=C...
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

---

## What's Deployed

After successful setup, you'll have:

### Testnet Contracts

| Contract | Purpose |
|----------|---------|
| Valocracy | Soulbound badges + Mana calculation |
| Governor | Proposal creation + Voting + Execution |
| Treasury | Asset management + Scholarship distribution |

### Backend API

Running on `http://localhost:3001`:
- `/api/profile` — User profiles
- `/api/badges` — Badge metadata
- `/api/auth/signature` — Registration signatures
- `/health` — Health check

### Frontend dApp

Running on `http://localhost:3000`:
- Landing page
- Onboarding flows
- User dashboard
- Governance interface

---

## Get Help

- **Documentation**: [`../`](../)
- **Examples**: [`../../examples/`](../../examples/)
- **GitHub Issues**: [github.com/karn-protocol/karn/issues](https://github.com/karn-protocol/karn/issues)
- **Discord**: Coming soon

---

**Quick Start Version**: 1.0.0
**Last Updated**: 2026-02-07
**Estimated Time**: 5-10 minutes
