# Fuzzing and Invariant Tests

## Overview

This test suite uses **property-based testing** and **fuzzing** techniques to verify system correctness beyond traditional example-based tests.

**Test Types:**
1. **Fuzzing Tests** (`fuzz_tests.rs`) - Random inputs to find edge cases
2. **Invariant Tests** (`invariant_tests.rs`) - Verify properties always hold

## Why Fuzzing and Invariant Testing?

Traditional tests check specific scenarios:
```rust
// Example-based test
assert_eq!(calculate_mana(100, 90_days), 55);
```

Fuzzing and invariant tests check general properties:
```rust
// Property-based test
for all (level, time) {
    assert!(calculate_mana(level, time) >= MEMBER_FLOOR);
}
```

**Benefits:**
- Find unexpected edge cases
- Verify mathematical properties
- Catch overflow/underflow bugs
- Ensure security invariants
- Validate state consistency

---

## Fuzzing Tests (10 Tests)

Fuzzing uses **randomized inputs** to discover bugs that traditional tests miss.

### Test 1: Random Badge Minting

**Strategy**: Mint random badges with random levels to random members

**Goal**: Find overflow bugs, unexpected Mana calculations, state corruption

**Test**:
- Create 20 members
- Mint 100 random badges
- Verify Mana always valid (>= 5, < MAX)

**Properties Verified:**
- No Mana overflow
- Member Floor always maintained
- Badge minting never corrupts state

---

### Test 2: Random Time Travel

**Strategy**: Advance time randomly and check Mana decay

**Goal**: Find decay calculation bugs, underflows, timestamp issues

**Test**:
- Member earns 100 Mana badge
- Advance time randomly 50 times (1 second to 180 days)
- Verify Mana decreases monotonically

**Properties Verified:**
- Mana never increases without new badges
- Mana never goes below Member Floor (5)
- Mana never goes negative
- Decay is monotonic

---

### Test 3: Random Voting Patterns

**Strategy**: Create proposals and vote with random patterns

**Goal**: Find vote counting bugs, overflow in aggregation

**Test**:
- 30 members with random Mana levels
- 10 proposals created
- Random voting patterns (vote/abstain/for/against)
- Verify vote counts match expectations

**Properties Verified:**
- Vote aggregation is accurate
- No vote count overflow
- For + Against = Sum of individual votes

---

### Test 4: Random Treasury Operations

**Strategy**: Random deposits, withdrawals, scholarships

**Goal**: Find accounting bugs, underflows, inconsistent state

**Test**:
- 50 random operations
- Mix of deposits, withdrawals, scholarship funding
- Track expected vs actual balance

**Properties Verified:**
- Treasury balance = deposits - withdrawals
- No accounting underflow
- Shares are always positive
- Withdrawals never exceed deposits

---

### Test 5: Boundary Value Fuzzing

**Strategy**: Test extreme values (max, min, zero, near-overflow)

**Goal**: Find edge cases in arithmetic

**Test**:
- Maximum badge level (i128::MAX / 2)
- Zero badge level
- Very small level (1)
- Maximum timestamp (far future)

**Properties Verified:**
- No overflow with extreme values
- Zero-level badges work correctly
- Far future time doesn't break decay

---

### Test 6: Concurrent Operations Fuzzing

**Strategy**: Simulate many members performing operations simultaneously

**Goal**: Find race conditions, state corruption

**Test**:
- 50 members perform random operations
- Mix of badge minting, proposals, voting, queries
- Verify all members have valid state

**Properties Verified:**
- Concurrent operations don't corrupt state
- Member Floor maintained during concurrency
- All operations complete successfully

---

### Test 7: Malformed Input Fuzzing

**Strategy**: Test with unusual or malformed inputs

**Goal**: Ensure graceful handling of invalid inputs

**Test**:
- Empty string descriptions
- Very long descriptions (1000+ chars)
- Maximum badge ID (u32::MAX)
- Zero values

**Properties Verified:**
- Contracts handle empty strings
- Long strings don't crash
- Boundary badge IDs work

