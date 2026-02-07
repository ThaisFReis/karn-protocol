//! Valocracy Governance Tests
//!
//! These tests demonstrate the core Valocracy principle:
//! **Treasury is managed collectively through governance, not individually.**

#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::Address as _,
    token, Address, Env,
};

#[test]
fn test_direct_withdrawal_blocked() {
    let env = Env::default();
    env.mock_all_auths();

    let treasury_id = env.register_contract(None, TreasuryContract);
    let treasury = TreasuryContractClient::new(&env, &treasury_id);

    let valocracy = Address::generate(&env);
    let governor = Address::generate(&env);

    // Register Stellar asset as token
    let token_admin = Address::generate(&env);
    let token_id = env.register_stellar_asset_contract_v2(token_admin).address();

    // Initialize
    treasury.initialize(&valocracy, &governor, &token_id);

    // Alice gets shares (simulating Valocracy minting badges)
    let alice = Address::generate(&env);
    let _ = treasury.deposit(&alice, &1000);

    // VALOCRACY PRINCIPLE: Alice cannot directly withdraw her shares
    // She must go through governance to request funds

    let result = treasury.try_withdraw(&alice, &alice, &500);

    // ✅ EXPECTED: Withdrawal fails with NotAuthorized
    assert!(result.is_err());
    assert_eq!(result.err(), Some(Ok(TreasuryError::NotAuthorized)));
}

#[test]
fn test_governance_controlled_transfer() {
    let env = Env::default();
    env.mock_all_auths();

    let treasury_id = env.register_contract(None, TreasuryContract);
    let treasury = TreasuryContractClient::new(&env, &treasury_id);

    let valocracy = Address::generate(&env);
    let governor = Address::generate(&env);

    // Register Stellar asset as token
    let token_admin = Address::generate(&env);
    let token_id = env.register_stellar_asset_contract_v2(token_admin.clone()).address();
    let token_client = token::TokenClient::new(&env, &token_id);
    let token_admin_client = token::StellarAssetClient::new(&env, &token_id);

    // Initialize contracts
    treasury.initialize(&valocracy, &governor, &token_id);

    // Fund the treasury
    let funder = Address::generate(&env);
    token_admin_client.mint(&funder, &10000);
    token_client.transfer(&funder, &treasury_id, &10000);

    // Member wants to withdraw funds
    let maria = Address::generate(&env);
    let requested_amount = 1000_i128;

    // VALOCRACY FLOW:
    // 1. Maria creates a governance proposal: "Send 1000 tokens to Maria"
    // 2. Community votes (weighted by Mana)
    // 3. If approved, Governor executes the transfer

    // ✅ EXPECTED: Transfer succeeds when called by Governor
    treasury.transfer(&maria, &requested_amount);

    // Verify Maria received the funds
    assert_eq!(token_client.balance(&maria), 1000);
    assert_eq!(token_client.balance(&treasury_id), 9000);
}

#[test]
fn test_non_governor_cannot_transfer() {
    let env = Env::default();
    env.mock_all_auths();

    let treasury_id = env.register_contract(None, TreasuryContract);
    let treasury = TreasuryContractClient::new(&env, &treasury_id);

    let valocracy = Address::generate(&env);
    let governor = Address::generate(&env);

    // Register Stellar asset as token
    let token_admin = Address::generate(&env);
    let token_id = env.register_stellar_asset_contract_v2(token_admin.clone()).address();
    let token_client = token::TokenClient::new(&env, &token_id);
    let token_admin_client = token::StellarAssetClient::new(&env, &token_id);

    // Initialize
    treasury.initialize(&valocracy, &governor, &token_id);

    // Fund the treasury
    let funder = Address::generate(&env);
    token_admin_client.mint(&funder, &10000);
    token_client.transfer(&funder, &treasury_id, &10000);

    // Attacker tries to call transfer() directly (without Governor auth)
    let _attacker = Address::generate(&env);
    let victim = Address::generate(&env);

    // Reset auths to remove the mock_all_auths() that was set earlier
    // This simulates a real scenario where the caller is NOT the Governor
    env.mock_auths(&[]);

    // This should fail because only Governor can call transfer()
    let result = treasury.try_transfer(&victim, &1000);

    // ✅ EXPECTED: Transfer fails because caller is not the Governor
    assert!(result.is_err());
}

#[test]
fn test_shares_are_informational_only() {
    let env = Env::default();
    env.mock_all_auths();

    let treasury_id = env.register_contract(None, TreasuryContract);
    let treasury = TreasuryContractClient::new(&env, &treasury_id);

    let valocracy = Address::generate(&env);
    let governor = Address::generate(&env);

    // Register Stellar asset as token
    let token_admin = Address::generate(&env);
    let token_id = env.register_stellar_asset_contract_v2(token_admin).address();

    // Initialize
    treasury.initialize(&valocracy, &governor, &token_id);

    // Alice and Bob get shares from badge minting
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);

    treasury.deposit(&alice, &1000);
    treasury.deposit(&bob, &500);

    // ✅ Shares track contribution
    assert_eq!(treasury.shares_of(&alice), 1000);
    assert_eq!(treasury.shares_of(&bob), 500);
    assert_eq!(treasury.total_shares(), 1500);

    // ✅ But shares CANNOT be redeemed directly
    // They represent potential economic interest, not liquid claims
    // Actual distributions require governance proposals

    let result = treasury.try_withdraw(&alice, &alice, &500);
    assert!(result.is_err());
    assert_eq!(result.err(), Some(Ok(TreasuryError::NotAuthorized)));
}

#[test]
fn test_valocracy_principle_no_permanent_power() {
    // This test documents the philosophical alignment:
    // - Genesis members have voting power (Mana) but it decays
    // - Genesis members do NOT have permanent economic claims
    // - Even core team must go through governance for withdrawals
    // - This enforces contribution-based power, not position-based power

    let env = Env::default();
    env.mock_all_auths();

    let treasury_id = env.register_contract(None, TreasuryContract);
    let treasury = TreasuryContractClient::new(&env, &treasury_id);

    let valocracy = Address::generate(&env);
    let governor = Address::generate(&env);

    // Register Stellar asset as token
    let token_admin = Address::generate(&env);
    let token_id = env.register_stellar_asset_contract_v2(token_admin.clone()).address();
    let token_client = token::TokenClient::new(&env, &token_id);
    let token_admin_client = token::StellarAssetClient::new(&env, &token_id);

    // Initialize
    treasury.initialize(&valocracy, &governor, &token_id);

    // Fund treasury
    let funder = Address::generate(&env);
    token_admin_client.mint(&funder, &100000);
    token_client.transfer(&funder, &treasury_id, &100000);

    // Genesis member (core team) wants to withdraw
    let genesis_member = Address::generate(&env);

    // Even genesis members cannot directly withdraw
    let result = treasury.try_withdraw(&genesis_member, &genesis_member, &1000);
    assert!(result.is_err());
    assert_eq!(result.err(), Some(Ok(TreasuryError::NotAuthorized)));

    // They must create a proposal and get community approval
    // Only then can Governor execute the transfer

    // ✅ Transfer succeeds only with governance approval (Governor auth)
    treasury.transfer(&genesis_member, &1000);
    assert_eq!(token_client.balance(&genesis_member), 1000);
}
