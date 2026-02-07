/**
 * Fuzzing Tests for Karn Protocol
 *
 * Uses randomized inputs to discover edge cases, overflow vulnerabilities,
 * and unexpected behavior that traditional tests might miss.
 *
 * Fuzzing Strategy:
 * - Random badge levels and counts
 * - Random timestamps (time travel)
 * - Random member counts
 * - Random voting patterns
 * - Random treasury operations
 * - Boundary value exploration
 */

#![cfg(test)]

use soroban_sdk::{
    testutils::{Address as _, Ledger},
    Address, Env, String, Vec,
};

// Import contracts
mod valocracy {
    soroban_sdk::contractimport!(
        file = "../target/wasm32-unknown-unknown/release/valocracy.wasm"
    );
}

mod governor {
    soroban_sdk::contractimport!(
        file = "../target/wasm32-unknown-unknown/release/governor.wasm"
    );
}

mod treasury {
    soroban_sdk::contractimport!(
        file = "../target/wasm32-unknown-unknown/release/treasury.wasm"
    );
}

mod token {
    soroban_sdk::contractimport!(
        file = "../target/wasm32-unknown-unknown/release/soroban_token_contract.wasm"
    );
    pub type TokenClient<'a> = Client<'a>;
}

use token::TokenClient;

/**
 * Test helper for fuzzing
 */
struct FuzzEnvironment<'a> {
    env: &'a Env,
    valocracy: valocracy::Client<'a>,
    governor: governor::Client<'a>,
    treasury: treasury::Client<'a>,
    token: TokenClient<'a>,
    founder: Address,
    admin: Address,
}

impl<'a> FuzzEnvironment<'a> {
    fn setup(env: &'a Env) -> Self {
        let founder = Address::generate(env);
        let admin = Address::generate(env);

        // Deploy token
        let token_id = env.register_contract_wasm(None, token::WASM);
        let token = TokenClient::new(env, &token_id);
        let token_admin = Address::generate(env);
        token.initialize(
            &token_admin,
            &7,
            &String::from_str(env, "Test"),
            &String::from_str(env, "TST"),
        );

        // Deploy contracts
        let valocracy_id = env.register_contract_wasm(None, valocracy::WASM);
        let valocracy = valocracy::Client::new(env, &valocracy_id);

        let governor_id = env.register_contract_wasm(None, governor::WASM);
        let governor = governor::Client::new(env, &governor_id);

        let treasury_id = env.register_contract_wasm(None, treasury::WASM);
        let treasury = treasury::Client::new(env, &treasury_id);

        // Initialize
        valocracy.initialize(
            &founder,
            &governor_id,
            &treasury_id,
            &String::from_str(env, "Karn"),
            &String::from_str(env, "KARN"),
        );

        governor.initialize(&valocracy_id, &treasury_id, &1, &300, &2, &4, &86400);

        treasury.initialize(&governor_id, &token_id, &admin);

        FuzzEnvironment {
            env,
            valocracy,
            governor,
            treasury,
            token,
            founder,
            admin,
        }
    }

    fn register_member(&self, member: &Address) {
        let signature = soroban_sdk::Bytes::from_array(self.env, &[0u8; 64]);
        self.valocracy.self_register(member, &signature);
    }

    /// Simple pseudo-random number generator for tests
    /// Uses seed based on ledger timestamp for determinism
    fn prng(&self, seed: u64, max: u64) -> u64 {
        // Simple LCG (Linear Congruential Generator)
        let a: u64 = 1664525;
        let c: u64 = 1013904223;
        let m: u64 = 2_u64.pow(32);

        ((a.wrapping_mul(seed).wrapping_add(c)) % m) % max
    }

    fn random_level(&self, seed: u64) -> i128 {
        // Generate random level between 1 and 1000
        (self.prng(seed, 1000) + 1) as i128
    }

    fn random_timestamp_advance(&self, seed: u64) -> u64 {
        // Random time advance between 1 second and 180 days
        self.prng(seed, 180 * 24 * 60 * 60) + 1
    }
}

/**
 * Fuzz Test 1: Random Badge Minting
 *
 * Strategy: Mint random number of badges with random levels to random members
 * Goal: Find overflow bugs, unexpected Mana calculations, or state corruption
 */
