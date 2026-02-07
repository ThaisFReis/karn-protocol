//! Governor - On-chain Governance Contract for Valocracy
//!
//! Manages proposals and voting using Mana-weighted votes from the Valocracy contract.
//! No admin: any member (level > 0) can create proposals.

#![no_std]

mod proposal;
mod storage;
mod voting;

use soroban_sdk::{contract, contractimpl, contracterror, Address, Env, String, Symbol, Vec, IntoVal};

use proposal::{Proposal, ProposalState, Action};
use storage::{
    get_valocracy, get_proposal, get_proposal_count,
    set_valocracy, set_proposal, set_proposal_count, set_vote,
    has_voted, extend_instance_ttl,
    is_locked, acquire_lock, release_lock,
};

/// Voting delay: 1 second (short for live demos)
pub const VOTING_DELAY: u64 = 1;

/// Voting period: 30 seconds (short for live demos)
pub const VOTING_PERIOD: u64 = 300;

/// Quorum: 51% of votes required
pub const QUORUM_PERCENTAGE: u64 = 51;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum GovernorError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    NotAuthorized = 3,
    ProposalNotFound = 4,
    VotingNotStarted = 5,
    VotingEnded = 6,
    AlreadyVoted = 7,
    NoVotingPower = 8,
    ProposalNotSucceeded = 9,
    ProposalAlreadyExecuted = 10,
    InvalidProposalState = 11,
    NotAMember = 12,
    ReentrancyDetected = 13,
}

#[contract]
pub struct GovernorContract;

#[contractimpl]
impl GovernorContract {
    // ============ Initialization ============

    /// Initialize the Governor contract.
    ///
    /// No admin: only stores the Valocracy contract address for membership checks
    /// and voting power queries.
    pub fn initialize(
        env: Env,
        valocracy: Address,
    ) -> Result<(), GovernorError> {
        if get_valocracy(&env).is_some() {
            return Err(GovernorError::AlreadyInitialized);
        }

        set_valocracy(&env, &valocracy);
        set_proposal_count(&env, 0);

        extend_instance_ttl(&env);
        Ok(())
    }

    // ============ Proposal Functions ============

    /// Create a new proposal.
    ///
    /// Open to any member (level > 0 in the Valocracy contract).
    pub fn propose(
        env: Env,
        proposer: Address,
        description: String,
        actions: Vec<Action>,
    ) -> Result<u64, GovernorError> {
        proposer.require_auth();

        // Check lock
        if is_locked(&env) {
            return Err(GovernorError::ReentrancyDetected);
        }

        // Acquire lock
        acquire_lock(&env);

        // Verify proposer is a member via cross-contract call to Valocracy
        let valocracy = get_valocracy(&env).ok_or(GovernorError::NotInitialized)?;
        
        // We use a functional approach or specific block to ensure we can release lock even if it fails? 
        // Soroban panics on failure usually, rolling back everything including the lock, so we don't need "try-finally" for panics.
        // We just need to handle Errors.
        
        let level: u64 = env.invoke_contract(
            &valocracy,
            &Symbol::new(&env, "level_of"),
            (proposer.clone(),).into_val(&env),
        );

        if level == 0 {
            release_lock(&env);
            return Err(GovernorError::NotAMember);
        }

        let current_time = env.ledger().timestamp();
        let proposal_count = get_proposal_count(&env);
        let proposal_id = proposal_count + 1;

        let proposal = Proposal {
            id: proposal_id,
            proposer: proposer.clone(),
            description,
            start_time: current_time + VOTING_DELAY,
            end_time: current_time + VOTING_DELAY + VOTING_PERIOD,
            for_votes: 0,
            against_votes: 0,
            executed: false,
            actions,
        };

        set_proposal(&env, proposal_id, &proposal);
        set_proposal_count(&env, proposal_id);

        extend_instance_ttl(&env);

        env.events().publish(
            (Symbol::new(&env, "proposal_created"), proposal_id),
            proposer,
        );

        release_lock(&env);
        Ok(proposal_id)
    }

