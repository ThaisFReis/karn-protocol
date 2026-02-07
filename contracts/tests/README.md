# Integration Tests for Cross-Contract Flows

## Overview

This test suite validates **realistic scenarios** that involve multiple smart contracts interacting together. Unlike unit tests that test individual contract functions in isolation, integration tests verify end-to-end workflows across the Karn Protocol ecosystem.

## Test Coverage

### 10 Integration Test Scenarios

| Test # | Scenario | Contracts Involved | Purpose |
|--------|----------|-------------------|---------|
| **1** | Registration → Voting | Valocracy + Governor | Verify new members can immediately participate in governance |
| **2** | Governance → Treasury Execution | Governor + Treasury | Verify passed proposals can execute treasury operations |
| **3** | Badge-Based Scholarship Access | Valocracy + Treasury | Verify badge holders can claim scholarships |
| **4** | Full Governance Cycle | All 3 contracts | Complete flow from registration to fund distribution |
| **5** | Mana Decay Impact on Voting | Valocracy + Governor | Verify voting power decreases over time |
| **6** | Quorum Requirements | Valocracy + Governor | Verify proposals fail without sufficient participation |
| **7** | Founder Badge Permanence | Valocracy + Governor | Verify Founder Mana doesn't decay |
| **8** | Concurrent Proposals | Valocracy + Governor | Verify multiple active proposals work correctly |
| **9** | Governance Scholarship Approval | All 3 contracts | Verify governance can approve scholarship allocations |
| **10** | Member Floor Guarantee | Valocracy + Governor | Verify all members maintain minimum 5 Mana |

## Running Integration Tests

### Prerequisites

**IMPORTANT**: Integration tests require compiled WASM files. You **must** build all contracts first:

```bash
# From contracts/ directory
stellar contract build

# Or build specific contracts
stellar contract build --package valocracy
stellar contract build --package governor
stellar contract build --package treasury
```

This generates WASM files in:
```
target/wasm32-unknown-unknown/release/
├── valocracy.wasm
├── governor.wasm
├── treasury.wasm
└── soroban_token_contract.wasm
```

### Run All Integration Tests

```bash
# From contracts/ directory
cargo test -p karn-integration-tests

# Or from tests/ directory
cargo test

# With output
cargo test -- --nocapture

# Run specific test
cargo test test_registration_to_voting -- --nocapture
```

### Test Execution Order

Tests are independent and can run in any order. Each test:
1. Creates a fresh test environment
2. Deploys all necessary contracts
3. Initializes contracts with test parameters
4. Executes the scenario
5. Verifies expected outcomes

## Test Details

### Test 1: Registration → Voting

**Scenario**: New user joins Karn and immediately participates in governance.

**Flow**:
1. User self-registers (gets 5 Mana from Member Floor)
2. User earns a badge (gains additional 10 Mana)
3. User creates a proposal
4. User votes on proposal with full 15 Mana

**Validates**:
- Self-registration works correctly
- Member Floor is automatically granted
- Badge Mana is added correctly
- New members can propose and vote immediately

**Expected Outcome**: Vote is recorded with 15 Mana weight.

---

### Test 2: Governance → Treasury Execution

**Scenario**: Multiple members vote on a proposal to allocate treasury funds.

**Flow**:
1. 3 members register and earn badges (total 60 Mana)
2. Treasury is funded with 100,000 tokens
3. Member creates proposal to fund scholarship lab
4. All members vote in favor (60 Mana total)
5. Voting period ends
6. Proposal enters timelock
7. Proposal executes after timelock

**Validates**:
- Multi-member voting aggregation
- Proposal state transitions (Pending → Active → Queued → Executed)
- Treasury can be controlled by governance
- Timelock delay is enforced

**Expected Outcome**: Proposal executes successfully after timelock.

---

### Test 3: Badge-Based Scholarship Access

**Scenario**: Student earns badge, gets approved for scholarship, and withdraws funds.

