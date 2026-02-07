/**
 * Terminology Configuration System
 *
 * Enables protocol adaptation for different use cases without modifying smart contracts.
 * Each deployment can use custom terminology by selecting a preset or defining custom config.
 *


 */
export interface TerminologyTerm {
  /** Singular form (e.g., "Badge", "Membership Tier") */
  singular: string;
  /** Plural form (e.g., "Badges", "Membership Tiers") */
  plural: string;
  /** Optional short form (e.g., "XP" for "Experience Points") */
  short?: string;
  /** Optional description for tooltips/help text */
  description?: string;
}

export interface TerminologyConfig {
  /** Protocol/project name */
  protocolName: string;

  /** Tagline/description */
  tagline: string;

  // Core concepts
  badge: TerminologyTerm;
  mana: TerminologyTerm;
  lab: TerminologyTerm;
  scholarship: TerminologyTerm;
  funder: TerminologyTerm;

  // Governance
  proposal: TerminologyTerm;
  vote: TerminologyTerm;
  governance: TerminologyTerm;

  // Actions (verbs)
  actions: {
    propose: string;      // "Propose", "Submit Motion", "Create Proposal"
    vote: string;         // "Vote", "Cast Vote"
    mint: string;         // "Mint Badge", "Award Credential"
    fund: string;         // "Fund Lab", "Create Grant Program"
    claim: string;        // "Claim Scholarship", "Claim Bounty"
    register: string;     // "Register", "Join"
  };

  // UI labels
  ui: {
    dashboard: string;
    myBadges: string;
    myMana: string;
    availableLabs: string;
    activeProposals: string;
  };
}

// ============ Preset Configurations ============

// Karn's Original Terminology (Education/Scholarship Focus)
export const KARN_TERMINOLOGY: TerminologyConfig = {
  protocolName: "Karn Valocracy",
  tagline: "Empowering women through contribution-driven governance",

  badge: {
    singular: "Badge",
    plural: "Badges",
    short: "Badge",
    description: "Soulbound credentials that grant voting power based on contributions"
  },

  mana: {
    singular: "Mana",
    plural: "Mana",
    short: "Mana",
    description: "Voting power that decays over 180 days of inactivity"
  },

  lab: {
    singular: "Lab",
    plural: "Labs",
    short: "Lab",
    description: "Educational programs funded by sponsors with scholarships for members"
  },

  scholarship: {
    singular: "Scholarship",
    plural: "Scholarships",
    short: "Scholarship",
    description: "Financial support for approved members to participate in Labs"
  },

  funder: {
    singular: "Funder",
    plural: "Funders",
    short: "Funder",
    description: "Individual or organization funding educational Labs"
  },

  proposal: {
    singular: "Proposal",
    plural: "Proposals",
    short: "Proposal",
    description: "Governance decision submitted for community vote"
  },

  vote: {
    singular: "Vote",
    plural: "Votes",
    short: "Vote",
    description: "Expression of preference on a proposal, weighted by Mana"
  },

  governance: {
    singular: "Governance",
    plural: "Governance",
    short: "Gov",
    description: "Collective decision-making process"
  },

  actions: {
    propose: "Propose",
    vote: "Vote",
    mint: "Mint Badge",
    fund: "Fund Lab",
    claim: "Claim Scholarship",
    register: "Register"
  },

  ui: {
    dashboard: "Dashboard",
    myBadges: "My Badges",
    myMana: "My Mana",
    availableLabs: "Available Labs",
    activeProposals: "Active Proposals"
  }
};