#[test]
fn fuzz_random_badge_minting() {
    let env = Env::default();
    env.mock_all_auths();

    let fuzz = FuzzEnvironment::setup(&env);

    // Create 20 members
    let members: Vec<Address> = (0..20)
        .map(|_| Address::generate(&env))
        .collect();

    for member in &members {
        fuzz.register_member(member);
    }

    // Fuzz: Mint 100 random badges
    for i in 0..100 {
        let member_idx = (fuzz.prng(i, 20)) as usize;
        let member = &members[member_idx];

        let badge_id = fuzz.prng(i * 2, 24) as u32; // 24 badge types
        let level = fuzz.random_level(i * 3);
        let is_permanent = fuzz.prng(i * 4, 2) == 1;

        // Mint badge
        fuzz.valocracy.mint(member, &badge_id, &level, &is_permanent);

        // Verify Mana is always valid (>= 5)
        let mana = fuzz.valocracy.get_votes(member);
        assert!(mana >= 5, "Mana should always be >= Member Floor (5)");

        // Verify no overflow
        assert!(mana < i128::MAX, "Mana overflow detected");
    }

    // Final verification: All members still have valid Mana
    for member in &members {
        let mana = fuzz.valocracy.get_votes(member);
        assert!(mana >= 5);
        assert!(mana < i128::MAX);
    }
}

/**
 * Fuzz Test 2: Random Time Travel
 *
 * Strategy: Advance time randomly and check Mana decay
 * Goal: Find issues with decay calculations, underflows, or incorrect timestamp handling
 */
#[test]
fn fuzz_random_time_travel() {
    let env = Env::default();
    env.mock_all_auths();

    let fuzz = FuzzEnvironment::setup(&env);
    let member = Address::generate(&env);

    fuzz.register_member(&member);
    fuzz.valocracy.mint(&member, &5, &100, &false);

    let initial_mana = fuzz.valocracy.get_votes(&member);
    assert_eq!(initial_mana, 105); // 5 base + 100 from badge

    let mut previous_mana = initial_mana;

    // Fuzz: Random time advances
    for i in 0..50 {
        let time_advance = fuzz.random_timestamp_advance(i);

        env.ledger().with_mut(|li| {
            li.timestamp += time_advance;
        });

        let current_mana = fuzz.valocracy.get_votes(&member);

        // Invariant: Mana should never increase without new badges
        assert!(
            current_mana <= previous_mana,
            "Mana increased without badge: {} -> {}",
            previous_mana,
            current_mana
        );

        // Invariant: Mana should never go below Member Floor
        assert!(
            current_mana >= 5,
            "Mana went below Member Floor: {}",
            current_mana
        );

        // Invariant: Mana should never be negative
        assert!(current_mana >= 0, "Negative Mana detected: {}", current_mana);

        previous_mana = current_mana;
    }
}

/**
 * Fuzz Test 3: Random Voting Patterns
 *
 * Strategy: Create proposals and vote with random patterns
 * Goal: Find vote counting bugs, overflow in aggregation, or state corruption
 */
#[test]
fn fuzz_random_voting_patterns() {
    let env = Env::default();
    env.mock_all_auths();

    let fuzz = FuzzEnvironment::setup(&env);

    // Create 30 members with random Mana
    let members: Vec<Address> = (0..30)
        .map(|_| Address::generate(&env))
        .collect();

    for (i, member) in members.iter().enumerate() {
        fuzz.register_member(member);
        let level = fuzz.random_level(i as u64);
        fuzz.valocracy.mint(member, &5, &level, &false);
    }

    // Create 10 proposals
    for prop_idx in 0..10 {
        let proposer = &members[prop_idx as usize];
        let desc = String::from_str(&env, "Fuzz proposal");
        let actions = Vec::new(&env);

        let prop_id = fuzz.governor.propose(proposer, &desc, &actions);

        env.ledger().with_mut(|li| li.timestamp += 2);

        // Random voting pattern
        let mut expected_for: i128 = 0;
        let mut expected_against: i128 = 0;

        for (i, member) in members.iter().enumerate() {
            if fuzz.prng(i as u64 + prop_idx, 3) == 0 {
                continue; // Skip this voter (abstain)
            }

            let vote_for = fuzz.prng(i as u64 + prop_idx + 100, 2) == 1;
            let member_mana = fuzz.valocracy.get_votes(member);

            fuzz.governor.cast_vote(member, &prop_id, &vote_for);

            if vote_for {
                expected_for += member_mana;
            } else {
                expected_against += member_mana;
            }
        }

        // Verify vote counts match expectations
        let proposal = fuzz.governor.get_proposal(&prop_id);
        assert_eq!(
            proposal.for_votes, expected_for,
            "For votes mismatch on proposal {}",
            prop_id
        );
        assert_eq!(
            proposal.against_votes, expected_against,
            "Against votes mismatch on proposal {}",
            prop_id
        );

        // Invariant: Total votes should never overflow
        let total_votes = proposal.for_votes + proposal.against_votes;
        assert!(total_votes >= 0, "Vote count overflow detected");
        assert!(total_votes < i128::MAX, "Vote count overflow detected");
    }
}

