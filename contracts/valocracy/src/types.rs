//! Data types for the Valocracy contract

use soroban_sdk::{contracttype, String};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UserStats {
    pub level: u64,
    pub permanent_level: u64,
    pub expiry: u64,
    pub verified: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Valor {
    pub rarity: u64,
    pub metadata: String,
}