// Worker Cooperative Terminology
export const COOP_TERMINOLOGY: TerminologyConfig = {
  protocolName: "Co-op Protocol",
  tagline: "Democratic worker ownership through contribution",

  badge: {
    singular: "Membership Tier",
    plural: "Membership Tiers",
    short: "Tier",
    description: "Worker classification based on contribution and expertise"
  },

  mana: {
    singular: "Voting Share",
    plural: "Voting Shares",
    short: "Shares",
    description: "Democratic voting power that reflects recent contribution"
  },

  lab: {
    singular: "Onboarding Fund",
    plural: "Onboarding Funds",
    short: "Fund",
    description: "Capital pool for training and integrating new workers"
  },

  scholarship: {
    singular: "Stipend",
    plural: "Stipends",
    short: "Stipend",
    description: "Payment during onboarding or training period"
  },

  funder: {
    singular: "Investor",
    plural: "Investors",
    short: "Investor",
    description: "External capital contributor to the cooperative"
  },

  proposal: {
    singular: "Motion",
    plural: "Motions",
    short: "Motion",
    description: "Formal proposal for worker council consideration"
  },

  vote: {
    singular: "Vote",
    plural: "Votes",
    short: "Vote",
    description: "Democratic expression of worker preference"
  },

  governance: {
    singular: "Worker Council",
    plural: "Worker Councils",
    short: "Council",
    description: "Democratic governance by worker-owners"
  },

  actions: {
    propose: "Submit Motion",
    vote: "Cast Vote",
    mint: "Award Tier",
    fund: "Create Fund",
    claim: "Claim Stipend",
    register: "Join Co-op"
  },

  ui: {
    dashboard: "Worker Dashboard",
    myBadges: "My Membership",
    myMana: "My Voting Power",
    availableLabs: "Training Programs",
    activeProposals: "Active Motions"
  }
};

// Open Source DAO Terminology
export const DAO_TERMINOLOGY: TerminologyConfig = {
  protocolName: "Contributor DAO",
  tagline: "Rewarding open source contributions with governance power",

  badge: {
    singular: "Contributor Badge",
    plural: "Contributor Badges",
    short: "Badge",
    description: "Recognition for code contributions, reviews, and community work"
  },

  mana: {
    singular: "Governance Power",
    plural: "Governance Power",
    short: "Power",
    description: "Voting weight based on recent contributions to the project"
  },

  lab: {
    singular: "Grant Program",
    plural: "Grant Programs",
    short: "Grant",
    description: "Funding pool for specific features, bugs, or initiatives"
  },

  scholarship: {
    singular: "Bounty",
    plural: "Bounties",
    short: "Bounty",
    description: "Payment for completing approved development work"
  },

  funder: {
    singular: "Sponsor",
    plural: "Sponsors",
    short: "Sponsor",
    description: "Company or individual funding DAO development"
  },

  proposal: {
    singular: "Proposal",
    plural: "Proposals",
    short: "Prop",
    description: "Protocol improvement or funding request"
  },

  vote: {
    singular: "Vote",
    plural: "Votes",
    short: "Vote",
    description: "Weighted vote on DAO proposals"
  },

  governance: {
    singular: "Governance",
    plural: "Governance",
    short: "Gov",
    description: "Token-weighted decision making"
  },

  actions: {
    propose: "Create Proposal",
    vote: "Vote",
    mint: "Award Badge",
    fund: "Create Grant",
    claim: "Claim Bounty",
    register: "Join DAO"
  },

  ui: {
    dashboard: "Dashboard",
    myBadges: "My Contributions",
    myMana: "My Power",
    availableLabs: "Active Grants",
    activeProposals: "Proposals"
  }
};

// Community/Gaming Terminology
export const COMMUNITY_TERMINOLOGY: TerminologyConfig = {
  protocolName: "Community XP",
  tagline: "Earn influence through participation",

  badge: {
    singular: "Achievement NFT",
    plural: "Achievement NFTs",
    short: "Achievement",
    description: "Collectible NFT earned through community participation"
  },

  mana: {
    singular: "XP",
    plural: "XP",
    short: "XP",
    description: "Experience points that decay if you go inactive"
  },

  lab: {
    singular: "Community Grant",
    plural: "Community Grants",
    short: "Grant",
    description: "Funding for community initiatives and events"
  },

  scholarship: {
    singular: "Reward",
    plural: "Rewards",
    short: "Reward",
    description: "Payment for community work (moderating, creating content, etc.)"
  },

  funder: {
    singular: "Donor",
    plural: "Donors",
    short: "Donor",
    description: "Supporter funding community activities"
  },

  proposal: {
    singular: "Community Proposal",
    plural: "Community Proposals",
    short: "Idea",
    description: "Suggestion for community improvements or events"
  },

  vote: {
    singular: "Vote",
    plural: "Votes",
    short: "Vote",
    description: "Community vote weighted by XP"
  },

  governance: {
    singular: "Community Governance",
    plural: "Community Governance",
    short: "Gov",
    description: "Community-driven decision making"
  },

  actions: {
    propose: "Submit Idea",
    vote: "Vote",
    mint: "Earn Achievement",
    fund: "Create Grant",
    claim: "Claim Reward",
    register: "Join Community"
  },

  ui: {
    dashboard: "Profile",
    myBadges: "My Achievements",
    myMana: "My XP",
    availableLabs: "Community Grants",
    activeProposals: "Active Votes"
  }
};

