# Karn Protocol - Deployment Scripts

Automated scripts for deploying and managing Karn Protocol infrastructure.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Scripts Reference](#scripts-reference)
- [Usage Examples](#usage-examples)
- [Troubleshooting](#troubleshooting)

---

## Overview

This directory contains shell scripts for automating Karn Protocol deployment and management:

| Script | Purpose | Time | Complexity |
|--------|---------|------|------------|
| `setup-dev.sh` | Complete local dev setup | 5 min | Easy |
| `deploy-contracts.sh` | Deploy contracts to network | 2 min | Medium |
| `initialize-contracts.sh` | Initialize deployed contracts | 3 min | Medium |
| `verify-deployment.sh` | Verify deployment health | 1 min | Easy |

---

## Sensitive Identifier Guard

To prevent accidentally committing contract IDs or wallet keys, this repo includes:

- `scripts/scan-sensitive.sh`: scans common text/code files for Stellar identifiers (`C...`, `G...`, `S...`)
- `githooks/pre-commit`: optional local pre-commit hook that runs the scan
- CI: `Sensitive Identifier Scan` job in `.github/workflows/ci.yml`

Install the local pre-commit hook:

```bash
./install-githooks.sh
```

## Prerequisites

### Required Software

- **Bash** 4.0+
- **Node.js** 18+
- **Stellar CLI** (latest)
- **jq** (JSON processor)
- **curl**

### Optional Software

- **Docker** (for local database)
- **Git** (for cloning repository)

### Installation

```bash
# Install Stellar CLI
cargo install --locked stellar-cli --features opt

# Install jq (Ubuntu/Debian)
sudo apt-get install jq

# Install jq (macOS)
brew install jq
```

---

## Quick Start

### Local Development

Set up complete local development environment in one command:

```bash
./setup-dev.sh
```

This script will:
1. Check prerequisites
2. Clone repository (if needed)
3. Set up PostgreSQL database
4. Generate development keypairs
5. Fund founder account (testnet)
6. Build and deploy contracts
7. Initialize contracts
8. Configure backend
9. Configure frontend
10. Create start script

**Time:** ~5 minutes

### Production Deployment

Deploy to testnet or mainnet:

```bash
# 1. Deploy contracts
FOUNDER_SECRET=S... ./deploy-contracts.sh testnet

# 2. Initialize contracts
FOUNDER_SECRET=S... \
SIGNER_PUBLIC=G... \
./initialize-contracts.sh testnet

# 3. Verify deployment
./verify-deployment.sh testnet
```

**Time:** ~5 minutes

---

## Scripts Reference

### `setup-dev.sh`

**Purpose:** Complete local development environment setup

**Usage:**
```bash
./setup-dev.sh
```

**What it does:**
- Checks prerequisites (Node, Rust, Stellar CLI)
- Clones repository if not present
- Sets up PostgreSQL database (Docker or Supabase)
- Generates development keypairs
- Funds founder account with test XLM
- Builds and deploys contracts to testnet
- Initializes all contracts
- Configures backend with .env file
- Configures frontend with .env.local
- Creates `start-dev.sh` launcher script

**Output Files:**
- `.dev-keys` — Development keypairs (never commit!)
- `backend/.env` — Backend configuration
- `frontend/.env.local` — Frontend configuration
- `start-dev.sh` — Development server launcher

**Environment Variables:**
- None required (fully interactive)

**Example:**
```bash
./setup-dev.sh

# When prompted, choose:
# - Database: Docker PostgreSQL
# - All default options

# Then start servers:
./start-dev.sh
```

---

### `deploy-contracts.sh`

**Purpose:** Deploy Valocracy, Governor, and Treasury contracts

**Usage:**
```bash
./deploy-contracts.sh [testnet|mainnet]
```

**What it does:**
- Validates network parameter
- Checks for Stellar CLI
- Shows mainnet warning (if applicable)
- Builds all contracts
- Deploys Valocracy contract
- Deploys Governor contract
- Deploys Treasury contract
- Saves deployment info to JSON file
- Generates environment file templates

**Output Files:**
- `deployed-contracts-{network}.json` — Contract addresses and metadata

**Environment Variables:**
- `FOUNDER_SECRET` (required) — Founder's secret key for deployment

**Example:**
```bash
# Testnet deployment
FOUNDER_SECRET=SXXXXXX... ./deploy-contracts.sh testnet

# Mainnet deployment (requires confirmation)
FOUNDER_SECRET=SXXXXXX... ./deploy-contracts.sh mainnet
```

**Output:**
```
Valocracy: REDACTED_CONTRACT_ID_VALOCRACY
Governor:  REDACTED_CONTRACT_ID_GOVERNOR
Treasury:  REDACTED_CONTRACT_ID_TREASURY
```

---

### `initialize-contracts.sh`

**Purpose:** Initialize deployed contracts with configuration

**Usage:**
```bash
./initialize-contracts.sh [testnet|mainnet]
```

**What it does:**
- Loads contract addresses from deployment file
- Initializes Valocracy with badges and signer
- Initializes Governor with governance parameters
- Initializes Treasury with asset token
- Verifies initialization (checks founder Mana)
- Generates .env files for backend and frontend

**Output Files:**
- `initialized-{network}.json` — Initialization metadata
- `.env.local.{network}` — Frontend environment template
- `.env.backend.{network}` — Backend environment template

**Environment Variables:**
- `FOUNDER_SECRET` (required) — Founder's secret key
- `SIGNER_PUBLIC` (required) — Backend signer's public key

**Governance Defaults:**
- **Voting Delay:** 86400s (1 day)
- **Voting Period:** 604800s (7 days)
- **Quorum:** 51%
- **Proposal Threshold:** 10 Mana

**Badge Types Registered:**
- `0` — Member (5 Mana, self-registration)
- `1` — Founder (100 Mana, permanent)
- `10` — Lideranca (50 Mana, leadership)
- `11` — Guardian Mentor (50 Mana, leadership)
- `20` — Learning Path (20 Mana, track)
- `21` — Advanced Learning (30 Mana, track)
- `22` — Expert Learning (40 Mana, track)
- `60` — Community (10 Mana, community)
- `61` — Active Community (15 Mana, community)
- `70` — Governance (75 Mana, governance)

**Example:**
```bash
FOUNDER_SECRET=SXXXXXX... \
SIGNER_PUBLIC=GXXXXXX... \
./initialize-contracts.sh testnet

# Choose governance config:
# - Use defaults: y
# - Or customize: n (then enter values)
```

---

### `verify-deployment.sh`

**Purpose:** Verify that all contracts are working correctly

**Usage:**
```bash
./verify-deployment.sh [testnet|mainnet]
```

**What it does:**
- Loads contract addresses from initialization file
- Runs 14+ contract verification tests
- Checks backend health (if deployed)
- Checks frontend configuration
- Tests cross-contract integrations
- Displays summary report

**Tests Performed:**
1. Valocracy name
2. Valocracy founder address
3. Valocracy governor address
4. Valocracy treasury address
5. Valocracy total supply
6. Founder's Mana (should be 105)
7. Founder's level (should be 100)
8. Founder's permanent level (should be 100)
9. Vacancy period constant
10. Governor valocracy address
11. Governor proposal count
12. Treasury valocracy address
13. Treasury governor address
14. Treasury total shares
15. Backend health endpoint
16. Backend profile endpoint
17. Frontend contract configuration
18. Cross-contract integrations

**Example:**
```bash
./verify-deployment.sh testnet

# Output:
# Tests Passed: 18
# Tests Failed: 0
# ✓ All tests passed!
```

---

## Usage Examples

### Scenario 1: New Developer Setup

**Goal:** Get a working local dev environment

```bash
# 1. Clone repository
git clone https://github.com/karn-protocol/karn.git
cd karn

# 2. Run setup script
./scripts/setup-dev.sh

# Follow prompts:
# - Database: Choose Docker PostgreSQL
# - Accept all defaults

# 3. Start development servers
./start-dev.sh

# 4. Visit http://localhost:3000
```

**Time:** 5 minutes
**Result:** Full local dev environment

---

### Scenario 2: Deploy to Testnet

**Goal:** Deploy contracts to Stellar testnet for testing

```bash
# 1. Generate founder keypair
stellar keys generate founder

# 2. Get founder secret
export FOUNDER_SECRET=$(stellar keys show founder | grep "Secret" | awk '{print $3}')

# 3. Fund founder account
FOUNDER_PUBLIC=$(stellar keys address founder)
curl -X POST "https://friendbot.stellar.org?addr=${FOUNDER_PUBLIC}"

# 4. Deploy contracts
cd scripts
./deploy-contracts.sh testnet

# 5. Generate signer keypair
stellar keys generate signer
export SIGNER_PUBLIC=$(stellar keys address signer)

# 6. Initialize contracts
./initialize-contracts.sh testnet

# 7. Verify deployment
./verify-deployment.sh testnet
```

**Time:** 3-5 minutes
**Result:** Contracts deployed and ready

---

### Scenario 3: Production Mainnet Deployment

**Goal:** Deploy to mainnet for production use

**Prerequisites:**
- [ ] Security audit completed
- [ ] All tests passing
- [ ] Testnet tested thoroughly
- [ ] Founder keys in hardware wallet
- [ ] Team sign-off on deployment

```bash
# 1. Load founder secret from hardware wallet
export FOUNDER_SECRET=S...

# 2. Deploy contracts (will show warning)
./deploy-contracts.sh mainnet

# Type: DEPLOY TO MAINNET

# 3. Initialize contracts
./initialize-contracts.sh mainnet

# 4. Verify deployment
./verify-deployment.sh mainnet

# 5. Update production .env files
cp .env.local.mainnet ../dapp-karn-ecosystem/frontend/.env.local
cp .env.backend.mainnet ../dapp-karn-ecosystem/backend/.env

# 6. Deploy backend and frontend
# (Use your hosting provider's deployment process)
```

**Time:** 10-15 minutes
**Result:** Production deployment

---

### Scenario 4: Update Deployed Contracts

**Goal:** Upgrade contracts via governance

```bash
# 1. Build new contract version
cd karn-protocol/contracts
stellar contract build

# 2. Get new WASM hash
NEW_WASM_HASH=$(stellar contract install \
    --wasm target/wasm32-unknown-unknown/release/valocracy.wasm \
    --source founder \
    --network mainnet)

# 3. Create governance proposal for upgrade
stellar contract invoke \
    --id $GOVERNOR_ID \
    --source member \
    --network mainnet \
    -- propose \
    --proposer $MEMBER_ADDRESS \
    --description "Upgrade Valocracy to v1.1.0" \
    --actions "[{
        \"contract\": \"$VALOCRACY_ID\",
        \"function\": \"upgrade\",
        \"args\": [\"$NEW_WASM_HASH\"]
    }]"

# 4. Community votes on proposal

# 5. Execute upgrade after voting period
stellar contract invoke \
    --id $GOVERNOR_ID \
    --network mainnet \
    -- execute \
    --proposal_id 1
```

---

## Troubleshooting

### Common Issues

#### "stellar: command not found"

**Problem:** Stellar CLI not installed

**Solution:**
```bash
cargo install --locked stellar-cli --features opt
```

---

#### "jq: command not found"

**Problem:** jq JSON processor not installed

**Solution:**
```bash
# Ubuntu/Debian
sudo apt-get install jq

# macOS
brew install jq
```

---

#### "Transaction failed: Unauthorized"

**Problem:** Caller lacks permission

**Solution:**
- Verify `FOUNDER_SECRET` is correct
- Check account is funded (testnet friendbot)
- Ensure calling from correct account

---

#### "Error: Deployment file not found"

**Problem:** Running initialization before deployment

**Solution:**
```bash
# Deploy contracts first
./deploy-contracts.sh testnet

# Then initialize
./initialize-contracts.sh testnet
```

---

#### "Permission denied"

**Problem:** Scripts not executable

**Solution:**
```bash
chmod +x scripts/*.sh
```

---

#### "Database connection failed"

**Problem:** PostgreSQL not running

**Solution:**
```bash
# Start Docker container
docker start karn-postgres

# Or check connection string
echo $DATABASE_URL
```

---

### Getting Help

- **Documentation:** `../docs/`
- **GitHub Issues:** [github.com/karn-protocol/karn/issues](https://github.com/karn-protocol/karn/issues)
- **Discord:** [Karn Community](https://discord.gg/karn) (coming soon)
- **Email:** support@karn.io

---

## Script Maintenance

### Testing Scripts

```bash
# Test on testnet first
./deploy-contracts.sh testnet
./initialize-contracts.sh testnet
./verify-deployment.sh testnet

# Verify all tests pass before mainnet
```

### Updating Scripts

When modifying scripts:
1. Update version comments
2. Test on testnet
3. Update this README
4. Commit changes

### Adding New Scripts

1. Create script in `scripts/` directory
2. Add shebang: `#!/bin/bash`
3. Add `set -e` for error handling
4. Add description comments
5. Make executable: `chmod +x script.sh`
6. Document in this README

---

## Security Notes

- Never commit `.dev-keys` or `.env` files
- Use hardware wallet for mainnet founder keys
- Verify all scripts before running with real funds
- Test on testnet first
- Keep scripts up to date

---

## Additional Resources

- **Deployment Guide:** `../docs/guides/CUSTOMIZATION_DEPLOYMENT_GUIDE.md`
- **Contract Reference:** `../docs/contracts/CONTRACT_REFERENCE.md`
- **Getting Started:** `../docs/getting-started/quick-start.md`

---

**Scripts Version:** 1.0.0
**Last Updated:** 2026-02-07
**Maintained By:** Karn Protocol Team