/**
 * Fuzz Test 4: Random Treasury Operations
 *
 * Strategy: Random deposits, withdrawals, and scholarship operations
 * Goal: Find accounting bugs, underflows, or inconsistent state
 */
#[test]
fn fuzz_random_treasury_operations() {
    let env = Env::default();
    env.mock_all_auths();

    let fuzz = FuzzEnvironment::setup(&env);

    let token_admin_client = token::StellarAssetClient::new(&env, &fuzz.token.address);

    // Track expected balance
    let mut total_deposited: i128 = 0;
    let mut total_withdrawn: i128 = 0;

    // Fuzz: 50 random operations
    for i in 0..50 {
        let operation_type = fuzz.prng(i, 3);

        match operation_type {
            0 => {
                // Random deposit
                let depositor = Address::generate(&env);
                let amount = fuzz.random_level(i * 2);

                // Mint tokens to depositor
                token_admin_client.mint(&depositor, &amount);

                // Deposit to treasury
                let shares = fuzz.treasury.deposit(&depositor, &amount);

                total_deposited += amount;

                // Verify shares are positive
                assert!(shares > 0, "Shares should be positive for deposit");
            }
            1 => {
                // Random withdrawal (if treasury has balance)
                if total_deposited > total_withdrawn {
                    let withdrawer = Address::generate(&env);
                    let deposit_amount = fuzz.random_level(i * 3);

                    // First deposit some funds
                    token_admin_client.mint(&withdrawer, &deposit_amount);
                    let shares = fuzz.treasury.deposit(&withdrawer, &deposit_amount);
                    total_deposited += deposit_amount;

                    // Then withdraw some shares
                    let withdraw_shares = shares / 2;
                    if withdraw_shares > 0 {
                        let withdrawn = fuzz.treasury.withdraw(&withdrawer, &withdraw_shares);
                        total_withdrawn += withdrawn;

                        // Verify withdrawn amount is reasonable
                        assert!(withdrawn > 0, "Withdrawal should return positive amount");
                        assert!(withdrawn <= deposit_amount, "Withdrew more than deposited");
                    }
                }
            }
            2 => {
                // Random scholarship lab funding
                let funder = Address::generate(&env);
                let lab_amount = fuzz.random_level(i * 4);
                let per_student = if lab_amount > 10 {
                    lab_amount / 10
                } else {
                    1
                };

                // Mint and fund
                token_admin_client.mint(&funder, &lab_amount);
                let lab_id = fuzz.treasury.fund_lab(&funder, &lab_amount, &per_student);

                // Verify lab ID is positive
                assert!(lab_id > 0, "Lab ID should be positive");
            }
            _ => unreachable!(),
        }

        // Invariant: Treasury total assets should be >= (deposits - withdrawals)
        let total_assets = fuzz.treasury.total_assets();
        assert!(
            total_assets >= (total_deposited - total_withdrawn),
            "Treasury balance inconsistent: assets={}, deposited={}, withdrawn={}",
            total_assets,
            total_deposited,
            total_withdrawn
        );
    }
}

/**
 * Fuzz Test 5: Boundary Value Fuzzing
 *
 * Strategy: Test extreme values (max, min, zero, near-overflow)
 * Goal: Find edge cases in arithmetic, overflow bugs, or validation failures
 */
#[test]
fn fuzz_boundary_values() {
    let env = Env::default();
    env.mock_all_auths();

    let fuzz = FuzzEnvironment::setup(&env);
    let member = Address::generate(&env);

    fuzz.register_member(&member);

    // Test 1: Maximum badge level
    let max_level = i128::MAX / 2; // Avoid overflow in calculations
    fuzz.valocracy.mint(&member, &10, &max_level, &false);

    let mana = fuzz.valocracy.get_votes(&member);
    assert!(mana > 0, "Mana should be positive with max level");
    assert!(mana >= 5, "Mana should include Member Floor");

    // Test 2: Zero badge level (edge case)
    let member2 = Address::generate(&env);
    fuzz.register_member(&member2);
    fuzz.valocracy.mint(&member2, &11, &0, &false);

    let mana2 = fuzz.valocracy.get_votes(&member2);
    assert_eq!(mana2, 5, "Zero-level badge should only have Member Floor");

    // Test 3: Very small level
    let member3 = Address::generate(&env);
    fuzz.register_member(&member3);
    fuzz.valocracy.mint(&member3, &12, &1, &false);

    let mana3 = fuzz.valocracy.get_votes(&member3);
    assert_eq!(mana3, 6, "Level 1 badge should give 5 + 1 = 6 Mana");

    // Test 4: Maximum timestamp (far future)
    env.ledger().with_mut(|li| {
        li.timestamp = u64::MAX / 2; // Very far in future
    });

    // Mana should have fully decayed (except Member Floor)
    let decayed_mana = fuzz.valocracy.get_votes(&member3);
    assert_eq!(
        decayed_mana, 5,
        "After max time, only Member Floor should remain"
    );
}

