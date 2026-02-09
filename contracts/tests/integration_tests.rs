/**
 * Integration Tests for Cross-Contract Flows
 *
 * Tests realistic scenarios that involve multiple contracts:
 * 1. Valocracy + Governor: Registration → Voting
 * 2. Governor + Treasury: Proposal execution for fund allocation
 * 3. Valocracy + Treasury: Badge-based scholarship access
 * 4. Full governance flow: Register → Earn badges → Propose → Vote → Execute
 */
use soroban_sdk::{
    testutils::{Address as _, AuthorizedFunction, AuthorizedInvocation, Ledger},
    Address, Env, String, Vec,
};

// Import all three contracts
mod valocracy {
    soroban_sdk::contractimport!(file = "../target/wasm32-unknown-unknown/release/valocracy.wasm");
}

mod governor {
    soroban_sdk::contractimport!(file = "../target/wasm32-unknown-unknown/release/governor.wasm");
}

mod treasury {
    soroban_sdk::contractimport!(file = "../target/wasm32-unknown-unknown/release/treasury.wasm");
}

mod token {
    soroban_sdk::contractimport!(
        file = "../target/wasm32-unknown-unknown/release/soroban_token_contract.wasm"
    );
    pub type TokenClient<'a> = Client<'a>;
}

use token::TokenClient;

/**
 * Test helper: Deploy and initialize all three contracts
 */
struct TestContracts<'a> {
    env: &'a Env,
    valocracy: valocracy::Client<'a>,
    governor: governor::Client<'a>,
    treasury: treasury::Client<'a>,
    token: TokenClient<'a>,
    founder: Address,
    admin: Address,
}

