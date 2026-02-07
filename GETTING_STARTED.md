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

**Time to start**: Read the [Deployment Guide](DEPLOYMENT_OPERATIONS.md)

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

- **Documentation**: [Full User Guide](USER_GUIDE.md)
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
npm install @karn/protocol-sdk
# or
yarn add @karn/protocol-sdk
```

### Step 2: Set Up Your Project

**TypeScript** (recommended):
```bash
mkdir my-karn-app
cd my-karn-app
npm init -y
npm install @karn/protocol-sdk @stellar/stellar-sdk
npm install -D typescript @types/node
npx tsc --init
```

**JavaScript**:
```bash
mkdir my-karn-app
cd my-karn-app
npm init -y
npm install @karn/protocol-sdk @stellar/stellar-sdk
```

### Step 3: Connect to a Wallet

```typescript
import { WalletManager, WalletType } from '@karn/protocol-sdk';

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
import { ValocracyClient } from '@karn/protocol-sdk';
import * as StellarSdk from '@stellar/stellar-sdk';

// Initialize client
const client = new ValocracyClient({
  networkPassphrase: 'Test SDF Network ; September 2015',
  contractId: 'REDACTED_CONTRACT_ID_VALOCRACY',
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
import { useMultiWallet, useValocracy } from '@karn/protocol-sdk';

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
- [SDK Documentation](../karn-protocol/sdk/README.md)
- [Multi-Wallet Integration](MULTI_WALLET_INTEGRATION.md)
- [API Reference](../karn-protocol/sdk/src/)

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
**Solution**: Ensure proper ESM import syntax (`import { ... } from '@karn/protocol-sdk'`)

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
- [Architecture Documentation](TECHNICAL_ARCHITECTURE.md)
- [Core Concepts](CORE_CONCEPTS.md)
- [Specification Index](../specs/INDEX.md)

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

See the comprehensive [Deployment Guide](DEPLOYMENT_OPERATIONS.md) for:
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
| **Valocracy** | `REDACTED_CONTRACT_ID_VALOCRACY` |
| **Governor** | `REDACTED_CONTRACT_ID_GOVERNOR` |
| **Treasury** | `REDACTED_CONTRACT_ID_TREASURY` |

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

## Resources

### Documentation
- [Whitepaper](Whitepaper_Karn.md)
- [Core Concepts](CORE_CONCEPTS.md)
- [User Guide](USER_GUIDE.md)
- [Developer Guide](DEVELOPER_GUIDE.md)
- [API Reference](../karn-protocol/sdk/)

### Community
- **Website**: [karn.io](https://karn.io)
- **GitHub**: [@karn-protocol](https://github.com/karn-protocol)
- **Discord**: [Karn Community](https://discord.gg/karn) (coming soon)
- **Twitter**: [@KarnProtocol](https://twitter.com/KarnProtocol) (coming soon)

### Support
- **Email**: support@karn.io
- **GitHub Issues**: [Report bugs](https://github.com/karn-protocol/karn/issues)
- **Documentation**: [Full docs](../Docs/)

---

## Next Steps

**Choose your path above and start building with Karn Protocol!**

- 🎯 [End Users](#for-end-users) — Start using Karn in 5 minutes
- 💻 [Developers](#for-developers) — Build apps with the SDK
- 🔧 [Contributors](#for-contributors) — Help build Karn Protocol
- 🏢 [Organizations](#for-organizations) — Deploy for your community

**Welcome to the Valocracia movement! 🚀**
