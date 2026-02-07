# Core Concepts - Karn Protocol

**Version:** 1.0.0
**Last Updated:** 2026-02-07
**Audience:** Developers, Contributors, Community Members

---

## Table of Contents

1. [What is Karn?](#what-is-karn)
2. [Valocracia (Valocracy)](#valocracia-valocracy)
3. [IDNFT - Isonomic Degradable NFT](#idnft---isonomic-degradable-nft)
4. [Mana: Voting Power](#mana-voting-power)
5. [Badge System](#badge-system)
6. [Governance Model](#governance-model)
7. [Treasury & Value Distribution](#treasury--value-distribution)
8. [Pods: Community Support](#pods-community-support)
9. [The Complete Ecosystem](#the-complete-ecosystem)

---

## What is Karn?

**Karn** is a decentralized ecosystem empowering women in Latin America through contribution-driven governance. Unlike traditional organizations where power comes from capital (money), Karn gives power based on **value created** through participation, learning, and community contribution.

### Core Philosophy

> "Your voice in Karn is measured by what you give, not what you own."

**Key Principles:**

1. **Merit over Money** - Influence comes from contribution, not investment
2. **Active Participation** - Power decays if you stop participating (no dynasties)
3. **Community First** - Decisions made collectively through governance
4. **Women-Led** - Built by and for women in tech across Latin America

### The Problem Karn Solves

**Traditional Organizations:**
- 💰 Power concentrated in those with capital
- 🏢 Top-down decision making
- 📊 Shareholders profit, contributors get salaries
- ⏰ Lifetime positions accumulate power

**Karn's Approach:**
- ✨ Power distributed based on contribution
- 🗳️ Democratic governance by active contributors
- 💎 Contributors share in value created
- ⚡ Power decays without participation (prevents stagnation)

---

## Valocracia (Valocracy)

**Valocracia** (from Portuguese "valor" = value) is Karn's governance system where voting power is tied to **value contributed** rather than tokens owned.

### How It Works

```
Contribution → Badge Earned → Mana Granted → Voting Power
```

**Example:**

1. **Maria** completes a Rust learning track
2. Earns a "Rust Developer" badge (Track category)
3. Receives +15 Mana from the badge
4. Can now vote on proposals with 15 + 5 (Member Floor) = **20 Mana**

### Key Differences from Traditional DAOs

| Aspect | Traditional DAO | Karn Valocracy |
|--------|----------------|----------------|
| **Power Source** | Tokens owned (capital) | Badges earned (contribution) |
| **Voting Weight** | 1 token = 1 vote | Mana from all badges |
| **Power Duration** | Permanent (as long as you hold tokens) | Decays over 180 days |
| **Entry Barrier** | Must buy tokens | Free registration |
| **Governance** | Plutocracy (rule by wealthy) | Meritocracy (rule by contributors) |

### Why "Valocracy"?

The term combines:
- **Valor** (Portuguese: value) - contribution is valued
- **-cracy** (Greek: rule) - governance system

It emphasizes that **value created** determines **voice in decisions**.

---

## IDNFT - Isonomic Degradable NFT

**IDNFT** stands for **Isonomic Degradable Non-Fungible Token**. These are the badges in Karn's system.

### What Makes IDNFTs Special?

#### 1. **Soulbound (Non-Transferable)**

```
❌ Cannot sell badges
❌ Cannot transfer to another wallet
✅ Tied to your identity forever
```

**Why?** Badges represent **your achievements**, not commodities to trade. They prove what **you** did, not what you bought.

#### 2. **Isonomic (Equal Foundation)**

All members start with equal baseline power:

```
Member Floor = 5 Mana (constant)
```

Even if all your badge Mana decays to zero, you still have 5 Mana as a registered member. This ensures:
- ✅ Everyone has a voice
- ✅ No member is completely powerless
- ✅ Democratic participation remains possible

**"Isonomic"** = Greek for "equal under law" - everyone has baseline equality.

#### 3. **Degradable (Power Decays)**

Unlike permanent NFTs, IDNFT voting power **degrades over time**:

```
Full Power → (180 days of inactivity) → Zero Additional Power
            ↓
     Still have Member Floor (5 Mana)
```

**Why decay?**
- Prevents inactive members from controlling governance
- Encourages ongoing participation
- Keeps the community dynamic and current
- Rewards recent contributors over past achievements

### IDNFT vs Traditional NFT

| Feature | Traditional NFT | IDNFT (Karn Badge) |
|---------|----------------|---------------------|
| **Transferable** | Yes (can sell/trade) | No (soulbound) |
| **Value** | Market speculation | Personal achievement |
| **Purpose** | Investment/collectible | Reputation/governance |
| **Permanence** | Forever the same | Voting power decays |
| **Ownership** | Whoever owns the wallet | Tied to identity (KYC optional) |

---

## Mana: Voting Power

**Mana** is your voting power in Karn's governance. Think of it as "influence points" that determine the weight of your vote.

### How Mana is Calculated

```rust
Mana = Member_Floor + Decaying_Mana + Permanent_Mana

Where:
  Member_Floor = 5 (constant for all registered members)
  Decaying_Mana = (Level - Permanent_Level) × (Time_Remaining / Vacancy_Period)
  Permanent_Mana = Level from Founder badge (never decays)
  Vacancy_Period = 180 days (15,552,000 seconds)
```

### Example Calculation

**Scenario:** Sofia has 3 badges

| Badge | Rarity | Earned | Status |
|-------|--------|--------|--------|
| Member | 5 | 180 days ago | Fully decayed |
| Rust Track | 15 | 90 days ago | 50% decayed |
| Community Contributor | 10 | Today | 100% active |

**Calculation:**
```
Member Floor = 5
Rust Track Mana = 15 × (90 days remaining / 180 days) = 7.5 → 7
Community Mana = 10 × (180 days remaining / 180 days) = 10
Total Mana = 5 + 7 + 10 = 22 Mana
```

Sofia can vote on proposals with weight = **22 votes**.

### Mana Decay Curve

```
Mana from Badge
    100% ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
     75% ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░
     50% ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░
     25% ▓▓▓▓▓░░░░░░░░░░░░░░░
      0% ░░░░░░░░░░░░░░░░░░░░ + Member Floor (5)
         0    45   90   135  180 days
```

**Linear Decay:** Mana decreases steadily over 180 days. After 90 days, you have 50% remaining.

### The Vacancy Period

**180 days** = Vacancy Period = Time until badge power fully decays

**Why 180 days?**
- Long enough to reward sustained contribution
- Short enough to prevent inactive control
- Aligns with ~6 months of active participation

**What happens after 180 days?**
- Badge Mana reaches 0
- Member Floor (5) remains
- You can earn new badges to regain Mana

### Permanent Mana (Founder Exception)

**Founder badge** has special status:

```
Founder Badge:
  - Never decays
  - Provides permanent voting power
  - Only granted at initialization
  - Cannot be minted later
```

**Why?** Recognizes foundational contribution and provides stability to governance.

### Member Floor

**Member Floor = 5 Mana** (constant)

Every registered member always has at least 5 Mana, even if:
- ❌ All badges have decayed to zero
- ❌ They just registered (only have Member badge)
- ❌ They've been inactive for years

**Purpose:**
- Ensures democratic participation
- Prevents complete disenfranchisement
- Allows "sleeping members" to wake up and vote
- Provides baseline governance access

---

## Badge System

Badges are the building blocks of reputation in Karn. Each badge grants Mana based on its **rarity**.

### Badge Categories

```
┌─────────────────────────────────────────────────┐
│  Badge ID Range    │  Category      │  Purpose  │
├─────────────────────────────────────────────────┤
│  0                 │  Member        │  Base     │
│  1                 │  Founder       │  Genesis  │
│  10-19             │  Leadership    │  Roles    │
│  20-59             │  Track         │  Skills   │
│  60-69             │  Community     │  Social   │
│  70-79             │  Governance    │  Admin    │
└─────────────────────────────────────────────────┘
```

### 1. Member Badge (ID: 0)

**Purpose:** Base badge for all registered members

**Characteristics:**
- ✅ Granted on self-registration
- ✅ Rarity: 5
- ✅ Grants Member Floor (5 Mana baseline)
- ✅ Free to obtain
- ✅ Cannot be minted by others

**How to Get:**
```typescript
// User registers via frontend
await valocracy.selfRegister(address, backendSignature, nonce, expiry);

// Result: Member badge minted, 5 Mana granted
```

### 2. Founder Badge (ID: 1)

**Purpose:** Recognize founding contributors

**Characteristics:**
- ✅ Set during contract initialization
- ❌ Cannot be minted after initialization
- ✅ Never decays (permanent Mana)
- ✅ Rarity: Typically high (50-100)
- ✅ Security anchor for governance

**Special Status:**
- Only one Founder badge exists (or small set)
- Provides stability during governance transitions
- Immutable after initialization

### 3. Leadership Badges (ID: 10-19)

**Purpose:** Formal roles in the organization

**Examples:**
- 10: Core Team Member
- 11: Working Group Lead
- 12: Community Manager
- 13: Technical Lead
- 14: Regional Coordinator

**Characteristics:**
- ✅ Granted by governance vote
- ✅ High rarity (20-50)
- ✅ Decays like other badges
- ✅ Governor-only minting

**Who Can Mint:** Governor contract (via governance proposal)

### 4. Track Badges (ID: 20-59)

**Purpose:** Recognize technical skills and learning paths

**Examples:**
- 20: Rust Developer
- 21: Solidity Developer
- 22: Frontend Developer
- 30: UX/UI Designer
- 40: Data Analyst
- 50: DevOps Engineer

**Characteristics:**
- ✅ Earned through learning paths
- ✅ Medium rarity (10-30)
- ✅ Verified by mentors or automated tests
- ✅ Stackable (can earn multiple tracks)

**Who Can Mint:** Governor OR Leadership holders (mentors)

### 5. Community Badges (ID: 60-69)

**Purpose:** Recognize social contributions

**Examples:**
- 60: Event Organizer
- 61: Content Creator
- 62: Mentor
- 63: Ambassador
- 64: Volunteer
- 65: Translator

**Characteristics:**
- ✅ Peer recognition
- ✅ Lower rarity (5-15)
- ✅ Any member can mint
- ✅ Encourages social participation

**Who Can Mint:** Any member with level > 0

### 6. Governance Badges (ID: 70-79)

**Purpose:** Administrative and institutional roles

**Examples:**
- 70: Auditor
- 71: Treasury Manager
- 72: Legal Representative
- 73: Compliance Officer

**Characteristics:**
- ✅ Governance-critical roles
- ✅ High rarity (30-60)
- ✅ Governor-only minting
- ✅ Requires formal appointment

**Who Can Mint:** Governor contract only

### Rarity and Mana

**Rarity** determines how much Mana (voting power) a badge grants.

| Rarity Range | Typical Badge Type | Mana Example |
|--------------|-------------------|--------------|
| 1-10 | Community, Entry-level | 5-10 Mana |
| 10-30 | Track, Specialized Skills | 10-30 Mana |
| 30-60 | Leadership, Governance | 30-60 Mana |
| 60-100 | Founder, Critical Roles | 60-100 Mana |

**Design Principle:** More impactful contributions = higher rarity = more Mana

---

## Governance Model

Karn uses **on-chain governance** where all decisions are made through proposals, votes, and execution.

### Governance Flow

```
1. Proposal Creation
   ↓
2. Voting Period (7 days)
   ↓
3. Vote Tally (based on Mana)
   ↓
4. Execution (if approved)
   ↓
5. On-Chain Action
```

### Step-by-Step Process

#### 1. Creating a Proposal

**Requirements:**
- Must have ≥100 Mana (proposal threshold)
- Provide title and description
- Specify actions (contract calls)

**Example:**
```typescript
await governor.createProposal(
  proposer,
  "Increase Scholarship Fund",
  "Allocate 10,000 USDC to scholarship program",
  [
    {
      contract_id: treasury_address,
      function: "fund_lab",
      args: [10000, 500] // total_amount, per_member
    }
  ]
);
```

#### 2. Voting Period

**Duration:** 7 days (configurable via governance)

**Delay:** 1 day between proposal creation and voting start

**Vote Options:**
- ✅ **For** - Support the proposal
- ❌ **Against** - Oppose the proposal
- 😐 **Abstain** - Recorded but doesn't affect outcome

**Vote Weight:** Your current Mana at time of vote

#### 3. Vote Counting

**Quorum:** 51% of total active Mana must participate

**Approval:** >50% of votes cast must be "For"

**Example:**
```
Total Active Mana: 10,000
Votes Cast:
  - For: 3,500 Mana
  - Against: 1,500 Mana
  - Abstain: 500 Mana
Total Participation: 5,500 Mana (55% - quorum met ✅)
Approval: 3,500 / 5,000 = 70% (approved ✅)

Result: Proposal PASSED
```

#### 4. Execution

**Requirements:**
- Proposal passed
- Voting period ended
- No execution yet (idempotent)

**Action:**
```typescript
await governor.execute(proposalId);

// Governor contract calls specified actions:
// → treasury.fund_lab(10000, 500)
// → Scholarship program funded ✅
```

**Reentrancy Protection:** Governor locks during execution to prevent attacks

### Proposal States

```
Draft → Active → Voting → [Succeeded/Failed] → [Executed/Expired]
```

**State Definitions:**

| State | Description | Next Action |
|-------|-------------|-------------|
| **Active** | Voting period ongoing | Cast votes |
| **Succeeded** | Passed, ready to execute | Execute |
| **Failed** | Did not meet quorum or approval | Archive |
| **Executed** | Actions completed | None |
| **Expired** | Succeeded but never executed | Archive |

### Governance Parameters

All configurable via governance:

| Parameter | Default | Min | Description |
|-----------|---------|-----|-------------|
| `voting_delay` | 1 day | 1 hour | Time before voting starts |
| `voting_period` | 7 days | 1 day | Duration of voting |
| `proposal_threshold` | 100 Mana | 10 Mana | Minimum Mana to propose |
| `quorum_percentage` | 51% | 10% | Participation required |

**To Change:** Create a proposal to call `governor.updateConfig(new_config)`

---

## Treasury & Value Distribution

The **Treasury** holds Karn's shared resources and distributes value to contributors.

### How the Treasury Works

```
Revenue Sources → Treasury → Distribution Mechanisms → Contributors
```

**Revenue Sources:**
1. **Partner Funding** - Organizations sponsor labs/scholarships
2. **Grant Programs** - Web3 grants (Stellar, etc.)
3. **Service Income** - Consulting, training, development work
4. **Donations** - Community and ally contributions

**Distribution Mechanisms:**
1. **Shares** - Based on badge rarity (automatic)
2. **Scholarships** - Approved learning stipends
3. **Bounties** - Task-based rewards
4. **Governance Spending** - Voted allocations

### Treasury Shares System

**How It Works:**

When you earn a badge, you receive **shares** in the Treasury:

```
Badge Earned → Shares Granted (based on rarity) → Claim on Treasury Assets
```

**Example:**

Maria earns a Rust Developer badge (rarity 20):
```typescript
// Automatically called when badge is minted:
await treasury.deposit(maria_address, 20); // 20 shares

// Maria now owns:
shares_of(maria) = 20
total_shares = 1000

// Maria's claim on treasury:
claimable = (20 / 1000) × total_assets
          = 2% of treasury assets
```

**Withdrawal:**

```typescript
// Maria withdraws half her shares
await treasury.withdraw(maria_address, receiver_address, 10);

// Receives: (10 / 1000) × 50,000 USDC = 500 USDC
```

### Scholarship Escrow

**Purpose:** Fund learning programs for community members

**Flow:**

```
1. Partner funds a "Lab" (learning program)
   → treasury.fund_lab(funder, 10_000, 500)

2. Members complete learning milestones

3. Governance approves scholarship release
   → treasury.approve_scholarship(lab_id, member)

4. Member claims scholarship
   → treasury.withdraw_scholarship(member, amount)
```

**Example:**

Stellar Foundation funds a Soroban learning lab:

```typescript
// 1. Fund lab: 20 members × 500 USDC = 10,000 USDC total
await treasury.fund_lab(
  stellar_foundation,
  10_000_000_000, // 10,000 USDC (7 decimals)
  500_000_000     // 500 USDC per member
);
// Lab ID: 1

// 2. Sofia completes learning track

// 3. Mentor (governance) approves
await treasury.approve_scholarship(1, sofia_address);
// Sofia's claimable: 500 USDC

// 4. Sofia withdraws
await treasury.withdraw_scholarship(sofia_address, 500_000_000);
// Sofia receives 500 USDC to her wallet ✅
```

### Governance Spending

**Any treasury expenditure** requires governance approval:

```typescript
// Proposal: Hire a designer for 2,000 USDC
await governor.createProposal(
  proposer,
  "Hire UX Designer",
  "Contract with Designer X for website redesign",
  [
    {
      contract_id: treasury_address,
      function: "spend",
      args: [designer_address, 2_000_000_000]
    }
  ]
);

// After vote passes and execution:
// → Designer receives 2,000 USDC from treasury
```

**Security:** Only Governor contract can call `treasury.spend()`

---

## Pods: Community Support

**Pods** are small mutual support groups (4-6 members) that provide:

- 🤝 Peer support and accountability
- 📚 Shared learning
- 🎯 Goal setting and tracking
- 💬 Safe space for discussion

### What Pods Are NOT

- ❌ NOT a team with a leader
- ❌ NOT a class with a teacher
- ❌ NOT a hierarchy

### What Pods ARE

- ✅ Peer-to-peer support network
- ✅ Horizontal organization (no ranks)
- ✅ Mutual accountability
- ✅ Learning community

### Pod Structure

**Size:** 4-6 members (optimal for group dynamics)

**Duration:** Flexible (can be ongoing or time-bound)

**Meetings:** Self-organized (typically weekly)

**Purpose:** Member-defined (learning track, project, mutual support)

### Example Pod Activities

**Learning Pod:**
- Study Rust together
- Share resources
- Code reviews
- Mock interviews

**Project Pod:**
- Build a dApp together
- Contribute to Karn codebase
- Create community content

**Support Pod:**
- Career guidance
- Job search support
- Mental health check-ins
- Celebrate wins

### Pod Formation

**Process:**

1. **Discovery** - Members express interest in forming a pod
2. **Matching** - Based on goals, timezone, language
3. **Kickoff** - First meeting to set norms and goals
4. **Ongoing** - Regular meetings and async communication

**Tools:**
- Discord channels (private per pod)
- Shared documents (goals, notes)
- Calendar invites
- Optional: pod treasury allocation (via governance)

---

## The Complete Ecosystem

### How Everything Connects

```
┌─────────────────────────────────────────────────────────┐
│                    KARN ECOSYSTEM                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  User Journey:                                           │
│                                                          │
│  1. REGISTER                                             │
│     ├─ Connect wallet                                    │
│     ├─ Self-register → Member badge (5 Mana)             │
│     └─ Join Discord community                            │
│                                                          │
│  2. LEARN                                                │
│     ├─ Choose learning track (Rust, Frontend, etc.)      │
│     ├─ Join a Pod for peer support                       │
│     ├─ Complete milestones                               │
│     └─ Earn Track badge → +15 Mana                       │
│                                                          │
│  3. CONTRIBUTE                                           │
│     ├─ Pick up bounties (Karn Works)                     │
│     ├─ Organize events                                   │
│     ├─ Mentor others                                     │
│     └─ Earn Community badges → +10 Mana each             │
│                                                          │
│  4. GOVERN                                               │
│     ├─ Vote on proposals (with your Mana)                │
│     ├─ Create proposals (if ≥100 Mana)                   │
│     └─ Shape the future of Karn                          │
│                                                          │
│  5. EARN                                                 │
│     ├─ Receive treasury shares (badge rarity)            │
│     ├─ Claim scholarships (learning stipends)            │
│     ├─ Complete bounties (task rewards)                  │
│     └─ Withdraw value to your wallet                     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Integration Points

**Frontend dApp:**
- User profile (badges, Mana, reputation)
- Governance (vote, propose)
- Learning paths (progress tracking)
- Treasury (view shares, withdraw)
- Pods (join, communicate)
- Karn Works (bounties)

**Smart Contracts:**
- **Valocracy** - Badge minting, Mana calculation
- **Governor** - Proposal creation, voting, execution
- **Treasury** - Value storage, distribution, scholarships

**Backend API:**
- User profiles (off-chain data)
- Verification system
- Learning progress tracking
- Bounty management
- Analytics

**Community:**
- Discord (communication)
- GitHub (development)
- Twitter/X (announcements)
- Website (documentation)

---

## Key Terminology Reference

| Term | Definition | Example |
|------|------------|---------|
| **Valocracia** | Governance system where power = contribution | "Karn uses Valocracia instead of token voting" |
| **IDNFT** | Isonomic Degradable NFT (soulbound badge) | "Each badge is an IDNFT" |
| **Mana** | Voting power from badges + Member Floor | "Sofia has 22 Mana" |
| **Member Floor** | Baseline 5 Mana for all registered members | "Even with no badges, you have Member Floor" |
| **Rarity** | Badge value (determines Mana granted) | "Founder badge has rarity 100" |
| **Vacancy Period** | 180 days until badge Mana fully decays | "After Vacancy Period, only Member Floor remains" |
| **Pod** | Small peer support group (4-6 members) | "Join a Rust learning pod" |
| **Lab** | Funded learning program (scholarship) | "Stellar funded a Soroban lab" |
| **Valor** | Portuguese for "value" (root of Valocracia) | "We measure valor through contribution" |
| **Treasury Shares** | Claim on treasury assets (from badges) | "Earning a badge grants treasury shares" |

---

## Further Reading

**Foundational Documents:**
- [Whitepaper](./Whitepaper_Karn.md) - Complete vision and technical details
- [Business Model Canvas](./Business_Model_Canvas_Karn.md) - Sustainability model
- [Security Hardening](./SECURITY_HARDENING_SC-001_COMPLETE.md) - Smart contract security

**Technical Documentation:**
- [SDK Documentation](./SDK_DOCUMENTATION.md) - Developer integration guide
- [React Hooks](./REACT_HOOKS_IMPLEMENTATION.md) - Frontend integration
- [Contract Reference](../karn-protocol/contracts/README.md) - Smart contract API

**Specifications:**
- [SPEC-SC-001](../Specs-Dapp-Karn-Ecosystem/contracts/SPEC-SC-001-security-hardening.md) - Security requirements
- [Feature Specs](../Specs-Dapp-Karn-Ecosystem/features/) - All feature specifications
- [Glossary](../Specs-Dapp-Karn-Ecosystem/GLOSSARY.md) - Complete terminology

---

## Summary

**Core Concepts at a Glance:**

1. **Karn** = Merit-based ecosystem for women in tech (Latin America)
2. **Valocracia** = Power from contribution, not capital
3. **IDNFT** = Soulbound badges that decay over time
4. **Mana** = Voting power (Member Floor + badge Mana)
5. **Badges** = Proof of contribution (6 categories, 0-79 IDs)
6. **Governance** = On-chain proposals, voting, execution
7. **Treasury** = Shared resources distributed via shares + scholarships
8. **Pods** = Small peer support groups (4-6 members)

**The Karn Philosophy:**

> "Build systems where value created determines voice in decisions.
> Reward active participation, not passive ownership.
> Create communities where everyone has a floor, but merit raises the ceiling."

---

**Last Updated:** 2026-02-07
**Version:** 1.0.0
**Maintainer:** Karn Protocol Team
**Questions?** Join our [Discord](https://discord.gg/karn) or read the [Whitepaper](./Whitepaper_Karn.md)