    /// Cast a vote on a proposal
    pub fn cast_vote(
        env: Env,
        voter: Address,
        proposal_id: u64,
        support: bool,
    ) -> Result<u64, GovernorError> {
        voter.require_auth();

        let mut proposal = get_proposal(&env, proposal_id)
            .ok_or(GovernorError::ProposalNotFound)?;

        let current_time = env.ledger().timestamp();

        // Check voting window
        if current_time < proposal.start_time {
            return Err(GovernorError::VotingNotStarted);
        }
        if current_time > proposal.end_time {
            return Err(GovernorError::VotingEnded);
        }

        // Check if already voted
        if has_voted(&env, proposal_id, &voter) {
            return Err(GovernorError::AlreadyVoted);
        }

        // Check lock
        if is_locked(&env) {
            return Err(GovernorError::ReentrancyDetected);
        }
        acquire_lock(&env);

        // Get real voting power from Valocracy contract via cross-contract call
        let valocracy_addr = get_valocracy(&env).ok_or(GovernorError::NotInitialized)?;
        let voting_power = Self::get_voting_power(&env, &valocracy_addr, &voter);

        if voting_power == 0 {
            release_lock(&env);
            return Err(GovernorError::NoVotingPower);
        }

        // Record vote
        if support {
            proposal.for_votes += voting_power;
        } else {
            proposal.against_votes += voting_power;
        }

        set_proposal(&env, proposal_id, &proposal);
        set_vote(&env, proposal_id, &voter, support);

        env.events().publish(
            (Symbol::new(&env, "vote_cast"), proposal_id, voter),
            (support, voting_power),
        );

        release_lock(&env);
        Ok(voting_power)
    }

    /// Execute a succeeded proposal
    pub fn execute(env: Env, proposal_id: u64) -> Result<(), GovernorError> {
        let mut proposal = get_proposal(&env, proposal_id)
            .ok_or(GovernorError::ProposalNotFound)?;

        if proposal.executed {
            return Err(GovernorError::ProposalAlreadyExecuted);
        }

        let state = Self::get_proposal_state(env.clone(), proposal_id)?;
        if state != ProposalState::Succeeded {
            return Err(GovernorError::ProposalNotSucceeded);
        }

        // Check lock
        if is_locked(&env) {
            return Err(GovernorError::ReentrancyDetected);
        }
        acquire_lock(&env);

        // Mark as executed
        proposal.executed = true;
        set_proposal(&env, proposal_id, &proposal);

        // Execute each action via cross-contract invocation
        for action in proposal.actions.iter() {
            env.invoke_contract::<soroban_sdk::Val>(
                &action.contract_id,
                &action.function,
                action.args.clone(),
            );
        }

        env.events().publish(
            (Symbol::new(&env, "proposal_executed"), proposal_id),
            (),
        );

        release_lock(&env);
        Ok(())
    }

    // ============ View Functions ============

    /// Get a proposal by ID
    pub fn get_proposal(env: Env, proposal_id: u64) -> Option<Proposal> {
        get_proposal(&env, proposal_id)
    }

    /// Get the current state of a proposal
    pub fn get_proposal_state(env: Env, proposal_id: u64) -> Result<ProposalState, GovernorError> {
        let proposal = get_proposal(&env, proposal_id)
            .ok_or(GovernorError::ProposalNotFound)?;

        let current_time = env.ledger().timestamp();

        if proposal.executed {
            return Ok(ProposalState::Executed);
        }

        if current_time < proposal.start_time {
            return Ok(ProposalState::Pending);
        }

        if current_time <= proposal.end_time {
            return Ok(ProposalState::Active);
        }

        // Voting ended - check result
        let total_votes = proposal.for_votes + proposal.against_votes;
        if total_votes == 0 {
            return Ok(ProposalState::Defeated);
        }

        let for_percentage = (proposal.for_votes * 100) / total_votes;
        if for_percentage >= QUORUM_PERCENTAGE {
            Ok(ProposalState::Succeeded)
        } else {
            Ok(ProposalState::Defeated)
        }
    }

    /// Get the number of proposals
    pub fn proposal_count(env: Env) -> u64 {
        get_proposal_count(&env)
    }

    /// Check if an account has voted on a proposal
    pub fn has_voted(env: Env, proposal_id: u64, voter: Address) -> bool {
        has_voted(&env, proposal_id, &voter)
    }

    /// Get valocracy contract address
    pub fn valocracy(env: Env) -> Option<Address> {
        get_valocracy(&env)
    }

    // ============ Internal Functions ============

    /// Get voting power from Valocracy contract (cross-contract call)
    fn get_voting_power(env: &Env, valocracy_addr: &Address, voter: &Address) -> u64 {
        env.invoke_contract::<u64>(
            valocracy_addr,
            &Symbol::new(env, "get_votes"),
            (voter.clone(),).into_val(env),
        )
    }
}
