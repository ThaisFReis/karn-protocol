# Customization and Deployment Guide

**Version**: 1.0.0
**Target Audience**: Organizations, Communities, DevOps Engineers
**Last Updated**: 2026-02-07

## Table of Contents

1. [Overview](#overview)
2. [Deployment Options](#deployment-options)
3. [Prerequisites](#prerequisites)
4. [Environment Configuration](#environment-configuration)
5. [Contract Deployment](#contract-deployment)
6. [Backend Deployment](#backend-deployment)
7. [Frontend Deployment](#frontend-deployment)
8. [Customization Guide](#customization-guide)
9. [Monitoring and Maintenance](#monitoring-and-maintenance)
10. [Security Checklist](#security-checklist)
11. [Troubleshooting](#troubleshooting)

---

# Overview

This guide covers deploying and customizing Karn Protocol for your organization or community. Karn can be deployed in two ways:

1. **Use Hosted Karn** (Recommended) — Managed infrastructure at karn.io
2. **Self-Hosted Deployment** — Full control, your infrastructure

## When to Self-Host

✅ **Good reasons:**
- Need complete data sovereignty
- Want custom governance parameters
- Serving a large community (1000+ members)
- Have DevOps expertise

❌ **Not recommended if:**
- Small community (<100 members)
- Limited technical resources
- Don't want maintenance overhead
- Testing/prototyping only

---

# Deployment Options

## Option 1: Hosted Karn (Recommended)

**Pros:**
- No setup required
- Automatic updates
- Professional monitoring
- Free for small communities

**Cons:**
- Less customization
- Shared infrastructure
- Must trust hosted provider

**Get Started:**
Visit [karn.io](https://karn.io) and sign up for a community account.

---

## Option 2: Self-Hosted

**Pros:**
- Full customization
- Complete data control
- Custom governance parameters
- Private infrastructure

**Cons:**
- Technical expertise required
- Ongoing maintenance
- Higher costs
- You handle security

**Architecture:**
```
                      ┌─────────────────┐
                      │  Stellar Network│
                      │    (Soroban)    │
                      └────────┬────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
     ┌────────▼────────┐ ┌────▼────┐ ┌─────────▼──────┐
     │   Valocracy     │ │Governor │ │   Treasury     │
     │   Contract      │ │Contract │ │   Contract     │
     └────────┬────────┘ └────┬────┘ └─────────┬──────┘
              │                │                │
              └────────────────┼────────────────┘
                               │
                      ┌────────▼────────┐
                      │  Backend API    │
                      │  (Express + DB) │
                      └────────┬────────┘
                               │
                      ┌────────▼────────┐
                      │   Frontend      │
                      │   (Next.js)     │
                      └─────────────────┘
```

---

# Prerequisites

## Development Environment

### Required Software

| Tool | Version | Purpose | Install |
|------|---------|---------|---------|
| **Node.js** | 18+ | Frontend/Backend runtime | [nodejs.org](https://nodejs.org) |
| **Rust** | 1.74+ | Contract compilation | [rustup.rs](https://rustup.rs) |
| **Stellar CLI** | Latest | Contract deployment | `cargo install stellar-cli` |
| **Docker** | Latest | Database (optional) | [docker.com](https://docker.com) |
| **Git** | Latest | Version control | [git-scm.com](https://git-scm.com) |

### Optional Tools

- **PostgreSQL** 14+ (or use Supabase)
- **Vercel CLI** (for deployment)
- **PM2** (for process management)

---

## Infrastructure Requirements

### Minimum Specifications

| Component | Specs | Estimated Cost |
|-----------|-------|----------------|
| **Frontend** | Static hosting (Vercel/Netlify) | $0-25/mo |
| **Backend** | 1 vCPU, 1GB RAM | $10-25/mo |
| **Database** | PostgreSQL (Supabase free tier) | $0-25/mo |
| **RPC Node** | Public Stellar RPC | $0 |
| **Total** | - | **$10-75/month** |

### Recommended Specifications (500+ users)

| Component | Specs | Estimated Cost |
|-----------|-------|----------------|
| **Frontend** | Static hosting with CDN | $25-50/mo |
| **Backend** | 2 vCPU, 4GB RAM | $40-100/mo |
| **Database** | Managed PostgreSQL (Supabase Pro) | $25-50/mo |
| **RPC Node** | Dedicated Stellar RPC (optional) | $100+/mo |
| **Total** | - | **$90-300/month** |

---

## Service Providers

### Frontend Hosting

**Vercel** (Recommended)
- Free tier: 100GB bandwidth
- Automatic deployments from Git
- Built-in CDN
- **Setup**: Connect GitHub repo, deploy

**Netlify**
- Free tier: 100GB bandwidth
- Similar features to Vercel
- Great for static sites

### Backend Hosting

**DigitalOcean App Platform**
- $10/month starter
- Managed Node.js hosting
- Auto-scaling

**Railway**
- Usage-based pricing
- Simple deployment
- PostgreSQL included

**AWS/GCP/Azure**
- Enterprise-grade
- More complex setup
- Higher costs

### Database

**Supabase** (Recommended)
- Free tier: 500MB
- PostgreSQL + Auth + Storage
- Great developer experience
- **Setup**: Create project, copy connection string

**Neon**
- Serverless PostgreSQL
- Free tier available
- Auto-scaling

---

# Environment Configuration

## Step 1: Clone Repository

```bash
git clone https://github.com/karn-protocol/karn.git
cd karn
```

## Step 2: Configure Environment Variables

### Frontend `.env.local`

```bash
# Network Configuration
NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org

# Contract Addresses (Deploy contracts first, then fill these)
NEXT_PUBLIC_VALOCRACY_CONTRACT=
NEXT_PUBLIC_GOVERNOR_CONTRACT=
NEXT_PUBLIC_TREASURY_CONTRACT=

# Backend API
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001

# Optional: Analytics
NEXT_PUBLIC_GA_ID=
```

### Backend `.env`

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/karn

# Ed25519 Signer for Registration
# Generate with: stellar keys generate signer
SIGNER_SECRET=S...
SIGNER_PUBLIC=G...

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# Network
STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
STELLAR_RPC_URL=https://soroban-testnet.stellar.org

# Contracts (fill after deployment)
VALOCRACY_CONTRACT=
GOVERNOR_CONTRACT=
TREASURY_CONTRACT=

# Optional: Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

# Contract Deployment

## Step 1: Build Contracts

```bash
cd karn-protocol/contracts

# Build all contracts
stellar contract build

# Verify WASM files created
ls -lh target/wasm32-unknown-unknown/release/*.wasm
```

**Expected Output:**
```
valocracy.wasm    ~150KB
governor.wasm     ~80KB
treasury.wasm     ~90KB
```

---

## Step 2: Deploy to Testnet

### Deploy Valocracy

```bash
# Deploy contract
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/valocracy.wasm \
  --source founder-secret \
  --network testnet

# Output: CONTRACT_ID (save this!)
<<<<<<< HEAD
# Example: REDACTED_CONTRACT_ID_VALOCRACY
=======
# Example: CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
>>>>>>> 257583c5837a1af14efbaa2ea574613bd78df4b0
```

### Deploy Governor

```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/governor.wasm \
  --source founder-secret \
  --network testnet

# Output: GOVERNOR_CONTRACT_ID
```

### Deploy Treasury

```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/treasury.wasm \
  --source founder-secret \
  --network testnet

# Output: TREASURY_CONTRACT_ID
```

---

## Step 3: Initialize Contracts

### Generate Signer Key

```bash
# Generate backend signer keypair
stellar keys generate signer

# Output:
# Secret key: S...
# Public key: G...

# Save both to backend .env
```

### Initialize Valocracy

```bash
stellar contract invoke \
  --id VALOCRACY_CONTRACT_ID \
  --source founder-secret \
  --network testnet \
  -- initialize \
<<<<<<< HEAD
  --founder REDACTED_WALLET_ADDRESS_FOUNDER \
=======
  --founder GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" \
>>>>>>> 257583c5837a1af14efbaa2ea574613bd78df4b0
  --governor GOVERNOR_CONTRACT_ID \
  --treasury TREASURY_CONTRACT_ID \
  --member_valor_id 0 \
  --valor_ids '[0, 1, 10, 11, 20, 60, 70]' \
  --valor_rarities '[5, 100, 50, 50, 20, 10, 75]' \
  --valor_metadatas '["Member", "Founder", "Lideranca", "Guardian Mentor", "Learning Path", "Community", "Governance"]' \
  --founder_valor_id 1 \
  --signer SIGNER_PUBLIC_KEY_BYTES
```

**valor_ids Explanation:**
- `0`: Member Badge (self-registration)
- `1`: Founder Badge (permanent)
- `10`: Lideranca (Leadership)
- `11`: Guardian Mentor
- `20`: Learning Path Track Badge
- `60`: Community Badge
- `70`: Governance Badge

### Initialize Governor

```bash
stellar contract invoke \
  --id GOVERNOR_CONTRACT_ID \
  --source founder-secret \
  --network testnet \
  -- initialize \
  --valocracy VALOCRACY_CONTRACT_ID \
  --voting_delay 86400 \
  --voting_period 604800 \
  --quorum_percentage 51 \
  --proposal_threshold 10
```

**Governance Parameters:**
- `voting_delay`: 86400 seconds (1 day)
- `voting_period`: 604800 seconds (7 days)
- `quorum_percentage`: 51% quorum required
- `proposal_threshold`: 10 Mana to create proposals

### Initialize Treasury

```bash
stellar contract invoke \
  --id TREASURY_CONTRACT_ID \
  --source founder-secret \
  --network testnet \
  -- initialize \
  --valocracy VALOCRACY_CONTRACT_ID \
  --governor GOVERNOR_CONTRACT_ID \
  --asset_token USDC_CONTRACT_ADDRESS
```

**Asset Token:**
- Use Stellar USDC contract for testnet
- Mainnet: Use official USDC asset

---

## Step 4: Verify Deployment

```bash
# Check Valocracy founder
stellar contract invoke \
  --id VALOCRACY_CONTRACT_ID \
  --network testnet \
  -- founder

# Output should be founder address

# Check Governor valocracy address
stellar contract invoke \
  --id GOVERNOR_CONTRACT_ID \
  --network testnet \
  -- valocracy

# Check founder's Mana (should be 105 = 5 floor + 100 permanent)
stellar contract invoke \
  --id VALOCRACY_CONTRACT_ID \
  --network testnet \
  -- get_votes \
<<<<<<< HEAD
  --account REDACTED_WALLET_ADDRESS_FOUNDER
=======
  --account GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
>>>>>>> 257583c5837a1af14efbaa2ea574613bd78df4b0
```

---

## Step 5: Update Environment Files

Add contract addresses to:
- `frontend/.env.local` → `NEXT_PUBLIC_*_CONTRACT`
- `backend/.env` → `*_CONTRACT`

---

# Backend Deployment

## Step 1: Set Up Database

### Using Supabase (Recommended)

1. Create project at [supabase.com](https://supabase.com)
2. Copy connection string from Settings → Database
3. Add to `backend/.env` as `DATABASE_URL`

### Using Docker (Local)

```bash
docker run -d \
  --name karn-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=karn \
  -p 5432:5432 \
  postgres:14-alpine

# Connection string:
# postgresql://postgres:password@localhost:5432/karn
```

---

## Step 2: Push Database Schema

```bash
cd dapp-karn-ecosystem/backend

# Install dependencies
npm install

# Push schema to database
npx prisma db push

# Verify tables created
npx prisma studio  # Opens browser GUI
```

**Expected Tables:**
- `User` — User profiles
- `Vouch` — Vouching system
- `Lab` — Scholarship labs
- `LearningPath` — Education tracks
- `Module` — Learning modules
- `Bounty` — Karn Works bounties

---

## Step 3: Deploy Backend

### Option A: DigitalOcean App Platform

```bash
# 1. Push to GitHub
git push origin main

# 2. In DigitalOcean:
#    - Create New App
#    - Connect GitHub repo
#    - Select backend/ directory
#    - Add environment variables from .env
#    - Deploy

# 3. Note the app URL (e.g., https://karn-backend-xxxxx.ondigitalocean.app)
# 4. Update frontend NEXT_PUBLIC_BACKEND_URL
```

### Option B: Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create project
railway init

# Add service
railway link

# Add environment variables
railway variables set DATABASE_URL=...
railway variables set SIGNER_SECRET=...
# (Add all .env variables)

# Deploy
railway up

# Note the deployment URL
```

### Option C: VPS (Ubuntu)

```bash
# SSH to server
ssh user@your-server.com

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Clone repo
git clone https://github.com/your-org/karn.git
cd karn/dapp-karn-ecosystem/backend

# Install dependencies
npm install

# Create .env file
nano .env
# (Paste environment variables)

# Build
npm run build

# Start with PM2
pm2 start dist/index.js --name karn-backend

# Save PM2 config
pm2 save
pm2 startup  # Follow instructions

# Set up Nginx reverse proxy (optional)
sudo apt install nginx
sudo nano /etc/nginx/sites-available/karn
```

**Nginx Config:**
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Step 4: Verify Backend

```bash
# Test health endpoint
curl https://your-backend-url.com/health

# Expected: {"status":"ok"}

# Test profile endpoint
curl https://your-backend-url.com/api/profile/GADDRESS...

# Should return profile or 404 if not exists
```

---

# Frontend Deployment

## Step 1: Update Environment

```bash
cd dapp-karn-ecosystem/frontend

# Edit .env.local
nano .env.local

# Update:
NEXT_PUBLIC_VALOCRACY_CONTRACT=<your-contract-id>
NEXT_PUBLIC_GOVERNOR_CONTRACT=<your-contract-id>
NEXT_PUBLIC_TREASURY_CONTRACT=<your-contract-id>
NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.com
```

---

## Step 2: Deploy to Vercel

### Method 1: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts:
# - Link to existing project or create new
# - Set root directory to: dapp-karn-ecosystem/frontend
# - Override build command: npm run build
# - Override output directory: .next

# Production deployment
vercel --prod
```

### Method 2: GitHub Integration

1. Push code to GitHub
2. Visit [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repo
5. Configure:
   - Root Directory: `dapp-karn-ecosystem/frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`
6. Add environment variables (copy from `.env.local`)
7. Deploy

---

## Step 3: Custom Domain (Optional)

### In Vercel:

1. Go to Project Settings → Domains
2. Add your domain (e.g., `karn.yourdomain.com`)
3. Add DNS records (Vercel provides instructions)
4. Wait for SSL certificate provisioning (~5 minutes)

### DNS Records:

**A Record:**
```
Name: karn (or @)
Value: 76.76.21.21 (Vercel IP)
TTL: 300
```

**AAAA Record (IPv6):**
```
Name: karn
Value: 2606:4700:10::ac43:1015
TTL: 300
```

---

## Step 4: Verify Deployment

```bash
# Visit your deployed URL
open https://your-app.vercel.app

# Test:
# 1. Landing page loads
# 2. Connect wallet works
# 3. Registration flow works
# 4. Dashboard displays correct data
```

---

# Customization Guide

## Governance Parameters

### Voting Period

**Default**: 7 days

**Change via Governance:**
```typescript
// Create proposal to update config
const actions = [{
  contract: governorAddress,
  function: 'update_config',
  args: [
    86400,    // voting_delay (1 day)
    1209600,  // voting_period (14 days) ← CHANGE THIS
    51,       // quorum_percentage
    10,       // proposal_threshold
  ],
}];

const proposalId = await governor.propose({
  proposer: founderAddress,
  description: 'Increase voting period to 14 days',
  actions,
});

// Vote and execute
```

**Considerations:**
- Longer period = more participation, slower decisions
- Shorter period = faster decisions, risk of low turnout
- Minimum: 1 day

---

### Quorum Percentage

**Default**: 51%

**Recommended Values:**
- Small community (<50): 30-40%
- Medium community (50-500): 40-50%
- Large community (500+): 50-60%

**Change:** Same as voting period (via `update_config`)

---

### Proposal Threshold

**Default**: 10 Mana

**Recommended Values:**
- Open community: 5-10 Mana
- Selective community: 15-25 Mana
- Expert-only: 50+ Mana

**Change:** Same as voting period

---

## Badge System

### Add New Badge Type

**Example**: Add "Code Contributor" badge

```bash
# 1. Choose badge ID (Track badges: 20-59)
BADGE_ID=25
BADGE_RARITY=30  # Voting power
BADGE_NAME="Code Contributor"

# 2. Create governance proposal
stellar contract invoke \
  --id GOVERNOR_CONTRACT_ID \
  --source member-with-10-mana \
  --network testnet \
  -- propose \
  --proposer MEMBER_ADDRESS \
  --description "Add Code Contributor badge for open source contributions" \
  --actions '[{
    "contract": "'$VALOCRACY_CONTRACT_ID'",
    "function": "set_valor",
    "args": ['$BADGE_ID', '$BADGE_RARITY', "'$BADGE_NAME'"]
  }]'

# 3. Vote on proposal (need quorum + majority)

# 4. Execute proposal after voting period
```

### Badge Metadata in Backend

```typescript
// backend/src/routes/badges.ts
const badgeMetadata = {
  25: {
    name: 'Code Contributor',
    description: 'Contributed to Karn codebase',
    icon: 'code',
    category: 'Track',
    requirements: [
      'Submit PR to Karn repository',
      'PR merged by maintainer',
    ],
  },
};
```

---

## UI Customization

### Branding

**Colors** (`frontend/tailwind.config.js`):
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#your-primary-color',
        secondary: '#your-secondary-color',
        accent: '#your-accent-color',
      },
    },
  },
};
```

**Logo** (`frontend/public/logo.svg`):
- Replace with your logo
- Update imports in `Sidebar.tsx`, `LandingPage.tsx`

**Favicon** (`frontend/public/favicon.ico`)

---

### Text Content

**Manifesto** (`frontend/src/locales/*.ts`):
```typescript
export const en = {
  onboarding: {
    manifesto: {
      title: 'Your Community Manifesto',
      content: 'Your custom manifesto text...',
    },
  },
};
```

**Landing Page** (`frontend/src/app/page.tsx`):
- Edit hero section
- Update "How It Works" content
- Customize ecosystem section

---

### Languages

**Add New Language:**

```bash
# 1. Create locale file
cp frontend/src/locales/en.ts frontend/src/locales/fr.ts

# 2. Translate all keys
# frontend/src/locales/fr.ts
export const fr = {
  nav: {
    home: 'Accueil',
    about: 'À propos',
    // ... translate all keys
  },
};

# 3. Update LanguageContext
# frontend/src/contexts/LanguageContext.tsx
import { fr } from '../locales/fr';

const translations = {
  pt: pt,
  en: en,
  es: es,
  fr: fr,  // Add French
};

type Language = 'pt' | 'en' | 'es' | 'fr';
```

---

## Scholarship Labs

### Configure Labs

**Backend** (`backend/src/routes/labs.ts`):
```typescript
// Seed initial labs
const labs = [
  {
    id: 1,
    name: 'Your Organization Scholarship',
    description: 'Support women in tech',
    amount: 10000_000000, // 10,000 USDC
    available: 10000_000000,
    currency: 'USDC',
  },
];
```

**Fund Lab** (via Treasury contract):
```bash
stellar contract invoke \
  --id TREASURY_CONTRACT_ID \
  --source funder \
  --network testnet \
  -- fund_lab \
  --funder FUNDER_ADDRESS \
  --lab_id 1 \
  --amount 10000000000  # 10,000 USDC (6 decimals)
```

---

## Member Floor Customization

**Default**: 5 Mana

**To Change** (requires contract redeployment):

```rust
// contracts/valocracy/src/lib.rs
pub const MEMBER_FLOOR: u64 = 10;  // Change to 10
```

**Rebuild and redeploy:**
```bash
stellar contract build
stellar contract deploy --wasm valocracy.wasm --source founder --network testnet
# Re-initialize with new contract ID
```

**Note**: This is a fundamental constant. Changing it affects all Mana calculations. Only do this before mainnet launch or via governance-controlled upgrade.

---

## Vacancy Period Customization

**Default**: 180 days (15,552,000 seconds)

**To Change**:
```rust
// contracts/valocracy/src/lib.rs
pub const VACANCY_PERIOD: u64 = 90 * 24 * 60 * 60;  // 90 days
```

**Impact:**
- Shorter period = badges decay faster (more active participation needed)
- Longer period = badges decay slower (less pressure to stay active)

**Recommendation**: Keep at 180 days for mainnet, adjust for testnet experimentation

---

# Monitoring and Maintenance

## Health Checks

### Backend Health Endpoint

```typescript
// backend/src/routes/health.ts
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    uptime: process.uptime(),
  });
});
```

**Monitor:**
```bash
# Cron job to check health every 5 minutes
*/5 * * * * curl -f https://your-backend/health || echo "Backend down!"
```

### Database Monitoring

**Supabase:**
- Built-in monitoring dashboard
- Query performance insights
- Connection pooling stats

**Self-Hosted PostgreSQL:**
```bash
# Install pg_stat_statements
sudo -u postgres psql -c "CREATE EXTENSION pg_stat_statements;"

# View slow queries
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;
```

---

## Logging

### Backend Logs

**Using Winston:**
```typescript
// backend/src/lib/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Use in routes
logger.info('User registered', { address: userAddress });
logger.error('Failed to mint badge', { error: err.message });
```

**View Logs:**
```bash
# Real-time
tail -f backend/combined.log

# Errors only
tail -f backend/error.log
```

---

### Frontend Monitoring

**Vercel Analytics:**
- Enable in Project Settings
- View page views, performance metrics
- Free for personal projects

**Sentry (Error Tracking):**
```bash
npm install @sentry/nextjs

# Follow Sentry setup wizard
npx @sentry/wizard -i nextjs
```

---

## Backups

### Database Backups

**Supabase:**
- Automatic daily backups (Pro plan)
- Manual backups via dashboard

**Self-Hosted:**
```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
pg_dump -h localhost -U postgres karn > backup_$DATE.sql
gzip backup_$DATE.sql

# Upload to S3 (optional)
aws s3 cp backup_$DATE.sql.gz s3://your-bucket/backups/

# Keep only last 30 days
find . -name "backup_*.sql.gz" -mtime +30 -delete
```

**Cron:**
```bash
# Run daily at 2 AM
0 2 * * * /path/to/backup.sh
```

---

### Contract State Backups

**Export User Data:**
```bash
# Script to export all user levels
stellar contract invoke \
  --id VALOCRACY_CONTRACT_ID \
  --network testnet \
  -- level_of \
  --account ADDRESS > user_levels.json

# Repeat for all users
```

**Note**: Contract state lives on Stellar blockchain, which is automatically backed up by validators. Focus on off-chain data (database, backend).

---

## Updates and Upgrades

### Backend Updates

```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install

# Push schema changes
npx prisma db push

# Restart service
pm2 restart karn-backend

# Verify
curl https://your-backend/health
```

### Frontend Updates

```bash
# Vercel auto-deploys on git push
git push origin main

# Or manual deploy
vercel --prod
```

### Contract Upgrades

**Via Governance:**
```typescript
// 1. Build new contract version
// 2. Get WASM hash
// 3. Create proposal

const newWasmHash = '0x123...';

const actions = [{
  contract: valocracyAddress,
  function: 'upgrade',
  args: [newWasmHash],
}];

const proposalId = await governor.propose({
  proposer: memberAddress,
  description: 'Upgrade Valocracy to v1.1.0 with bug fixes',
  actions,
});

// 4. Community votes
// 5. Execute upgrade
```

---

# Security Checklist

## Pre-Deployment

- [ ] **Contracts audited** by professional security firm
- [ ] **Environment variables** never committed to Git
- [ ] **CORS origins** restricted to your domain only
- [ ] **Database credentials** using strong passwords
- [ ] **Rate limiting** enabled on all API endpoints
- [ ] **HTTPS/SSL** enabled for all services
- [ ] **Signature verification** working for registration
- [ ] **Nonce tracking** preventing replay attacks

## Post-Deployment

- [ ] **Monitoring** set up for uptime and errors
- [ ] **Backups** automated and tested
- [ ] **Founder keys** secured in hardware wallet
- [ ] **Backend signer key** secured (never exposed)
- [ ] **Bug bounty** program launched
- [ ] **Incident response** plan documented
- [ ] **Security updates** process defined

## Ongoing

- [ ] **Dependencies** updated monthly
- [ ] **Security patches** applied immediately
- [ ] **Access logs** reviewed weekly
- [ ] **Database queries** optimized for performance
- [ ] **User feedback** collected for improvements

---

# Troubleshooting

## Common Issues

### "Transaction Failed: Unauthorized"

**Cause:** Caller lacks permission for operation

**Fix:**
1. Check if operation requires governor auth
2. Verify governance proposal was executed
3. Ensure correct address is calling function

### "Signature Verification Failed"

**Cause:** Backend signature doesn't match

**Fix:**
1. Verify `SIGNER_PUBLIC` in backend .env matches contract
2. Check signature payload format (account || valor_id || nonce || expiry)
3. Ensure nonce is unique and not expired

### "Database Connection Error"

**Cause:** Database unreachable or credentials wrong

**Fix:**
1. Check `DATABASE_URL` format: `postgresql://user:pass@host:5432/db`
2. Verify database is running: `psql $DATABASE_URL`
3. Check firewall rules allow connection

### "Contract Not Found"

**Cause:** Contract ID wrong or not deployed

**Fix:**
1. Verify contract ID in `.env` files
2. Check contract exists: `stellar contract invoke --id CONTRACT_ID --network testnet -- name`
3. Ensure using correct network (testnet vs mainnet)

### "Frontend Shows 'Loading...' Forever"

**Cause:** Backend API unreachable or CORS issue

**Fix:**
1. Check `NEXT_PUBLIC_BACKEND_URL` is correct
2. Verify backend is running and healthy
3. Check CORS `ALLOWED_ORIGINS` includes frontend domain
4. Open browser console for errors

### "Wallet Connection Fails"

**Cause:** Wallet not installed or network mismatch

**Fix:**
1. Install Freighter/Albedo/Lobstr wallet extension
2. Switch wallet to correct network (Testnet/Mainnet)
3. Refresh page after installing wallet

---

## Getting Help

### Community Support

- **Discord**: [Karn Community](https://discord.gg/karn) (coming soon)
- **GitHub Issues**: [github.com/karn-protocol/karn/issues](https://github.com/karn-protocol/karn/issues)
- **Email**: support@karn.io

### Enterprise Support

For organizations deploying Karn:
- Dedicated technical support
- Custom feature development
- SLA guarantees
- Training for your team

**Contact**: enterprise@karn.io

---

## Deployment Checklist

### Pre-Launch

- [ ] Contracts built and tested
- [ ] Contracts deployed to testnet
- [ ] Contracts initialized correctly
- [ ] Backend deployed and healthy
- [ ] Frontend deployed and accessible
- [ ] Database schema pushed
- [ ] Environment variables configured
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificates active
- [ ] Monitoring and logging enabled

### Launch Day

- [ ] Announce to community
- [ ] Monitor error logs
- [ ] Test registration flow
- [ ] Test wallet connection
- [ ] Test governance flow
- [ ] Verify backend responding
- [ ] Check database performance
- [ ] Have founder available for issues

### Post-Launch

- [ ] Collect user feedback
- [ ] Monitor key metrics (registrations, proposals, votes)
- [ ] Plan first governance vote
- [ ] Set up regular backups
- [ ] Document any custom configurations
- [ ] Update documentation for community

---

# Appendix

## Useful Commands

```bash
# Check contract balance
stellar contract invoke --id CONTRACT_ID --network testnet -- total_supply

# Query user Mana
stellar contract invoke --id VALOCRACY_ID --network testnet -- get_votes --account ADDRESS

# List all proposals
stellar contract invoke --id GOVERNOR_ID --network testnet -- proposal_count

# Check backend health
curl https://your-backend/health

# View backend logs (PM2)
pm2 logs karn-backend

# View database connections (Supabase)
# Visit: https://app.supabase.com/project/_/settings/database

# Restart backend
pm2 restart karn-backend

# Deploy frontend to production
vercel --prod
```

---

## Further Reading

- **Stellar Documentation**: [developers.stellar.org](https://developers.stellar.org)
- **Soroban Docs**: [soroban.stellar.org](https://soroban.stellar.org)
- **Next.js Deployment**: [nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)
- **Prisma Guides**: [prisma.io/docs](https://prisma.io/docs)
- **Contract Reference**: `CONTRACT_REFERENCE.md`
- **Core Concepts**: `CORE_CONCEPTS.md`

---

**Customization and Deployment Guide Version**: 1.0.0
**Last Updated**: 2026-02-07
**Maintained By**: Karn Protocol Team
