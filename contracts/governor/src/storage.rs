//! Storage helpers for the Governor contract

use soroban_sdk::{contracttype, Address, Env};

use crate::proposal::Proposal;
use crate::types::GovernanceConfig;

/// Storage keys for the Governor contract
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Valocracy,
    ProposalCount,
    Proposal(u64),
    Vote(u64, Address),
    ReentrancyLock,
    Config,
}

// TTL constants
const DAY_IN_LEDGERS: u32 = 17280;
const INSTANCE_BUMP_AMOUNT: u32 = 7 * DAY_IN_LEDGERS;
const INSTANCE_LIFETIME_THRESHOLD: u32 = DAY_IN_LEDGERS;

const PERSISTENT_BUMP_AMOUNT: u32 = 90 * DAY_IN_LEDGERS;
const PERSISTENT_LIFETIME_THRESHOLD: u32 = 30 * DAY_IN_LEDGERS;

/// Extend instance TTL
pub fn extend_instance_ttl(env: &Env) {
    env.storage()
        .instance()
        .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
}

fn extend_persistent_ttl(env: &Env, key: &DataKey) {
    env.storage().persistent().extend_ttl(
        key,
        PERSISTENT_LIFETIME_THRESHOLD,
        PERSISTENT_BUMP_AMOUNT,
    );
}

pub fn get_valocracy(env: &Env) -> Option<Address> {
    env.storage().instance().get(&DataKey::Valocracy)
}

pub fn set_valocracy(env: &Env, valocracy: &Address) {
    env.storage().instance().set(&DataKey::Valocracy, valocracy);
}

pub fn get_proposal_count(env: &Env) -> u64 {
    env.storage()
        .instance()
        .get(&DataKey::ProposalCount)
        .unwrap_or(0)
}

pub fn set_proposal_count(env: &Env, count: u64) {
    env.storage()
        .instance()
        .set(&DataKey::ProposalCount, &count);
}

pub fn get_proposal(env: &Env, proposal_id: u64) -> Option<Proposal> {
    let key = DataKey::Proposal(proposal_id);
    let result = env.storage().persistent().get(&key);
    if result.is_some() {
        extend_persistent_ttl(env, &key);
    }
    result
}

pub fn set_proposal(env: &Env, proposal_id: u64, proposal: &Proposal) {
    let key = DataKey::Proposal(proposal_id);
    env.storage().persistent().set(&key, proposal);
    extend_persistent_ttl(env, &key);
}

#[allow(dead_code)]
pub fn get_vote(env: &Env, proposal_id: u64, voter: &Address) -> Option<bool> {
    let key = DataKey::Vote(proposal_id, voter.clone());
    env.storage().persistent().get(&key)
}

pub fn set_vote(env: &Env, proposal_id: u64, voter: &Address, support: bool) {
    let key = DataKey::Vote(proposal_id, voter.clone());
    env.storage().persistent().set(&key, &support);
    extend_persistent_ttl(env, &key);
}

pub fn has_voted(env: &Env, proposal_id: u64, voter: &Address) -> bool {
    let key = DataKey::Vote(proposal_id, voter.clone());
    env.storage().persistent().has(&key)
}

pub fn is_locked(env: &Env) -> bool {
    env.storage().instance().has(&DataKey::ReentrancyLock)
}

pub fn acquire_lock(env: &Env) {
    env.storage()
        .instance()
        .set(&DataKey::ReentrancyLock, &true);
}

pub fn release_lock(env: &Env) {
    env.storage().instance().remove(&DataKey::ReentrancyLock);
}

pub fn get_config(env: &Env) -> Option<GovernanceConfig> {
    env.storage().instance().get(&DataKey::Config)
}

pub fn set_config(env: &Env, config: &GovernanceConfig) {
    env.storage().instance().set(&DataKey::Config, config);
}
