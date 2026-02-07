# Valocracy Treasury Redesign

**Date:** 2026-02-07
**Status:** ✅ Implemented
**Impact:** Critical architectural change - enforces collective governance

---

## Executive Summary

The Treasury contract has been redesigned to align with core Valocracy principles: **all treasury withdrawals must be approved through collective governance, not redeemed individually.**

This change transforms the Treasury from an ERC-4626-style vault (individual redemptions) to a **governance-controlled asset manager** (collective decisions).

---

## What Changed

### Before (Vault Model)

```rust
// ❌ OLD: Anyone with shares could withdraw directly
pub fn withdraw(env: Env, caller: Address, receiver: Address, shares: i128) {
    caller.require_auth();

    // Calculate proportional assets
    let assets = convert_shares_to_assets(shares);

    // Transfer assets to caller
    token.transfer(&treasury, &receiver, &assets);
}
```

**Problem:** This creates individual ownership claims, contradicting Valocracy's collective decision-making model.

### After (Governance Model)

```rust
// ✅ NEW: Only Governor can move funds after community vote
pub fn transfer(env: Env, receiver: Address, amount: i128) {
    // CRITICAL: Only Governor can call this
    let governor = get_governor(&env)?;
    governor.require_auth();

    // Transfer funds (executed after governance approval)
    token.transfer(&treasury, &receiver, &amount);
}

// ❌ Individual withdrawals disabled
pub fn withdraw(...) -> Result<i128, TreasuryError> {
    Err(TreasuryError::NotAuthorized)  // Always fails
}
```

---

## Governance Flow

### Member Wants Funds

1. **Proposal Creation**
   Maria needs 1000 USDC for a project
   → Creates governance proposal: "Send 1000 USDC to Maria's address"

2. **Community Voting**
   All members vote (weighted by Mana = contribution-based power)
   → Voting period: 7 days (default)
   → Approval threshold: 51% of votes FOR
   → Participation threshold: 4% of total Mana must vote

3. **Execution**
   If approved → Governor executes proposal
   → Calls `treasury.transfer(maria_address, 1000_USDC)`
   → Funds transferred to Maria

4. **If Rejected**
   No transfer happens
   → Maria can create a new proposal with revised request

---

## Technical Details

### Contract Functions

**Governance-Controlled (Governor-only):**
```rust
transfer(receiver: Address, amount: i128) -> Result<()>
// Primary function - ALL fund movements go through this
// Only callable by Governor contract after approved proposal
```

**Share Accounting (Valocracy-only):**
```rust
deposit(receiver: Address, shares: i128) -> Result<()>
// Allocates shares when badges are minted
// Shares are informational (track contribution)
// Cannot be redeemed individually
```

**Deprecated (Always fails):**
```rust
withdraw(...) -> Result<i128, TreasuryError>
// Returns NotAuthorized
// Kept for backward compatibility but disabled
```

### Action Type (Governor)

Proposals can include Treasury transfers as actions:
```rust
Action {
    contract_id: treasury_address,
    function: Symbol::new("transfer"),
    args: vec![recipient_address, amount],
}
```

---

## What Shares Mean Now

**Before:** Shares = redeemable claims (like stock certificates)
**After:** Shares = informational tracking (like reputation points)

### Share Use Cases in Valocracy

1. **Contribution Tracking**
   Track member's proportional contribution to treasury growth

2. **Governance Weight (Future)**
   Could be used as additional voting power modifier

3. **Distribution Basis**
   Governance can vote to airdrop tokens proportional to shares

4. **Transparency**
   Public visibility of who contributed what

**Key Point:** Shares have NO automatic redemption rights.

---

## Security Implications

### Vulnerabilities Resolved

**KRN-01 (Critical): Verification Bypass**
- **Before:** Unverified users could withdraw if they had shares
- **After:** ✅ N/A - All withdrawals require governance approval
- Verification is enforced through governance voting, not contract checks

**KRN-02 (High): Genesis Members No Economic Shares**
- **Before:** Genesis members had voting power but no treasury shares
- **After:** ✅ N/A - Shares are not redeemable, only governance matters
- Genesis members participate in governance to request funds like everyone else

### New Security Properties

**Collective Authorization**
- No single person can unilaterally move funds
- Even core team/genesis members need community approval