/**
 * Fuzz Test 6: Concurrent Operations Fuzzing
 *
 * Strategy: Simulate many members performing operations simultaneously
 * Goal: Find race conditions, state corruption, or incorrect aggregation
 */
#[test]
fn fuzz_concurrent_operations() {
    let env = Env::default();
    env.mock_all_auths();

    let fuzz = FuzzEnvironment::setup(&env);

    // Create 50 members
    let members: Vec<Address> = (0..50)
        .map(|_| Address::generate(&env))
        .collect();

    // Register all members
    for member in &members {
        fuzz.register_member(member);
    }

    // Fuzz: Each member performs random operations
    for (i, member) in members.iter().enumerate() {
        let operation = fuzz.prng(i as u64, 4);

        match operation {
            0 => {
                // Earn badge
                let badge_id = fuzz.prng(i as u64 + 100, 24) as u32;
                let level = fuzz.random_level(i as u64 + 200);
                fuzz.valocracy.mint(member, &badge_id, &level, &false);
            }
            1 => {
                // Create proposal
                let desc = String::from_str(&env, "Concurrent proposal");
                let actions = Vec::new(&env);
                fuzz.governor.propose(member, &desc, &actions);
            }
            2 => {
                // Vote on random proposal (if exists)
                let total_proposals = fuzz.governor.get_proposal_count();
                if total_proposals > 0 {
                    let prop_id = (fuzz.prng(i as u64 + 300, total_proposals) + 1) as u64;
                    let vote_for = fuzz.prng(i as u64 + 400, 2) == 1;

                    // May fail if voting period hasn't started, that's ok
                    let _ = std::panic::catch_unwind(|| {
                        fuzz.governor.cast_vote(member, &prop_id, &vote_for);
                    });
                }
            }
            3 => {
                // Check Mana (read-only)
                let mana = fuzz.valocracy.get_votes(member);
                assert!(mana >= 5, "Member Floor violated during concurrent ops");
            }
            _ => unreachable!(),
        }
    }

    // Final verification: All members have valid state
    for member in &members {
        let mana = fuzz.valocracy.get_votes(member);
        assert!(mana >= 5, "Member Floor violated");
        assert!(mana < i128::MAX, "Mana overflow");

        let level = fuzz.valocracy.level_of(member);
        assert!(level >= 0, "Negative level detected");
    }
}

/**
 * Fuzz Test 7: Malformed Input Fuzzing
 *
 * Strategy: Test with unusual or malformed inputs
 * Goal: Ensure contracts handle invalid inputs gracefully
 */
#[test]
fn fuzz_malformed_inputs() {
    let env = Env::default();
    env.mock_all_auths();

    let fuzz = FuzzEnvironment::setup(&env);

    // Test 1: Empty string descriptions
    let member = Address::generate(&env);
    fuzz.register_member(&member);
    fuzz.valocracy.mint(&member, &5, &10, &false);

    let empty_desc = String::from_str(&env, "");
    let actions = Vec::new(&env);

    // Should handle empty description
    let prop_id = fuzz.governor.propose(&member, &empty_desc, &actions);
    assert!(prop_id > 0, "Should create proposal even with empty description");

    // Test 2: Very long description
    let long_desc = String::from_str(
        &env,
        "A".repeat(1000).as_str()
    );

    let prop_id2 = fuzz.governor.propose(&member, &long_desc, &actions);
    assert!(prop_id2 > 0, "Should create proposal with long description");

    // Test 3: Badge ID at boundary
    let member2 = Address::generate(&env);
    fuzz.register_member(&member2);

    // Test maximum badge ID
    fuzz.valocracy.mint(&member2, &u32::MAX, &10, &false);
    let mana = fuzz.valocracy.get_votes(&member2);
    assert!(mana >= 5, "Should handle max badge ID");
}

/**
 * Fuzz Test 8: State Transition Fuzzing
 *
 * Strategy: Random sequence of state-changing operations
 * Goal: Find invalid state transitions or corruption
 */