**Flow**:
1. Student registers (5 Mana)
2. Student earns Learning Path badge (20 Mana)
3. Funder creates scholarship lab (10,000 tokens)
4. Guardian approves student for scholarship
5. Student withdraws scholarship (1,000 tokens)

**Validates**:
- Badge system increases Mana
- Scholarship escrow functionality
- Claimable balance tracking
- Withdrawal mechanism

**Expected Outcome**: Student receives 1,000 tokens, claimable balance becomes 0.

---

### Test 4: Full Governance Cycle

**Scenario**: Complete flow from member registration to proposal defeat.

**Flow**:
1. 5 members register with varying badge levels
2. Treasury funded with 1,000,000 tokens
3. Proposal to allocate 100,000 tokens
4. 3 members vote FOR (75 Mana total)
5. 2 members vote AGAINST (100 Mana total)
6. Proposal is defeated (more against than for)

**Validates**:
- Complex voting scenarios
- Vote counting accuracy
- Proposal defeat mechanism
- Different badge levels create different vote weights

**Expected Outcome**: Proposal state = Defeated.

---

### Test 5: Mana Decay Impact on Voting

**Scenario**: Member's voting power decreases over time due to Mana decay.

**Flow**:
1. Member earns badge (100 Mana + 5 base = 105)
2. Member votes on Proposal 1 with 105 Mana
3. 90 days pass (half the vacancy period)
4. Mana decays to ~55 (5 base + 50% of 100)
5. Member votes on Proposal 2 with reduced Mana

**Validates**:
- Mana decay calculation
- Time-based voting power reduction
- Member Floor persists (5 Mana remains)
- Decay formula accuracy

**Expected Outcome**: Second vote has ~50% less weight than first vote.

**Decay Formula**:
```
Mana = 5 + (Level × Time_Remaining / Vacancy_Period)
Where Vacancy_Period = 180 days
```

---

### Test 6: Quorum Requirements

**Scenario**: Proposal fails due to insufficient voter participation.

**Flow**:
1. Single member with 15 Mana votes
2. Proposal requires 4% quorum
3. Voting period ends
4. Proposal is defeated (insufficient participation)

**Validates**:
- Quorum enforcement
- Proposal defeat when quorum not met
- Minimum participation requirements

**Expected Outcome**: Proposal state = Defeated (failed quorum).

---

### Test 7: Founder Badge Permanence

**Scenario**: Founder's Mana doesn't decay while regular member's does.

**Flow**:
1. Founder receives permanent badge (100 Mana, permanent)
2. Regular member receives normal badge (100 Mana, decaying)
3. 180 days pass (full vacancy period)
4. Founder still has 105 Mana
5. Regular member has only 5 Mana (Member Floor)

**Validates**:
- Permanent badge mechanics
- Founder privilege persistence
- Regular badge decay
- Member Floor guarantee

**Expected Outcome**:
- Founder Mana = 105 (no decay)
- Regular Mana = 5 (fully decayed)

---

### Test 8: Concurrent Proposals

**Scenario**: Multiple proposals active simultaneously with overlapping voters.

**Flow**:
1. 3 members create 3 different proposals
2. Members vote on different combinations
3. All votes are tracked independently