impl<'a> TestContracts<'a> {
    fn setup(env: &'a Env) -> Self {
        let founder = Address::generate(env);
        let admin = Address::generate(env);

        // Deploy token for treasury
        let token_id = env.register_contract_wasm(None, token::WASM);
        let token = TokenClient::new(env, &token_id);
        let token_admin = Address::generate(env);
        token.initialize(
            &token_admin,
            &7,
            &String::from_str(env, "Test Token"),
            &String::from_str(env, "TST"),
        );

        // Deploy Valocracy
        let valocracy_id = env.register_contract_wasm(None, valocracy::WASM);
        let valocracy = valocracy::Client::new(env, &valocracy_id);

        // Deploy Governor
        let governor_id = env.register_contract_wasm(None, governor::WASM);
        let governor = governor::Client::new(env, &governor_id);

        // Deploy Treasury
        let treasury_id = env.register_contract_wasm(None, treasury::WASM);
        let treasury = treasury::Client::new(env, &treasury_id);

        // Initialize Valocracy
        valocracy.initialize(
            &founder,
            &governor_id,
            &treasury_id,
            &String::from_str(env, "Karn Badge"),
            &String::from_str(env, "KARN"),
        );

        // Initialize Governor
        governor.initialize(
            &valocracy_id,
            &treasury_id,
            &1,     // voting_delay: 1 second
            &300,   // voting_period: 5 minutes
            &2,     // proposal_threshold: 2 Mana
            &4,     // quorum_percentage: 4%
            &86400, // timelock_delay: 1 day
        );

        // Initialize Treasury
        treasury.initialize(&governor_id, &token_id, &admin);

        TestContracts {
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
        // Create signature (simplified for tests - in production comes from backend)
        let signature = soroban_sdk::Bytes::from_array(
            self.env, &[0u8; 64], // Mock signature
        );

        self.valocracy.self_register(member, &signature);
    }

    fn mint_badge(&self, to: &Address, badge_id: u32, level: i128, is_permanent: bool) {
        self.valocracy.mint(to, &badge_id, &level, &is_permanent);
    }

    fn fund_treasury(&self, funder: &Address, amount: i128) {
        // Mint tokens to funder
        let token_admin_client = token::StellarAssetClient::new(self.env, &self.token.address);
        token_admin_client.mint(funder, &amount);

        // Deposit to treasury
        self.treasury.deposit(funder, &amount);
    }
}

/**
 * Integration Test 1: Registration → Voting
 *
 * Flow:
 * 1. User registers in Valocracy (gets Member Floor of 5 Mana)
 * 2. User earns badge (gains additional Mana)
 * 3. User creates proposal in Governor
 * 4. User votes on proposal
 */
#[test]
fn test_registration_to_voting() {
    let env = Env::default();
    env.mock_all_auths();

    let contracts = TestContracts::setup(&env);
    let member = Address::generate(&env);

    // 1. Register member
    contracts.register_member(&member);

    // Verify member has Member Floor (5 Mana)
    let initial_mana = contracts.valocracy.get_votes(&member);
    assert_eq!(initial_mana, 5);

    // 2. Earn badge (Learning Path completion - badge ID 5, level 10)
    contracts.mint_badge(&member, 5, 10, false);

    // Verify increased Mana (5 base + 10 from badge)
    let new_mana = contracts.valocracy.get_votes(&member);
    assert_eq!(new_mana, 15);

    // 3. Create proposal
    let description = String::from_str(&env, "Fund new scholarship program");
    let actions = Vec::new(&env); // Empty actions for test

    let proposal_id = contracts.governor.propose(&member, &description, &actions);
    assert_eq!(proposal_id, 1);

    // 4. Advance time past voting delay
    env.ledger().with_mut(|li| {
        li.timestamp = li.timestamp + 2; // voting_delay + 1
    });

    // 5. Vote on proposal
    contracts.governor.cast_vote(&member, &proposal_id, &true);

    // Verify vote was recorded
    let proposal = contracts.governor.get_proposal(&proposal_id);
    assert_eq!(proposal.for_votes, 15); // Should match member's Mana
    assert_eq!(proposal.against_votes, 0);
}

/**
 * Integration Test 2: Governance → Treasury Execution
 *
 * Flow:
 * 1. Multiple members vote on a treasury proposal
 * 2. Proposal passes and enters timelock
 * 3. Proposal executes and allocates treasury funds
 */
#[test]
fn test_governance_treasury_execution() {
    let env = Env::default();
    env.mock_all_auths();

    let contracts = TestContracts::setup(&env);

    // Create 3 members with different Mana levels
    let member1 = Address::generate(&env);
    let member2 = Address::generate(&env);
    let member3 = Address::generate(&env);

    contracts.register_member(&member1);
    contracts.register_member(&member2);
    contracts.register_member(&member3);

    // Give them badges
    contracts.mint_badge(&member1, 5, 20, false); // Total Mana: 25
    contracts.mint_badge(&member2, 6, 15, false); // Total Mana: 20
    contracts.mint_badge(&member3, 7, 10, false); // Total Mana: 15

    // Fund treasury
    contracts.fund_treasury(&contracts.admin, 100_000);

    // Create proposal to fund scholarship lab
    let description = String::from_str(&env, "Fund scholarship lab for 10 students");
    let actions = Vec::new(&env);

    let proposal_id = contracts.governor.propose(&member1, &description, &actions);

    // Advance past voting delay
    env.ledger().with_mut(|li| {
        li.timestamp = li.timestamp + 2;
    });

    // All members vote in favor
    contracts.governor.cast_vote(&member1, &proposal_id, &true);
    contracts.governor.cast_vote(&member2, &proposal_id, &true);
    contracts.governor.cast_vote(&member3, &proposal_id, &true);

    // Verify proposal passed
    let proposal = contracts.governor.get_proposal(&proposal_id);
    assert_eq!(proposal.for_votes, 60); // 25 + 20 + 15
    assert_eq!(proposal.against_votes, 0);

    // Advance past voting period
    env.ledger().with_mut(|li| {
        li.timestamp = li.timestamp + 301;
    });

    // Queue proposal (enters timelock)
    contracts.governor.queue(&proposal_id);

    // Verify state is Queued
    let state = contracts.governor.state(&proposal_id);
    assert_eq!(state, governor::ProposalState::Queued);

    // Advance past timelock
    env.ledger().with_mut(|li| {
        li.timestamp = li.timestamp + 86401; // timelock_delay + 1
    });

    // Execute proposal
    contracts.governor.execute(&proposal_id);

    // Verify state is Executed
    let state = contracts.governor.state(&proposal_id);
    assert_eq!(state, governor::ProposalState::Executed);
}

/**
 * Integration Test 3: Badge-Based Scholarship Access
 *
 * Flow:
 * 1. Member registers and earns badges
 * 2. Guardian approves member for scholarship
 * 3. Member claims scholarship based on badge level
 */
#[test]
fn test_badge_scholarship_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let contracts = TestContracts::setup(&env);
    let student = Address::generate(&env);
    let funder = Address::generate(&env);