// Gig Economy Platform Terminology
export const GIG_TERMINOLOGY: TerminologyConfig = {
  protocolName: "Freelancer Collective",
  tagline: "Reputation-based gig marketplace",

  badge: {
    singular: "Skill Certificate",
    plural: "Skill Certificates",
    short: "Cert",
    description: "Verified competency in specific skills"
  },

  mana: {
    singular: "Reputation Score",
    plural: "Reputation Score",
    short: "Rep",
    description: "Trust metric based on recent work quality"
  },

  lab: {
    singular: "Project Escrow",
    plural: "Project Escrows",
    short: "Escrow",
    description: "Client payment held until project completion"
  },

  scholarship: {
    singular: "Milestone Payment",
    plural: "Milestone Payments",
    short: "Payment",
    description: "Release of escrowed funds for completed deliverables"
  },

  funder: {
    singular: "Client",
    plural: "Clients",
    short: "Client",
    description: "Person or company paying for freelance work"
  },

  proposal: {
    singular: "Platform Proposal",
    plural: "Platform Proposals",
    short: "Proposal",
    description: "Suggested changes to platform policies"
  },

  vote: {
    singular: "Vote",
    plural: "Votes",
    short: "Vote",
    description: "Freelancer vote on platform governance"
  },

  governance: {
    singular: "Platform Governance",
    plural: "Platform Governance",
    short: "Gov",
    description: "Collective freelancer decision-making"
  },

  actions: {
    propose: "Propose Change",
    vote: "Vote",
    mint: "Award Certificate",
    fund: "Create Escrow",
    claim: "Release Payment",
    register: "Join Platform"
  },

  ui: {
    dashboard: "Freelancer Dashboard",
    myBadges: "My Certifications",
    myMana: "My Reputation",
    availableLabs: "Active Projects",
    activeProposals: "Platform Votes"
  }
};

// ============ Helper Functions ============

// Get terminology config from preset name or environment variable
export function getTerminologyConfig(preset?: string): TerminologyConfig {
  const presetName = preset || process.env.NEXT_PUBLIC_TERMINOLOGY_PRESET || 'karn';

  switch (presetName.toLowerCase()) {
    case 'karn':
    case 'education':
      return KARN_TERMINOLOGY;
    case 'coop':
    case 'cooperative':
      return COOP_TERMINOLOGY;
    case 'dao':
      return DAO_TERMINOLOGY;
    case 'community':
    case 'gaming':
      return COMMUNITY_TERMINOLOGY;
    case 'gig':
    case 'freelance':
      return GIG_TERMINOLOGY;
    default:
      console.warn(`Unknown terminology preset: ${presetName}, defaulting to Karn`);
      return KARN_TERMINOLOGY;
  }
}

// Available preset names
export const TERMINOLOGY_PRESETS = [
  { value: 'karn', label: 'Karn (Education)', config: KARN_TERMINOLOGY },
  { value: 'coop', label: 'Worker Co-op', config: COOP_TERMINOLOGY },
  { value: 'dao', label: 'Open Source DAO', config: DAO_TERMINOLOGY },
  { value: 'community', label: 'Gaming Community', config: COMMUNITY_TERMINOLOGY },
  { value: 'gig', label: 'Gig Economy', config: GIG_TERMINOLOGY }
] as const;
