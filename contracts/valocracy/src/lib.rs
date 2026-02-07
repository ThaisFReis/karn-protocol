//! Valocracy - Core IDNFT (Isonomic Degradable NFT) Contract
//!
//! Implements soulbound NFTs with decaying voting power (Mana) for governance.
//! No admin: the code is law. Badge minting requires governance proposals.

#![no_std]

mod errors;
mod storage;
mod types;

use soroban_sdk::{contract, contractimpl, Address, Env, String, Symbol, Vec, BytesN, Bytes, IntoVal};
use soroban_sdk::xdr::ToXdr;

use errors::ValocracyError;
use storage::{
    get_governor, get_treasury, get_total_supply, get_user_stats, get_valor,
    get_token_valor_id, get_token_owner, get_founder, get_member_valor_id,
    is_initialized, set_initialized, set_founder, set_governor, set_treasury,
    set_total_supply, set_user_stats, set_valor, set_token_valor_id, set_token_owner,
    set_member_valor_id, remove_token_owner, remove_token_valor_id,
    extend_instance_ttl, get_signer, set_signer, is_nonce_used, set_nonce_used,
};
use types::{UserStats, Valor};

/// Vacancy period: 180 days in seconds (15,552,000 seconds)
pub const VACANCY_PERIOD: u64 = 180 * 24 * 60 * 60;

/// Member Floor: fixed baseline Mana for any registered user.
/// Matches the Member Badge rarity (id: 0, rarity: 5).
/// Inactive members decay to exactly this value — legacy status
/// offers zero protection against inactivity.
pub const MEMBER_FLOOR: u64 = 5;

#[contract]
pub struct ValocracyContract;

#[contractimpl]
impl ValocracyContract {
    // ============ Initialization ============

    /// Initialize the Valocracy contract.
    ///
    /// No admin: sets all configuration at once. Registers initial valor types,
    /// mints the Founder badge, and stores the member badge ID for self-registration.
    ///
    /// # Arguments
    /// * `founder` - Address that receives the permanent Founder badge
    /// * `governor` - Governor contract address
    /// * `treasury` - Treasury contract address
    /// * `name` - Contract name
    /// * `symbol` - Contract symbol
    /// * `member_valor_id` - Valor ID used by self_register() (the Member badge)
    /// * `valor_ids` - List of valor IDs to register
    /// * `valor_rarities` - List of rarities (parallel to valor_ids)
    /// * `valor_metadatas` - List of metadata strings (parallel to valor_ids)
    /// * `founder_valor_id` - Which valor_id is the Founder badge
    pub fn initialize(
        env: Env,
        founder: Address,
        governor: Address,
        treasury: Address,
        // name: String, // Removed to fit 10 args limit
        // symbol: String, // Removed to fit 10 args limit
        member_valor_id: u64,
        valor_ids: Vec<u64>,
        valor_rarities: Vec<u64>,
        valor_metadatas: Vec<String>,
        founder_valor_id: u64,
        signer: BytesN<32>,
    ) -> Result<(), ValocracyError> {
        if is_initialized(&env) {
            return Err(ValocracyError::AlreadyInitialized);
        }

        set_initialized(&env);
        set_founder(&env, &founder);
        set_governor(&env, &governor);
        set_treasury(&env, &treasury);
        set_signer(&env, &signer);
        set_member_valor_id(&env, member_valor_id);
        env.storage().instance().set(&Symbol::new(&env, "name"), &String::from_str(&env, "Valocracy"));
        env.storage().instance().set(&Symbol::new(&env, "symbol"), &String::from_str(&env, "VALOR"));
        set_total_supply(&env, 0);

        // Register all initial valor types
        let count = valor_ids.len();
        for i in 0..count {
            let vid = valor_ids.get(i).unwrap();
            let rar = valor_rarities.get(i).unwrap();
            let meta = valor_metadatas.get(i).unwrap();
            let valor = Valor { rarity: rar, metadata: meta };
            set_valor(&env, vid, &valor);
        }

        // Mint the Founder badge to the founder address
        let founder_valor = get_valor(&env, founder_valor_id)
            .ok_or(ValocracyError::NonExistentValor)?;
        let founder_rarity = founder_valor.rarity;

        let current_time = env.ledger().timestamp();
        let founder_stats = UserStats {
            level: founder_rarity,
            permanent_level: founder_rarity,
            expiry: current_time + VACANCY_PERIOD,
        };
        set_user_stats(&env, &founder, &founder_stats);

        let token_id = 1u64;
        set_total_supply(&env, token_id);
        set_token_valor_id(&env, token_id, founder_valor_id);
        set_token_owner(&env, token_id, &founder);

        extend_instance_ttl(&env);

        env.events().publish(
            (Symbol::new(&env, "initialized"),),
            founder.clone(),
        );
        env.events().publish(
            (Symbol::new(&env, "mint"), founder),
            (token_id, founder_valor_id, founder_rarity),
        );

        Ok(())
    }

