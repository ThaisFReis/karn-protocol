//! Data types for the Valocracy contract

use soroban_sdk::{contracttype, String};

/// User statistics including level and expiration
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UserStats {
    /// The accumulated governance level
    pub level: u64,
    /// The permanent portion of level that never decays (e.g., Founder badge)
    pub permanent_level: u64,
    /// The expiration timestamp (Unix seconds)
    pub expiry: u64,
}

/// Valor type definition with rarity and metadata
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Valor {
    /// The rarity multiplier for this valor type
    pub rarity: u64,
    /// Metadata string (e.g., description, URI)
    pub metadata: String,
}
