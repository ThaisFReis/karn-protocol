//! Proposal types and state management

use soroban_sdk::{contracttype, Address, String, Symbol, Val, Vec};

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum ProposalState {
    Pending = 0,
    Active = 1,
    Succeeded = 2,
    Defeated = 3,
    Executed = 4,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct Action {
    pub contract_id: Address,
    pub function: Symbol,
    pub args: Vec<Val>,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct Proposal {
    pub id: u64,
    pub proposer: Address,
    pub description: String,
    /// KRN-03: Snapshot voting power at creation time
    pub creation_time: u64,
    pub start_time: u64,
    pub end_time: u64,
    pub for_votes: u64,
    pub against_votes: u64,
    pub executed: bool,
    pub actions: Vec<Action>,
    /// KRN-03: Used for participation percentage
    pub total_mana_at_creation: u64,
}
