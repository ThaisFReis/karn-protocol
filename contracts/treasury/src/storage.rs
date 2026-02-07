//! Storage helpers for the Treasury contract

use soroban_sdk::{contracttype, Address, Env};

/// Storage keys for the Treasury contract
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    /// Valocracy contract address
    Valocracy,
    /// Governor contract address (authorized for spends)
    Governor,
    /// Underlying asset token
    AssetToken,
    /// Total shares outstanding
    TotalShares,
    /// User address -> shares
    UserShares(Address),
    /// Reentrancy lock
    ReentrancyLock,
}

// TTL constants
const DAY_IN_LEDGERS: u32 = 17280;
const INSTANCE_BUMP_AMOUNT: u32 = 7 * DAY_IN_LEDGERS;
const INSTANCE_LIFETIME_THRESHOLD: u32 = DAY_IN_LEDGERS;

const PERSISTENT_BUMP_AMOUNT: u32 = 180 * DAY_IN_LEDGERS;
const PERSISTENT_LIFETIME_THRESHOLD: u32 = 30 * DAY_IN_LEDGERS;

/// Extend instance TTL
pub fn extend_instance_ttl(env: &Env) {
    env.storage()
        .instance()
        .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
}

fn extend_persistent_ttl(env: &Env, key: &DataKey) {
    env.storage()
        .persistent()
        .extend_ttl(key, PERSISTENT_LIFETIME_THRESHOLD, PERSISTENT_BUMP_AMOUNT);
}

// ============ Valocracy ============

pub fn get_valocracy(env: &Env) -> Option<Address> {
    env.storage().instance().get(&DataKey::Valocracy)
}

pub fn set_valocracy(env: &Env, valocracy: &Address) {
    env.storage().instance().set(&DataKey::Valocracy, valocracy);
}

// ============ Governor ============

pub fn get_governor(env: &Env) -> Option<Address> {
    env.storage().instance().get(&DataKey::Governor)
}

pub fn set_governor(env: &Env, governor: &Address) {
    env.storage().instance().set(&DataKey::Governor, governor);
}

// ============ Asset Token ============

pub fn get_asset_token(env: &Env) -> Option<Address> {
    env.storage().instance().get(&DataKey::AssetToken)
}

pub fn set_asset_token(env: &Env, token: &Address) {
    env.storage().instance().set(&DataKey::AssetToken, token);
}

// ============ Total Shares ============

pub fn get_total_shares(env: &Env) -> i128 {
    env.storage()
        .instance()
        .get(&DataKey::TotalShares)
        .unwrap_or(0)
}

pub fn set_total_shares(env: &Env, shares: i128) {
    env.storage().instance().set(&DataKey::TotalShares, &shares);
}

// ============ User Shares ============

pub fn get_user_shares(env: &Env, account: &Address) -> i128 {
    let key = DataKey::UserShares(account.clone());
    env.storage()
        .persistent()
        .get(&key)
        .unwrap_or(0)
}

    env.storage().persistent().set(&key, &shares);
    extend_persistent_ttl(env, &key);
}

// ============ Reentrancy Lock ============

pub fn is_locked(env: &Env) -> bool {
    env.storage().instance().has(&DataKey::ReentrancyLock)
}

pub fn acquire_lock(env: &Env) {
    env.storage().instance().set(&DataKey::ReentrancyLock, &true);
}

pub fn release_lock(env: &Env) {
    env.storage().instance().remove(&DataKey::ReentrancyLock);
}
