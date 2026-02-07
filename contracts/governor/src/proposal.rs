//! Proposal types and state management

use soroban_sdk::{contracttype, Address, String, Symbol, Val, Vec};

/// Proposal state enum
#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum ProposalState {
    /// Waiting for voting to start
    Pending = 0,
    /// Voting is active
    Active = 1,
    /// Proposal succeeded (quorum met)
    Succeeded = 2,
    /// Proposal defeated (quorum not met)
    Defeated = 3,
    /// Proposal has been executed
    Executed = 4,
}

/// An action to execute when proposal succeeds
#[contracttype]
#[derive(Clone, Debug)]
pub struct Action {
    /// Contract to call
    pub contract_id: Address,
    /// Function name to invoke
    pub function: Symbol,
    /// Arguments as raw vals (simplified)
    pub args: Vec<Val>,
}

/// A governance proposal
#[contracttype]
#[derive(Clone, Debug)]
pub struct Proposal {
    /// Unique proposal ID
    pub id: u64,
    /// Address that created the proposal
    pub proposer: Address,
    /// Description of the proposal
    pub description: String,
    /// Timestamp when voting starts
    pub start_time: u64,
    /// Timestamp when voting ends
    pub end_time: u64,
    /// Total votes in favor
    pub for_votes: u64,
    /// Total votes against
    pub against_votes: u64,
    /// Whether the proposal has been executed
    pub executed: bool,
    /// Actions to execute on success
    pub actions: Vec<Action>,
}