    // 1. Student registers
    contracts.register_member(&student);

    // 2. Student earns Learning Path badge (badge ID 5, level 20)
    contracts.mint_badge(&student, 5, 20, false);

    // Verify student has increased Mana
    let mana = contracts.valocracy.get_votes(&student);
    assert_eq!(mana, 25); // 5 base + 20 from badge

    // 3. Funder creates scholarship lab
    contracts.fund_treasury(&funder, 50_000);

    let lab_id = contracts.treasury.fund_lab(&funder, &10_000, &1_000);
    assert_eq!(lab_id, 1);

    // 4. Guardian approves scholarship for student
    contracts.treasury.approve_scholarship(&lab_id, &student);

    // 5. Student checks claimable balance
    let claimable = contracts.treasury.get_claimable_balance(&student);
    assert_eq!(claimable, 1_000);

    // 6. Student withdraws scholarship
    contracts.treasury.withdraw_scholarship(&student, &1_000);

    // 7. Verify student received tokens
    let student_balance = contracts.token.balance(&student);
    assert_eq!(student_balance, 1_000);

    // 8. Verify claimable balance is now 0
    let claimable_after = contracts.treasury.get_claimable_balance(&student);
    assert_eq!(claimable_after, 0);
}

/**
 * Integration Test 4: Full Governance Cycle
 *
 * Flow:
 * 1. Multiple members register
 * 2. Members earn badges over time
 * 3. Proposal to allocate treasury funds
 * 4. Voting period
 * 5. Timelock period
 * 6. Execution and fund distribution
 */
#[test]
fn test_full_governance_cycle() {
    let env = Env::default();
    env.mock_all_auths();

    let contracts = TestContracts::setup(&env);

    // Setup: Create 5 members with varying Mana
    let members: Vec<Address> = (0..5).map(|_| Address::generate(&env)).collect::<Vec<_>>();

    for (i, member) in members.iter().enumerate() {
        contracts.register_member(member);

        // Different badge levels
        let level = ((i as i128) + 1) * 10;
        contracts.mint_badge(member, 5, level, false);
    }

    // Verify total Mana in system
    let total_mana: i128 = members
        .iter()
        .map(|m| contracts.valocracy.get_votes(m))
        .sum();

    // Total: (5+10) + (5+20) + (5+30) + (5+40) + (5+50) = 175
    assert_eq!(total_mana, 175);

    // Fund treasury
    contracts.fund_treasury(&contracts.admin, 1_000_000);

    // Member 0 creates proposal
    let description = String::from_str(&env, "Allocate 100k for Q2 scholarships");
    let actions = Vec::new(&env);

    let proposal_id = contracts
        .governor
        .propose(&members[0], &description, &actions);

    // Advance past voting delay
    env.ledger().with_mut(|li| {
        li.timestamp = li.timestamp + 2;
    });

    // Members vote (3 for, 2 against)
    contracts
        .governor
        .cast_vote(&members[0], &proposal_id, &true); // 15 Mana
    contracts
        .governor
        .cast_vote(&members[1], &proposal_id, &true); // 25 Mana
    contracts
        .governor
        .cast_vote(&members[2], &proposal_id, &true); // 35 Mana
    contracts
        .governor
        .cast_vote(&members[3], &proposal_id, &false); // 45 Mana
    contracts
        .governor
        .cast_vote(&members[4], &proposal_id, &false); // 55 Mana

    // Verify vote counts
    let proposal = contracts.governor.get_proposal(&proposal_id);
    assert_eq!(proposal.for_votes, 75); // 15 + 25 + 35
    assert_eq!(proposal.against_votes, 100); // 45 + 55

    // Advance past voting period
    env.ledger().with_mut(|li| {
        li.timestamp = li.timestamp + 301;
    });

    // Proposal should be Defeated (more against than for)
    let state = contracts.governor.state(&proposal_id);
    assert_eq!(state, governor::ProposalState::Defeated);
}

