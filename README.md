# Karn Protocol

> **Contribution-based governance on Stellar/Soroban**
> Where power = contribution, not capital

[![npm version](https://img.shields.io/npm/v/@karn_lat/protocol-sdk.svg?style=flat&color=purple)](https://www.npmjs.com/package/@karn_lat/protocol-sdk)
[![npm downloads](https://img.shields.io/npm/dm/@karn_lat/protocol-sdk.svg?style=flat&color=purple)](https://www.npmjs.com/package/@karn_lat/protocol-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Security: Hardened](https://img.shields.io/badge/Security-Hardened-green.svg)](docs/SECURITY_HARDENING.md)
[![Tests: 53 Passing](https://img.shields.io/badge/Tests-53%20passing-brightgreen.svg)](docs/reports/TESTING_SUMMARY.md)
[![Stellar: Soroban](https://img.shields.io/badge/Stellar-Soroban-blue.svg)](https://soroban.stellar.org)

---

## Installation

```bash
npm install @karn_lat/protocol-sdk
```

Or with yarn:
```bash
yarn add @karn_lat/protocol-sdk
```

---

## What is Karn Protocol?

Karn Protocol is **open-source governance infrastructure** that replaces plutocracy (1 token = 1 vote) with **merit-based voting**. Your influence comes from verified contributions, not your wallet balance.

**Built for:** DAOs, cooperatives, community organizations, and any group that values contribution over capital.

### Core Principles

**Valocracy = Value-Based Democracy**
- 🏆 **Contribution > Capital** - Earn influence through verified work, not token purchases
- ⏱️ **Stay Active** - Voting power decays over 180 days of inactivity
- 🔒 **Soulbound Identity** - Non-transferable badges prove your contributions
- 🗳️ **Community Control** - All treasury operations require governance approval

---

## Features

### 🎫 Soulbound Tokens (SBTs)
- Non-transferable NFTs proving contributions
- Each badge grants "Mana" (voting power)
- Automatic decay ensures active participation

### 📊 Mana System
- Voting power based on contribution, not holdings
- Linear decay over 180 days
- Minimum floor of 5 Mana for all members
- Can't be bought, sold, or transferred

### 🏛️ On-Chain Governance
- Create proposals (requires minimum Mana)
- Vote with Mana-weighted power
- Execute approved proposals automatically
- Snapshot-based voting (no manipulation)

### 💰 Community Treasury
- Transparent fund management
- All withdrawals require governance votes
- Built-in scholarship system
- No individual access, only collective decisions

### 🔐 Security Hardened
- ✅ All 5 security vulnerabilities resolved
- ✅ 53 tests passing (100% coverage on fixes)
- ✅ Industry-standard best practices
- ✅ Ready for external audit

---

## Architecture

Karn Protocol consists of **3 modular smart contracts**:

```
┌──────────────────────────────────────────────────┐
│                  Karn Protocol                   │
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌────────┐  │
│  │  Valocracy   │  │   Governor   │  │Treasury│  │
│  │              │  │              │  │        │  │
│  │ • Identity   │←→│ • Proposals  │←→│• Vault │  │
│  │ • Badges     │  │ • Voting     │  │• Funds │  │
│  │ • Mana       │  │ • Execution  │  │        │  │
│  └──────────────┘  └──────────────┘  └────────┘  │
│                                                  │
└──────────────────────────────────────────────────┘
```

### 1. Valocracy Contract
**Identity, Badges & Voting Power**
- Soulbound token management
- Mana calculation with decay
- Member registration
- Historical voting power queries

### 2. Governor Contract
**Proposals, Voting & Execution**
- Proposal creation (with threshold)
- Snapshot-based voting
- Participation & approval thresholds
- Cross-contract execution

### 3. Treasury Contract
**Asset Management & Governance**
- Community-controlled vault
- Governance-approved transfers
- Scholarship escrow system
- Transparent accounting

---

## Quick Start

### Prerequisites
```bash
# Install Stellar CLI
cargo install --locked stellar-cli --features opt

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add WASM target
rustup target add wasm32-unknown-unknown
```

### Build Contracts
```bash
cd contracts
stellar contract build
```

### Run Tests
```bash
# All contracts
cargo test

# Specific contract
cargo test -p valocracy
cargo test -p governor
cargo test -p treasury
```

### Deploy to Testnet
```bash
# Deploy Valocracy
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/valocracy.wasm \
  --network testnet

# Deploy Governor
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/governor.wasm \
  --network testnet

# Deploy Treasury
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/treasury.wasm \
  --network testnet
```

**Full deployment guide:** [docs/guides/CUSTOMIZATION_DEPLOYMENT_GUIDE.md](docs/guides/CUSTOMIZATION_DEPLOYMENT_GUIDE.md)

---

## Documentation

### 📖 Getting Started
- **[Documentation Index](docs/INDEX.md)** - Complete navigation
- **[Getting Started](docs/getting-started/README.md)** - Setup guide
- **[Core Concepts](docs/concepts/README.md)** - Understand Valocracy

### 🔒 Security
- **[Security Hardening](docs/SECURITY_HARDENING.md)** - Complete security guide
- **[Security Audit Report](docs/reports/SECURITY_AUDIT_REPORT.md)** - Original audit + resolutions
- **[Testing Summary](docs/reports/TESTING_SUMMARY.md)** - Test coverage

### 📜 Contracts
- **[Contract Reference](docs/contracts/CONTRACT_REFERENCE.md)** - API documentation
- **[Architecture](docs/architecture/ARCHITECTURE_DIAGRAMS.md)** - System design

### 📚 Guides
- **[Deployment Guide](docs/guides/CUSTOMIZATION_DEPLOYMENT_GUIDE.md)** - Deploy your own
- **[Adaptation Guide](docs/guides/PROTOCOL_ADAPTATION_GUIDE.md)** - Customize for your DAO
- **[CI/CD Guide](docs/guides/CI_CD.md)** - Automation setup

### 💻 SDK
- **[SDK Overview](docs/sdk/README.md)** - Client library
- **[SDK Tests](docs/sdk/SDK_TESTS_IMPLEMENTATION.md)** - Implementation guide
- **[Wallet Connect](docs/sdk/WALLET_CONNECT_GUIDE.md)** - Implementation guide

> SDK lives alongside the core contracts; follow the SDK Overview link for packaging and wallet integration details rather than treating it as the primary protocol surface.

---

## Project Status

### ✅ Completed

**Smart Contracts:**
- ✅ Valocracy contract (identity, badges, Mana)
- ✅ Governor contract (proposals, voting)
- ✅ Treasury contract (governance-controlled vault)

**Security:**
- ✅ All 5 vulnerabilities resolved (KRN-01 to KRN-05)
- ✅ 53 tests passing (100% on security fixes)
- ✅ Industry best practices implemented
- ✅ Comprehensive security documentation

**Documentation:**
- ✅ Complete API reference
- ✅ Deployment guides
- ✅ Architecture documentation
- ✅ Security hardening guide

### 🔜 Next Steps

**Immediate:**
- [ ] External security audit
- [ ] Testnet deployment & monitoring
- [ ] Frontend integration testing

**Short-term:**
- [ ] Bug bounty program
- [ ] Community testing
- [ ] Performance optimization

**Long-term:**
- [ ] Mainnet deployment
- [ ] SDK client libraries (JS/Python)
- [ ] Governance UI toolkit

---

## Use Cases

### 🏢 DAOs (Decentralized Autonomous Organizations)
Replace token-voting with contribution-based governance. Reward active members, not whale investors.

### 🤝 Cooperatives
Democratic governance where every member's work matters. No corporate shareholders, just community members.

### 🎓 Educational Communities
Students and teachers earn influence through participation, teaching, and learning achievements.

### 💼 Professional Guilds
Skilled professionals govern their trade based on expertise and contributions, not capital.

### 🌍 Social Impact Organizations
Volunteers and contributors gain voice through verified impact, not donations.

---

## Technical Specs

| Feature | Technology | Details |
|---------|-----------|---------|
| **Blockchain** | Stellar (Soroban) | Testnet deployed, Mainnet ready |
| **Language** | Rust | Soroban SDK v21.7.7 |
| **Architecture** | 3 modular contracts | Can be used independently |
| **Security** | Hardened | All vulnerabilities resolved |
| **Tests** | 53 passing | 100% coverage on fixes |
| **License** | MIT | Fully open source |

---

## Security

### Current Status: 🟢 Secure

**All vulnerabilities resolved:**
- ✅ KRN-01 (Critical): Treasury governance
- ✅ KRN-02 (High): Genesis Council
- ✅ KRN-03 (Medium): Voting snapshot
- ✅ KRN-04 (Medium): Integer overflow
- ✅ KRN-05 (Low): Guardian authorization

**Documentation:** [docs/SECURITY_HARDENING.md](docs/SECURITY_HARDENING.md)

### Report Vulnerabilities
- **Email:** security@karn.lat
- **Responsible Disclosure:** We follow coordinated vulnerability disclosure

---

## Contributing

We welcome contributions! Here's how to get started:

### Ways to Contribute
- 🐛 **Report bugs** - Open an issue
- 💡 **Suggest features** - Open a discussion
- 📝 **Improve docs** - Submit a PR
- 🔍 **Review code** - Join discussions
- 🛠️ **Build tooling** - SDKs, UIs, integrations

### Development Process
1. Fork the repository
2. Create a feature branch (`feat/your-feature`)
3. Write tests for your changes
4. Ensure all tests pass (`cargo test`)
5. Submit a Pull Request

**Full guidelines:** [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md)

---

## Community

### Resources
- **Documentation:** [docs/](docs/)
- **Discussions:** [Karn-lat Discussions](https://github.com/ThaisFReis/karn-protocol/discussions/)

### Stay Updated
- Watch this repo for updates
- Star if you find it useful
- Share with your community

---

## Comparison

### Traditional Token Voting (Plutocracy)
```
❌ 1 token = 1 vote (whales control governance)
❌ Voting power can be bought
❌ No requirement for contribution
❌ Whales can extract value without participation
```

### Karn Protocol (Valocracy)
```
✅ Voting power = Contribution (merit-based)
✅ Can't buy influence (soulbound badges)
✅ Must stay active (power decays)
✅ Community controls treasury (governance required)
```

---

## Examples

### Create a Proposal
```rust
// Propose transferring 1000 USDC for bounty
let proposal_id = governor.propose(
    proposer,
    "Pay Alice 1000 USDC for UI design",
    vec![Action {
        contract_id: treasury_id,
        function: Symbol::new(&env, "transfer"),
        args: vec![alice_address, 1000]
    }]
);
```

### Vote on Proposal
```rust
// Vote with your Mana (voting power)
let voting_power = governor.cast_vote(
    voter,
    proposal_id,
    true  // vote in favor
);
```

### Execute Approved Proposal
```rust
// Anyone can execute after approval
governor.execute(proposal_id);
// Funds automatically transferred from treasury to Alice
```

---

## FAQ

**Q: Can I buy voting power?**
A: No. Voting power (Mana) comes from earning badges through contributions. Badges are soulbound and cannot be transferred or sold.

**Q: What happens if I stop contributing?**
A: Your voting power decays linearly over 180 days. You'll maintain a minimum floor of 5 Mana, but to have significant influence, you need to stay active.

**Q: Can I use just one contract?**
A: Yes! The contracts are modular. Use Valocracy alone for identity, or combine all three for full governance.

**Q: Is this production ready?**
A: Contracts are security-hardened with all vulnerabilities resolved. We recommend external audit before mainnet deployment.

**Q: What blockchain networks are supported?**
A: Stellar Soroban (Testnet currently). Mainnet deployment planned after external audit.

**Q: Can I fork this for my DAO?**
A: Absolutely! MIT license. Fork, customize, deploy. See the [Adaptation Guide](docs/guides/PROTOCOL_ADAPTATION_GUIDE.md).

---

## License

**MIT License** - See [LICENSE](LICENSE)

You are free to:
- ✅ Use commercially
- ✅ Modify
- ✅ Distribute
- ✅ Use privately

Requires:
- 📝 Include original license and copyright

---

## Acknowledgments

Built with:
- [Stellar](https://stellar.org) - Fast, low-cost blockchain
- [Soroban](https://soroban.stellar.org) - Smart contract platform
- [Rust](https://rust-lang.org) - Safe, fast systems language

Inspired by:
- Merit-based governance models
- Soulbound token research
- Contribution-weighted voting systems

---

## Support

### Need Help?
- 📖 **Docs:** Start with [docs/INDEX.md](docs/INDEX.md)
- 💬 **Discussions:** Ask questions on GitHub
- 🐛 **Issues:** Report bugs on GitHub

### For Organizations
Deploying Karn for your DAO or cooperative?
- Review [Deployment Guide](docs/guides/CUSTOMIZATION_DEPLOYMENT_GUIDE.md)
- Check [Adaptation Guide](docs/guides/PROTOCOL_ADAPTATION_GUIDE.md)
- Consider external audit before production use

---

**Built with 💜 for communities that value contribution over capital**

*Karn Protocol: Where your influence comes from what you do, not what you own.*