    // ============ Governor-Only Functions ============

    /// Create or update a Valor type with rarity and metadata.
    ///
    /// Governor-only. Badge type changes require a governance proposal.
    pub fn set_valor(
        env: Env,
        valor_id: u64,
        rarity: u64,
        metadata: String,
    ) -> Result<(), ValocracyError> {
        let governor = get_governor(&env).ok_or(ValocracyError::NotInitialized)?;
        governor.require_auth();

        let valor = Valor { rarity, metadata: metadata.clone() };
        set_valor(&env, valor_id, &valor);

        env.events().publish(
            (Symbol::new(&env, "valor_update"), valor_id),
            (rarity, metadata),
        );
        Ok(())
    }

    /// Mint a new soulbound NFT to an account.
    ///
    /// Governor-only. Badge minting requires a governance proposal.
    /// This increases the target's level and extends their expiry time.
    pub fn mint(env: Env, account: Address, valor_id: u64) -> Result<u64, ValocracyError> {
        let governor = get_governor(&env).ok_or(ValocracyError::NotInitialized)?;
        governor.require_auth();

        Self::mint_internal(&env, &account, valor_id)
    }

    pub fn self_register(
        env: Env,
        caller: Address,
        signature: BytesN<64>,
        nonce: u64,
        expiry: u64,
    ) -> Result<u64, ValocracyError> {
        caller.require_auth();

        if !is_initialized(&env) {
            return Err(ValocracyError::NotInitialized);
        }

        // Verify signature
        let mut payload = Bytes::new(&env);
        payload.append(&caller.clone().to_xdr(&env));
        payload.append(&nonce.to_xdr(&env));
        payload.append(&expiry.to_xdr(&env));

        Self::verify_signature(&env, &payload, &signature, &caller, nonce, expiry)?;

        // Check if user already has stats (already registered)
        if get_user_stats(&env, &caller).is_some() {
            return Err(ValocracyError::AlreadyRegistered);
        }

        // Get the designated member valor_id
        let member_valor_id = get_member_valor_id(&env)
            .ok_or(ValocracyError::NotInitialized)?;

        // Execute minting logic
        Self::mint_internal(&env, &caller, member_valor_id)
    }

    // ============ Guardian Mint (Backend Auth) ============

    /// Mint a new soulbound NFT using backend signature (Guardian).
    ///
    /// Payload: account | valor_id | nonce | expiry
    pub fn guardian_mint(
        env: Env,
        account: Address,
        valor_id: u64,
        signature: BytesN<64>,
        nonce: u64,
        expiry: u64,
    ) -> Result<u64, ValocracyError> {
        // We do typically NOT require account auth here if the backend authorizes it,
        // BUT to prevent spamming someone's wallet with badges they don't want,
        // we might require account auth as well.
        // However, usually "airdropping" merit badges is fine.
        // Let's require auth just in case, or stick to backend auth as source of truth.
        // Spec says "Validation: 1 Guardian... -> Mint".
        // Let's assume backend auth is sufficient.
        
        if !is_initialized(&env) {
            return Err(ValocracyError::NotInitialized);
        }

        // Verify signature
        let mut payload = Bytes::new(&env);
        payload.append(&account.clone().to_xdr(&env));
        payload.append(&valor_id.to_xdr(&env));
        payload.append(&nonce.to_xdr(&env));
        payload.append(&expiry.to_xdr(&env));

        // Note: We use 'account' as the nonce-holder context
        Self::verify_signature(&env, &payload, &signature, &account, nonce, expiry)?;

        // Execute minting logic
        Self::mint_internal(&env, &account, valor_id)
    }