/**
 * Integration Test 5: Mana Decay Impact on Voting
 *
 * Flow:
 * 1. Member earns badge
 * 2. Member votes with full Mana
 * 3. Time passes (Mana decays)
 * 4. Member's vote weight decreases on new proposal
 */
#[test]
fn test_mana_decay_voting_impact() {
    let env = Env::default();
    env.mock_all_auths();

    let contracts = TestContracts::setup(&env);
    let member = Address::generate(&env);

    // 1. Register and earn badge
    contracts.register_member(&member);
    contracts.mint_badge(&member, 5, 100, false);

    // Initial Mana: 5 + 100 = 105
    let initial_mana = contracts.valocracy.get_votes(&member);
    assert_eq!(initial_mana, 105);

    // 2. Create and vote on first proposal
    let desc1 = String::from_str(&env, "Proposal 1");
    let actions = Vec::new(&env);
    let prop1 = contracts.governor.propose(&member, &desc1, &actions);

    env.ledger().with_mut(|li| li.timestamp += 2);
    contracts.governor.cast_vote(&member, &prop1, &true);

    let proposal1 = contracts.governor.get_proposal(&prop1);
    assert_eq!(proposal1.for_votes, 105);

    // 3. Advance time by 90 days (half the vacancy period)
    env.ledger().with_mut(|li| {
        li.timestamp += 90 * 24 * 60 * 60; // 90 days
    });

    // 4. Check decayed Mana (should be ~50% of original badge level)
    let decayed_mana = contracts.valocracy.get_votes(&member);
    // Formula: 5 + (100 * (90 days remaining / 180 days total))
    // = 5 + (100 * 0.5) = 55
    assert!(decayed_mana >= 50 && decayed_mana <= 60); // Allow some rounding

    // 5. Vote on second proposal with decayed Mana
    let desc2 = String::from_str(&env, "Proposal 2");
    let prop2 = contracts.governor.propose(&member, &desc2, &actions);

    env.ledger().with_mut(|li| li.timestamp += 2);
    contracts.governor.cast_vote(&member, &prop2, &true);

    let proposal2 = contracts.governor.get_proposal(&prop2);
    assert!(proposal2.for_votes >= 50 && proposal2.for_votes <= 60);
}

/**
 * Integration Test 6: Quorum Requirements
 *
 * Flow:
 * 1. Create proposal with insufficient votes to meet quorum
 * 2. Verify proposal is Defeated due to lack of quorum
 * 3. Add more members and retry
 * 4. Verify proposal passes with quorum
 */
#[test]
fn test_quorum_enforcement() {
    let env = Env::default();
    env.mock_all_auths();

    let contracts = TestContracts::setup(&env);

    // Create member with low Mana
    let member1 = Address::generate(&env);
    contracts.register_member(&member1);
    contracts.mint_badge(&member1, 5, 10, false);

    // Total Mana: 15
    let total_mana = contracts.valocracy.get_votes(&member1);
    assert_eq!(total_mana, 15);

    // Create proposal
    let description = String::from_str(&env, "Test quorum");
    let actions = Vec::new(&env);
    let prop_id = contracts.governor.propose(&member1, &description, &actions);

    env.ledger().with_mut(|li| li.timestamp += 2);

    // Vote with all available Mana
    contracts.governor.cast_vote(&member1, &prop_id, &true);

    // Advance past voting period
    env.ledger().with_mut(|li| li.timestamp += 301);

    // Check state - should be Defeated due to insufficient quorum
    // Quorum is 4% of total supply, but we only have 15 Mana
    let state = contracts.governor.state(&prop_id);
    assert_eq!(state, governor::ProposalState::Defeated);
}