**Validates**:
- Multiple active proposals
- Vote isolation (voting on one doesn't affect others)
- Complex voting patterns
- Vote counting accuracy across proposals

**Expected Outcome**: All vote counts are correct and independent.

---

### Test 9: Governance Scholarship Approval

**Scenario**: Scholarship allocation requires governance approval.

**Flow**:
1. Guardian creates proposal to approve student
2. 3 voters approve proposal (total Mana: 105)
3. Proposal executes after timelock
4. Guardian approves scholarship
5. Student withdraws scholarship

**Validates**:
- Governance-controlled scholarship distribution
- Multi-step approval process
- Integration of all 3 contracts
- Real-world scholarship workflow

**Expected Outcome**: Student receives scholarship after governance approval.

---

### Test 10: Member Floor Guarantee

**Scenario**: Registered member without badges maintains minimum Mana.

**Flow**:
1. Member registers (no badges)
2. Initial Mana = 5 (Member Floor)
3. 180 days pass
4. Mana still = 5 (Member Floor is permanent)
5. Member can still propose and vote

**Validates**:
- Member Floor is granted on registration
- Member Floor doesn't decay
- Minimum governance participation guaranteed
- Zero-badge members can still participate

**Expected Outcome**: Member retains 5 Mana indefinitely.

---

## Test Architecture

### Helper Structure

```rust
struct TestContracts<'a> {
    env: &'a Env,
    valocracy: valocracy::Client<'a>,
    governor: governor::Client<'a>,
    treasury: treasury::Client<'a>,
    token: TokenClient<'a>,
    founder: Address,
    admin: Address,
}
```

### Helper Methods

- `setup()` - Deploy and initialize all contracts
- `register_member()` - Register a new member with signature
- `mint_badge()` - Award badge to member
- `fund_treasury()` - Add tokens to treasury

## Key Testing Patterns

### Time Manipulation

```rust
// Advance time by 90 days
env.ledger().with_mut(|li| {
    li.timestamp += 90 * 24 * 60 * 60;
});
```

### Mock Authentication

```rust
env.mock_all_auths(); // Allow all operations in test environment
```

### State Verification

```rust
let state = contracts.governor.state(&proposal_id);
assert_eq!(state, governor::ProposalState::Executed);
```

## Expected Test Results

All 10 tests should **PASS** when contracts are correctly implemented.

### Common Failure Scenarios

| Failure | Likely Cause | Solution |
|---------|-------------|----------|
| `contractimport!` error | WASM files not built | Run `stellar contract build` |
| Mana calculation wrong | Decay formula bug | Check `get_votes()` implementation |
| Proposal state wrong | State transition bug | Check Governor state machine |
| Vote count mismatch | Vote recording bug | Check `cast_vote()` implementation |
| Scholarship claim fails | Escrow logic bug | Check Treasury escrow functions |

## Performance

- **Total test count**: 10 tests
- **Estimated runtime**: ~10-15 seconds (all tests)
- **Each test runtime**: ~1-2 seconds

Tests are fast because they use Soroban's in-memory test environment, not actual blockchain.

## Continuous Integration

These tests should be run in CI/CD pipeline:

```yaml
# .github/workflows/test.yml
- name: Build contracts
  run: stellar contract build

- name: Run integration tests
  run: cargo test -p karn-integration-tests
```

## Debugging

### Enable verbose output

```bash
cargo test -- --nocapture --test-threads=1
```

### Run single test with logs

```bash
RUST_LOG=debug cargo test test_registration_to_voting -- --nocapture
```

### Check WASM files exist

```bash
ls -lh target/wasm32-unknown-unknown/release/*.wasm
```

## Future Enhancements

**Planned additions**:
- [ ] Test badge revocation flow
- [ ] Test emergency pause mechanisms
- [ ] Test upgrade scenarios
- [ ] Test malicious actor attempts (Sybil attacks, double-voting)
- [ ] Test gas limit scenarios
- [ ] Test with realistic Stellar network latency
- [ ] Fuzz testing for edge cases
- [ ] Property-based testing for invariants

## Contributing

When adding new integration tests:

1. Follow naming convention: `test_<scenario_name>`
2. Include comprehensive documentation comments
3. Verify test passes with `cargo test`
4. Update this README with test description
5. Ensure test is independent (doesn't rely on other tests)

## Resources

- [Soroban Testing Documentation](https://soroban.stellar.org/docs/getting-started/testing)
- [Karn Protocol Whitepaper](../../../Docs/Whitepaper_Karn.md)
- [Governor Contract Spec](../../../specs/contracts/SPEC-SC-002-governor.md)
- [Treasury Contract Spec](../../../specs/contracts/SPEC-SC-003-treasury.md)
- [Valocracy Contract Spec](../../../specs/contracts/SPEC-SC-001-security-hardening.md)

---

**Last Updated**: 2026-02-07
**Test Coverage**: 10 cross-contract scenarios
**Status**: Ready for continuous integration
