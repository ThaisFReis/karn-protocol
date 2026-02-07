use soroban_sdk::{contracttype, Env};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct GovernanceConfig {
    /// Voting delay in seconds (time between proposal creation and voting start)
    pub voting_delay: u64,
    /// Voting period in seconds (duration of voting)
    pub voting_period: u64,
    /// Minimum Mana required to create a proposal
    pub proposal_threshold: u64,
    /// Percentage of votes required for a proposal to pass (e.g. 51)
    pub quorum_percentage: u64,
}

impl GovernanceConfig {
    pub fn default(_env: &Env) -> Self {
        Self {
            voting_delay: 86400, // 1 day
            voting_period: 604800, // 7 days
            proposal_threshold: 100, // 100 Mana
            quorum_percentage: 51, // 51%
        }
    }
}
