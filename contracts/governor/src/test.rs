#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::{Address as _, Ledger, MockAuth, MockAuthInvoke}, vec, Address, Env, IntoVal, Symbol, BytesN};

extern crate valocracy;
use valocracy::ValocracyContract;

#[test]
fn test_initialize_and_config() {
    let env = Env::default();
    env.mock_all_auths();

    let governor_id = env.register_contract(None, GovernorContract);
    let client = GovernorContractClient::new(&env, &governor_id);

    // Deploy mock valocracy
    let valocracy_id = env.register_contract(None, ValocracyContract);

    client.initialize(&valocracy_id);

    // Verify re-initialization fails
    let res = client.try_initialize(&valocracy_id);
    assert!(res.is_err());
}

#[test]
fn test_settings_update() {
    let env = Env::default();
    env.mock_all_auths();

    let governor_id = env.register_contract(None, GovernorContract);
    let client = GovernorContractClient::new(&env, &governor_id);
    let valocracy_id = env.register_contract(None, ValocracyContract);
    client.initialize(&valocracy_id);

    let new_config = GovernanceConfig {
        voting_delay: 3600,
        voting_period: 86400,
        proposal_threshold: 100,
        quorum_percentage: 10,
    };

    // Reset auths to test failure
    env.mock_auths(&[]);

    // Calling directly should fail because auth check expects self-call
    let res = client.try_update_config(&new_config);
    assert!(res.is_err());
}

#[test]
fn test_upgrade_access() {
    let env = Env::default();
    env.mock_all_auths();
    
    let governor_id = env.register_contract(None, GovernorContract);
    let client = GovernorContractClient::new(&env, &governor_id);
    let valocracy_id = env.register_contract(None, ValocracyContract);
    client.initialize(&valocracy_id);
    
    let new_wasm_hash = BytesN::from_array(&env, &[0; 32]);
    
    // Reset auths to test failure
    env.mock_auths(&[]);
    
    // Call upgrade without auth -> Fail
    let res = client.try_upgrade(&new_wasm_hash);
    assert!(res.is_err());
}
