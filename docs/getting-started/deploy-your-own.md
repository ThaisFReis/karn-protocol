# Deploy Your Own Karn Protocol Instance

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

## Prerequisites

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

## Next Steps

1. **Customize Governance** — Modify voting periods, quorum, thresholds
   - See [`../guides/CUSTOMIZATION_DEPLOYMENT_GUIDE.md`](../guides/CUSTOMIZATION_DEPLOYMENT_GUIDE.md)

2. **Add Custom Badges** — Define badge types for your community
   - See [Contract Reference](../contracts/CONTRACT_REFERENCE.md)

3. **Set Up Monitoring** — Configure alerts and logging
   - See Security section in deployment guide

4. **Plan Mainnet Migration** — When ready for production
   - Complete security audit
   - Test thoroughly on testnet
   - Follow mainnet deployment checklist

---

## Troubleshooting

### Contracts deployed but backend can't connect

**Check:**
- Contract addresses in backend `.env` are correct
- Network passphrase matches (testnet vs mainnet)
- RPC URL is accessible from backend server

### Frontend shows "Failed to fetch"

**Check:**
- CORS configured correctly in backend
- Backend URL in frontend `.env.local` is correct
- Backend is running and healthy (`/health` endpoint)

### Database migration fails

**Check:**
- DATABASE_URL is correct and accessible
- Database user has CREATE TABLE permissions
- Prisma schema is valid (`npx prisma validate`)

---

## Resources

- **Full Deployment Guide**: [`../guides/CUSTOMIZATION_DEPLOYMENT_GUIDE.md`](../guides/CUSTOMIZATION_DEPLOYMENT_GUIDE.md)
- **Contract Reference**: [`../contracts/CONTRACT_REFERENCE.md`](../contracts/CONTRACT_REFERENCE.md)
- **Architecture Diagrams**: [`../architecture/ARCHITECTURE_DIAGRAMS.md`](../architecture/ARCHITECTURE_DIAGRAMS.md)
- **Security Policy**: [`../../SECURITY.md`](../../SECURITY.md)

---

**Deploy Your Own Guide Version**: 1.0.0
**Last Updated**: 2026-02-07
**Estimated Time**: 50 minutes
