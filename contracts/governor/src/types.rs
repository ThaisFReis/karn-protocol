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
    /// Percentage of FOR votes required vs total votes cast (e.g. 51 = 51%)
    /// This is the APPROVAL threshold, not participation
    pub quorum_percentage: u64,
    /// Minimum percentage of total Mana that must vote (e.g. 4 = 4%)
    /// KRN-03: Prevents single-vote proposal hijacking
    pub participation_threshold: u64,
}

impl GovernanceConfig {
    pub fn default(_env: &Env) -> Self {
        Self {
            voting_delay: 86400, // 1 day
            voting_period: 604800, // 7 days
            proposal_threshold: 100, // 100 Mana
            quorum_percentage: 51, // 51% approval required
            participation_threshold: 4, // 4% participation required (KRN-03)
        }
    }
}
