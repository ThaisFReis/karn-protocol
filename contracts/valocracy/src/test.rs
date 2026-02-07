//! Unit tests for the Valocracy contract

#![cfg(test)]

use soroban_sdk::{testutils::Address as _, Address, Env, String};

use crate::{ValocracyContract, ValocracyContractClient, VACANCY_PERIOD};

fn setup_test<'a>() -> (Env, ValocracyContractClient<'a>, Address) {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register_contract(None, ValocracyContract);
    let client = ValocracyContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    
    (env, client, admin)
}

#[test]
fn test_initialize() {
    let (env, client, admin) = setup_test();
    
    let name = String::from_str(&env, "Valocracy");
    let symbol = String::from_str(&env, "VAL");
    
    client.initialize(&admin, &name, &symbol);
    
    assert_eq!(client.name(), name);
    assert_eq!(client.symbol(), symbol);
    assert_eq!(client.admin(), Some(admin));
    assert_eq!(client.total_supply(), 0);
}

#[test]
fn test_set_valor() {
    let (env, client, admin) = setup_test();
    
    let name = String::from_str(&env, "Valocracy");
    let symbol = String::from_str(&env, "VAL");
    client.initialize(&admin, &name, &symbol);
    
    let valor_id = 1u64;
    let rarity = 10u64;
    let metadata = String::from_str(&env, "Gold Contributor Badge");
    
    client.set_valor(&valor_id, &rarity, &metadata);
    
    assert_eq!(client.rarity_of(&valor_id), rarity);
    assert_eq!(client.metadata_of(&valor_id), metadata);
}

#[test]
fn test_mint() {
    let (env, client, admin) = setup_test();
    
    let name = String::from_str(&env, "Valocracy");
    let symbol = String::from_str(&env, "VAL");
    client.initialize(&admin, &name, &symbol);
    
    // Create a valor type
    let valor_id = 1u64;
    let rarity = 10u64;
    let metadata = String::from_str(&env, "Gold Badge");
    client.set_valor(&valor_id, &rarity, &metadata);
    
    // Mint to user
    let user = Address::generate(&env);
    let token_id = client.mint(&user, &valor_id);
    
    assert_eq!(token_id, 1);
    assert_eq!(client.total_supply(), 1);
    assert_eq!(client.owner_of(&token_id), Some(user.clone()));
    assert_eq!(client.valor_id_of(&token_id), Some(valor_id));
    assert_eq!(client.level_of(&user), rarity);
}

#[test]
fn test_mana_calculation() {
    let level = 100u64;
    let current_time = 1000000u64;
    let expiry = current_time + VACANCY_PERIOD;
    
    // At start, mana should equal level
    let mana = ValocracyContract::calculate_mana(level, expiry, current_time);
    assert_eq!(mana, level);
    
    // At half time, mana should be half level
    let half_time = current_time + VACANCY_PERIOD / 2;
    let mana_half = ValocracyContract::calculate_mana(level, expiry, half_time);
    assert_eq!(mana_half, level / 2);
    
    // At expiry, mana should be zero
    let mana_expired = ValocracyContract::calculate_mana(level, expiry, expiry);
    assert_eq!(mana_expired, 0);
    
    // After expiry, mana should be zero
    let mana_after = ValocracyContract::calculate_mana(level, expiry, expiry + 1000);
    assert_eq!(mana_after, 0);
}

#[test]
fn test_get_votes_with_decay() {
    let (env, client, admin) = setup_test();
    
    let name = String::from_str(&env, "Valocracy");
    let symbol = String::from_str(&env, "VAL");
    client.initialize(&admin, &name, &symbol);
    
    // Create valor and mint
    let valor_id = 1u64;
    let rarity = 100u64;
    client.set_valor(&valor_id, &rarity, &String::from_str(&env, "Test"));
    
    let user = Address::generate(&env);
    client.mint(&user, &valor_id);
    
    // Check initial votes (should be full level since just minted)
    let votes = client.get_votes(&user);
    assert_eq!(votes, rarity); // At mint time, mana equals level
}

#[test]
fn test_multiple_mints_accumulate() {
    let (env, client, admin) = setup_test();
    
    let name = String::from_str(&env, "Valocracy");
    let symbol = String::from_str(&env, "VAL");
    client.initialize(&admin, &name, &symbol);
    
    // Create two valor types
    let valor_1 = 1u64;
    let rarity_1 = 10u64;
    client.set_valor(&valor_1, &rarity_1, &String::from_str(&env, "Bronze"));
    
    let valor_2 = 2u64;
    let rarity_2 = 20u64;
    client.set_valor(&valor_2, &rarity_2, &String::from_str(&env, "Silver"));
    
    let user = Address::generate(&env);
    
    // First mint
    client.mint(&user, &valor_1);
    assert_eq!(client.level_of(&user), rarity_1);
    
    // Second mint should accumulate
    client.mint(&user, &valor_2);
    assert_eq!(client.level_of(&user), rarity_1 + rarity_2);
    assert_eq!(client.total_supply(), 2);
}

#[test]
fn test_vacancy_period() {
    let (env, client, _admin) = setup_test();
    
    assert_eq!(client.vacancy_period(), VACANCY_PERIOD);
    assert_eq!(VACANCY_PERIOD, 180 * 24 * 60 * 60); // 180 days in seconds
}