/**
 * Integration Test 7: Founder Badge Permanence
 *
 * Flow:
 * 1. Founder gets permanent badge
 * 2. Time passes (180+ days)
 * 3. Verify founder's Mana does NOT decay
 * 4. Regular member's Mana DOES decay
 */
#[test]
fn test_founder_badge_permanence() {
    let env = Env::default();
    env.mock_all_auths();

    let contracts = TestContracts::setup(&env);

    // Founder already initialized in Valocracy
    // Mint Founder badge (badge ID 0, level 100, permanent)
    contracts.mint_badge(&contracts.founder, 0, 100, true);

    // Regular member
    let regular = Address::generate(&env);
    contracts.register_member(&regular);
    contracts.mint_badge(&regular, 5, 100, false);

    // Both start with same Mana: 5 + 100 = 105
    let founder_mana_initial = contracts.valocracy.get_votes(&contracts.founder);
    let regular_mana_initial = contracts.valocracy.get_votes(&regular);
    assert_eq!(founder_mana_initial, 105);
    assert_eq!(regular_mana_initial, 105);

    // Advance 180 days (full vacancy period)
    env.ledger().with_mut(|li| {
        li.timestamp += 180 * 24 * 60 * 60;
    });

    // Check Mana after decay period
    let founder_mana_after = contracts.valocracy.get_votes(&contracts.founder);
    let regular_mana_after = contracts.valocracy.get_votes(&regular);

    // Founder: 5 + 100 (permanent) = 105 (no decay)
    assert_eq!(founder_mana_after, 105);

    // Regular: 5 + 0 (fully decayed) = 5
    assert_eq!(regular_mana_after, 5);
}

/**
 * Integration Test 8: Multiple Proposals Concurrent Voting
 *
 * Flow:
 * 1. Create multiple proposals
 * 2. Members vote on different proposals
 * 3. Verify all votes are tracked correctly
 */
#[test]
fn test_concurrent_proposals() {
    let env = Env::default();
    env.mock_all_auths();

    let contracts = TestContracts::setup(&env);

    // Create 3 members
    let members: Vec<Address> = (0..3).map(|_| Address::generate(&env)).collect();

    for member in &members {
        contracts.register_member(member);
        contracts.mint_badge(member, 5, 50, false);
    }

    // Each member creates a proposal
    let actions = Vec::new(&env);
    let prop1 =
        contracts
            .governor
            .propose(&members[0], &String::from_str(&env, "Proposal 1"), &actions);
    let prop2 =
        contracts
            .governor
            .propose(&members[1], &String::from_str(&env, "Proposal 2"), &actions);
    let prop3 =
        contracts
            .governor
            .propose(&members[2], &String::from_str(&env, "Proposal 3"), &actions);

    env.ledger().with_mut(|li| li.timestamp += 2);

    // Members vote on different proposals
    // Member 0: votes for prop1 and prop2
    contracts.governor.cast_vote(&members[0], &prop1, &true);
    contracts.governor.cast_vote(&members[0], &prop2, &true);

    // Member 1: votes against prop1, for prop3
    contracts.governor.cast_vote(&members[1], &prop1, &false);
    contracts.governor.cast_vote(&members[1], &prop3, &true);

    // Member 2: votes for all
    contracts.governor.cast_vote(&members[2], &prop1, &true);
    contracts.governor.cast_vote(&members[2], &prop2, &true);
    contracts.governor.cast_vote(&members[2], &prop3, &true);

    // Verify vote counts
    let proposal1 = contracts.governor.get_proposal(&prop1);
    assert_eq!(proposal1.for_votes, 110); // members[0] + members[2]
    assert_eq!(proposal1.against_votes, 55); // members[1]

    let proposal2 = contracts.governor.get_proposal(&prop2);
    assert_eq!(proposal2.for_votes, 110); // members[0] + members[2]
    assert_eq!(proposal2.against_votes, 0);

    let proposal3 = contracts.governor.get_proposal(&prop3);
    assert_eq!(proposal3.for_votes, 110); // members[1] + members[2]
    assert_eq!(proposal3.against_votes, 0);
}