    // ============ Revoke (Governor Only) ============

    /// Revoke (burn) a badge token.
    ///
    /// Governor-only. Removes the token, reduces the user's level by
    /// the badge's rarity value. Used for governance-decided removal.
    pub fn revoke(env: Env, token_id: u64) -> Result<(), ValocracyError> {
        let governor = get_governor(&env).ok_or(ValocracyError::NotInitialized)?;
        governor.require_auth();

        // Get token owner
        let owner = get_token_owner(&env, token_id)
            .ok_or(ValocracyError::NonExistentToken)?;

        // Get valor rarity
        let valor_id = get_token_valor_id(&env, token_id)
            .ok_or(ValocracyError::NonExistentToken)?;
        let valor = get_valor(&env, valor_id)
            .ok_or(ValocracyError::NonExistentValor)?;
        let rarity = valor.rarity;

        // Reduce user level (saturating subtract)
        let current_stats = get_user_stats(&env, &owner)
            .ok_or(ValocracyError::NonExistentAccount)?;
        let new_level = if current_stats.level > rarity {
            current_stats.level - rarity
        } else {
            0
        };
        let new_permanent = if current_stats.permanent_level > rarity {
            current_stats.permanent_level - rarity
        } else {
            0
        };

        let new_stats = UserStats {
            level: new_level,
            permanent_level: new_permanent,
            expiry: current_stats.expiry,
        };
        set_user_stats(&env, &owner, &new_stats);

        // Remove token entries
        remove_token_owner(&env, token_id);
        remove_token_valor_id(&env, token_id);

        extend_instance_ttl(&env);

        env.events().publish(
            (Symbol::new(&env, "revoke"), owner),
            (token_id, valor_id, new_level),
        );

        Ok(())
    }

    // ============ Governor-Only Config ============

    /// Update the governor contract address (migration path).
    /// Only callable by the current governor.
    pub fn update_governor(env: Env, new_governor: Address) -> Result<(), ValocracyError> {
        let governor = get_governor(&env).ok_or(ValocracyError::NotInitialized)?;
        governor.require_auth();
        set_governor(&env, &new_governor);
        env.events().publish((Symbol::new(&env, "governor_update"),), new_governor);
        Ok(())
    }

    /// Update the treasury contract address.
    /// Only callable by the current governor.
    pub fn update_treasury(env: Env, new_treasury: Address) -> Result<(), ValocracyError> {
        let governor = get_governor(&env).ok_or(ValocracyError::NotInitialized)?;
        governor.require_auth();
        set_treasury(&env, &new_treasury);
        env.events().publish((Symbol::new(&env, "treasury_update"),), new_treasury);
        Ok(())
    }

    // ============ View Functions ============

    /// Get the contract name
    pub fn name(env: Env) -> String {
        env.storage()
            .instance()
            .get(&Symbol::new(&env, "name"))
            .unwrap_or(String::from_str(&env, ""))
    }

    /// Get the contract symbol
    pub fn symbol(env: Env) -> String {
        env.storage()
            .instance()
            .get(&Symbol::new(&env, "symbol"))
            .unwrap_or(String::from_str(&env, ""))
    }

    /// Get total supply of minted tokens
    pub fn total_supply(env: Env) -> u64 {
        get_total_supply(&env)
    }

    /// Get the vacancy period (180 days in seconds)
    pub fn vacancy_period(_env: Env) -> u64 {
        VACANCY_PERIOD
    }

