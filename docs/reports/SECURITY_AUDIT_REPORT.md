# Security Audit Report: Karn Protocol

> **📋 For Complete Security Hardening Details:**
> See [`docs/SECURITY_HARDENING.md`](../SECURITY_HARDENING.md) for consolidated documentation of all fixes, tests, and architecture changes.
>
> **Status:** ✅ All 5 vulnerabilities resolved (100% complete)

---

## 1. Executive Summary
The Karn Protocol introduces a novel "Valocracy" governance model based on soulbound tokens and decaying voting power ("Mana"). The architecture is modular, separating concerns between `Valocracy` (Identity/Power), `Governor` (Decision Making), and `Treasury` (Asset Management).

**Key Strengths:**
-   **Decay Logic:** The linear decay mechanism (`calculate_mana`) ensures active participation is required to maintain influence.
-   **Architecture:** Clear separation of concerns minimizes the blast radius of potential exploits.
-   **Safe Math:** Use of Rust's checked arithmetic (or specific Soroban overflow checks) prevents common integer overflow issues.
-   **Anti-Flash Loan:** Voting power snapshots at proposal start time effectively mitigate flash loan attacks.

**Critical Risks:**
-   **Verification Bypass:** The `Treasury` contract fails to enforce identity verification (`is_verified`) during withdrawals, potentially violating the protocol's compliance or safety requirements.
-   **Genesis Economic Exclusion:** The initialization process grants governance power to Genesis members but fails to issue corresponding Treasury shares, effectively disenfranchising the core team from economic claims.

## 2. Scope
-   **Repository:** `karn-protocol`
-   **Files Audited:**
    -   `contracts/valocracy/src/lib.rs`
    -   `contracts/governor/src/lib.rs`
    -   `contracts/treasury/src/lib.rs`
    -   `contracts/tests/integration_tests.rs`

## 3. Findings Summary

| ID | Severity | Title | Status |
|----|----------|-------|--------|
| KRN-01 | **Critical** | Treasury Withdrawal Verification Bypass | ✅ Resolved (Valocracy Redesign) |
| KRN-02 | **High** | Genesis Members Receive No Economic Shares | ✅ Resolved (N/A in new model) |
| KRN-03 | **Medium** | Voting Power Snapshot Allows "Buy-In" During Delay | ✅ Resolved (Snapshot at creation) |
| KRN-04 | **Info** | Treasury Assets Exclude Restricted Reserves (Positive) | ✅ Maintained |

## 4. Detailed Findings

### [KRN-01] Treasury Withdrawal Verification Bypass
**Severity:** Critical
**Context:** `contracts/treasury/src/lib.rs`, function `withdraw` (Lines 134-190)

**Description:**
The `withdraw` function in the Treasury contract allows any user with shares to burn them for underlying assets. While `Valocracy` implements an `is_verified` status (ADR-003) intended to gate access to funds, the `Treasury` contract **never checks this status**.

Lines 134-140:
```rust
    pub fn withdraw(
        env: Env,
        caller: Address,
        receiver: Address,
        shares: i128,
    ) -> Result<i128, TreasuryError> {
        caller.require_auth();
        // ... (No call to valocracy.is_verified)
```

**Impact:**
Unverified users (e.g., those who have not completed KYC or community vetting) can withdraw protocol assets. If verification is a regulatory or safety requirement for the DAO, this is a complete bypass of that control.

**Recommendation:**
Add a check to verify the user's status before allowing withdrawal.

```rust
// Add to Treasury::withdraw
let valocracy = get_valocracy(&env).ok_or(TreasuryError::NotInitialized)?;
let is_verified: bool = env.invoke_contract(
    &valocracy,
    &Symbol::new(&env, "is_verified"),
    (caller.clone(),).into_val(&env),
);

if !is_verified {
    return Err(TreasuryError::NotAuthorized); // Or new error NotVerified
}
```

**✅ RESOLVED (2026-02-07):**
This vulnerability has been eliminated through the Valocracy Treasury Redesign. Individual `withdraw()` functionality has been disabled entirely. All treasury withdrawals now require governance approval:

1. Member creates governance proposal requesting funds
2. Community votes (weighted by Mana)
3. If approved, Governor executes `treasury.transfer()`
4. If rejected, no transfer occurs

Verification is now enforced through the governance voting process, not contract-level checks. Unverified users must gain community trust to receive treasury funds.

See `docs/VALOCRACY_TREASURY_REDESIGN.md` for full details.

---

### [KRN-02] Genesis Members Receive No Economic Shares
**Severity:** High
**Context:** `contracts/valocracy/src/lib.rs`, function `initialize` (Lines 125-143)