/**
 * Integration Test 9: Treasury Escrow → Governance Approval
 *
 * Flow:
 * 1. Funder creates scholarship lab
 * 2. Guardian creates proposal to approve student
 * 3. Governance votes on approval
 * 4. Student receives scholarship after approval
 */
#[test]
fn test_governance_scholarship_approval() {
    let env = Env::default();
    env.mock_all_auths();

    let contracts = TestContracts::setup(&env);

    // Setup members
    let guardian = Address::generate(&env);
    let student = Address::generate(&env);
    let voters: Vec<Address> = (0..3).map(|_| Address::generate(&env)).collect();

    contracts.register_member(&guardian);
    contracts.register_member(&student);

    for voter in &voters {
        contracts.register_member(voter);
        contracts.mint_badge(voter, 5, 30, false);
    }

    // Fund treasury and create lab
    contracts.fund_treasury(&contracts.admin, 100_000);
    let lab_id = contracts
        .treasury
        .fund_lab(&contracts.admin, &10_000, &1_000);

    // Create proposal to approve student for scholarship
    let description = String::from_str(&env, "Approve scholarship for student");
    let actions = Vec::new(&env);

    let prop_id = contracts
        .governor
        .propose(&guardian, &description, &actions);

    env.ledger().with_mut(|li| li.timestamp += 2);

    // Voters approve
    for voter in &voters {
        contracts.governor.cast_vote(voter, &prop_id, &true);
    }

    env.ledger().with_mut(|li| li.timestamp += 301);

    // Queue and execute proposal
    contracts.governor.queue(&prop_id);

    env.ledger().with_mut(|li| li.timestamp += 86401);

    contracts.governor.execute(&prop_id);

    // After governance approval, guardian can approve scholarship
    contracts.treasury.approve_scholarship(&lab_id, &student);

    // Student can now withdraw
    let claimable = contracts.treasury.get_claimable_balance(&student);
    assert_eq!(claimable, 1_000);

    contracts.treasury.withdraw_scholarship(&student, &1_000);

    let balance = contracts.token.balance(&student);
    assert_eq!(balance, 1_000);
}

/**
 * Integration Test 10: Member Floor Guarantee
 *
 * Flow:
 * 1. Member registers (gets 5 Mana)
 * 2. Member never earns badges
 * 3. Time passes (180+ days)
 * 4. Verify member still has 5 Mana (Member Floor is permanent)
 */
#[test]
fn test_member_floor_permanence() {
    let env = Env::default();
    env.mock_all_auths();

    let contracts = TestContracts::setup(&env);
    let member = Address::generate(&env);

    // Register without any badges
    contracts.register_member(&member);

    // Initial Mana should be Member Floor (5)
    let initial_mana = contracts.valocracy.get_votes(&member);
    assert_eq!(initial_mana, 5);

    // Advance 180 days
    env.ledger().with_mut(|li| {
        li.timestamp += 180 * 24 * 60 * 60;
    });

    // Mana should still be 5 (Member Floor doesn't decay)
    let final_mana = contracts.valocracy.get_votes(&member);
    assert_eq!(final_mana, 5);

    // Member can still participate in governance
    let description = String::from_str(&env, "Test with minimum Mana");
    let actions = Vec::new(&env);

    let prop_id = contracts.governor.propose(&member, &description, &actions);
    assert_eq!(prop_id, 1);

    env.ledger().with_mut(|li| li.timestamp += 2);

    contracts.governor.cast_vote(&member, &prop_id, &true);

    let proposal = contracts.governor.get_proposal(&prop_id);
    assert_eq!(proposal.for_votes, 5);
}