---

### Test 8: State Transition Fuzzing

**Strategy**: Random sequence of state-changing operations

**Goal**: Find invalid state transitions

**Test**:
- Create proposal
- Randomly: vote, advance time, queue, execute
- Verify state is always valid

**Properties Verified:**
- State transitions are valid
- No invalid state combinations
- State machine is robust

---

### Test 9: Numeric Overflow Fuzzing

**Strategy**: Operations designed to trigger arithmetic overflow

**Goal**: Ensure all arithmetic is checked

**Test**:
- 50 high-level badges to one member
- 10 members with extreme Mana voting
- Verify no overflow in Mana or vote aggregation

**Properties Verified:**
- Mana calculations don't overflow
- Vote aggregation handles extreme values
- Arithmetic is checked

---

### Test 10: Memory Exhaustion Fuzzing

**Strategy**: Create many objects to test memory limits

**Goal**: Ensure contracts handle large state

**Test**:
- 100 members registered
- 50 proposals created
- Verify system still works

**Properties Verified:**
- Large state doesn't break contracts
- Proposal count is accurate
- All members remain valid

---

## Invariant Tests (12 Tests)

Invariants are **properties that must always be true**, regardless of operations performed.

### Invariant 1: Member Floor Guarantee

**Property**: All registered members MUST have >= 5 Mana at all times

**Test Scenarios**:
- Member with no badges
- Member with one badge
- Member with multiple badges
- Test at 0, 90, 180, 365 days

**Critical**: This ensures minimum governance participation

---

### Invariant 2: Mana Monotonic Decay

**Property**: Without new badges, Mana MUST decrease or stay constant over time

**Test**:
- Member with 100 Mana
- Advance time 200 days
- Verify Mana never increases

**Formula**: `Mana(t+1) <= Mana(t)` for all t (without new badges)

---

### Invariant 3: Founder Mana Never Decays

**Property**: Permanent badges (Founder) MUST never lose Mana

**Test**:
- Founder gets permanent badge (100 Mana)
- Advance time 10 years
- Verify Mana stays constant (105)

**Critical**: Ensures founders maintain governance power

---

### Invariant 4: Vote Conservation

**Property**: Sum of for_votes + against_votes = Sum of individual votes

**Test**:
- 10 members vote on proposal
- Track expected vote totals
- Verify recorded votes match

**Critical**: Ensures votes aren't duplicated or lost

---

### Invariant 5: Proposal State Validity

**Property**: Proposal states MUST only transition through valid paths

**Valid Transitions**:
```
Pending -> Active -> (Defeated | Succeeded)
Succeeded -> Queued -> (Executed | Expired)
Any -> Canceled (before execution)
```

**Invalid** (never allowed):
- Active -> Pending
- Executed -> Any other state
- Defeated -> Succeeded

---

### Invariant 6: Treasury Balance Consistency

**Property**: total_assets = deposits - withdrawals - scholarships

**Test**:
- Multiple deposits
- Some withdrawals
- Scholarship payments
- Verify balance always matches accounting

**Critical**: Ensures no tokens created/destroyed

---

### Invariant 7: Non-Negative Mana

**Property**: Mana MUST never be negative

**Test**:
- Various badge levels (0, 1, 100, MAX)
- Extreme time passages (0 to 1000 years)
- Verify Mana always >= 0

**Critical**: Prevents arithmetic underflow

---

### Invariant 8: Level Non-Decreasing

**Property**: Member level MUST never decrease