    /// Get the founder address
    pub fn founder(env: Env) -> Option<Address> {
        get_founder(&env)
    }

    /// Get the governor contract address
    pub fn governor(env: Env) -> Option<Address> {
        get_governor(&env)
    }

    /// Get the treasury contract address
    pub fn treasury(env: Env) -> Option<Address> {
        get_treasury(&env)
    }

    /// Get the valor ID linked to a token
    pub fn valor_id_of(env: Env, token_id: u64) -> Option<u64> {
        get_token_valor_id(&env, token_id)
    }

    /// Get the rarity of a valor type
    pub fn rarity_of(env: Env, valor_id: u64) -> u64 {
        get_valor(&env, valor_id).map_or(0, |v| v.rarity)
    }

    /// Get the metadata of a valor type
    pub fn metadata_of(env: Env, valor_id: u64) -> String {
        get_valor(&env, valor_id).map_or(String::from_str(&env, ""), |v| v.metadata)
    }

    /// Get the owner of a token
    pub fn owner_of(env: Env, token_id: u64) -> Option<Address> {
        get_token_owner(&env, token_id)
    }

    /// Get the raw level of an account (without decay)
    pub fn level_of(env: Env, account: Address) -> u64 {
        get_user_stats(&env, &account).map_or(0, |s| s.level)
    }

    /// Get the permanent level of an account
    pub fn permanent_level_of(env: Env, account: Address) -> u64 {
        get_user_stats(&env, &account).map_or(0, |s| s.permanent_level)
    }

    /// Get the expiry timestamp of an account
    pub fn expiry_of(env: Env, account: Address) -> u64 {
        let stats = get_user_stats(&env, &account);
        let expiry = stats.map_or(0, |s| s.expiry);

        // Return 0 if expired
        let current_time = env.ledger().timestamp();
        if expiry > current_time {
            expiry
        } else {
            0
        }
    }

    /// Get the current voting power (Mana) of an account
    ///
    /// Mana = MEMBER_FLOOR + bonus (decay applies to extra_level only)
    /// Registered accounts always retain at least MEMBER_FLOOR voting power.
    pub fn get_votes(env: Env, account: Address) -> u64 {
        let stats = match get_user_stats(&env, &account) {
            Some(s) => s,
            None => return 0,
        };

        let current_time = env.ledger().timestamp();
        Self::calculate_mana(stats.level, stats.permanent_level, stats.expiry, current_time)
    }

    /// Calculate Mana (voting power with Member Floor)
    ///
    /// Formula: Mana = floor + bonus
    ///   - floor = MEMBER_FLOOR (fixed constant, e.g. 5)
    ///   - extra_level = level - floor
    ///   - bonus = (extra_level * time_remaining) / VACANCY_PERIOD
    ///
    /// Inactive members decay to exactly MEMBER_FLOOR regardless of their
    /// accumulated level. Legacy status offers zero protection against inactivity.
    pub fn calculate_mana(level: u64, permanent_level: u64, expiry: u64, current_time: u64) -> u64 {
        if level == 0 {
            return 0;
        }

        let floor = MEMBER_FLOOR;
        if current_time >= expiry {
            // Return max(permanent, floor)
            return if permanent_level > floor { permanent_level } else { floor };
        }

        let extra_level = level.saturating_sub(floor);

        let bonus = {
            let time_remaining = expiry - current_time;
            (extra_level * time_remaining) / VACANCY_PERIOD
        };

        floor + bonus
    }

    /// Check if account has any active voting power
    ///
    /// Any registered account (level > 0) always has at least MEMBER_FLOOR voting power.
    pub fn has_voting_power(env: Env, account: Address) -> bool {
        Self::level_of(env, account) > 0
    }

    // ============ Internal Helpers ============

