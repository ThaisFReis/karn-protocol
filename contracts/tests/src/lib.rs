#![cfg(test)]

use soroban_sdk::{
    testutils::{Address as _, Ledger},
    Address, BytesN, Env, IntoVal, Symbol,
};

use governor::{GovernorContract, GovernorContractClient};
use soroban_sdk::token::{StellarAssetClient, TokenClient};
use treasury::{TreasuryContract, TreasuryContractClient};
use valocracy::{ValocracyContract, ValocracyContractClient};

#[test]
fn test_integration_full_flow() {
    let env = Env::default();
    env.mock_all_auths();

    // 1. Deployment
    let val_id = env.register_contract(None, ValocracyContract);
    let gov_id = env.register_contract(None, GovernorContract);
    let tr_id = env.register_contract(None, TreasuryContract);

    let val = ValocracyContractClient::new(&env, &val_id);
    let gov = GovernorContractClient::new(&env, &gov_id);
    let tr = TreasuryContractClient::new(&env, &tr_id);

    // 2. Token setup
    let token_admin = Address::generate(&env);
    let token_id = env
        .register_stellar_asset_contract_v2(token_admin.clone())
        .address();
    let token = TokenClient::new(&env, &token_id);
    let token_admin_client = StellarAssetClient::new(&env, &token_id);

    // 3. Initialization
    let founder = Address::generate(&env);

    // Valocracy Init
    let member_valor_id = 0;
    let ids = soroban_sdk::vec![&env, 0, 1, 10, 20, 70];
    let rarities = soroban_sdk::vec![&env, 5, 100, 20, 10, 50];
    let metas = soroban_sdk::vec![
        &env,
        soroban_sdk::String::from_str(&env, "Member"),
        soroban_sdk::String::from_str(&env, "Founder"),
        soroban_sdk::String::from_str(&env, "Leadership"),
        soroban_sdk::String::from_str(&env, "Track"),
        soroban_sdk::String::from_str(&env, "Governance")
    ];
    let founder_valor_id = 1;
    let signer = BytesN::from_array(&env, &[0; 32]);

    val.initialize(
        &founder,
        &gov_id,
        &tr_id,
        &member_valor_id,
        &ids,
        &rarities,
        &metas,
        &founder_valor_id,
        &signer,
    );

    // Governor Init
    gov.initialize(&val_id);

    // Treasury Init
    tr.initialize(&val_id, &gov_id, &token_id);

    // 4. User Interaction
    let user = Address::generate(&env);
    token_admin_client.mint(&user, &100); // Give some funds for later

    // 5. Happy Path: Founder mints Track badge (ID 20) to User1
    // Founder has level 100 (from init), so can mint Track (requires level >= 10)
    // Actually, check_mint_authorization says: Track (20-59): Governor OR Leadership holders (level >= 10).
    // Founder level 100 > 10.

    // We need to use `try_mint` or assume `mint` works.
    // Proposal threshold is 100. Track badge is 10. We need 10 badges.
    for _ in 0..10 {
        let res = val.try_mint(&founder, &user, &20);
        assert!(res.is_ok());
    }

    // Check user now has level
    let level = val.level_of(&user);
    assert_eq!(level, 100); // 10 * 10

    // Check Mana
    // Immediate mana: floor (5) + bonus.
    // Bonus = (100 - 5) * 180days / 180days = 95.
    // Total = 100.
    let mana = val.get_votes(&user);
    assert_eq!(mana, 100);

    // 6. Governance Flow
    // User1 creates proposal
    // Proposal threshold? Default config in Governor?
    // We didn't set config explicitly in init, so it uses default.
    // Default config might require threshold.
    // Let's verify config first?
    // We can't easily see config from client if no getter?
    // But we can just try proposing.

    let description = soroban_sdk::String::from_str(&env, "Test Proposal");
    let actions = soroban_sdk::vec![&env]; // Empty actions for simplicity, or simple action.

    // Mock auths for user
    // Note: mock_all_auths covers it.

    let prop_res = gov.try_propose(&user, &description, &actions);
    // Be careful: if threshold is high, this might fail.
    // In governor/src/lib.rs, default config:
    // proposal_threshold: 10, voting_delay: 7 days, voting_period: 7 days.
    // User mana is 10. So constraint is satisfied (checks >= ? or > ?).
    // Code says: if voting_power < threshold { Err }
    // 10 < 10 is false. So it passes.

    // assert!(prop_res.is_ok());
    let proposal_id = prop_res.unwrap().unwrap(); // Unwrap to see error if failed

    // 7. Voting
    // Need to advance time to pass voting_delay (7 days)
    let current_time = env.ledger().timestamp();
    let voting_delay = 7 * 24 * 60 * 60;
    env.ledger().set_timestamp(current_time + voting_delay + 1);

    // Setup Vote
    let vote_res = gov.try_cast_vote(&user, &proposal_id, &true);
    assert!(vote_res.is_ok());

    // 8. Execution
    // Advance time to pass voting_period (7 days)
    let voting_period = 7 * 24 * 60 * 60;
    env.ledger()
        .set_timestamp(current_time + voting_delay + voting_period + 1);

    // Execute
    // Needs quorum.
    // Quorum percentage default?
    // Governor default config: quorum_percentage: 4.
    // Total supply?
    // In this test env, total supply is effectively just user (level 10) + founder (level 100).
    // Wait, Valocracy uses "Total Voting Power" for quorum?
    // Governor `get_proposal_state` check:
    // `let for_percentage = (proposal.for_votes * 100) / total_votes;`
    // Wait, `total_votes` is `for + against`.
    // It compares `for_percentage` against `quorum_percentage`.
    // This logic means "Percentage of VOTES CAST that are FOR".
    // 10 votes cast (all for). 100% FOR.
    // 100% > 4%. Succeeded.
    // (Note: This is "Relative Quorum" logic in my implementation, unusual but that's what code said).

    let exec_res = gov.try_execute(&proposal_id);
    assert!(exec_res.is_ok());

    // 9. Treasury Flow (Scholarship)
    // Fund Lab
    let funder = Address::generate(&env);
    token_admin_client.mint(&funder, &10000);

    let total_amount = 5000i128;
    let scholarship_amount = 1000i128;

    let lab_res = tr.try_fund_lab(&funder, &total_amount, &scholarship_amount);
    assert!(lab_res.is_ok());
    let lab_id = lab_res.unwrap().unwrap();

    // Approve Scholarship
    let student = Address::generate(&env);
    let app_res = tr.try_approve_scholarship(&lab_id, &student);
    assert!(app_res.is_ok());

    // Withdraw
    let withdraw_res = tr.try_withdraw_scholarship(&student, &scholarship_amount);
    assert!(withdraw_res.is_ok());

    // Verify balance
    assert_eq!(token.balance(&student), scholarship_amount);
}
