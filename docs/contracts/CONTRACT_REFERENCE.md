# Smart Contract Reference Documentation

**Version**: 1.0.0
**Network**: Stellar/Soroban
**Language**: Rust
**Last Updated**: 2026-02-07

## Overview

Karn Protocol consists of three interconnected Soroban smart contracts implementing a decentralized governance system based on contribution, not capital:

| Contract | Purpose | Testnet Address |
|----------|---------|-----------------|
| **Valocracy** | Core IDNFT (soulbound badges) with decaying voting power | `CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"` |
| **Governor** | Proposal creation, voting, and execution | `CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"` |
| **Treasury** | Asset management and scholarship distribution | `CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"` |

---

## Table of Contents

- [Valocracy Contract](#valocracy-contract)
  - [Core Concepts](#core-concepts)
  - [Initialization](#initialization)
  - [Badge Management](#badge-management)
  - [Governance Functions](#governance-functions)
  - [Query Functions](#query-functions)
  - [Voting Power (Mana)](#voting-power-mana)
  - [Verification](#verification)
- [Governor Contract](#governor-contract)
  - [Initialization](#governor-initialization)
  - [Proposal Management](#proposal-management)
  - [Voting](#voting)
  - [Execution](#execution)
  - [Configuration](#configuration)
- [Treasury Contract](#treasury-contract)
  - [Initialization](#treasury-initialization)
  - [Share Management](#share-management)
  - [Asset Operations](#asset-operations)
  - [Scholarship System](#scholarship-system)
  - [Governance Operations](#governance-operations)
- [Error Reference](#error-reference)
- [Events Reference](#events-reference)
- [Security Considerations](#security-considerations)

---

# Valocracy Contract

The Valocracy contract is the **core identity and voting power system** for Karn Protocol. It implements soulbound NFTs (non-transferable badges) where each badge grants a level of influence that decays over time without activity.

## Core Concepts

### IDNFT (Isonomic Degradable Non-Fungible Token)

- **Soulbound**: Badges cannot be transferred to other accounts
- **Degradable**: Voting power decays linearly over 180 days without new badges
- **Non-Fungible**: Each badge is unique with specific metadata
- **Isonomic**: All members start with equal baseline power (Member Floor)

### Key Constants

```rust
/// Vacancy period: 180 days in seconds
pub const VACANCY_PERIOD: u64 = 15_552_000; // 180 * 24 * 60 * 60

/// Member Floor: minimum voting power for any registered member
pub const MEMBER_FLOOR: u64 = 5;
```

### Badge Categories

| Category | ID Range | Access Control | Examples |
|----------|----------|----------------|----------|
| **Member** | 0 | Self-registration only | Member Badge |
| **Founder** | 1 | Initialization only | Founder Badge (permanent) |
| **Leadership** | 10-19 | Governor only | Lideranca, Guardian Mentor |
| **Track** | 20-59 | Governor or Leadership holders | Learning Path badges |
| **Community** | 60-69 | Any member | Community badges |
| **Governance** | 70-79 | Governor only | Governance-related badges |

---

## Initialization

### `initialize()`

Initialize the Valocracy contract with all configuration and initial badges.

**Signature:**
```rust
pub fn initialize(
    env: Env,
    founder: Address,
    governor: Address,
    treasury: Address,
    member_valor_id: u64,
    valor_ids: Vec<u64>,
    valor_rarities: Vec<u64>,
    valor_metadatas: Vec<String>,
    founder_valor_id: u64,
    signer: BytesN<32>,
) -> Result<(), ValocracyError>
```

**Parameters:**
- `founder`: Address that receives the permanent Founder badge
- `governor`: Governor contract address for governance operations
- `treasury`: Treasury contract address for fund management
- `member_valor_id`: Valor ID used for self-registration (typically 0)
- `valor_ids`: List of badge IDs to register
- `valor_rarities`: List of badge rarities (voting power values)
- `valor_metadatas`: List of metadata strings (badge names/descriptions)
- `founder_valor_id`: Which badge ID is the Founder badge (typically 1)
- `signer`: Backend public key for signature verification (Ed25519)

**Returns:**
- `Ok(())` on success
- `Err(AlreadyInitialized)` if contract was already initialized
- `Err(NonExistentValor)` if founder badge doesn't exist

**Side Effects:**
- Sets all contract addresses (governor, treasury, founder)
- Registers all valor types
- Mints Founder badge to founder address
- Emits `initialized` and `mint` events

**Example:**
```typescript
import { ValocracyClient } from '@karn/protocol-sdk';

const client = new ValocracyClient({ /* config */ });

await client.initialize({
  founder: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"',
  governor: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"',
  treasury: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"',
  member_valor_id: 0,
  valor_ids: [0, 1, 10, 20, 60, 70],
  valor_rarities: [5, 100, 50, 20, 10, 75],
  valor_metadatas: ['Member', 'Founder', 'Lideranca', 'Learning Path', 'Community', 'Governance'],
  founder_valor_id: 1,
  signer: /* backend public key */,
});
```

**Security Notes:**
- Can only be called once
- No admin keys — configuration is immutable after initialization
- Founder badge is permanent (never decays)

---

## Badge Management

### `mint()`

Mint a new badge to a recipient. Requires role-based authorization.

**Signature:**
```rust
pub fn mint(
    env: Env,
    minter: Address,
    recipient: Address,
    valor_id: u64
) -> Result<u64, ValocracyError>
```

**Parameters:**
- `minter`: Address attempting to mint (must have appropriate authorization)
- `recipient`: Address receiving the badge
- `valor_id`: Badge ID to mint

**Returns:**
- `Ok(token_id)` — The new token ID on success
- `Err(NotAuthorized)` — Minter lacks permission for this badge category
- `Err(InvalidValorId)` — Badge ID out of valid range
- `Err(NonExistentValor)` — Badge type not registered

**Access Control Matrix:**

| Badge Category | Who Can Mint |
|----------------|--------------|
| Member (0) | Self-registration only (via `self_register`) |
| Founder (1) | Never (only during initialization) |
| Leadership (10-19) | Governor only |
| Track (20-59) | Governor OR Leadership holders |
| Community (60-69) | Any member (level > 0) |
| Governance (70-79) | Governor only |

**Side Effects:**
- Increases recipient's level by badge rarity
- Updates expiry to 180 days from now
- Increments total supply
- Emits `mint` event

**Example:**
```typescript
// Governance minting a learning path badge
const tx = client.mint({
  minter: governorAddress,
  recipient: 'GMEMBER...',
  valor_id: 20, // Learning path badge
});

const result = await tx.simulate();
const tokenId = StellarSdk.scValToBigInt(result.result.retval);
console.log('Minted token ID:', tokenId);
```

**Reentrancy Protection:**
- Uses reentrancy guard to prevent recursive calls

---

### `self_register()`

Register a new member by minting the Member badge (ID 0). Requires backend signature.

**Signature:**
```rust
pub fn self_register(
    env: Env,
    caller: Address,
    signature: BytesN<64>,
    nonce: u64,
    expiry: u64,
) -> Result<u64, ValocracyError>
```

**Parameters:**
- `caller`: Address registering (must sign the transaction)
- `signature`: Ed25519 signature from backend
- `nonce`: Unique nonce to prevent replay attacks
- `expiry`: Signature expiration timestamp

**Payload Signed:**
```
account || valor_id || nonce || expiry
```

**Returns:**
- `Ok(token_id)` — New token ID
- `Err(SignatureExpired)` — Signature past expiry time
- `Err(InvalidSignature)` — Signature verification failed
- `Err(NonceAlreadyUsed)` — Nonce was used before (replay attack)

**Side Effects:**
- Mints Member badge (ID 0, rarity 5)
- Sets level to 5, permanent_level to 0
- Marks nonce as used
- Emits `mint` event

**Example:**
```typescript
// 1. Backend generates signature
const payload = Buffer.concat([
  publicKey.toBuffer(),
  Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]), // valor_id = 0
  Buffer.from(nonce.toString()),
  Buffer.from(expiry.toString()),
]);
const signature = nacl.sign.detached(payload, secretKey);

// 2. Frontend calls self_register
const tx = client.self_register({
  caller: userAddress,
  signature: Buffer.from(signature),
  nonce,
  expiry,
});
```

**Security Notes:**
- Prevents Sybil attacks via backend signature
- Nonce prevents replay attacks
- Signature has expiration time
- Each address can only register once

---

### `guardian_mint()`

Mint a badge using backend (guardian) signature. Used for approved badge grants.

**Signature:**
```rust
pub fn guardian_mint(
    env: Env,
    account: Address,
    valor_id: u64,
    signature: BytesN<64>,
    nonce: u64,
    expiry: u64,
) -> Result<u64, ValocracyError>
```

**Parameters:**
- `account`: Recipient address
- `valor_id`: Badge ID to mint
- `signature`: Backend signature
- `nonce`: Unique nonce
- `expiry`: Signature expiration

**Returns:**
- `Ok(token_id)` — New token ID
- Errors same as `self_register()`

**Use Cases:**
- Awarding badges for completing learning paths
- Granting community badges after verification
- Minting track badges after course completion

**Example:**
```typescript
// After user completes learning path, backend signs approval
const tx = client.guardian_mint({
  account: userAddress,
  valor_id: 20, // Learning path badge
  signature: backendSignature,
  nonce: uniqueNonce,
  expiry: timestamp + 3600, // 1 hour validity
});
```

---

### `revoke()`

Burn a badge token. Governor-only, used for governance-decided removal.

**Signature:**
```rust
pub fn revoke(
    env: Env,
    token_id: u64
) -> Result<(), ValocracyError>
```

**Parameters:**
- `token_id`: Token to burn

**Authorization:**
- Requires governor auth (must be called via governance proposal)

**Returns:**
- `Ok(())` on success
- `Err(Unauthorized)` if caller is not governor
- `Err(InvalidTokenId)` if token doesn't exist

**Side Effects:**
- Reduces owner's level by badge rarity
- Removes token from storage
- Emits `revoke` event

**Example:**
```typescript
// Via governance proposal
const actions = [
  {
    contract: valocracyAddress,
    function: 'revoke',
    args: [tokenId],
  }
];

const proposalId = await governor.propose({
  proposer: memberAddress,
  description: 'Revoke badge from inactive member',
  actions,
});
```

**Security Notes:**
- Cannot be called directly — requires governance vote
- Permanent level is NOT reduced (founder status persists)
- Reentrancy protected

---

## Governance Functions

### `set_valor()`

Create or update a badge type. Governor-only.

**Signature:**
```rust
pub fn set_valor(
    env: Env,
    valor_id: u64,
    rarity: u64,
    metadata: String,
) -> Result<(), ValocracyError>
```

**Parameters:**
- `valor_id`: Badge ID (must be in valid range)
- `rarity`: Voting power granted by this badge
- `metadata`: Badge name/description

**Returns:**
- `Ok(())` on success
- `Err(Unauthorized)` if not governor
- `Err(InvalidValorId)` if ID out of range

**Example:**
```typescript
// Via governance
const actions = [{
  contract: valocracyAddress,
  function: 'set_valor',
  args: [25, 30, 'Advanced Rust Badge'],
}];
```

---

### `update_governor()`

Update the governor contract address (migration path).

**Signature:**
```rust
pub fn update_governor(
    env: Env,
    new_governor: Address
) -> Result<(), ValocracyError>
```

**Authorization:** Current governor only

**Use Case:** Upgrading to a new governor contract version

---

### `update_treasury()`

Update the treasury contract address.

**Signature:**
```rust
pub fn update_treasury(
    env: Env,
    new_treasury: Address
) -> Result<(), ValocracyError>
```

**Authorization:** Current governor only

---

### `upgrade()`

Upgrade the contract to a new WASM hash.

**Signature:**
```rust
pub fn upgrade(
    env: Env,
    new_wasm_hash: BytesN<32>
) -> Result<(), ValocracyError>
```

**Authorization:** Governor only (requires governance proposal)

**Security Notes:**
- Allows governance-controlled upgrades
- No admin backdoor
- Previous contract state is preserved

---

## Query Functions

### `get_votes()`

Get the current voting power (Mana) of an account.

**Signature:**
```rust
pub fn get_votes(
    env: Env,
    account: Address
) -> u64
```

**Returns:**
- Current Mana value (minimum 5 for registered members)
- 0 for unregistered accounts

**Formula:**
```
Mana = MEMBER_FLOOR + bonus + permanent_level

Where:
  MEMBER_FLOOR = 5
  decaying_level = max(0, level - permanent_level)
  time_remaining = max(0, expiry - current_time)
  bonus = floor(decaying_level * time_remaining / VACANCY_PERIOD)
```

**Example:**
```typescript
const mana = await client.get_votes({ account: userAddress });
console.log('Voting power:', mana);
```

---

### `level_of()`

Get the raw level of an account (without decay).

**Signature:**
```rust
pub fn level_of(
    env: Env,
    account: Address
) -> u64
```

**Returns:**
- Total accumulated level from all badges
- 0 if not registered

---

### `permanent_level_of()`

Get the permanent level (from Founder badge or other permanent badges).

**Signature:**
```rust
pub fn permanent_level_of(
    env: Env,
    account: Address
) -> u64
```

**Returns:**
- Permanent level that never decays
- 0 for non-founders

---

### `expiry_of()`

Get the expiry timestamp when voting power fully decays.

**Signature:**
```rust
pub fn expiry_of(
    env: Env,
    account: Address
) -> u64
```

**Returns:**
- Unix timestamp of expiry
- Updated to 180 days from now when new badges are minted

---

### `has_voting_power()`

Check if an account has any voting power.

**Signature:**
```rust
pub fn has_voting_power(
    env: Env,
    account: Address
) -> bool
```

**Returns:**
- `true` if registered (any level > 0)
- `false` otherwise

**Note:** Registered members ALWAYS have at least Member Floor (5) voting power.

---

### `is_verified()`

Check if a member has completed identity verification.

**Signature:**
```rust
pub fn is_verified(
    env: Env,
    account: Address
) -> bool
```

**Returns:**
- `true` if identity verified
- `false` otherwise

**Use Case:**
- Required for scholarship withdrawals
- Optional for governance participation

---

### Metadata Functions

#### `name()`
Returns: `"Valocracy"`

#### `symbol()`
Returns: `"VALOR"`

#### `total_supply()`
Returns: Number of badges minted

#### `vacancy_period()`
Returns: `15552000` (180 days in seconds)

#### `founder()`
Returns: Founder address

#### `governor()`
Returns: Governor contract address

#### `treasury()`
Returns: Treasury contract address

#### `owner_of(token_id: u64)`
Returns: Owner address of token

#### `valor_id_of(token_id: u64)`
Returns: Badge ID for token

#### `rarity_of(valor_id: u64)`
Returns: Rarity (voting power) of badge type

#### `metadata_of(valor_id: u64)`
Returns: Badge name/description

---

## Verification

### `set_verified()`

Set the verification status of a member. Governor-only.

**Signature:**
```rust
pub fn set_verified(
    env: Env,
    account: Address,
    verified: bool
) -> Result<(), ValocracyError>
```

**Parameters:**
- `account`: Member to verify
- `verified`: `true` to mark verified, `false` to revoke

**Authorization:** Governor only

**Use Case:**
- After identity verification process completes
- Required before scholarship withdrawals

**Example:**
```typescript
// Via governance
const actions = [{
  contract: valocracyAddress,
  function: 'set_verified',
  args: [memberAddress, true],
}];
```

---

# Governor Contract

The Governor contract handles **proposal creation, voting, and execution** for Karn's decentralized governance.

<a name="governor-initialization"></a>
## Initialization

### `initialize()`

Initialize the Governor contract.

**Signature:**
```rust
pub fn initialize(
    env: Env,
    valocracy: Address,
    voting_delay: u64,
    voting_period: u64,
    quorum_percentage: u64,
    proposal_threshold: u64,
) -> Result<(), GovernorError>
```

**Parameters:**
- `valocracy`: Valocracy contract address for membership/voting power
- `voting_delay`: Delay before voting starts (seconds, minimum 3600 = 1 hour)
- `voting_period`: Duration of voting period (seconds, minimum 86400 = 1 day)
- `quorum_percentage`: Minimum % of total votes needed (10-100)
- `proposal_threshold`: Minimum Mana needed to create proposals

**Default Configuration:**
```rust
voting_delay: 86400,        // 1 day
voting_period: 604800,      // 7 days
quorum_percentage: 51,      // 51% quorum
proposal_threshold: 10,     // Need 10 Mana to propose
```

**Example:**
```typescript
await governor.initialize({
  valocracy: valocracyAddress,
  voting_delay: 86400,
  voting_period: 604800,
  quorum_percentage: 51,
  proposal_threshold: 10,
});
```

---

## Proposal Management

### `propose()`

Create a new governance proposal.

**Signature:**
```rust
pub fn propose(
    env: Env,
    proposer: Address,
    description: String,
    actions: Vec<ProposedAction>,
) -> Result<u64, GovernorError>
```

**Parameters:**
- `proposer`: Address creating proposal (must have enough Mana)
- `description`: Proposal description (what and why)
- `actions`: List of contract calls to execute if passed

**ProposedAction Structure:**
```rust
pub struct ProposedAction {
    pub contract: Address,      // Target contract
    pub function: Symbol,        // Function name
    pub args: Vec<Val>,          // Function arguments
    pub value: i128,             // XLM to send (usually 0)
}
```

**Returns:**
- `Ok(proposal_id)` on success
- `Err(InsufficientVotingPower)` if proposer lacks threshold Mana
- `Err(EmptyActions)` if no actions provided

**Proposal Lifecycle:**
```
Created → Pending (voting_delay) → Active (voting_period) → [Succeeded/Defeated/Expired]
```

**Example:**
```typescript
const actions = [
  {
    contract: valocracyAddress,
    function: 'set_valor',
    args: [30, 50, 'New Badge Type'],
    value: 0,
  }
];

const proposalId = await governor.propose({
  proposer: memberAddress,
  description: 'Add new badge type for advanced contributions',
  actions,
});
```

**Side Effects:**
- Creates proposal with state `Pending`
- Sets voting start time (now + voting_delay)
- Sets voting end time (start + voting_period)
- Emits `proposal_created` event

---

### `get_proposal()`

Get proposal details by ID.

**Signature:**
```rust
pub fn get_proposal(
    env: Env,
    proposal_id: u64
) -> Option<Proposal>
```

**Returns:**
```rust
pub struct Proposal {
    pub proposer: Address,
    pub description: String,
    pub actions: Vec<ProposedAction>,
    pub for_votes: u64,
    pub against_votes: u64,
    pub start_time: u64,
    pub end_time: u64,
    pub executed: bool,
}
```

**Example:**
```typescript
const proposal = await governor.get_proposal({ proposal_id: 1 });
console.log('For:', proposal.for_votes);
console.log('Against:', proposal.against_votes);
```

---

### `get_proposal_state()`

Get the current state of a proposal.

**Signature:**
```rust
pub fn get_proposal_state(
    env: Env,
    proposal_id: u64
) -> Result<ProposalState, GovernorError>
```

**Returns:**
```rust
pub enum ProposalState {
    Pending,    // Waiting for voting_delay to pass
    Active,     // Currently voting
    Defeated,   // Voting ended, did not pass
    Succeeded,  // Voting ended, passed (ready for execution)
    Executed,   // Already executed
    Expired,    // Voting ended, execution window expired
}
```

**State Transitions:**
```
Pending → Active → [Succeeded/Defeated] → [Executed/Expired]
```

---

### `proposal_count()`

Get total number of proposals created.

**Signature:**
```rust
pub fn proposal_count(env: Env) -> u64
```

---

## Voting

### `cast_vote()`

Cast a vote on an active proposal.

**Signature:**
```rust
pub fn cast_vote(
    env: Env,
    voter: Address,
    proposal_id: u64,
    support: bool,
) -> Result<(), GovernorError>
```

**Parameters:**
- `voter`: Address voting (must sign transaction)
- `proposal_id`: Proposal to vote on
- `support`: `true` for yes, `false` for no

**Returns:**
- `Ok(())` on success
- `Err(ProposalNotActive)` if voting period hasn't started or has ended
- `Err(AlreadyVoted)` if voter already voted on this proposal
- `Err(InsufficientVotingPower)` if voter has 0 Mana

**Voting Weight:**
- Vote weight = voter's current Mana at time of vote
- Queried from Valocracy contract via `get_votes()`

**Example:**
```typescript
await governor.cast_vote({
  voter: memberAddress,
  proposal_id: 1,
  support: true, // Vote yes
});
```

**Side Effects:**
- Records vote (prevents double voting)
- Adds Mana to for_votes or against_votes
- Emits `vote_cast` event

---

### `has_voted()`

Check if an account has voted on a proposal.

**Signature:**
```rust
pub fn has_voted(
    env: Env,
    proposal_id: u64,
    voter: Address
) -> bool
```

---

## Execution

### `execute()`

Execute a succeeded proposal.

**Signature:**
```rust
pub fn execute(
    env: Env,
    proposal_id: u64
) -> Result<(), GovernorError>
```

**Preconditions:**
- Proposal must be in `Succeeded` state
- Must be within execution window (before expiry)
- Quorum must be met: `(for_votes + against_votes) >= (total_supply * quorum_percentage / 100)`
- Majority must be yes: `for_votes > against_votes`

**Returns:**
- `Ok(())` on success
- `Err(ProposalNotSucceeded)` if not ready
- `Err(QuorumNotReached)` if insufficient participation
- `Err(AlreadyExecuted)` if already executed

**Side Effects:**
- Executes all actions in order
- Marks proposal as executed
- Emits `proposal_executed` event

**Example:**
```typescript
// After proposal succeeds
await governor.execute({ proposal_id: 1 });
```

**Security Notes:**
- Anyone can execute a succeeded proposal
- Actions execute with governor authority
- Reentrancy protected

---

## Configuration

### `update_config()`

Update governance configuration. Governor-only (self-governance).

**Signature:**
```rust
pub fn update_config(
    env: Env,
    voting_delay: u64,
    voting_period: u64,
    quorum_percentage: u64,
    proposal_threshold: u64,
) -> Result<(), GovernorError>
```

**Validation:**
- `voting_delay >= 3600` (1 hour minimum)
- `voting_period >= 86400` (1 day minimum)
- `10 <= quorum_percentage <= 100`

**Example:**
```typescript
// Via governance proposal
const actions = [{
  contract: governorAddress,
  function: 'update_config',
  args: [
    172800,  // 2 day delay
    1209600, // 14 day voting
    60,      // 60% quorum
    15,      // 15 Mana threshold
  ],
}];
```

---

### `valocracy()`

Get the Valocracy contract address.

**Returns:** Address

---

### `upgrade()`

Upgrade to new WASM hash. Governor-only.

**Signature:**
```rust
pub fn upgrade(
    env: Env,
    new_wasm_hash: BytesN<32>
) -> Result<(), GovernorError>
```

---

# Treasury Contract

The Treasury contract manages **asset custody and scholarship distribution**.

<a name="treasury-initialization"></a>
## Initialization

### `initialize()`

Initialize the Treasury contract.

**Signature:**
```rust
pub fn initialize(
    env: Env,
    valocracy: Address,
    governor: Address,
    asset_token: Address,
) -> Result<(), TreasuryError>
```

**Parameters:**
- `valocracy`: Valocracy contract (for verification checks)
- `governor`: Governor contract (for privileged operations)
- `asset_token`: Token contract address (e.g., USDC)

**Example:**
```typescript
await treasury.initialize({
  valocracy: valocracyAddress,
  governor: governorAddress,
  asset_token: usdcTokenAddress,
});
```

---

## Share Management

### `deposit()`

Deposit shares to a user account. Called by Valocracy when minting badges.

**Signature:**
```rust
pub fn deposit(
    env: Env,
    receiver: Address,
    shares: i128
) -> Result<(), TreasuryError>
```

**Authorization:** Valocracy contract only

**Note:** This is NOT a user-facing function. Shares are allocated based on badge rarity, not asset deposits.

---

### `shares_of()`

Get shares for a specific user.

**Signature:**
```rust
pub fn shares_of(
    env: Env,
    account: Address
) -> i128
```

---

### `total_shares()`

Get total shares outstanding.

**Returns:** Total shares across all users

---

## Asset Operations

### `withdraw()`

Withdraw assets by burning shares.

**Signature:**
```rust
pub fn withdraw(
    env: Env,
    owner: Address,
    shares: i128,
) -> Result<i128, TreasuryError>
```

**Parameters:**
- `owner`: Account withdrawing (must sign)
- `shares`: Amount of shares to burn

**Returns:**
- `Ok(assets)` — Amount of assets transferred
- `Err(InsufficientShares)` if owner lacks shares
- `Err(NotVerified)` if owner not identity-verified

**Vault Math:**
```rust
assets = (shares * total_assets) / (total_shares + VIRTUAL_OFFSET)
```

**Rounding:** Rounds DOWN (user gets slightly less, vault keeps remainder for security)

**Example:**
```typescript
const sharesToBurn = 100;
const tx = await treasury.withdraw({
  owner: memberAddress,
  shares: sharesToBurn,
});

// Returns amount of USDC transferred
```

**Security Notes:**
- Requires identity verification
- First-depositor attack mitigated by virtual offset
- Zero-share withdrawal rejected

---

### `total_assets()`

Get total assets in treasury by querying token balance.

**Returns:** Current asset balance

---

### `asset()`

Get the asset token address.

**Returns:** Token contract address

---

### `preview_withdraw()`

Preview how many assets a share amount would yield.

**Signature:**
```rust
pub fn preview_withdraw(
    env: Env,
    shares: i128
) -> Result<i128, TreasuryError>
```

**Returns:** Estimated asset amount (same calculation as withdraw)

---

## Scholarship System

### `fund_lab()`

Fund a new scholarship lab. Anyone can fund.

**Signature:**
```rust
pub fn fund_lab(
    env: Env,
    funder: Address,
    lab_id: u64,
    amount: i128,
) -> Result<(), TreasuryError>
```

**Parameters:**
- `funder`: Address providing funds (must sign)
- `lab_id`: Unique identifier for the lab/scholarship
- `amount`: Asset amount to fund

**Side Effects:**
- Transfers assets from funder to treasury
- Creates or increases lab balance
- Emits `lab_funded` event

**Example:**
```typescript
await treasury.fund_lab({
  funder: companyAddress,
  lab_id: 1,
  amount: 10000_000000, // 10,000 USDC (6 decimals)
});
```

---

### `approve_scholarship()`

Approve scholarship for a member. Governor-only.

**Signature:**
```rust
pub fn approve_scholarship(
    env: Env,
    lab_id: u64,
    member: Address,
    amount: i128,
) -> Result<(), TreasuryError>
```

**Parameters:**
- `lab_id`: Lab to withdraw from
- `member`: Recipient of scholarship
- `amount`: Amount to approve

**Authorization:** Governor only (governance/mentor approval)

**Returns:**
- `Ok(())` on success
- `Err(InsufficientLabBalance)` if lab lacks funds
- `Err(Unauthorized)` if not governor

**Side Effects:**
- Deducts from lab balance
- Adds to member's claimable balance
- Emits `scholarship_approved` event

**Example:**
```typescript
// Via governance
const actions = [{
  contract: treasuryAddress,
  function: 'approve_scholarship',
  args: [1, memberAddress, 1000_000000], // 1,000 USDC
}];
```

---

### `get_claimable_balance()`

Get a member's claimable scholarship balance.

**Signature:**
```rust
pub fn get_claimable_balance(
    env: Env,
    member: Address
) -> i128
```

---

### `withdraw_scholarship()`

Withdraw approved scholarship funds.

**Signature:**
```rust
pub fn withdraw_scholarship(
    env: Env,
    member: Address,
    amount: i128,
) -> Result<(), TreasuryError>
```

**Parameters:**
- `member`: Address withdrawing (must sign)
- `amount`: Amount to withdraw

**Returns:**
- `Ok(())` on success
- `Err(InsufficientBalance)` if claimable balance too low
- `Err(NotVerified)` if member not identity-verified

**Side Effects:**
- Deducts from claimable balance
- Transfers assets to member
- Emits `scholarship_withdrawn` event

**Example:**
```typescript
await treasury.withdraw_scholarship({
  member: memberAddress,
  amount: 500_000000, // 500 USDC
});
```

**Security Notes:**
- Requires identity verification
- Can only withdraw approved amount
- Separate from share-based withdrawals

---

## Governance Operations

### `spend()`

Spend treasury assets. Governor-only.

**Signature:**
```rust
pub fn spend(
    env: Env,
    recipient: Address,
    amount: i128,
) -> Result<(), TreasuryError>
```

**Authorization:** Governor only (via governance proposal)

**Use Case:** Fund initiatives, pay contributors, etc.

**Example:**
```typescript
// Via governance
const actions = [{
  contract: treasuryAddress,
  function: 'spend',
  args: [recipientAddress, 5000_000000], // 5,000 USDC
}];
```

---

### `update_governor()`

Update governor address. Current governor only.

**Signature:**
```rust
pub fn update_governor(
    env: Env,
    new_governor: Address
) -> Result<(), TreasuryError>
```

---

### `upgrade()`

Upgrade contract. Governor-only.

**Signature:**
```rust
pub fn upgrade(
    env: Env,
    new_wasm_hash: BytesN<32>
) -> Result<(), TreasuryError>
```

---

### Query Functions

#### `valocracy()`
Returns: Valocracy contract address

#### `governor()`
Returns: Governor contract address

---

# Error Reference

## Valocracy Errors

```rust
pub enum ValocracyError {
    AlreadyInitialized,          // Contract already initialized
    Unauthorized,                // Caller lacks permission
    NotAuthorized,               // Minter lacks permission for badge category
    InvalidBadgeForRole,         // Badge category wrong for minter's role
    NonExistentValor,            // Badge type doesn't exist
    InvalidValorId,              // Badge ID out of valid range
    InvalidTokenId,              // Token ID doesn't exist
    SignatureExpired,            // Signature past expiry time
    InvalidSignature,            // Ed25519 signature verification failed
    NonceAlreadyUsed,            // Nonce reused (replay attack)
    ReentrancyDetected,          // Recursive call detected
}
```

## Governor Errors

```rust
pub enum GovernorError {
    AlreadyInitialized,          // Contract already initialized
    InsufficientVotingPower,     // Proposer lacks minimum Mana
    EmptyActions,                // Proposal has no actions
    ProposalNotFound,            // Invalid proposal ID
    ProposalNotActive,           // Voting period not started or ended
    AlreadyVoted,                // Voter already cast vote
    ProposalNotSucceeded,        // Proposal not ready for execution
    QuorumNotReached,            // Insufficient voter participation
    AlreadyExecuted,             // Proposal already executed
    Unauthorized,                // Caller lacks permission
    InvalidConfig,               // Config values below minimums
}
```

## Treasury Errors

```rust
pub enum TreasuryError {
    AlreadyInitialized,          // Contract already initialized
    Unauthorized,                // Caller lacks permission
    InsufficientShares,          // Account lacks shares
    InsufficientBalance,         // Insufficient claimable balance
    InsufficientLabBalance,      // Lab lacks funds
    NotVerified,                 // Member not identity-verified
    ZeroShares,                  // Cannot mint zero shares
    Overflow,                    // Arithmetic overflow
}
```

---

# Events Reference

## Valocracy Events

### `initialized`
**Topic:** `(Symbol::new(&env, "initialized"),)`
**Data:** `founder: Address`

### `mint`
**Topic:** `(Symbol::new(&env, "mint"), recipient: Address)`
**Data:** `(token_id: u64, valor_id: u64, rarity: u64)`

### `revoke`
**Topic:** `(Symbol::new(&env, "revoke"),)`
**Data:** `(token_id: u64, owner: Address)`

### `set_valor`
**Topic:** `(Symbol::new(&env, "set_valor"),)`
**Data:** `(valor_id: u64, rarity: u64)`

### `update_governor`
**Topic:** `(Symbol::new(&env, "update_governor"),)`
**Data:** `new_governor: Address`

### `update_treasury`
**Topic:** `(Symbol::new(&env, "update_treasury"),)`
**Data:** `new_treasury: Address`

### `verified`
**Topic:** `(Symbol::new(&env, "verified"), account: Address)`
**Data:** `verified: bool`

---

## Governor Events

### `proposal_created`
**Topic:** `(Symbol::new(&env, "proposal_created"),)`
**Data:** `(proposal_id: u64, proposer: Address)`

### `vote_cast`
**Topic:** `(Symbol::new(&env, "vote_cast"), proposal_id: u64)`
**Data:** `(voter: Address, support: bool, weight: u64)`

### `proposal_executed`
**Topic:** `(Symbol::new(&env, "proposal_executed"),)`
**Data:** `proposal_id: u64`

### `config_updated`
**Topic:** `(Symbol::new(&env, "config_updated"),)`
**Data:** `(voting_delay: u64, voting_period: u64, quorum: u64)`

---

## Treasury Events

### `deposit`
**Topic:** `(Symbol::new(&env, "deposit"), receiver: Address)`
**Data:** `shares: i128`

### `withdraw`
**Topic:** `(Symbol::new(&env, "withdraw"), owner: Address)`
**Data:** `(shares: i128, assets: i128)`

### `lab_funded`
**Topic:** `(Symbol::new(&env, "lab_funded"),)`
**Data:** `(lab_id: u64, funder: Address, amount: i128)`

### `scholarship_approved`
**Topic:** `(Symbol::new(&env, "scholarship_approved"),)`
**Data:** `(lab_id: u64, member: Address, amount: i128)`

### `scholarship_withdrawn`
**Topic:** `(Symbol::new(&env, "scholarship_withdrawn"), member: Address)`
**Data:** `amount: i128`

---

# Security Considerations

## Access Control

**No Admin Keys:**
- All contracts are adminless after initialization
- All privileged operations require governance proposals
- No backdoor upgrade mechanisms

**Role-Based Access:**
- Badge minting follows strict RBAC matrix
- Governor functions self-governed
- Treasury operations governor-controlled

## Reentrancy Protection

**Contracts Protected:**
- Valocracy: `mint()`, `revoke()`
- Governor: Inherently safe (no external calls in critical sections)
- Treasury: Inherently safe (standard CEI pattern)

**Implementation:**
```rust
// Before critical operation
set_guard(&env);

// Critical operation
// ...

// After operation
clear_guard(&env);
```

## Signature Security

**Self-Registration:**
- Ed25519 signatures required
- Nonce prevents replay attacks
- Expiry time limits validity
- Backend key never on-chain

**Guardian Mint:**
- Same security as self-registration
- Used for approved badge grants

## Vault Security

**Treasury Math:**
- Virtual offset prevents first-depositor attack
- Rounding DOWN favors vault
- Zero-share deposits rejected
- Checked arithmetic prevents overflow

## Identity Verification

**ADR-003 Compliance:**
- Withdrawals require verification
- Prevents anonymous fund extraction
- Governance participation unrestricted

## Upgrade Mechanism

**Governance-Controlled:**
- All upgrades require proposals
- Community vote needed
- No emergency upgrade backdoor
- State preserved across upgrades

## Known Limitations

**Pre-Mainnet:**
1. Contracts not formally audited
2. Testnet only — do NOT use with real funds
3. See `SPEC-SC-001-security-hardening.md` for full list

**Recommended Actions:**
- Complete OpenZeppelin audit before mainnet
- Formal verification of vault math
- Comprehensive integration testing
- Bug bounty program post-mainnet

---

# Contract Addresses

## Testnet (Stellar)

| Contract | Address | Deployed |
|----------|---------|----------|
| Valocracy | `CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"` | ✅ |
| Governor | `CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"` | ✅ |
| Treasury | `CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"` | ✅ |
| Founder | `GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"` | - |

## Mainnet

**Not yet deployed** — awaiting security audit completion.

---

# Network Configuration

## Testnet

```typescript
{
  networkPassphrase: 'Test SDF Network ; September 2015',
  rpcUrl: 'https://soroban-testnet.stellar.org',
}
```

## Mainnet (Future)

```typescript
{
  networkPassphrase: 'Public Global Stellar Network ; September 2015',
  rpcUrl: 'https://soroban-mainnet.stellar.org', // TBD
}
```

---

# Additional Resources

- **Whitepaper**: `Whitepaper_Karn.md`
- **Getting Started**: `GETTING_STARTED.md`
- **Core Concepts**: `CORE_CONCEPTS.md`
- **Security Hardening**: `specs/contracts/SPEC-SC-001-security-hardening.md`
- **SDK Documentation**: `karn-protocol/sdk/README.md`
- **Integration Tests**: `karn-protocol/contracts/tests/`

---

**Contract Reference Version**: 1.0.0
**Last Updated**: 2026-02-07
**Status**: Testnet Only — Production Deployment Pending Audit