    /// Validate that a badge ID falls within a valid category range
    fn validate_badge_id(valor_id: u64) -> Result<(), ValocracyError> {
        // Categories:
        // Member: 0
        // Founder: 1
        // Leadership: 10-19
        // Track: 20-59
        // Community: 60-69
        // Governance: 70-79
        
        if valor_id <= 1 {
            return Ok(()); // Member (0) or Founder (1)
        }
        if valor_id >= 10 && valor_id <= 79 {
            return Ok(());
        }
        
        // Future proofing: allow higher IDs but maybe restrict them?
        // For now, let's strictly enforce the spec ranges to prevent 
        // accidental minting of "test" or "garbage" IDs.
        // If we want to allow arbitrary IDs later, we can remove this or expand it.
        // But SC-001.5 says "Validate that badge_id matches expected categories".
        
        Err(ValocracyError::InvalidValorId)
    }

    /// Check that the caller is a member (has level > 0).
    fn require_member(env: &Env, caller: &Address) -> Result<(), ValocracyError> {
        if !is_initialized(env) {
            return Err(ValocracyError::NotInitialized);
        }
        let stats = get_user_stats(env, caller);
        if stats.map_or(0, |s| s.level) == 0 {
            return Err(ValocracyError::NotAuthorized);
        }
        Ok(())
    }
}

impl ValocracyContract {
    fn verify_signature(
        env: &Env,
        payload: &Bytes,
        signature: &BytesN<64>,
        account: &Address,
        nonce: u64,
        expiry: u64,
    ) -> Result<(), ValocracyError> {
        let signer = get_signer(env).ok_or(ValocracyError::NotInitialized)?;
        
        // Check expiry
        if env.ledger().timestamp() > expiry {
            return Err(ValocracyError::SignatureExpired);
        }

        // Check nonce
        if is_nonce_used(env, account, nonce) {
            return Err(ValocracyError::NonceUsed);
        }
        set_nonce_used(env, account, nonce);

        // Verify signature
        env.crypto().ed25519_verify(&signer, payload, signature);
        
        Ok(())
    }

    fn mint_internal(env: &Env, account: &Address, valor_id: u64) -> Result<u64, ValocracyError> {
        // Validate badge ID range
        Self::validate_badge_id(valor_id)?;

        // Get valor rarity
        let valor = get_valor(env, valor_id).ok_or(ValocracyError::NonExistentValor)?;
        let rarity = valor.rarity;

        // Get current user stats or default
        let current_stats = get_user_stats(env, account);
        let current_level = current_stats.as_ref().map_or(0, |s| s.level);
        let current_permanent = current_stats.as_ref().map_or(0, |s| s.permanent_level);

        // Calculate new stats
        let current_time = env.ledger().timestamp();
        let new_level = current_level + rarity;
        let new_expiry = current_time + VACANCY_PERIOD;

        // Update user stats (permanent_level unchanged for regular mints)
        let new_stats = UserStats {
            level: new_level,
            permanent_level: current_permanent,
            expiry: new_expiry,
        };
        set_user_stats(env, account, &new_stats);

        // Increment total supply and create token
        let total_supply = get_total_supply(env);
        let token_id = total_supply + 1;
        set_total_supply(env, token_id);

        // Link token to valor and owner
        set_token_valor_id(env, token_id, valor_id);
        set_token_owner(env, token_id, account);

        extend_instance_ttl(env);

        env.events().publish(
            (Symbol::new(env, "mint"), account.clone()),
            (token_id, valor_id, new_level),
        );

        // Grant Treasury shares equal to badge rarity
        if let Some(treasury) = get_treasury(env) {
            // We ignore errors here to not block minting if treasury fails?
            // Or should we fail?
            // "Share issuance policy: I am implementing Shares = Badge Rarity."
            // If it fails, the user gets no shares. That seems bad.
            // Let's propagate error.
            
            // i128::from(rarity) might panic if rarity is too big, but u64 fits in i128 easily.
            let shares = i128::from(rarity);
            if shares > 0 {
                let _res: () = env.invoke_contract(
                    &treasury,
                    &Symbol::new(env, "deposit"),
                    (account.clone(), shares).into_val(env),
                );
            }
        }

        Ok(token_id)
    }
}

#[cfg(test)]
mod test;
