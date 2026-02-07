/**
 * Invariant Tests for Karn Protocol
 *
 * Verifies that critical system properties (invariants) hold true
 * regardless of the sequence of operations performed.
 *
 * Invariants are properties that must ALWAYS be true:
 * - Mathematical properties (e.g., total supply = sum of balances)
 * - Security properties (e.g., only authorized can execute)
 * - Business logic properties (e.g., Mana never negative)
 *
 * These tests use property-based testing techniques to verify
 * invariants across many different execution paths.
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
 * Test environment for invariant testing
 */
struct InvariantEnvironment<'a> {
    env: &'a Env,
    valocracy: valocracy::Client<'a>,
    governor: governor::Client<'a>,
    treasury: treasury::Client<'a>,
    token: TokenClient<'a>,
    founder: Address,
    admin: Address,
}

impl<'a> InvariantEnvironment<'a> {
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

        InvariantEnvironment {
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
}

/**
 * Invariant 1: Member Floor Guarantee
 *
 * Property: All registered members MUST have at least 5 Mana at all times,
 * regardless of badge status or time elapsed.
 *
 * This is a critical invariant that ensures minimum governance participation.
 */
#[test]
fn invariant_member_floor_always_five() {
    let env = Env::default();
    env.mock_all_auths();

    let inv = InvariantEnvironment::setup(&env);

    // Create members with different scenarios
    let scenarios = vec![
        ("no_badges", false, 0),
        ("one_badge", true, 50),
        ("multiple_badges", true, 100),
    ];

    for (name, has_badge, level) in scenarios {
        let member = Address::generate(&env);
        inv.register_member(&member);

        // Give badge if scenario requires it
        if has_badge {
            inv.valocracy.mint(&member, &5, &level, &false);
        }

        // Test at different time points
        for days in [0, 90, 180, 365] {
            env.ledger().with_mut(|li| {
                li.timestamp = days * 24 * 60 * 60;
            });

            let mana = inv.valocracy.get_votes(&member);

            // INVARIANT: Mana >= 5
            assert!(
                mana >= 5,
                "Member Floor violated for {} at day {}: Mana = {}",
                name,
                days,
                mana
            );
        }
    }
}

/**
 * Invariant 2: Mana Monotonic Decay
 *
 * Property: Without new badges, Mana MUST be non-increasing over time.
 * It should decay monotonically (never increase).
 *
 * Exception: Member Floor (5 Mana) is permanent and doesn't decay.
 */
#[test]
fn invariant_mana_monotonic_decay() {
    let env = Env::default();
    env.mock_all_auths();

    let inv = InvariantEnvironment::setup(&env);
    let member = Address::generate(&env);

    inv.register_member(&member);
    inv.valocracy.mint(&member, &5, &100, &false);

    let mut previous_mana = inv.valocracy.get_votes(&member);

    // Advance time and check Mana never increases
    for day in 1..=200 {
        env.ledger().with_mut(|li| {
            li.timestamp = day * 24 * 60 * 60;
        });

        let current_mana = inv.valocracy.get_votes(&member);

        // INVARIANT: Mana(t+1) <= Mana(t)
        assert!(
            current_mana <= previous_mana,
            "Mana increased without new badge: day {}, {} -> {}",
            day,
            previous_mana,
            current_mana
        );

        previous_mana = current_mana;
    }

    // After 200 days, should be at Member Floor
    assert_eq!(previous_mana, 5, "Should decay to Member Floor");
}

/**
 * Invariant 3: Founder Mana Never Decays
 *
 * Property: Permanent badges (e.g., Founder) MUST never lose Mana over time.
 *
 * This ensures founders maintain their governance power permanently.
 */
#[test]
fn invariant_founder_mana_permanent() {
    let env = Env::default();
    env.mock_all_auths();

    let inv = InvariantEnvironment::setup(&env);

    // Founder gets permanent badge
    inv.valocracy.mint(&inv.founder, &0, &100, &true);

    let initial_mana = inv.valocracy.get_votes(&inv.founder);
    assert_eq!(initial_mana, 105); // 5 base + 100 permanent

    // Test at various time points
    for years in 1..=10 {
        env.ledger().with_mut(|li| {
            li.timestamp = years * 365 * 24 * 60 * 60;
        });

        let current_mana = inv.valocracy.get_votes(&inv.founder);

        // INVARIANT: Permanent Mana never changes
        assert_eq!(
            current_mana, initial_mana,
            "Founder Mana changed after {} years: {} -> {}",
            years, initial_mana, current_mana
        );
    }
}

/**
 * Invariant 4: Vote Conservation
 *
 * Property: For any proposal, the sum of for_votes and against_votes
 * MUST equal the sum of all individual votes cast.
 *
 * This ensures votes are counted correctly and not duplicated or lost.
 */
#[test]
fn invariant_vote_conservation() {
    let env = Env::default();
    env.mock_all_auths();

    let inv = InvariantEnvironment::setup(&env);

    // Create members with known Mana
    let members: Vec<(Address, i128)> = (0..10)
        .map(|i| {
            let member = Address::generate(&env);
            inv.register_member(&member);
            let level = (i + 1) * 10;
            inv.valocracy.mint(&member, &5, &level, &false);
            let mana = inv.valocracy.get_votes(&member);
            (member, mana)
        })
        .collect();

    // Create proposal
    let desc = String::from_str(&env, "Vote conservation test");
    let actions = Vec::new(&env);
    let prop_id = inv.governor.propose(&members[0].0, &desc, &actions);

    env.ledger().with_mut(|li| li.timestamp += 2);

    // Vote with known weights
    let mut expected_for: i128 = 0;
    let mut expected_against: i128 = 0;

    for (i, (member, mana)) in members.iter().enumerate() {
        if i % 2 == 0 {
            inv.governor.cast_vote(member, &prop_id, &true);
            expected_for += mana;
        } else {
            inv.governor.cast_vote(member, &prop_id, &false);
            expected_against += mana;
        }
    }

    let proposal = inv.governor.get_proposal(&prop_id);

    // INVARIANT: Recorded votes = Expected votes
    assert_eq!(
        proposal.for_votes, expected_for,
        "For votes not conserved"
    );
    assert_eq!(
        proposal.against_votes, expected_against,
        "Against votes not conserved"
    );

    // INVARIANT: Total votes = Sum of individual votes
    let total_votes = proposal.for_votes + proposal.against_votes;
    let expected_total = expected_for + expected_against;
    assert_eq!(total_votes, expected_total, "Total votes not conserved");
}

/**
 * Invariant 5: Proposal State Validity
 *
 * Property: Proposal states MUST only transition through valid paths.
 * Invalid transitions should be impossible.
 *
 * Valid transitions:
 * Pending -> Active -> (Defeated | Succeeded)
 * Succeeded -> Queued -> (Executed | Expired)
 * Any -> Canceled (before execution)
 */
#[test]
fn invariant_proposal_state_valid_transitions() {
    let env = Env::default();
    env.mock_all_auths();

    let inv = InvariantEnvironment::setup(&env);
    let member = Address::generate(&env);

    inv.register_member(&member);
    inv.valocracy.mint(&member, &5, &100, &false);

    // Create proposal
    let desc = String::from_str(&env, "State transition test");
    let actions = Vec::new(&env);
    let prop_id = inv.governor.propose(&member, &desc, &actions);

    // Track state transitions
    let mut previous_state = inv.governor.state(&prop_id);
    assert_eq!(previous_state, governor::ProposalState::Pending);

    // Advance to Active
    env.ledger().with_mut(|li| li.timestamp += 2);
    let state = inv.governor.state(&prop_id);
    assert_eq!(state, governor::ProposalState::Active);

    // Vote
    inv.governor.cast_vote(&member, &prop_id, &true);

    // Advance past voting period
    env.ledger().with_mut(|li| li.timestamp += 301);

    let state = inv.governor.state(&prop_id);

    // INVARIANT: Must be Succeeded or Defeated, never back to Pending
    assert!(
        matches!(
            state,
            governor::ProposalState::Succeeded | governor::ProposalState::Defeated
        ),
        "Invalid state after voting: {:?}",
        state
    );

    // If succeeded, can queue
    if state == governor::ProposalState::Succeeded {
        inv.governor.queue(&prop_id);
        let queued_state = inv.governor.state(&prop_id);
        assert_eq!(queued_state, governor::ProposalState::Queued);

        // Advance past timelock
        env.ledger().with_mut(|li| li.timestamp += 86401);

        inv.governor.execute(&prop_id);
        let executed_state = inv.governor.state(&prop_id);
        assert_eq!(executed_state, governor::ProposalState::Executed);

        // INVARIANT: Once executed, state never changes
        env.ledger().with_mut(|li| li.timestamp += 365 * 24 * 60 * 60);
        let final_state = inv.governor.state(&prop_id);
        assert_eq!(
            final_state,
            governor::ProposalState::Executed,
            "Executed state changed"
        );
    }
}

/**
 * Invariant 6: Treasury Balance Consistency
 *
 * Property: Treasury total_assets MUST equal the sum of:
 * - All deposits made
 * - Minus all withdrawals made
 * - Minus all scholarships paid
 *
 * This ensures no tokens are created or destroyed unexpectedly.
 */
#[test]
fn invariant_treasury_balance_consistency() {
    let env = Env::default();
    env.mock_all_auths();

    let inv = InvariantEnvironment::setup(&env);
    let token_admin_client = token::StellarAssetClient::new(&env, &inv.token.address);

    // Track expected balance
    let mut total_deposited: i128 = 0;
    let mut total_withdrawn: i128 = 0;
    let mut total_scholarships: i128 = 0;

    // Deposit 1
    let depositor1 = Address::generate(&env);
    let amount1 = 10_000;
    token_admin_client.mint(&depositor1, &amount1);
    inv.treasury.deposit(&depositor1, &amount1);
    total_deposited += amount1;

    // INVARIANT: Balance = Deposits
    let balance1 = inv.treasury.total_assets();
    assert_eq!(
        balance1, total_deposited,
        "Balance mismatch after deposit"
    );

    // Deposit 2
    let depositor2 = Address::generate(&env);
    let amount2 = 5_000;
    token_admin_client.mint(&depositor2, &amount2);
    inv.treasury.deposit(&depositor2, &amount2);
    total_deposited += amount2;

    // INVARIANT: Balance = Deposits
    let balance2 = inv.treasury.total_assets();
    assert_eq!(
        balance2, total_deposited,
        "Balance mismatch after second deposit"
    );

    // Withdrawal
    let shares1 = inv.treasury.balance(&depositor1);
    let withdrawn = inv.treasury.withdraw(&depositor1, &shares1);
    total_withdrawn += withdrawn;

    // INVARIANT: Balance = Deposits - Withdrawals
    let balance3 = inv.treasury.total_assets();
    assert_eq!(
        balance3,
        total_deposited - total_withdrawn,
        "Balance mismatch after withdrawal"
    );

    // Scholarship
    let funder = Address::generate(&env);
    let lab_amount = 3_000;
    token_admin_client.mint(&funder, &lab_amount);
    inv.treasury.fund_lab(&funder, &lab_amount, &1_000);

    let student = Address::generate(&env);
    inv.treasury.approve_scholarship(&1, &student);
    inv.treasury.withdraw_scholarship(&student, &1_000);
    total_scholarships += 1_000;

    // INVARIANT: Balance accounts for scholarships
    let balance4 = inv.treasury.total_assets();
    let expected = total_deposited - total_withdrawn + lab_amount - total_scholarships;
    assert_eq!(
        balance4, expected,
        "Balance mismatch after scholarship"
    );
}

/**
 * Invariant 7: Non-Negative Mana
 *
 * Property: Mana MUST never be negative under any circumstances.
 *
 * Even with extreme time passages or badge configurations,
 * Mana should bottom out at Member Floor (5), never go negative.
 */
#[test]
fn invariant_mana_non_negative() {
    let env = Env::default();
    env.mock_all_auths();

    let inv = InvariantEnvironment::setup(&env);

    // Test various scenarios
    let scenarios = vec![
        ("normal", 100, false),
        ("zero_level", 0, false),
        ("small_level", 1, false),
        ("large_level", i128::MAX / 2, false),
        ("permanent", 100, true),
    ];

    for (name, level, is_permanent) in scenarios {
        let member = Address::generate(&env);
        inv.register_member(&member);
        inv.valocracy.mint(&member, &5, &level, &is_permanent);

        // Test at extreme time points
        for years in [0, 1, 10, 100, 1000] {
            env.ledger().with_mut(|li| {
                li.timestamp = years * 365 * 24 * 60 * 60;
            });

            let mana = inv.valocracy.get_votes(&member);

            // INVARIANT: Mana >= 0
            assert!(
                mana >= 0,
                "Negative Mana for {} at year {}: {}",
                name,
                years,
                mana
            );

            // Also verify >= Member Floor
            assert!(
                mana >= 5,
                "Mana below Member Floor for {} at year {}: {}",
                name,
                years,
                mana
            );
        }
    }
}

/**
 * Invariant 8: Level Non-Decreasing
 *
 * Property: A member's level MUST never decrease.
 * Badges can only add level, never subtract.
 *
 * Note: Mana decays, but level is permanent accumulation.
 */
#[test]
fn invariant_level_non_decreasing() {
    let env = Env::default();
    env.mock_all_auths();

    let inv = InvariantEnvironment::setup(&env);
    let member = Address::generate(&env);

    inv.register_member(&member);

    let mut previous_level = inv.valocracy.level_of(&member);
    assert_eq!(previous_level, 0, "Initial level should be 0");

    // Mint badges and verify level only increases
    for i in 1..=20 {
        let badge_level = i * 10;
        inv.valocracy.mint(&member, &(i as u32), &badge_level, &false);

        let current_level = inv.valocracy.level_of(&member);

        // INVARIANT: Level(t+1) >= Level(t)
        assert!(
            current_level >= previous_level,
            "Level decreased: {} -> {}",
            previous_level,
            current_level
        );

        previous_level = current_level;
    }

    // Even after time passes, level should remain the same
    env.ledger().with_mut(|li| {
        li.timestamp += 365 * 24 * 60 * 60;
    });

    let final_level = inv.valocracy.level_of(&member);
    assert_eq!(
        final_level, previous_level,
        "Level changed after time passage"
    );
}

/**
 * Invariant 9: Double Voting Prevention
 *
 * Property: A member MUST NOT be able to vote twice on the same proposal.
 *
 * Second vote should either fail or override the first (depending on design).
 */
#[test]
fn invariant_no_double_voting() {
    let env = Env::default();
    env.mock_all_auths();

    let inv = InvariantEnvironment::setup(&env);
    let member = Address::generate(&env);

    inv.register_member(&member);
    inv.valocracy.mint(&member, &5, &50, &false);

    let mana = inv.valocracy.get_votes(&member);

    // Create proposal
    let desc = String::from_str(&env, "Double vote test");
    let actions = Vec::new(&env);
    let prop_id = inv.governor.propose(&member, &desc, &actions);

    env.ledger().with_mut(|li| li.timestamp += 2);

    // First vote
    inv.governor.cast_vote(&member, &prop_id, &true);

    let proposal_after_first = inv.governor.get_proposal(&prop_id);
    assert_eq!(proposal_after_first.for_votes, mana);
    assert_eq!(proposal_after_first.against_votes, 0);

    // Second vote (should fail or override, but not double count)
    let result = std::panic::catch_unwind(|| {
        inv.governor.cast_vote(&member, &prop_id, &false);
    });

    let proposal_after_second = inv.governor.get_proposal(&prop_id);

    // INVARIANT: Vote weight shouldn't exceed voter's Mana
    let total_votes = proposal_after_second.for_votes + proposal_after_second.against_votes;
    assert!(
        total_votes <= mana,
        "Double voting detected: total {} > member mana {}",
        total_votes,
        mana
    );
}

/**
 * Invariant 10: Quorum Threshold
 *
 * Property: A proposal MUST NOT succeed if quorum is not met,
 * even if all votes are in favor.
 *
 * This ensures minimum participation requirements.
 */
#[test]
fn invariant_quorum_enforcement() {
    let env = Env::default();
    env.mock_all_auths();

    let inv = InvariantEnvironment::setup(&env);

    // Create system with low Mana (won't meet quorum)
    let member = Address::generate(&env);
    inv.register_member(&member);
    inv.valocracy.mint(&member, &5, &5, &false);

    let total_mana = inv.valocracy.get_votes(&member);
    assert_eq!(total_mana, 10); // 5 base + 5 from badge

    // Create proposal
    let desc = String::from_str(&env, "Quorum test");
    let actions = Vec::new(&env);
    let prop_id = inv.governor.propose(&member, &desc, &actions);

    env.ledger().with_mut(|li| li.timestamp += 2);

    // Vote with all available Mana
    inv.governor.cast_vote(&member, &prop_id, &true);

    // Advance past voting period
    env.ledger().with_mut(|li| li.timestamp += 301);

    let state = inv.governor.state(&prop_id);

    // INVARIANT: Proposal defeated due to insufficient quorum
    // (4% quorum requires much more than 10 Mana)
    assert_eq!(
        state,
        governor::ProposalState::Defeated,
        "Proposal passed without quorum"
    );
}

/**
 * Invariant 11: Scholarship Claimable Balance
 *
 * Property: A student's claimable balance MUST match approved scholarships
 * minus withdrawals.
 *
 * No scholarships should appear or disappear unexpectedly.
 */
#[test]
fn invariant_scholarship_balance_accuracy() {
    let env = Env::default();
    env.mock_all_auths();

    let inv = InvariantEnvironment::setup(&env);
    let token_admin_client = token::StellarAssetClient::new(&env, &inv.token.address);

    let student = Address::generate(&env);
    let funder = Address::generate(&env);

    // Create scholarship lab
    let lab_amount = 10_000;
    let per_student = 1_000;
    token_admin_client.mint(&funder, &lab_amount);
    let lab_id = inv.treasury.fund_lab(&funder, &lab_amount, &per_student);

    // INVARIANT: Initial claimable balance = 0
    let initial_balance = inv.treasury.get_claimable_balance(&student);
    assert_eq!(initial_balance, 0, "Initial balance should be 0");

    // Approve scholarship
    inv.treasury.approve_scholarship(&lab_id, &student);

    // INVARIANT: Claimable balance = per_student amount
    let approved_balance = inv.treasury.get_claimable_balance(&student);
    assert_eq!(
        approved_balance, per_student,
        "Claimable balance should match approved amount"
    );

    // Withdraw half
    let withdraw_amount = per_student / 2;
    inv.treasury.withdraw_scholarship(&student, &withdraw_amount);

    // INVARIANT: Claimable balance = approved - withdrawn
    let remaining_balance = inv.treasury.get_claimable_balance(&student);
    assert_eq!(
        remaining_balance,
        per_student - withdraw_amount,
        "Remaining balance incorrect"
    );

    // Withdraw rest
    inv.treasury.withdraw_scholarship(&student, &remaining_balance);

    // INVARIANT: Final claimable balance = 0
    let final_balance = inv.treasury.get_claimable_balance(&student);
    assert_eq!(final_balance, 0, "Final balance should be 0");
}

/**
 * Invariant 12: Registered Members Never Unregister
 *
 * Property: Once a member is registered, they remain registered forever.
 * There is no un-registration mechanism.
 *
 * This ensures stable membership and prevents gaming the system.
 */
#[test]
fn invariant_permanent_registration() {
    let env = Env::default();
    env.mock_all_auths();

    let inv = InvariantEnvironment::setup(&env);
    let member = Address::generate(&env);

    // Register member
    inv.register_member(&member);

    // Verify registered (has Mana >= 5)
    let initial_mana = inv.valocracy.get_votes(&member);
    assert_eq!(initial_mana, 5, "Should be registered");

    // Perform various operations
    inv.valocracy.mint(&member, &5, &100, &false);

    // Advance a lot of time
    env.ledger().with_mut(|li| {
        li.timestamp += 10 * 365 * 24 * 60 * 60; // 10 years
    });

    // INVARIANT: Still registered (still has Mana >= 5)
    let final_mana = inv.valocracy.get_votes(&member);
    assert_eq!(
        final_mana, 5,
        "Member should still be registered with Member Floor"
    );

    // Can still participate
    let desc = String::from_str(&env, "Long-term member test");
    let actions = Vec::new(&env);
    let prop_id = inv.governor.propose(&member, &desc, &actions);
    assert!(prop_id > 0, "Registered member should be able to propose");
}