#[test]
fn fuzz_state_transitions() {
    let env = Env::default();
    env.mock_all_auths();

    let fuzz = FuzzEnvironment::setup(&env);

    let member = Address::generate(&env);
    fuzz.register_member(&member);
    fuzz.valocracy.mint(&member, &5, &100, &false);

    // Create proposal
    let desc = String::from_str(&env, "State transition test");
    let actions = Vec::new(&env);
    let prop_id = fuzz.governor.propose(&member, &desc, &actions);

    // Random state transitions
    for i in 0..20 {
        let action = fuzz.prng(i, 4);

        match action {
            0 => {
                // Try to vote (may fail if in wrong state)
                let _ = std::panic::catch_unwind(|| {
                    fuzz.governor.cast_vote(&member, &prop_id, &true);
                });
            }
            1 => {
                // Advance time randomly
                let time_advance = fuzz.prng(i + 100, 1000);
                env.ledger().with_mut(|li| {
                    li.timestamp += time_advance;
                });
            }
            2 => {
                // Try to queue (may fail if in wrong state)
                let _ = std::panic::catch_unwind(|| {
                    fuzz.governor.queue(&prop_id);
                });
            }
            3 => {
                // Check state (should always succeed)
                let state = fuzz.governor.state(&prop_id);

                // Verify state is valid
                match state {
                    governor::ProposalState::Pending
                    | governor::ProposalState::Active
                    | governor::ProposalState::Canceled
                    | governor::ProposalState::Defeated
                    | governor::ProposalState::Succeeded
                    | governor::ProposalState::Queued
                    | governor::ProposalState::Expired
                    | governor::ProposalState::Executed => {
                        // Valid state
                    }
                }
            }
            _ => unreachable!(),
        }
    }
}

/**
 * Fuzz Test 9: Numeric Overflow Fuzzing
 *
 * Strategy: Operations designed to trigger arithmetic overflow
 * Goal: Ensure all arithmetic is checked and handles overflow gracefully
 */
#[test]
fn fuzz_numeric_overflow() {
    let env = Env::default();
    env.mock_all_auths();

    let fuzz = FuzzEnvironment::setup(&env);

    // Test 1: Many high-level badges to single member
    let member = Address::generate(&env);
    fuzz.register_member(&member);

    for i in 0..50 {
        let level = i128::MAX / 100; // High but won't overflow individually
        fuzz.valocracy.mint(&member, &(i as u32), &level, &false);

        // Check for overflow
        let mana = fuzz.valocracy.get_votes(&member);
        assert!(mana > 0, "Mana overflow resulted in negative/zero");
        assert!(mana >= 5, "Member Floor lost during overflow");
    }

    // Test 2: Extreme vote counts
    let voters: Vec<Address> = (0..10)
        .map(|_| Address::generate(&env))
        .collect();

    for voter in &voters {
        fuzz.register_member(voter);
        fuzz.valocracy.mint(voter, &10, &(i128::MAX / 20), &false);
    }

    let desc = String::from_str(&env, "Overflow test");
    let actions = Vec::new(&env);
    let prop_id = fuzz.governor.propose(&voters[0], &desc, &actions);

    env.ledger().with_mut(|li| li.timestamp += 2);

    // All vote (potential overflow in aggregation)
    for voter in &voters {
        fuzz.governor.cast_vote(voter, &prop_id, &true);
    }

    let proposal = fuzz.governor.get_proposal(&prop_id);
    assert!(proposal.for_votes > 0, "Vote count overflow");
    assert!(proposal.for_votes < i128::MAX, "Vote count overflow not caught");
}

/**
 * Fuzz Test 10: Memory Exhaustion Fuzzing
 *
 * Strategy: Create many objects to test memory limits
 * Goal: Ensure contracts handle large state gracefully
 */
#[test]
fn fuzz_memory_exhaustion() {
    let env = Env::default();
    env.mock_all_auths();

    let fuzz = FuzzEnvironment::setup(&env);

    // Create many members
    let member_count = 100;
    let members: Vec<Address> = (0..member_count)
        .map(|_| Address::generate(&env))
        .collect();

    // Register all
    for member in &members {
        fuzz.register_member(member);
    }

    // Create many proposals
    for i in 0..50 {
        let proposer = &members[i % member_count];
        let desc = String::from_str(&env, "Memory test");
        let actions = Vec::new(&env);

        fuzz.governor.propose(proposer, &desc, &actions);
    }

    // Verify system still works
    let total_proposals = fuzz.governor.get_proposal_count();
    assert_eq!(total_proposals, 50, "Proposal count mismatch");

    // All members should still have valid Mana
    for member in &members {
        let mana = fuzz.valocracy.get_votes(member);
        assert_eq!(mana, 5, "Member Floor should still be 5");
    }
}
