# Getting Started with Karn Protocol

Welcome to **Karn Protocol** — a merit-based governance system empowering women in Latin America through contribution, not capital.

## Choose Your Path

Select the guide that matches your goals:

### 🎯 [For End Users](#for-end-users)
**I want to participate in the Karn ecosystem**
- Register as a beneficiary or ally
- Earn badges and Mana
- Participate in governance
- Access scholarships

**Time to start**: 5 minutes

---

### 💻 [For Developers](#for-developers)
**I want to build applications using Karn Protocol**
- Integrate the TypeScript SDK
- Connect to Stellar wallets
- Query Mana and badges
- Submit governance proposals

**Time to start**: 15 minutes

---

### 🔧 [For Contributors](#for-contributors)
**I want to contribute to Karn Protocol development**
- Set up local development environment
- Build and test smart contracts
- Submit pull requests
- Follow coding standards

**Time to start**: 30 minutes

---

### 🏢 [For Organizations](#for-organizations)
**I want to deploy Karn for my community**
- Understand deployment requirements
- Customize governance parameters
- Set up backend infrastructure
- Integrate with existing systems

**Time to start**: Read the [Detailed Deployment Guide](#detailed-deployment-guide) below.

---

## For End Users

### Prerequisites

- **Web Browser** (Chrome, Firefox, or Brave)
- **Stellar Wallet** (Freighter, Albedo, Lobstr, xBull, or Rabet)
- **5 minutes** of your time

### Step 1: Install a Stellar Wallet

Choose one wallet to install:

#### Freighter (Recommended)
- **Best for**: Desktop users, developers
- **Features**: Full Soroban support, network switching
- **Install**: [freighter.app](https://freighter.app)

#### Albedo
- **Best for**: Users without extensions
- **Features**: Web-based, no installation needed
- **Visit**: [albedo.link](https://albedo.link)

#### Lobstr
- **Best for**: Mobile-first users
- **Features**: Mobile app + extension
- **Install**: [lobstr.co](https://lobstr.co)

#### xBull
- **Best for**: Advanced users
- **Features**: Modern interface, advanced features
- **Install**: [xbull.app](https://xbull.app)

#### Rabet
- **Best for**: DeFi users
- **Features**: Built-in swap, liquidity pools
- **Install**: [rabet.io](https://rabet.io)

### Step 2: Create Your Wallet

1. Open your chosen wallet
2. Click **"Create New Wallet"**
3. **Write down your secret key** (12 or 24 words)
4. **Store it safely** — you'll need this to recover your account
5. Confirm your secret key

⚠️ **Critical**: Never share your secret key. Karn will never ask for it.

### Step 3: Get Testnet Lumens (XLM)

For testing on Stellar Testnet:

1. Copy your wallet address (starts with `G...`)
2. Visit [Stellar Laboratory Friendbot](https://laboratory.stellar.org/#account-creator?network=test)
3. Paste your address and click **"Get test network lumens"**
4. Wait ~5 seconds for 10,000 test XLM

### Step 4: Visit Karn dApp

1. Go to **[karn.io](https://karn.io)** (or your deployment URL)
2. Click **"Connect Wallet"**
3. Choose your wallet from the list
4. Approve the connection

### Step 5: Register

**For Beneficiaries** (Women in Tech):
1. Click **"Join as Beneficiary"**
2. Fill out the registration form:
   - Name
   - Email
   - Country
   - Tech interests
3. Click **"Register"**
4. Approve the transaction in your wallet
5. Wait ~5 seconds for confirmation

**For Allies** (Supporters):
1. Click **"Join as Ally"**
2. Fill out the form:
   - Name/Organization
   - Email
   - Contribution type (funding, mentorship, etc.)
3. Click **"Register"**
4. Approve the transaction

### Step 6: Explore Your Dashboard

After registration, you'll see:

- **Reputation Score**: Your current Mana (starts at 5)
- **Level**: Your total accumulated level
- **Badges**: Achievements you've earned
- **Active Proposals**: Governance votes you can participate in

### What's Next?

**Earn Your First Badge** 🏆
- Complete a learning path
- Contribute to a project
- Participate in governance

**Participate in Governance** 🗳️
- View active proposals
- Cast your vote (weighted by Mana)
- Create your own proposals

**Access Scholarships** 💰
- Check available scholarship labs
- Apply through guardian approval
- Withdraw funds when approved

**Join a Pod** 👥
- Find mutual support groups
- Collaborate with peers
- Build accountability

### Need Help?

- **Documentation**: [Full User Guide](../../docs/)
- **Discord**: [Karn Community](https://discord.gg/karn) (coming soon)
- **Email**: support@karn.io

---

## For Developers

### Prerequisites

- **Node.js** 18+ ([nodejs.org](https://nodejs.org))
- **npm** or **yarn**
- **Basic TypeScript** knowledge
- **Stellar wallet** (for testing)

### Step 1: Install the SDK

```bash
npm install @karn_lat/protocol-sdk
# or
yarn add @karn_lat/protocol-sdk
```

### Step 2: Set Up Your Project

**TypeScript** (recommended):
```bash
mkdir my-karn-app
cd my-karn-app
npm init -y
npm install @karn_lat/protocol-sdk @stellar/stellar-sdk
npm install -D typescript @types/node
npx tsc --init
```

**JavaScript**:
```bash
mkdir my-karn-app
cd my-karn-app
npm init -y
npm install @karn_lat/protocol-sdk @stellar/stellar-sdk
```

### Step 3: Connect to a Wallet

```typescript
import { WalletManager, WalletType } from '@karn_lat/protocol-sdk';

// Create wallet manager
const walletManager = new WalletManager();

// Get available wallets
const wallets = await walletManager.getAvailableWallets();
console.log('Available wallets:', wallets);

// Connect to Freighter
try {
  const connection = await walletManager.connect(WalletType.FREIGHTER);
  console.log('Connected:', connection.address);
} catch (error) {
  console.error('Connection failed:', error.message);
}
```

### Step 4: Query Mana and Level

```typescript
import { ValocracyClient } from '@karn_lat/protocol-sdk';
import * as StellarSdk from '@stellar/stellar-sdk';

// Initialize client
const client = new ValocracyClient({
  networkPassphrase: 'Test SDF Network ; September 2015',
<<<<<<< HEAD
  contractId: 'REDACTED_CONTRACT_ID_VALOCRACY',
=======
  contractId: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"',
>>>>>>> 257583c5837a1af14efbaa2ea574613bd78df4b0
  rpcUrl: 'https://soroban-testnet.stellar.org',
});

// Get Mana
const address = 'GXXX...'; // User's address
const server = new StellarSdk.rpc.Server('https://soroban-testnet.stellar.org');
const account = await server.getAccount(address);

const tx = client.get_votes({ account: address });
const simulation = await tx.simulate({ account });
const mana = StellarSdk.scValToBigInt(simulation.result.retval);

console.log('Mana:', mana.toString());
```

### Step 5: Sign and Submit a Transaction

```typescript
// Build transaction
const mintTx = client.mint({
  to: address,
  badge_id: 5,
  level: 20,
  is_permanent: false,
});

// Prepare transaction
const builtTx = await mintTx.build(account, {
  fee: '100000',
  networkPassphrase: 'Test SDF Network ; September 2015',
});

// Sign with wallet
const signedXdr = await walletManager.signTransaction(builtTx.toXDR());
const signedTx = StellarSdk.TransactionBuilder.fromXDR(
  signedXdr,
  'Test SDF Network ; September 2015'
);

// Submit to network
const result = await server.sendTransaction(signedTx as StellarSdk.Transaction);
console.log('Transaction hash:', result.hash);
```

### Step 6: Use React Hooks (Optional)

```tsx
import { useMultiWallet, useValocracy } from '@karn_lat/protocol-sdk';

function MyComponent() {
  const { state, connect, disconnect } = useMultiWallet();
  const { mana, level, isLoading } = useValocracy(state.address);

  if (!state.isConnected) {
    return <button onClick={() => connect(WalletType.FREIGHTER)}>Connect</button>;
  }

  return (
    <div>
      <p>Address: {state.address}</p>
      <p>Mana: {mana?.toString()}</p>
      <p>Level: {level?.toString()}</p>
      <button onClick={disconnect}>Disconnect</button>
    </div>
  );
}
```

### What's Next?

**Explore the SDK**:
- [SDK Documentation](../../sdk/README.md)
- [Multi-Wallet Integration](MULTI_WALLET_INTEGRATION.md)
- [API Reference](../../sdk/src/)

**Build Something**:
- Governance dashboard
- Badge leaderboard
- Mana calculator
- Scholarship tracker

**Join the Community**:
- Share your project
- Get help on Discord
- Contribute improvements

### Common Issues

**Issue**: "Wallet not installed"
**Solution**: Install the wallet extension or use Albedo (web-based)

**Issue**: "Transaction failed"
**Solution**: Check network (testnet vs mainnet), ensure sufficient XLM balance

**Issue**: "Module not found"
**Solution**: Ensure proper ESM import syntax (`import { ... } from '@karn_lat/protocol-sdk'`)

---

## For Contributors

### Prerequisites

- **Rust** 1.74+ ([rustup.rs](https://rustup.rs))
- **Node.js** 18+
- **Stellar CLI** ([stellar.org/docs/tools](https://stellar.org/docs/tools))
- **Git** ([git-scm.com](https://git-scm.com))
- **PostgreSQL** (for backend)

### Step 1: Install Stellar CLI

```bash
cargo install --locked stellar-cli --features opt
```

Verify installation:
```bash
stellar --version
```

### Step 2: Clone Repository

```bash
git clone https://github.com/karn-protocol/karn.git
cd karn
```

### Step 3: Set Up Contracts

```bash
cd karn-protocol/contracts

# Build all contracts
stellar contract build

# Run tests
cargo test

# Run specific contract tests
cargo test -p valocracy
```

### Step 4: Set Up SDK

```bash
cd ../sdk

# Install dependencies
npm install

# Build SDK
npm run build

# Run tests
npm test
```

### Step 5: Set Up Backend

```bash
cd ../../dapp-karn-ecosystem/backend

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Push database schema
npx prisma db push

# Start development server
npm run dev
```

### Step 6: Set Up Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Set up environment
cp .env.local.example .env.local
# Edit .env.local with contract addresses

# Start development server
npm run dev
```

Visit **http://localhost:3000**

### Step 7: Make Changes

1. **Read SPRINTS.md** to understand current sprint
2. **Check specs/** for feature specifications
3. **Create branch**: `feat/SPEC-{TYPE}-{NUMBER}-{name}`
4. **Make changes** following coding standards
5. **Write tests** for new functionality
6. **Run tests**: `cargo test` or `npm test`
7. **Build**: `npm run build` or `stellar contract build`

### Step 8: Submit Pull Request

```bash
# Commit changes
git add .
git commit -m "feat(SPEC-FT-XXX): description"

# Push to your fork
git push origin feat/SPEC-FT-XXX-name

# Open PR on GitHub
```

### Coding Standards

**Rust** (Contracts):
- Follow Soroban SDK patterns
- Validate auth before state changes
- Include tests for all public functions

**TypeScript** (SDK/Frontend/Backend):
- Use TypeScript strict mode
- Functional components with hooks
- All user text in i18n (PT/EN/ES)

**Git**:
- Branch: `feat/SPEC-{TYPE}-{NUMBER}-{name}`
- Commit: `feat(SPEC-{TYPE}-{NUMBER}): description`
- Reference spec in PR

### What's Next?

**Explore the Codebase**:
- [Architecture Documentation](../architecture/ARCHITECTURE_DIAGRAMS.md)
- [Core Concepts](../concepts/CORE_CONCEPTS.md)
- [Core Concepts](../concepts/CORE_CONCEPTS.md)

**Find Issues**:
- Check GitHub Issues
- Look for `TODO` in code
- Read SPRINTS.md for planned features

**Get Help**:
- Read `.claude/CLAUDE.md` for project rules
- Ask in Discord
- Comment on relevant issues

---

## For Organizations

### Deployment Options

**Option 1: Use Hosted Karn** (Recommended)
- Visit [karn.io](https://karn.io)
- No technical setup required
- Instant access
- Managed infrastructure

**Option 2: Self-Hosted Deployment**
- Full control over data
- Customize governance parameters
- Deploy on your infrastructure
- Requires technical expertise

### Self-Hosted Requirements

**Infrastructure**:
- **Frontend**: Vercel, Netlify, or any static hosting
- **Backend**: Node.js hosting (AWS, GCP, DigitalOcean)
- **Database**: PostgreSQL 14+ (Supabase recommended)
- **RPC**: Stellar Horizon + Soroban RPC node

**Costs** (estimated):
- Frontend: $0-50/month
- Backend: $10-100/month (depends on usage)
- Database: $5-25/month
- RPC: $0 (public) or $100+/month (private node)

### Deployment Steps

See the comprehensive [Deployment Guide](../guides/CUSTOMIZATION_DEPLOYMENT_GUIDE.md) for:
1. Contract deployment
2. Backend configuration
3. Frontend deployment
4. Database setup
5. Monitoring and maintenance

### Customization

You can customize:
- **Governance Parameters**: Voting period, quorum, timelock
- **Badge System**: Create custom badge types
- **Member Floor**: Adjust minimum Mana (default: 5)
- **Vacancy Period**: Change decay timeline (default: 180 days)
- **UI/UX**: Brand colors, logo, text
- **Languages**: Add new language support

### Support

**Enterprise Support** (coming soon):
- Dedicated technical support
- Custom feature development
- SLA guarantees
- Training for your team

**Contact**: enterprise@karn.io

---

## Quick Reference

### Testnet Addresses

| Contract | Address |
|----------|---------|
<<<<<<< HEAD
| **Valocracy** | `REDACTED_CONTRACT_ID_VALOCRACY` |
| **Governor** | `REDACTED_CONTRACT_ID_GOVERNOR` |
| **Treasury** | `REDACTED_CONTRACT_ID_TREASURY` |
=======
| **Valocracy** | `CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"` |
| **Governor** | `CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"` |
| **Treasury** | `CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"` |
>>>>>>> 257583c5837a1af14efbaa2ea574613bd78df4b0

### Network Configuration

| Network | Passphrase | RPC URL |
|---------|-----------|---------|
| **Testnet** | `Test SDF Network ; September 2015` | `https://soroban-testnet.stellar.org` |
| **Mainnet** | `Public Global Stellar Network ; September 2015` | TBD (after audit) |

### Key Concepts

- **Mana**: Voting power that decays over 180 days
- **Member Floor**: Minimum 5 Mana for all registered members
- **IDNFT**: Soulbound badge (non-transferable)
- **Valocracia**: Governance by contribution, not capital
- **Vacancy Period**: 180 days (15,552,000 seconds)

### Common Commands

```bash
# Build contracts
stellar contract build

# Run contract tests
cargo test

# Build SDK
cd sdk && npm run build

# Run SDK tests
npm test

# Start frontend dev server
cd frontend && npm run dev

# Start backend dev server
cd backend && npm run dev
```

---

<br>

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
   - Install: `npm install @karn_lat/protocol-sdk`
   - React hooks for easy integration
   - TypeScript support

### For Organizations

1. **Customize Your Instance** — [Detailed Deployment Guide](#detailed-deployment-guide) below
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

## Get Help

- **Documentation**: [`../`](../)
- **Examples**: [`../../examples/`](../../examples/)
- **GitHub Issues**: [github.com/karn-protocol/karn/issues](https://github.com/karn-protocol/karn/issues)
- **Discord**: Coming soon

---

<br>
<a id="detailed-deployment-guide"></a>

# Detailed Deployment Guide

This guide covers deploying the 3 core contracts (Valocracy, Governor, Treasury) and full infrastructure for your organization.

## Should You Deploy Your Own?

### ✅ Deploy Your Own If:

- Need complete data sovereignty
- Want custom governance parameters
- Serving a large community (1000+ members)
- Have DevOps expertise in-house
- Need private infrastructure

### ❌ Use Hosted Karn If:

- Small community (<100 members)
- Limited technical resources
- Don't want maintenance overhead
- Testing or prototyping
- Quick start needed

---

## Deployment Overview

### What You'll Deploy

| Component | Purpose | Hosting |
|-----------|---------|---------|
| **Smart Contracts** | Valocracy, Governor, Treasury | Stellar Network (testnet or mainnet) |
| **Backend API** | Express server + PostgreSQL | VPS, DigitalOcean, or Railway |
| **Frontend dApp** | Next.js application | Vercel or static hosting |

### Time Estimates

| Phase | Time | Difficulty |
|-------|------|------------|
| Prerequisites | 15 min | Easy |
| Contract Deployment | 5 min | Easy (automated) |
| Backend Deployment | 20 min | Medium |
| Frontend Deployment | 10 min | Easy |
| **Total** | **50 min** | **Medium** |

---

## Prerequisites (Detailed)

### Required Tools

```bash
# 1. Stellar CLI
cargo install --locked stellar-cli --features opt

# 2. Node.js 18+
node --version  # Should be 18+

# 3. jq (JSON processor)
# Ubuntu/Debian
sudo apt-get install jq

# macOS
brew install jq

# 4. Git
git --version
```

### Required Accounts

1. **Stellar Wallet**
   - Funded account for contract deployment
   - Testnet: Use [friendbot](https://laboratory.stellar.org/#account-creator?network=test)
   - Mainnet: Real XLM required (~100 XLM for deployment)

2. **Backend Hosting** (choose one):
   - [DigitalOcean](https://digitalocean.com) — $5-12/month
   - [Railway](https://railway.app) — Free tier available
   - VPS with Ubuntu 22.04+

3. **Database Hosting** (choose one):
   - [Supabase](https://supabase.com) — Free tier available
   - [Railway PostgreSQL](https://railway.app)
   - Self-hosted PostgreSQL

4. **Frontend Hosting** (choose one):
   - [Vercel](https://vercel.com) — Free tier available
   - [Netlify](https://netlify.com) — Free tier available
   - Static hosting (Cloudflare Pages, GitHub Pages)

---

## Step 1: Deploy Smart Contracts

### 1.1 Clone Repository

```bash
git clone https://github.com/your-org/karn-protocol.git
cd karn-protocol
```

### 1.2 Generate Founder Keypair

```bash
# Generate new keypair for founder
stellar keys generate founder --network testnet

# Save the secret key securely!
stellar keys address founder
# Output: G... (public key)

# Fund account (testnet only)
stellar keys fund founder --network testnet
```

**⚠️ SECURITY WARNING**: Never commit secret keys to version control!

### 1.3 Deploy Contracts

```bash
# Set environment variable
export FOUNDER_SECRET=S...  # Your founder secret key

# Deploy to testnet
./scripts/deploy-contracts.sh testnet

# Or deploy to mainnet (requires confirmation)
./scripts/deploy-contracts.sh mainnet
```

**What this does:**
- Builds all 3 contracts
- Deploys Valocracy → Governor → Treasury
- Saves addresses to `deployed_addresses_testnet.json`

**Expected output:**
```
✅ Valocracy deployed: C...
✅ Governor deployed: C...
✅ Treasury deployed: C...
```

### 1.4 Initialize Contracts

```bash
# Generate backend signer keypair
stellar keys generate signer --network testnet
export SIGNER_PUBLIC=$(stellar keys address signer)

# Initialize contracts
./scripts/initialize-contracts.sh testnet
```

**What this does:**
- Registers 10 default badge types
- Sets governance parameters
- Configures cross-contract relationships
- Auto-generates `.env` files

### 1.5 Verify Deployment

```bash
./scripts/verify-deployment.sh testnet
```

**Expected output:**
```
✅ Contract initialized
✅ Founder has 105 Mana
✅ Member badge registered
✅ Governance parameters set
... (18 total tests)
```

---

## Step 2: Deploy Backend

### 2.1 Set Up Database

**Option A: Supabase (Recommended)**

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Copy database URL from Settings → Database
4. Format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

**Option B: Railway PostgreSQL**

```bash
# Install Railway CLI
npm install -g railway

# Login
railway login

# Create new project
railway init

# Add PostgreSQL
railway add postgresql

# Get connection string
railway variables
```

### 2.2 Configure Backend

```bash
cd backend

# Copy environment template
cp .env.example .env

# Edit .env with your values
nano .env
```

**Required variables:**

```env
# Database
DATABASE_URL=postgresql://...

# Contract addresses (from deployed_addresses_testnet.json)
VALOCRACY_CONTRACT=C...
GOVERNOR_CONTRACT=C...
TREASURY_CONTRACT=C...

# Ed25519 Signer (from step 1.4)
SIGNER_SECRET=S...
SIGNER_PUBLIC=G...

# Network
STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
STELLAR_RPC_URL=https://soroban-testnet.stellar.org

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend-domain.com
```

### 2.3 Push Database Schema

```bash
# Install dependencies
npm install

# Push Prisma schema to database
npx prisma db push

# Verify schema
npx prisma studio
# Opens GUI at http://localhost:5555
```

### 2.4 Deploy Backend

**Option A: Railway**

```bash
# From backend/ directory
railway up

# Set environment variables
railway variables set DATABASE_URL=...
railway variables set SIGNER_SECRET=...
# (set all variables from .env)

# Get backend URL
railway status
# Note the URL (e.g., https://your-app.railway.app)
```

**Option B: DigitalOcean App Platform**

1. Go to [cloud.digitalocean.com](https://cloud.digitalocean.com)
2. Create new App
3. Connect GitHub repository
4. Configure:
   - Source: `backend/`
   - Build Command: `npm run build`
   - Run Command: `npm run start`
5. Add environment variables
6. Deploy

**Option C: VPS (Ubuntu)**

```bash
# SSH into your server
ssh root@your-server-ip

# Install dependencies
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Clone and setup
git clone https://github.com/your-org/karn-protocol.git
cd karn-protocol/backend
npm install
npm run build

# Set environment variables
nano .env
# (paste your configuration)

# Install PM2
npm install -g pm2

# Start backend
pm2 start npm --name "karn-backend" -- run start

# Enable startup on boot
pm2 startup
pm2 save

# Check status
pm2 status
pm2 logs karn-backend
```

### 2.5 Verify Backend

```bash
# Test health endpoint
curl https://your-backend-url/health

# Expected response:
# {"status":"healthy","contracts":{"valocracy":"connected","governor":"connected","treasury":"connected"}}
```

---

## Step 3: Deploy Frontend

### 3.1 Configure Frontend

```bash
cd frontend

# Copy environment template
cp .env.example .env.local

# Edit with your values
nano .env.local
```

**Required variables:**

```env
# Network
NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org

# Contract addresses (from deployed_addresses_testnet.json)
NEXT_PUBLIC_VALOCRACY_CONTRACT=C...
NEXT_PUBLIC_GOVERNOR_CONTRACT=C...
NEXT_PUBLIC_TREASURY_CONTRACT=C...

# Backend URL (from step 2.4)
NEXT_PUBLIC_BACKEND_URL=https://your-backend-url
```

### 3.2 Test Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Visit http://localhost:3000
# Test wallet connection and contract queries
```

### 3.3 Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Add environment variables in Vercel dashboard:
# https://vercel.com/your-org/your-project/settings/environment-variables

# Redeploy for production
vercel --prod
```

**Vercel Dashboard Setup:**
1. Go to your project settings
2. Environment Variables
3. Add all variables from `.env.local`
4. Redeploy

### 3.4 Verify Frontend

1. Visit your deployed URL (e.g., `https://your-app.vercel.app`)
2. Test wallet connection (Freighter/Albedo)
3. Check dashboard displays Mana correctly
4. Verify backend API calls work

---

## Step 4: Final Configuration

### 4.1 Update CORS

Update backend `ALLOWED_ORIGINS` with production frontend URL:

```env
ALLOWED_ORIGINS=https://your-app.vercel.app,https://www.your-domain.com
```

Restart backend after updating.

### 4.2 Custom Domain (Optional)

**Frontend (Vercel):**
1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed

**Backend (Railway):**
1. Go to Project Settings → Domains
2. Add custom domain
3. Configure DNS CNAME record

### 4.3 SSL Certificates

- **Vercel**: Automatic HTTPS
- **Railway**: Automatic HTTPS
- **VPS**: Use [Let's Encrypt](https://letsencrypt.org) with Certbot

---

## Post-Deployment Checklist

### Security

- [ ] All secret keys stored securely (not in version control)
- [ ] HTTPS enabled on all endpoints
- [ ] CORS configured with specific domains (not *)
- [ ] Database has restricted access (not public)
- [ ] Backend rate limiting enabled
- [ ] Founder secret key backed up offline

### Testing

- [ ] Wallet connection works
- [ ] User can view Mana and Level
- [ ] Registration flow completes
- [ ] Proposals can be created
- [ ] Voting works correctly
- [ ] Backend health check passes

### Monitoring

- [ ] Backend logs configured (PM2, Railway, or DigitalOcean)
- [ ] Database backups enabled
- [ ] Uptime monitoring (UptimeRobot, Pingdom)
- [ ] Error tracking (Sentry recommended)

---

## Cost Estimates

### Testnet (Development)

| Service | Provider | Monthly Cost |
|---------|----------|--------------|
| Contracts | Stellar Testnet | **Free** |
| Backend | Railway | **Free** (hobby tier) |
| Database | Supabase | **Free** (500MB) |
| Frontend | Vercel | **Free** |
| **Total** | | **$0** |

### Mainnet (Production)

| Service | Provider | Monthly Cost |
|---------|----------|--------------|
| Contracts | Stellar Mainnet | $1-5 (transaction fees) |
| Backend | Railway Pro | $5 |
| Database | Supabase Pro | $25 |
| Frontend | Vercel Pro | $20 |
| Monitoring | Sentry | $26 |
| **Total** | | **~$77/month** |

---

## Resources

- **Full Deployment Guide**: [`../guides/CUSTOMIZATION_DEPLOYMENT_GUIDE.md`](../guides/CUSTOMIZATION_DEPLOYMENT_GUIDE.md)
- **Contract Reference**: [`../contracts/CONTRACT_REFERENCE.md`](../contracts/CONTRACT_REFERENCE.md)
- **Architecture Diagrams**: [`../architecture/ARCHITECTURE_DIAGRAMS.md`](../architecture/ARCHITECTURE_DIAGRAMS.md)
- **Security Policy**: [`../../SECURITY.md`](../../SECURITY.md)

---

**Last Updated**: 2026-02-07
**Estimated Time**: 50 minutes
