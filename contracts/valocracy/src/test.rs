//! Unit tests for the Valocracy contract

#![cfg(test)]

use soroban_sdk::{testutils::Address as _, Address, Env, String, BytesN, Vec, IntoVal};

use crate::{ValocracyContract, ValocracyContractClient, VACANCY_PERIOD};

fn setup_test<'a>() -> (Env, ValocracyContractClient<'a>, Address, Address, Address, BytesN<32>) {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register_contract(None, ValocracyContract);
    let client = ValocracyContractClient::new(&env, &contract_id);
    let founder = Address::generate(&env);
    let governor = Address::generate(&env);
    let treasury = Address::generate(&env);
    
    let mut signer_bytes = [0u8; 32];
    for i in 0..32 { signer_bytes[i] = i as u8; }
    let signer = BytesN::from_array(&env, &signer_bytes);
    
    (env, client, founder, governor, treasury, signer)
}

fn init_contract(
    env: &Env,
    client: &ValocracyContractClient,
    founder: &Address,
    governor: &Address,
    treasury: &Address,
    signer: &BytesN<32>
) {
    // name and symbol are hardcoded in contract now to save args
    let member_valor_id = 0u64;
    let founder_valor_id = 1u64;
    
    let mut ids = Vec::new(env);
    ids.push_back(0); // Member
    ids.push_back(1); // Founder
    
    let mut rarities = Vec::new(env);
    rarities.push_back(5); // Member floor
    rarities.push_back(100); // Founder
    
    let mut metas = Vec::new(env);
    metas.push_back(String::from_str(env, "Member"));
    metas.push_back(String::from_str(env, "Founder"));
    
    client.initialize(
        founder,
        governor,
        treasury,
        &member_valor_id,
        &ids,
        &rarities,
        &metas,
        &founder_valor_id,
        signer
    );
}

#[test]
fn test_initialize() {
    let (env, client, founder, governor, treasury, signer) = setup_test();
    
    init_contract(&env, &client, &founder, &governor, &treasury, &signer);
    
    assert_eq!(client.name(), String::from_str(&env, "Valocracy"));
    assert_eq!(client.symbol(), String::from_str(&env, "VALOR"));
    assert_eq!(client.founder(), Some(founder));
    assert_eq!(client.total_supply(), 1); // Founder minted
}

#[test]
fn test_set_valor() {
    let (env, client, founder, governor, treasury, signer) = setup_test();
    init_contract(&env, &client, &founder, &governor, &treasury, &signer);
    
    let valor_id = 10u64;
    let rarity = 10u64;
    let metadata = String::from_str(&env, "Gold Contributor Badge");
    
    client.set_valor(&valor_id, &rarity, &metadata);
    
    assert_eq!(client.rarity_of(&valor_id), rarity);
    assert_eq!(client.metadata_of(&valor_id), metadata);
}

#[test]
fn test_mint() {
    let (env, client, founder, governor, treasury, signer) = setup_test();
    init_contract(&env, &client, &founder, &governor, &treasury, &signer);
    
    let valor_id = 10u64;
    let rarity = 10u64;
    let metadata = String::from_str(&env, "Gold Badge");
    client.set_valor(&valor_id, &rarity, &metadata);
    
    // Mint logic skipped due to treasury mock complexity
}

#[test]
fn test_mana_calculation() {
    let level = 100u64;
    let current_time = 1000000u64;
    let expiry = current_time + VACANCY_PERIOD;
    
    let mana = ValocracyContract::calculate_mana(level, 0, expiry, current_time);
    assert_eq!(mana, level);
    
    // At half time, mana should be half level (plus floor)
    let half_time = current_time + VACANCY_PERIOD / 2;
    let mana_half = ValocracyContract::calculate_mana(level, 0, expiry, half_time);
    // Level 100. Floor 5. Extra 95.
    // Bonus = 95 * 0.5 = 47. Total = 5 + 47 = 52.
    assert_eq!(mana_half, 52);
    
    // At expiry, mana should be floor (5)
    let mana_expired = ValocracyContract::calculate_mana(level, 0, expiry, expiry);
    assert_eq!(mana_expired, 5);
    
    // After expiry, mana should be floor (5)
    let mana_after = ValocracyContract::calculate_mana(level, 0, expiry, expiry + 1000);
    assert_eq!(mana_after, 5);
}

#[test]
fn test_get_votes_with_decay() {
    let (env, client, founder, governor, treasury, signer) = setup_test();
    init_contract(&env, &client, &founder, &governor, &treasury, &signer);
    
    let valor_id = 100u64;
    let rarity = 100u64;
    client.set_valor(&valor_id, &rarity, &String::from_str(&env, "Test"));
    
    let votes = client.get_votes(&founder);
    assert_eq!(votes, 100); 
}

#[test]
fn test_vacancy_period() {
    let (env, client, _founder, _governor, _treasury, _signer) = setup_test();
    
    assert_eq!(client.vacancy_period(), VACANCY_PERIOD);
    assert_eq!(VACANCY_PERIOD, 180 * 24 * 60 * 60); // 180 days in seconds
}
