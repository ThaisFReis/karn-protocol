# Protocol Adaptation Guide - Karn Valocracy

**Version:** 1.0
**Last Updated:** 2026-02-07
**Status:** Production-Ready (All security vulnerabilities fixed)

---

## Overview

Karn's Valocracy protocol was designed for educational scholarships but is **fully adaptable** to any use case requiring:
- Contribution-based governance (not capital-based)
- Time-decaying reputation/credentials
- Dual-pool treasury (shareholder assets vs. restricted escrow)
- Snapshot-based voting with participation thresholds

**You don't need to fork or modify the smart contracts.** The terminology is presentation-layer - your frontend can call things whatever you want.

---

## Core Primitives (Abstract)

The protocol implements these generic patterns:

### 1. Degradable NFT with Voting Power
**Karn calls it:** "Badge" (Valor)
**What it is:** A soulbound credential that grants voting power (Mana) which decays linearly over 180 days unless renewed through contribution.

**Abstract concept:**
- Non-transferable credential
- Grants time-limited influence
- Requires ongoing participation to maintain
- Prevents plutocracy (you can't buy permanent power)

**Configurable parameters:**
- Decay period (default: 180 days)
- Minimum floor power (default: 5)
- Credential types and rarities
- Permanent vs. temporary credentials

### 2. Escrow Pool System
**Karn calls it:** "Lab" (scholarship program)
**What it is:** A restricted funding pool where deposited assets are isolated from shareholder withdrawals and only claimable by approved recipients.

**Abstract concept:**
- Segregated treasury accounting (KRN-01 fix)
- Funder deposits assets for specific purpose
- Administrator approves individual distributions
- Recipients claim approved amounts
- Shareholders cannot access escrowed funds

**Configurable parameters:**
- Distribution amount per recipient
- Approval mechanism (governance vs. admin)
- Claim conditions

### 3. Distribution System
**Karn calls it:** "Scholarship"
**What it is:** An approved claimable balance that recipients can withdraw from an escrow pool.

**Abstract concept:**
- Merit-based or criteria-based allocation
- Two-step process (approve → claim)
- Prevents unauthorized drainage
- Auditable on-chain

### 4. Time-Decaying Reputation
**Karn calls it:** "Mana"
**What it is:** Voting power calculated from credential level that decays linearly to a floor over 180 days of inactivity.

**Abstract concept:**
- Activity-based influence
- Prevents stale voters from controlling decisions
- Rewards ongoing contribution
- Formula: `Mana = Floor + (Level - Permanent) × (TimeRemaining / DecayPeriod) + Permanent`

**Use cases:**
- Governance voting weight
- Proposal creation threshold
- Access control tiers
- Reputation scores

### 5. Snapshot-Based Governance
**Karn calls it:** "Voting on proposals"
**What it is:** Voting power is captured at proposal creation time (not vote time) to prevent flash attacks.

**Abstract concept:**
- Anti-manipulation mechanism (KRN-02 fix)
- Prevents: buying credentials mid-vote to sway outcome
- Ensures: all voters use same timestamp for power calculation
- Fair: early and late voters have equal influence

### 6. Participation Threshold
**Karn calls it:** Part of governance config
**What it is:** Proposals require minimum % of total power to participate (not just approve) to pass.

**Abstract concept:**
- Prevents: single whale approving proposals alone (KRN-03 fix)
- Requires: community engagement for legitimacy
- Example: 10% participation + 51% approval both needed

---

## Adaptation Examples

### Use Case 1: **Worker Cooperative**

**Context:** Tech co-op where workers earn ownership through contribution

**Terminology Mapping:**

| Karn Term | Co-op Term | Meaning |
|-----------|------------|---------|
| Badge | Membership Tier | Worker classification (Apprentice → Journeyman → Master) |
| Mana | Voting Shares | Democratic voting power that decays if you leave |
| Lab | Onboarding Fund | Pool to pay stipends for new member training |
| Scholarship | Stipend | Weekly payment during onboarding period |
| Funder | External Investor | Outside capital contributor |
| Governor | Worker Council | Elected governance body |
| Treasury | Co-op Bank | Shared capital pool |

**How it works:**
1. New worker applies → receives "Apprentice" badge (low Mana)
2. Contributes work → earns higher tier badges → more voting power
3. Stops contributing → Mana decays → voting power decreases
4. Investor funds onboarding pool → new workers get stipends
5. Workers vote on proposals (weighted by current Mana)
6. Profit sharing uses treasury shares (separate from stipend pool)

**Configuration:**
```typescript
const coopConfig = {
  terminology: {
    badge: "Membership Tier",
    mana: "Voting Shares",
    lab: "Onboarding Fund",
    scholarship: "Stipend",
    funder: "Investor",
    propose: "Submit Motion",
    vote: "Cast Vote"
  },
  badgeTypes: [
    { id: 0, name: "Member", rarity: 5 },
    { id: 1, name: "Founder", rarity: 100 },
    { id: 10, name: "Apprentice", rarity: 10 },
    { id: 20, name: "Journeyman", rarity: 30 },
    { id: 30, name: "Master", rarity: 60 }
  ],
  governance: {
    votingPeriod: 7 * 24 * 3600, // 7 days
    participationThreshold: 15, // 15% must vote
    approvalThreshold: 66 // 66% must approve
  }
}
```

---

### Use Case 2: **Open Source DAO**

**Context:** Developer community funding open source work

**Terminology Mapping:**

| Karn Term | DAO Term | Meaning |
|-----------|----------|---------|
| Badge | Contributor Badge | Recognition for merged PRs, code reviews, etc. |
| Mana | Governance Power | Voting weight based on recent contributions |
| Lab | Grant Program | Pool for funding specific features/bugs |
| Scholarship | Bounty Payment | Reward for completing approved work |
| Funder | Sponsor | Company or individual funding development |
| Governor | Core Team | Elected maintainers |
| Treasury | DAO Treasury | Community-owned capital |

**How it works:**
1. Developer contributes code → earns "Contributor" badge → gains governance power
2. Core team creates grant program for new feature
3. Sponsor deposits 10,000 USDC into grant pool
4. Developers apply → core team approves → they complete work
5. Developer claims bounty payment from grant pool
6. Community votes on protocol upgrades (weighted by contribution recency)

**Configuration:**
```typescript
const daoConfig = {
  terminology: {
    badge: "Contributor Badge",
    mana: "Governance Power",
    lab: "Grant Program",
    scholarship: "Bounty",
    funder: "Sponsor",
    propose: "Create Proposal",
    vote: "Vote"
  },
  badgeTypes: [
    { id: 0, name: "Member", rarity: 5 },
    { id: 10, name: "Contributor", rarity: 20 },
    { id: 20, name: "Core Contributor", rarity: 50 },
    { id: 30, name: "Maintainer", rarity: 80 }
  ],
  governance: {
    votingPeriod: 3 * 24 * 3600, // 3 days
    participationThreshold: 10, // 10% quorum
    approvalThreshold: 51 // Simple majority
  }
}
```

---

### Use Case 3: **Community Token Project**

**Context:** NFT/Gaming community with contributor rewards

**Terminology Mapping:**

| Karn Term | Community Term | Meaning |
|-----------|----------------|---------|
| Badge | Achievement NFT | Earned through community participation |
| Mana | XP (Experience Points) | Gaming-style reputation that decays |
| Lab | Community Grant | Pool for funding community initiatives |
| Scholarship | Reward Distribution | Payment for ambassadors, artists, etc. |
| Funder | Treasury Donor | Whale or project team funding |
| Governor | Council | Elected community representatives |
| Treasury | Community Vault | Shared funds |

**How it works:**
1. Member participates in Discord, creates content → earns achievement NFTs
2. NFTs grant XP that decays if inactive → incentivizes ongoing participation
3. Active members vote on community proposals (weighted by XP)
4. Community grants fund artists, event organizers, ambassadors
5. Contributors claim rewards from grant pools
6. XP decay ensures recent contributors have most influence

**Configuration:**
```typescript
const communityConfig = {
  terminology: {
    badge: "Achievement NFT",
    mana: "XP",
    lab: "Community Grant",
    scholarship: "Reward",
    funder: "Donor",
    propose: "Submit Idea",
    vote: "Vote"
  },
  badgeTypes: [
    { id: 0, name: "Member", rarity: 5 },
    { id: 10, name: "Active Member", rarity: 15 },
    { id: 20, name: "Content Creator", rarity: 30 },
    { id: 30, name: "Ambassador", rarity: 50 },
    { id: 40, name: "Moderator", rarity: 70 }
  ],
  governance: {
    votingPeriod: 5 * 24 * 3600, // 5 days
    participationThreshold: 8, // 8% quorum
    approvalThreshold: 60 // 60% approval
  }
}
```

---

### Use Case 4: **Gig Economy Platform**

**Context:** Freelancer collective with reputation system

**Terminology Mapping:**

| Karn Term | Platform Term | Meaning |
|-----------|---------------|---------|
| Badge | Skill Certification | Verified competency in specific skills |
| Mana | Reputation Score | Trust metric based on recent work quality |
| Lab | Client Escrow | Payment held for project completion |
| Scholarship | Milestone Payment | Release of escrowed funds per deliverable |
| Funder | Client | Person/company paying for work |
| Governor | Dispute Arbitrator | Elected mediators for conflicts |
| Treasury | Platform Reserve | Emergency fund / insurance pool |

**How it works:**
1. Freelancer completes gigs → earns skill certifications → reputation increases
2. Reputation decays if inactive → encourages consistent work
3. Client deposits payment into project escrow
4. Freelancer delivers milestone → arbitrator approves → payment released
5. High-reputation members vote on platform policies
6. Platform takes small fee → builds reserve fund

---

### Use Case 5: **Educational DAO**

**Context:** Online learning community with peer validation

**Terminology Mapping:**

| Karn Term | Education Term | Meaning |
|-----------|----------------|---------|
| Badge | Course Certificate | Completion credential for learning modules |
| Mana | Learning Streak | Voting power based on recent course completions |
| Lab | Study Group Fund | Pool to pay mentors/tutors |
| Scholarship | Tutor Stipend | Payment for teaching/mentoring hours |
| Funder | Education Sponsor | Donor funding learning programs |
| Governor | Faculty | Elected course creators/reviewers |
| Treasury | DAO Treasury | Community-owned funds |

**How it works:**
1. Student completes courses → earns certificates → gains learning streak
2. Streak decays if no activity → incentivizes continuous learning
3. Sponsor funds study group → covers mentor payments
4. Mentor teaches students → claims hourly stipend from pool
5. Active learners vote on curriculum changes (weighted by streak)

---

## Technical Implementation

### Option A: Frontend-Only Adaptation (Recommended)

**No contract changes required.** Just rename things in your UI:

```typescript
// frontend/src/config/terminology.ts

export type TerminologyConfig = {
  badge: string;
  badges: string;
  mana: string;
  lab: string;
  labs: string;
  scholarship: string;
  scholarships: string;
  funder: string;
  propose: string;
  vote: string;
  // ... etc
};

// Presets
export const KARN_TERMINOLOGY: TerminologyConfig = {
  badge: "Badge",
  badges: "Badges",
  mana: "Mana",
  lab: "Lab",
  labs: "Labs",
  scholarship: "Scholarship",
  scholarships: "Scholarships",
  funder: "Funder",
  propose: "Propose",
  vote: "Vote"
};

export const COOP_TERMINOLOGY: TerminologyConfig = {
  badge: "Membership Tier",
  badges: "Membership Tiers",
  mana: "Voting Shares",
  lab: "Onboarding Fund",
  labs: "Onboarding Funds",
  scholarship: "Stipend",
  scholarships: "Stipends",
  funder: "Investor",
  propose: "Submit Motion",
  vote: "Cast Vote"
};

export const DAO_TERMINOLOGY: TerminologyConfig = {
  badge: "Contributor Badge",
  badges: "Contributor Badges",
  mana: "Governance Power",
  lab: "Grant Program",
  labs: "Grant Programs",
  scholarship: "Bounty",
  scholarships: "Bounties",
  funder: "Sponsor",
  propose: "Create Proposal",
  vote: "Vote"
};
```

**Usage in components:**
```typescript
import { useTerminology } from '@/contexts/TerminologyContext';

function BadgesPage() {
  const { t, term } = useTerminology();

  return (
    <div>
      <h1>{term('badges')}</h1>
      <p>Earn {term('badges')} to increase your {term('mana')}</p>
      <BadgesList />
    </div>
  );
}
```

**i18n integration:**
```typescript
// locales/en.ts
export const en = {
  badges: {
    hero: "Your {badgeTerm}",
    description: "Earn {badgeTerm} to gain {manaTerm}",
    // Use placeholders for custom terminology
  }
}

// Component usage
<p>{t('badges.description', {
  badgeTerm: term('badges'),
  manaTerm: term('mana')
})}</p>
```

---

### Option B: SDK Wrapper (Advanced)

Create a terminology-aware SDK wrapper:

```typescript
// sdk/terminology-wrapper.ts

import { ValocracyClient, GovernorClient, TreasuryClient } from '@/contracts';

export class AdaptedProtocol {
  constructor(
    private valocracy: ValocracyClient,
    private governor: GovernorClient,
    private treasury: TreasuryClient,
    private config: TerminologyConfig
  ) {}

  // Wrapped methods with renamed parameters
  async awardCredential(to: Address, credentialId: number) {
    // Internally calls valocracy.mint()
    return this.valocracy.mint(to, credentialId);
  }

  async createFundingPool(
    poolCreator: Address,
    totalAmount: bigint,
    amountPerRecipient: bigint
  ) {
    // Internally calls treasury.fund_lab()
    return this.treasury.fund_lab(poolCreator, totalAmount, amountPerRecipient);
  }

  async claimDistribution(recipient: Address, amount: bigint) {
    // Internally calls treasury.withdraw_scholarship()
    return this.treasury.withdraw_scholarship(recipient, amount);
  }

  // ... etc
}

// Usage
const protocol = new AdaptedProtocol(
  valocracyClient,
  governorClient,
  treasuryClient,
  DAO_TERMINOLOGY
);

await protocol.createFundingPool(sponsor, 10000n, 1000n);
```

---

## Deployment Guide

### 1. Fork the Repository

```bash
git clone https://github.com/karn-protocol/karn-protocol.git my-protocol
cd my-protocol
```

### 2. Customize Configuration

**Update environment variables:**
```bash
# .env.local
NEXT_PUBLIC_PROTOCOL_NAME="My Protocol"
NEXT_PUBLIC_TERMINOLOGY_PRESET="dao" # karn | coop | dao | community
```

**Customize terminology:**
```typescript
// frontend/src/config/terminology.ts
export const MY_CUSTOM_TERMINOLOGY: TerminologyConfig = {
  badge: "Your Term",
  mana: "Your Power Metric",
  lab: "Your Pool Type",
  // ...
};
```

### 3. Deploy Contracts (Unchanged)

```bash
cd contracts
soroban contract build
soroban contract deploy --wasm target/wasm32-unknown-unknown/release/valocracy.wasm
soroban contract deploy --wasm target/wasm32-unknown-unknown/release/governor.wasm
soroban contract deploy --wasm target/wasm32-unknown-unknown/release/treasury.wasm
```

**The contracts don't need modification** - they work as-is.

### 4. Initialize with Your Parameters

```typescript
// Initialize with your badge types
await valocracy.initialize(
  founder,
  governor,
  treasury,
  memberBadgeId: 0,
  badgeIds: [0, 10, 20, 30], // Your IDs
  rarities: [5, 20, 40, 70],  // Your rarities
  metadatas: ["Member", "Contributor", "Core", "Lead"], // Your names
  founderBadgeId: 1,
  backendSigner
);
```

### 5. Customize Frontend

**Update branding:**
- Logo: `public/logo.png`
- Colors: `tailwind.config.js`
- Copy: Use terminology config everywhere

**Update i18n:**
```typescript
// Use dynamic terminology in all translation strings
const { term } = useTerminology();
<h1>{t('hero.title', { badgeTerm: term('badges') })}</h1>
```

---

## Migration Checklist

- [ ] Choose terminology preset or create custom config
- [ ] Update all UI components to use `term()` function
- [ ] Replace hardcoded "Badge", "Mana", "Lab" with dynamic terms
- [ ] Update i18n files to support placeholders
- [ ] Customize badge metadata (names, descriptions)
- [ ] Configure governance parameters
- [ ] Deploy contracts (unchanged)
- [ ] Initialize with your parameters
- [ ] Test all flows with new terminology
- [ ] Update documentation/help text

---

## FAQ

### Do I need to modify the smart contracts?

**No.** The contracts are generic - only the terminology is domain-specific. Your frontend can call things whatever you want.

### Can I change the 180-day decay period?

Not currently without forking contracts. This is a good candidate for v2 to make configurable at deployment time.

### Can I use different badge types?

**Yes!** You define badge IDs, rarities, and metadata during initialization. The contracts don't care what you call them.

### Can I deploy multiple instances?

**Yes!** Each deployment is independent. You can run:
- Karn's education instance at `karn.io`
- Your co-op instance at `mycoop.io`
- Both using the same contract code with different configurations

### Do I need to maintain a fork?

**No.** You can use the contracts as a library/dependency. Only fork if you need contract-level changes (which you probably don't).

### What about future upgrades?

The contracts have an `upgrade()` function controlled by governance. You can upgrade to new contract versions without losing state.

### Can I white-label completely?

**Yes.** Nothing in the contracts mentions "Karn". That's only in:
- Frontend copy (easy to change)
- Documentation (fork and customize)
- Brand assets (replace with yours)

---

## Support & Community

- **GitHub:** https://github.com/karn-protocol/karn-protocol
- **Discord:** [Coming soon]
- **Docs:** https://docs.karn.io
- **Examples:** See `examples/` directory for sample deployments

**Built an adaptation?** Let us know! We'd love to showcase diverse use cases.

---

## License

Karn Protocol contracts are MIT licensed - use them however you want, commercial or non-commercial. Attribution appreciated but not required.