**Transparent Governance**
- All treasury movements are on-chain proposals
- Full audit trail of who requested, who voted, outcome

**Sybil Resistance**
- Voting power = Mana (earned through contribution)
- Cannot buy voting power with capital alone

---

## Testing

### Test Coverage

**New Tests** (`test_valocracy.rs` - 5 tests, all passing):
- ✅ `test_direct_withdrawal_blocked` - Verify individual withdrawals fail
- ✅ `test_governance_controlled_transfer` - Full governance flow succeeds
- ✅ `test_non_governor_cannot_transfer` - Unauthorized access blocked
- ✅ `test_shares_are_informational_only` - Shares don't grant redemption rights
- ✅ `test_valocracy_principle_no_permanent_power` - Even genesis members need approval

**Deprecated Tests** (`test_comprehensive.rs` - 8 tests ignored):
- 🔕 `test_withdraw_basic` - Tests individual withdrawal (no longer applies)
- 🔕 `test_withdraw_proportional_to_shares` - Tests share redemption (disabled)
- 🔕 `test_preview_withdraw_with_virtual_offsets` - Vault math (not used)
- 🔕 `test_scholarship_funds_isolated_from_shares` - Scholarship isolation via withdrawals
- 🔕 (4 more withdrawal tests) - All test deprecated functionality

**Passing Tests:** 34 out of 42 (8 ignored as deprecated)

---

## Migration Guide

### For Frontend/dApp

**Old Pattern (DO NOT USE):**
```typescript
// ❌ This will fail
await treasury.withdraw(myAddress, myAddress, shares);
```

**New Pattern (USE THIS):**
```typescript
// 1. Create governance proposal
const actions = [{
  contract_id: treasuryAddress,
  function: "transfer",
  args: [myAddress, requestedAmount]
}];

await governor.propose(myAddress, description, actions);

// 2. Community votes
// ... voting happens ...

// 3. After approval, execute
await governor.execute(proposalId);
```

### For Contract Interactions

If your contract was calling `treasury.withdraw()`, update to:
1. Create a governance proposal from your contract
2. Wait for community approval
3. Funds are transferred via `treasury.transfer()` during execution

---

## Philosophy Alignment

### Valocracy Core Principles

**Contribution-Based Power**
✅ Mana (voting power) earned through participation
✅ No permanent power - even genesis members' Mana decays

**Collective Decision-Making**
✅ Treasury managed by community, not individuals
✅ Every fund movement requires collective approval

**No Position-Based Power**
✅ No "founder" role with special treasury access
✅ Core team requests funds same as any member

**Transparency**
✅ All proposals visible on-chain
✅ Full voting history preserved

### What This Means

- **For Members:** You participate in governance to access treasury funds
- **For Genesis Council:** You have no special economic privileges
- **For Scholarships:** Still supported (separate escrow system)
- **For Contributors:** Shares track contribution but don't grant automatic claims

---

## Backward Compatibility

**Breaking Changes:**
- `withdraw()` function now always returns `NotAuthorized`
- Shares are no longer redeemable
- All treasury access requires governance proposals

**Maintained:**
- `deposit()` still works (Valocracy allocates shares)
- `transfer()` replaces `spend()` (same functionality, better name)
- Scholarship escrow (`fund_lab()`, `withdraw_scholarship()`) unchanged
- All view functions unchanged

**Recommended:** Update all clients to use governance flow instead of direct withdrawals.

---

## Future Enhancements

**Potential Improvements:**
1. **Batch Transfers** - Single proposal with multiple recipients
2. **Scheduled Payments** - Recurring transfers without repeated proposals
3. **Emergency Fund** - Small reserve accessible with lower thresholds
4. **Delegation** - Vote on treasury proposals with delegated power

**Note:** All enhancements must maintain collective governance principle.

---

## Conclusion

This redesign enforces the core Valocracy principle that **treasury is a collective resource managed through contribution-based governance**. No individual—not even founders or core team—can unilaterally access funds.

Every treasury movement requires:
1. Creating a proposal
2. Community voting
3. Collective approval
4. Transparent execution

This aligns incentives: those who contribute earn Mana → Mana grants voting power → voting power influences treasury → treasury supports contributors.

**The result:** A truly decentralized, contribution-driven governance system.