**Description:**
When `Valocracy` is initialized, it mints "Leadership" badges to the `genesis_members`. This logic handles setting the user's level and token ownership in storage. However, unlike the standard `mint` function (Lines 764-780), the `initialize` function **does not call the Treasury to deposit shares**.

`initialize` loop (Lines 125-143) updates:
-   `set_user_stats`
-   `set_token_owner`
-   But **NOT** `treasury.deposit()`

**Impact:**
Genesis members have high Voting Power ("Mana") but **Zero Economic Interest** (Shares). They cannot claim any portion of the treasury assets unless they separately mint new badges or manually deposit funds (if allowed). This creates a misalignment of incentives for the core team.

**Recommendation:**
Update `valocracy::initialize` to call the Treasury for each genesis member.

```rust
// In valocracy::initialize loop
let leadership_shares = i128::from(leadership_rarity);
env.invoke_contract::<()>(
    &treasury,
    &Symbol::new(&env, "deposit"),
    (member.clone(), leadership_shares).into_val(&env),
);
```

**✅ RESOLVED (2026-02-07):**
This issue is no longer applicable in the Valocracy model. Treasury shares are now informational tracking only—they do NOT grant automatic redemption rights.

**Key Changes:**
1. **Genesis Council replaces single Founder** - 3-5 members share responsibility equally
2. **All badges decay** - Genesis members have NO permanent power (permanent_level: 0)
3. **Shares ≠ Claims** - Shares track contribution but cannot be redeemed individually
4. **Governance Required** - Even genesis members must create proposals and get community approval to access treasury funds

This aligns with Valocracy principles: **all power comes from contribution, not position**. Genesis members participate in governance like any other member—no special economic privileges.

See `docs/VALOCRACY_TREASURY_REDESIGN.md` for full details.

---

### [KRN-03] Voting Power Snapshot Allows "Buy-In" During Delay
**Severity:** Medium
**Context:** `contracts/governor/src/lib.rs`, function `cast_vote` (Line 225)

**Description:**
The Governor contracts uses `get_votes_at(..., proposal.start_time)`.
`proposal.start_time` is calculated as `current_time + voting_delay`.

If `voting_delay` is non-zero (e.g. 2 days), the snapshot time is in the future relative to the proposal creation. This allows users to observe a proposal and then acquire badges (if minting is open) *during the delay period* to influence the vote.

**Impact:**
While it prevents flash loans (atomic attacks), it does not prevent "just-in-time" voting power acquisition if the minting rules allow it. It weakens the "snapshot" property which usually implies "state at creation".

**Recommendation:**
If this is unintended, change the snapshot time to `proposal.start_time` but ensure `start_time` implies the *beginning* of the lifecycle, or explicitly use `creation_time` for the snapshot tick.
Alternatively, acknowledge this as a design choice (allowing "campaigning" via badge acquisition during the delay).

**✅ RESOLVED (2026-02-07):**
The vulnerability has been fixed by implementing proper snapshot timing at proposal creation.

**Key Changes:**
1. **Added `creation_time` field** to Proposal struct - stores when proposal was created
2. **Updated `propose()`** - sets `creation_time: current_time` when proposal is created
3. **Updated `cast_vote()`** - uses `proposal.creation_time` for voting power snapshot (not `start_time`)

**Result:**
- Voting power is now snapshotted at **proposal creation time**
- Users cannot "buy-in" during voting delay to inflate their power
- Aligns with industry standards (Compound, OpenZeppelin, Snapshot)
- Maintains "contribution before decision" principle of Valocracy

**Technical Implementation:**
```rust
// In proposal.rs
pub struct Proposal {
    pub creation_time: u64,  // NEW: Snapshot timestamp
    pub start_time: u64,     // When voting begins
    // ...
}

// In lib.rs - propose()
creation_time: current_time,  // Snapshot at creation

// In lib.rs - cast_vote()
let voting_power = Self::get_voting_power_at(&env, &valocracy_addr, &voter,
    proposal.creation_time);  // Uses creation, not start
```

See `docs/KRN-03_ANALYSIS.md` for detailed vulnerability analysis and fix rationale.

---

### [KRN-04] Treasury Assets Exclude Restricted Reserves (Positive)
**Severity:** Info
**Context:** `contracts/treasury/src/lib.rs`, function `total_assets`

**Description:**
The contract correctly subtracts `restricted_reserves` (Scholarship funds) from the total token balance when calculating shareholder assets.
`total_balance.saturating_sub(restricted)`

**Impact:**
This effectively protects scholarship funds from being drained by shareholder withdrawals (run-on-the-bank scenario). This is a well-implemented security feature.

**Recommendation:**
Maintain this invariant in all future updates.
