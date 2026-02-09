use soroban_sdk::{contracttype, Env};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct GovernanceConfig {
    pub voting_delay: u64,
    pub voting_period: u64,
    pub proposal_threshold: u64,
    pub quorum_percentage: u64,
    /// KRN-03: Prevents single-vote proposal hijacking
    pub participation_threshold: u64,
}

impl GovernanceConfig {
    pub fn default(_env: &Env) -> Self {
        Self {
            voting_delay: 86400,        // 1 day
            voting_period: 604800,      // 7 days
            proposal_threshold: 100,    // 100 Mana
            quorum_percentage: 51,      // 51% approval required
            participation_threshold: 4, // 4% participation required (KRN-03)
        }
    }
}
