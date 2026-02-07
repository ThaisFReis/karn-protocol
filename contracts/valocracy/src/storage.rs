//! Storage helpers for the Valocracy contract

use soroban_sdk::{contracttype, Address, Env, BytesN};

use crate::types::{UserStats, Valor};

/// Storage keys for the contract
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    /// Contract initialized status
    Initialized,
    /// Governor address
    Governor,
    /// Treasury address
    Treasury,
    /// Total supply
    TotalSupply,
    /// Member badge Valor ID
    MemberValorId,
    /// Token ID to Valor ID mapping
    TokenValorId(u64),
    /// Valor ID to Valor data mapping
    ValorData(u64),
    /// Account to UserStats mapping
    UserStats(Address),
    /// Token ID to owner address mapping
    TokenOwner(u64),
    Signer,
    UsedNonce(Address, u64),
}

// TTL constants (in ledgers, ~5 seconds each)
const DAY_IN_LEDGERS: u32 = 17280; // ~24 hours
const INSTANCE_BUMP_AMOUNT: u32 = 7 * DAY_IN_LEDGERS;
const INSTANCE_LIFETIME_THRESHOLD: u32 = DAY_IN_LEDGERS;

const PERSISTENT_BUMP_AMOUNT: u32 = 180 * DAY_IN_LEDGERS; // 180 days
const PERSISTENT_LIFETIME_THRESHOLD: u32 = 30 * DAY_IN_LEDGERS;

/// Extend the instance TTL
pub fn extend_instance_ttl(env: &Env) {
    env.storage()
        .instance()
        .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
}

/// Extend persistent storage TTL
fn extend_persistent_ttl(env: &Env, key: &DataKey) {
    env.storage()
        .persistent()
        .extend_ttl(key, PERSISTENT_LIFETIME_THRESHOLD, PERSISTENT_BUMP_AMOUNT);
}



pub fn is_initialized(env: &Env) -> bool {
    env.storage().instance().get(&DataKey::Initialized).unwrap_or(false)
}

pub fn set_initialized(env: &Env) {
    env.storage().instance().set(&DataKey::Initialized, &true);
}



pub fn get_member_valor_id(env: &Env) -> Option<u64> {
    env.storage().instance().get(&DataKey::MemberValorId)
}

pub fn set_member_valor_id(env: &Env, valor_id: u64) {
    env.storage().instance().set(&DataKey::MemberValorId, &valor_id);
}



pub fn get_governor(env: &Env) -> Option<Address> {
    env.storage().instance().get(&DataKey::Governor)
}

pub fn set_governor(env: &Env, governor: &Address) {
    env.storage().instance().set(&DataKey::Governor, governor);
}



pub fn get_treasury(env: &Env) -> Option<Address> {
    env.storage().instance().get(&DataKey::Treasury)
}

pub fn set_treasury(env: &Env, treasury: &Address) {
    env.storage().instance().set(&DataKey::Treasury, treasury);
}



pub fn get_total_supply(env: &Env) -> u64 {
    env.storage()
        .instance()
        .get(&DataKey::TotalSupply)
        .unwrap_or(0)
}

pub fn set_total_supply(env: &Env, supply: u64) {
    env.storage().instance().set(&DataKey::TotalSupply, &supply);
}



pub fn get_token_valor_id(env: &Env, token_id: u64) -> Option<u64> {
    let key = DataKey::TokenValorId(token_id);
    let result = env.storage().persistent().get(&key);
    if result.is_some() {
        extend_persistent_ttl(env, &key);
    }
    result
}

pub fn set_token_valor_id(env: &Env, token_id: u64, valor_id: u64) {
    let key = DataKey::TokenValorId(token_id);
    env.storage().persistent().set(&key, &valor_id);
    extend_persistent_ttl(env, &key);
}



pub fn get_valor(env: &Env, valor_id: u64) -> Option<Valor> {
    let key = DataKey::ValorData(valor_id);
    let result = env.storage().persistent().get(&key);
    if result.is_some() {
        extend_persistent_ttl(env, &key);
    }
    result
}

pub fn set_valor(env: &Env, valor_id: u64, valor: &Valor) {
    let key = DataKey::ValorData(valor_id);
    env.storage().persistent().set(&key, valor);
    extend_persistent_ttl(env, &key);
}



pub fn get_user_stats(env: &Env, account: &Address) -> Option<UserStats> {
    let key = DataKey::UserStats(account.clone());
    let result = env.storage().persistent().get(&key);
    if result.is_some() {
        extend_persistent_ttl(env, &key);
    }
    result
}

pub fn set_user_stats(env: &Env, account: &Address, stats: &UserStats) {
    let key = DataKey::UserStats(account.clone());
    env.storage().persistent().set(&key, stats);
    extend_persistent_ttl(env, &key);
}

pub fn has_user_stats(env: &Env, account: &Address) -> bool {
    let key = DataKey::UserStats(account.clone());
    env.storage().persistent().has(&key)
}



pub fn get_token_owner(env: &Env, token_id: u64) -> Option<Address> {
    let key = DataKey::TokenOwner(token_id);
    let result = env.storage().persistent().get(&key);
    if result.is_some() {
        extend_persistent_ttl(env, &key);
    }
    result
}

pub fn set_token_owner(env: &Env, token_id: u64, owner: &Address) {
    let key = DataKey::TokenOwner(token_id);
    env.storage().persistent().set(&key, owner);
    extend_persistent_ttl(env, &key);
}

pub fn remove_token_owner(env: &Env, token_id: u64) {
    let key = DataKey::TokenOwner(token_id);
    env.storage().persistent().remove(&key);
}

pub fn remove_token_valor_id(env: &Env, token_id: u64) {
    let key = DataKey::TokenValorId(token_id);
    env.storage().persistent().remove(&key);
}



pub fn get_signer(env: &Env) -> Option<BytesN<32>> {
    env.storage().instance().get(&DataKey::Signer)
}

pub fn set_signer(env: &Env, signer: &BytesN<32>) {
    env.storage().instance().set(&DataKey::Signer, signer);
}



pub fn is_nonce_used(env: &Env, account: &Address, nonce: u64) -> bool {
    let key = DataKey::UsedNonce(account.clone(), nonce);
    env.storage().persistent().has(&key)
}

pub fn set_nonce_used(env: &Env, account: &Address, nonce: u64) {
    let key = DataKey::UsedNonce(account.clone(), nonce);
    env.storage().persistent().set(&key, &true);
    // 30 days retention for nonces seems reasonable, or maybe less?
    // Let's stick to persistent default
    extend_persistent_ttl(env, &key);
}