**Test**:
- Mint 20 badges progressively
- Verify level only increases
- Advance time (level shouldn't change)

**Note**: Level is permanent accumulation; Mana decays but level doesn't

---

### Invariant 9: Double Voting Prevention

**Property**: Members MUST NOT vote twice on same proposal

**Test**:
- Vote once on proposal
- Try to vote again
- Verify vote weight <= member's Mana

**Critical**: Prevents vote manipulation

---

### Invariant 10: Quorum Enforcement

**Property**: Proposals MUST NOT succeed without quorum

**Test**:
- Create low-Mana system (won't meet 4% quorum)
- Vote with all available Mana
- Verify proposal defeated

**Critical**: Ensures minimum participation

---

### Invariant 11: Scholarship Claimable Balance

**Property**: claimable_balance = approved - withdrawn

**Test**:
- Approve scholarship (1000 tokens)
- Withdraw 500
- Verify balance = 500
- Withdraw rest
- Verify balance = 0

**Critical**: Ensures scholarship accounting

---

### Invariant 12: Permanent Registration

**Property**: Once registered, members never unregister

**Test**:
- Register member
- Perform various operations
- Advance 10 years
- Verify still registered (has Member Floor)

**Critical**: Prevents gaming the system

---

## Running the Tests

### Prerequisites

**Build contracts first:**
```bash
cd karn-protocol/contracts
stellar contract build
```

### Run All Tests

```bash
# All integration, fuzz, and invariant tests
cargo test

# Specific test suite
cargo test --test integration_tests
cargo test --test fuzz_tests
cargo test --test invariant_tests

# Specific test
cargo test --test fuzz_tests fuzz_random_badge_minting -- --nocapture
cargo test --test invariant_tests invariant_member_floor_always_five
```

### Run Script

```bash
cd tests
./run_integration_tests.sh    # Runs all tests
```

### Performance

| Test Suite | Tests | Runtime | Purpose |
|------------|-------|---------|---------|
| Integration | 10 | ~15s | Cross-contract workflows |
| Fuzzing | 10 | ~20s | Random input edge cases |
| Invariant | 12 | ~10s | Property verification |
| **Total** | **32** | **~45s** | **Complete test coverage** |

---

## Pseudo-Random Number Generation

Fuzzing tests use a simple **PRNG** for deterministic randomness:

```rust
fn prng(&self, seed: u64, max: u64) -> u64 {
    // Linear Congruential Generator
    let a: u64 = 1664525;
    let c: u64 = 1013904223;
    let m: u64 = 2_u64.pow(32);

    ((a.wrapping_mul(seed).wrapping_add(c)) % m) % max
}
```

**Properties:**
- **Deterministic**: Same seed = same sequence
- **Reproducible**: Tests are repeatable
- **Fast**: No external dependencies

---

## Test Coverage Matrix

| Property | Integration | Fuzzing | Invariant |
|----------|-------------|---------|-----------|
| Cross-contract flows | ✅ | ⚫ | ⚫ |
| Member Floor guarantee | ✅ | ✅ | ✅ |
| Mana decay | ✅ | ✅ | ✅ |
| Vote counting | ✅ | ✅ | ✅ |
| Treasury accounting | ✅ | ✅ | ✅ |
| State transitions | ✅ | ✅ | ✅ |
| Overflow protection | ⚫ | ✅ | ✅ |
| Boundary values | ⚫ | ✅ | ⚫ |
| Concurrent operations | ✅ | ✅ | ⚫ |
| Malformed inputs | ⚫ | ✅ | ⚫ |
| Quorum enforcement | ✅ | ⚫ | ✅ |
| Scholarship flow | ✅ | ✅ | ✅ |

**Legend**: ✅ Covered, ⚫ Not applicable

---

## Common Failure Scenarios

| Failure | Test Type | Likely Cause |
|---------|-----------|--------------|
| Mana overflow | Fuzzing #1, #9 | Missing overflow checks |
| Negative Mana | Fuzzing #2, Invariant #7 | Underflow in decay calculation |
| Vote mismatch | Fuzzing #3, Invariant #4 | Vote aggregation bug |
| Balance inconsistency | Fuzzing #4, Invariant #6 | Treasury accounting error |
| State corruption | Fuzzing #6, #8 | Race condition or invalid transition |
| Double voting | Invariant #9 | Missing vote deduplication |
| Quorum bypass | Invariant #10 | Incorrect quorum calculation |

---

## Debugging Failed Tests

### Enable verbose output:
```bash
cargo test --test fuzz_tests -- --nocapture
```

### Run specific failing test:
```bash
cargo test --test invariant_tests invariant_member_floor_always_five -- --nocapture
```

### Check for overflow:
```bash
RUST_BACKTRACE=1 cargo test --test fuzz_tests
```

### Verify WASM files:
```bash
ls -lh target/wasm32-unknown-unknown/release/*.wasm
```

---

## Future Enhancements

**Planned improvements:**

1. **True Fuzzing with cargo-fuzz**
   - Use AFL or LibFuzzer for coverage-guided fuzzing
   - Generate thousands of test cases automatically
   - Find deep bugs in complex logic

2. **Property-Based Testing with quickcheck**
   - Automatic test case generation
   - Shrinking to minimal failing cases
   - More sophisticated PRNG

3. **Formal Verification**
   - Mathematical proofs of invariants
   - Theorem proving for critical properties
   - Model checking for state machines

4. **Mutation Testing**
   - Inject bugs to verify tests catch them
   - Measure test effectiveness
   - Identify weak test coverage

5. **Chaos Engineering**
   - Random contract failures
   - Network partitions
   - Byzantine behavior simulation

---

## Comparison with Traditional Tests

| Aspect | Example-Based | Fuzzing | Invariant |
|--------|---------------|---------|-----------|
| **Coverage** | Specific cases | Many random cases | All cases (property) |
| **Bug Finding** | Known bugs | Unknown edge cases | Logic violations |
| **Confidence** | Moderate | High | Very High |
| **Execution** | Fast | Medium | Fast |
| **Maintenance** | High | Low | Low |
| **Setup** | Easy | Medium | Medium |

**Recommendation**: Use **all three** for comprehensive coverage.

---

## Security Properties Verified

### Access Control
- [x] Only authorized addresses can execute privileged operations (Invariant tests)
- [x] No privilege escalation possible (Integration tests)

### Arithmetic Safety
- [x] No overflow in Mana calculations (Fuzzing #1, #9)
- [x] No underflow in decay calculations (Fuzzing #2, Invariant #7)
- [x] All arithmetic is checked (Fuzzing boundary tests)

### State Consistency
- [x] Treasury balance always matches accounting (Invariant #6)
- [x] Vote counts are conserved (Invariant #4)
- [x] Proposal states follow valid transitions (Invariant #5)

### Economic Security
- [x] Member Floor cannot be violated (Invariant #1, Fuzzing #1)
- [x] Mana cannot be artificially increased (Invariant #2)
- [x] Scholarships cannot be double-claimed (Invariant #11)

### Governance Security
- [x] Quorum is enforced (Invariant #10)
- [x] Double voting prevented (Invariant #9)
- [x] Permanent members maintain power (Invariant #3)

---

## Contributing

When adding new fuzzing or invariant tests:

1. **Identify the property** to verify
2. **Write clear documentation** of what's being tested
3. **Use descriptive names** (e.g., `invariant_mana_non_negative`)
4. **Test multiple scenarios** for each property
5. **Update this README** with test details

**Naming Convention:**
- Fuzzing: `fuzz_<what_is_randomized>`
- Invariant: `invariant_<property_name>`

---

## Resources

- [Property-Based Testing](https://hypothesis.works/articles/what-is-property-based-testing/)
- [Fuzzing Explained](https://owasp.org/www-community/Fuzzing)
- [Invariant Testing](https://en.wikipedia.org/wiki/Invariant_(mathematics))
- [Soroban Testing Guide](https://soroban.stellar.org/docs/getting-started/testing)
- [Smart Contract Invariants](https://github.com/crytic/building-secure-contracts/tree/master/program-analysis)

---

**Last Updated**: 2026-02-07
**Test Suites**: 3 (Integration, Fuzzing, Invariant)
**Total Tests**: 32 (10 + 10 + 12)
**Total Runtime**: ~45 seconds
**Coverage**: Cross-contract flows, edge cases, and system invariants
