//! Valocracy - Core IDNFT (Isonomic Degradable NFT) Contract.
//! Implements soulbound NFTs with decaying voting power (Mana) for governance.

#![allow(clippy::too_many_arguments)]
#![no_std]

mod errors;
mod storage;
mod types;

use soroban_sdk::xdr::ToXdr;
use soroban_sdk::{
    contract, contractimpl, Address, Bytes, BytesN, Env, IntoVal, String, Symbol, Vec,
};

use errors::ValocracyError;
use storage::{
    extend_instance_ttl, get_governor, get_member_valor_id, get_signer, get_token_owner,
    get_token_valor_id, get_total_supply, get_treasury, get_user_stats, get_valor, is_initialized,
    is_nonce_used, remove_token_owner, remove_token_valor_id, set_governor, set_initialized,
    set_member_valor_id, set_nonce_used, set_signer, set_token_owner, set_token_valor_id,
    set_total_supply, set_treasury, set_user_stats, set_valor,
};
use types::{UserStats, Valor};

/// Vacancy period: 180 days in seconds (15,552,000 seconds)
pub const VACANCY_PERIOD: u64 = 180 * 24 * 60 * 60;

/// Member Floor: fixed baseline Mana for any registered user.
/// Matches the Member Badge rarity (id: 0, rarity: 5).
/// Inactive members decay to MEMBER_FLOOR.
pub const MEMBER_FLOOR: u64 = 5;

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
enum BadgeCategory {
    Member,     // 0
    Founder,    // 1
    Leadership, // 10-19
    Track,      // 20-59
    Community,  // 60-69
    Governance, // 70-79
}

#[contract]
pub struct ValocracyContract;

#[contractimpl]
impl ValocracyContract {
    /// Initialize the Valocracy contract.
    /// Registers initial valor types and mints genesis badges.
    #[allow(clippy::too_many_arguments)]
    pub fn initialize(
        env: Env,
        genesis_members: Vec<Address>,
        governor: Address,
        treasury: Address,
        // name: String, // Removed to fit 10 args limit
        // symbol: String, // Removed to fit 10 args limit
        member_valor_id: u64,
        valor_ids: Vec<u64>,
        valor_rarities: Vec<u64>,
        valor_metadatas: Vec<String>,
        leadership_valor_id: u64,
        signer: BytesN<32>,
    ) -> Result<(), ValocracyError> {
        if is_initialized(&env) {
            return Err(ValocracyError::AlreadyInitialized);
        }

        if genesis_members.is_empty() {
            return Err(ValocracyError::NotAuthorized);
        }

        // First genesis member must authorize the initialization
        genesis_members.get(0).unwrap().require_auth();

        set_initialized(&env);
        set_governor(&env, &governor);
        set_treasury(&env, &treasury);
        set_signer(&env, &signer);
        set_member_valor_id(&env, member_valor_id);
        env.storage().instance().set(
            &Symbol::new(&env, "name"),
            &String::from_str(&env, "Valocracy"),
        );
        env.storage().instance().set(
            &Symbol::new(&env, "symbol"),
            &String::from_str(&env, "VALOR"),
        );
        set_total_supply(&env, 0);

        let count = valor_ids.len();
        for i in 0..count {
            let vid = valor_ids.get(i).unwrap();
            let rar = valor_rarities.get(i).unwrap();
            let meta = valor_metadatas.get(i).unwrap();
            let valor = Valor {
                rarity: rar,
                metadata: meta,
            };
            set_valor(&env, vid, &valor);
        }

        let leadership_valor =
            get_valor(&env, leadership_valor_id).ok_or(ValocracyError::NonExistentValor)?;
        let leadership_rarity = leadership_valor.rarity;

        let current_time = env.ledger().timestamp();
        let mut current_token_id = 1u64;

        // Mint leadership badge to all genesis members.
        // All badges decay equally — no permanent power.
        for member in genesis_members.iter() {
            let member_stats = UserStats {
                level: leadership_rarity,
                permanent_level: 0,
                expiry: current_time + VACANCY_PERIOD,
                verified: false,
            };
            set_user_stats(&env, &member, &member_stats);

            set_token_valor_id(&env, current_token_id, leadership_valor_id);
            set_token_owner(&env, current_token_id, &member);

            env.events().publish(
                (Symbol::new(&env, "mint"), member),
                (current_token_id, leadership_valor_id, leadership_rarity),
            );

            current_token_id += 1;
        }

        // Update total supply to reflect all minted genesis badges
        set_total_supply(&env, current_token_id - 1);

        extend_instance_ttl(&env);

        env.events()
            .publish((Symbol::new(&env, "initialized"),), genesis_members.len());

        Ok(())
    }

    /// Create or update a Valor type (Governor only).
    pub fn set_valor(
        env: Env,
        valor_id: u64,
        rarity: u64,
        metadata: String,
    ) -> Result<(), ValocracyError> {
        let governor = get_governor(&env).ok_or(ValocracyError::NotInitialized)?;
        governor.require_auth();

        let valor = Valor {
            rarity,
            metadata: metadata.clone(),
        };
        set_valor(&env, valor_id, &valor);

        env.events().publish(
            (Symbol::new(&env, "valor_update"), valor_id),
            (rarity, metadata),
        );
        Ok(())
    }

    /// Mint a new soulbound NFT. Requires authorization from a valid minter.
    pub fn mint(
        env: Env,
        minter: Address,
        recipient: Address,
        valor_id: u64,
    ) -> Result<u64, ValocracyError> {
        minter.require_auth();

        // Check role-based authorization
        Self::check_mint_authorization(&env, &minter, valor_id)?;

        Self::mint_internal(&env, &recipient, valor_id)
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
        let member_valor_id = get_member_valor_id(&env).ok_or(ValocracyError::NotInitialized)?;

        // Execute minting logic
        Self::mint_internal(&env, &caller, member_valor_id)
    }

    /// Mint a new soulbound NFT using backend signature.
    pub fn guardian_mint(
        env: Env,
        account: Address,
        valor_id: u64,
        signature: BytesN<64>,
        nonce: u64,
        expiry: u64,
    ) -> Result<u64, ValocracyError> {
        // KRN-05: Require recipient authorization to prevent griefing attacks
        account.require_auth();

        if !is_initialized(&env) {
            return Err(ValocracyError::NotInitialized);
        }

        // Verify backend signature
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

    /// Revoke a badge token (Governor only).
    pub fn revoke(env: Env, token_id: u64) -> Result<(), ValocracyError> {
        let governor = get_governor(&env).ok_or(ValocracyError::NotInitialized)?;
        governor.require_auth();

        // Get token owner
        let owner = get_token_owner(&env, token_id).ok_or(ValocracyError::NonExistentToken)?;

        // Get valor rarity
        let valor_id =
            get_token_valor_id(&env, token_id).ok_or(ValocracyError::NonExistentToken)?;
        let valor = get_valor(&env, valor_id).ok_or(ValocracyError::NonExistentValor)?;
        let rarity = valor.rarity;

        let current_stats =
            get_user_stats(&env, &owner).ok_or(ValocracyError::NonExistentAccount)?;
        let new_level = current_stats.level.saturating_sub(rarity);
        let new_permanent = current_stats.permanent_level.saturating_sub(rarity);

        let new_stats = UserStats {
            level: new_level,
            permanent_level: new_permanent,
            expiry: current_stats.expiry,
            verified: current_stats.verified,
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

    /// Update the governor contract address (Governor only).
    pub fn update_governor(env: Env, new_governor: Address) -> Result<(), ValocracyError> {
        let governor = get_governor(&env).ok_or(ValocracyError::NotInitialized)?;
        governor.require_auth();
        set_governor(&env, &new_governor);
        env.events()
            .publish((Symbol::new(&env, "governor_update"),), new_governor);
        Ok(())
    }

    /// Update the treasury contract address (Governor only).
    pub fn update_treasury(env: Env, new_treasury: Address) -> Result<(), ValocracyError> {
        let governor = get_governor(&env).ok_or(ValocracyError::NotInitialized)?;
        governor.require_auth();
        set_treasury(&env, &new_treasury);
        env.events()
            .publish((Symbol::new(&env, "treasury_update"),), new_treasury);
        Ok(())
    }

    /// Upgrade the contract WASM hash (Governor only).
    pub fn upgrade(env: Env, new_wasm_hash: BytesN<32>) -> Result<(), ValocracyError> {
        let governor = get_governor(&env).ok_or(ValocracyError::NotInitialized)?;
        governor.require_auth();

        env.deployer()
            .update_current_contract_wasm(new_wasm_hash.clone());

        env.events()
            .publish((Symbol::new(&env, "contract_upgraded"),), new_wasm_hash);

        Ok(())
    }

    /// Set the verification status of a member (Governor only).
    /// Unverified members cannot withdraw funds from the treasury.
    pub fn set_verified(env: Env, member: Address, verified: bool) -> Result<(), ValocracyError> {
        let governor = get_governor(&env).ok_or(ValocracyError::NotInitialized)?;
        governor.require_auth();

        // Get current stats
        let mut stats = get_user_stats(&env, &member).ok_or(ValocracyError::NonExistentAccount)?;

        // Update verification status
        stats.verified = verified;
        set_user_stats(&env, &member, &stats);

        extend_instance_ttl(&env);

        env.events().publish(
            (Symbol::new(&env, "verification_changed"), member),
            verified,
        );

        Ok(())
    }

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

    /// Get the current voting power (Mana) of an account.
    /// Registered accounts retain at least MEMBER_FLOOR.
    pub fn get_votes(env: Env, account: Address) -> u64 {
        let stats = match get_user_stats(&env, &account) {
            Some(s) => s,
            None => return 0,
        };

        let current_time = env.ledger().timestamp();
        Self::calculate_mana(
            stats.level,
            stats.permanent_level,
            stats.expiry,
            current_time,
        )
    }

    /// Get voting power (Mana) at a specific timestamp (KRN-02).
    pub fn get_votes_at(env: Env, account: Address, timestamp: u64) -> u64 {
        let stats = match get_user_stats(&env, &account) {
            Some(s) => s,
            None => return 0,
        };

        Self::calculate_mana(stats.level, stats.permanent_level, stats.expiry, timestamp)
    }

    /// Calculate Mana with decay.
    /// Formula: Mana = floor + (extra_level * time_remaining) / VACANCY_PERIOD
    fn calculate_mana(level: u64, permanent_level: u64, expiry: u64, current_time: u64) -> u64 {
        if level == 0 {
            return 0;
        }

        let floor = MEMBER_FLOOR;
        if current_time >= expiry {
            // Return max(permanent, floor)
            return if permanent_level > floor {
                permanent_level
            } else {
                floor
            };
        }

        let extra_level = level.saturating_sub(floor);

        let bonus = {
            let time_remaining = expiry - current_time;
            // KRN-04 FIX: Cast to u128 to prevent overflow with large values
            let result =
                (u128::from(extra_level) * u128::from(time_remaining)) / u128::from(VACANCY_PERIOD);
            // Safe to cast back since result <= extra_level (division by period)
            result as u64
        };

        floor + bonus
    }

    /// Check if account has any active voting power
    ///
    /// Any registered account (level > 0) always has at least MEMBER_FLOOR voting power.
    pub fn has_voting_power(env: Env, account: Address) -> bool {
        Self::level_of(env, account) > 0
    }

    /// Check if a member has completed identity verification (ADR-003).
    ///
    /// Returns false if the account is not registered.
    pub fn is_verified(env: Env, account: Address) -> bool {
        get_user_stats(&env, &account).is_some_and(|s| s.verified)
    }

    /// Get conservative lower bound of total Mana (KRN-03).
    /// Used for participation threshold.
    pub fn total_mana(env: Env) -> u64 {
        let total_supply = get_total_supply(&env);
        total_supply * MEMBER_FLOOR
    }

    /// Get the category of a badge based on its ID
    fn get_badge_category(valor_id: u64) -> BadgeCategory {
        match valor_id {
            0 => BadgeCategory::Member,
            1 => BadgeCategory::Founder,
            10..=19 => BadgeCategory::Leadership,
            20..=59 => BadgeCategory::Track,
            60..=69 => BadgeCategory::Community,
            70..=79 => BadgeCategory::Governance,
            _ => panic!("Invalid valor_id"), // Should never happen after validation
        }
    }

    /// Check if minter is authorized (RBAC).
    fn check_mint_authorization(
        env: &Env,
        minter: &Address,
        valor_id: u64,
    ) -> Result<(), ValocracyError> {
        let category = Self::get_badge_category(valor_id);
        let governor = get_governor(env).ok_or(ValocracyError::NotInitialized)?;

        match category {
            BadgeCategory::Member => {
                // Can only be minted via self_register
                return Err(ValocracyError::BadgeNotMintable);
            }
            BadgeCategory::Founder => {
                // Never mintable after initialization
                return Err(ValocracyError::BadgeNotMintable);
            }
            BadgeCategory::Governance | BadgeCategory::Leadership => {
                // Governor-only
                if minter != &governor {
                    return Err(ValocracyError::MintNotAuthorized);
                }
            }
            BadgeCategory::Track => {
                // Governor OR leadership holders
                if minter != &governor {
                    let minter_stats = get_user_stats(env, minter);
                    let has_leadership = minter_stats
                        .map(|s| s.level >= 10) // Leadership badges have rarity >= 10
                        .unwrap_or(false);

                    if !has_leadership {
                        return Err(ValocracyError::MintNotAuthorized);
                    }
                }
            }
            BadgeCategory::Community => {
                // Any member (level > 0)
                let minter_stats = get_user_stats(env, minter);
                let is_member = minter_stats.map(|s| s.level > 0).unwrap_or(false);

                if !is_member {
                    return Err(ValocracyError::MintNotAuthorized);
                }
            }
        }

        Ok(())
    }

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
        if (10..=79).contains(&valor_id) {
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
    #[allow(dead_code)]
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

        let current_stats = get_user_stats(env, account);
        let current_level = current_stats.as_ref().map_or(0, |s| s.level);
        let current_permanent = current_stats.as_ref().map_or(0, |s| s.permanent_level);

        // Calculate new stats
        let current_time = env.ledger().timestamp();
        let new_level = current_level + rarity;
        let new_expiry = current_time + VACANCY_PERIOD;
        let current_verified = current_stats.as_ref().is_some_and(|s| s.verified);

        let new_stats = UserStats {
            level: new_level,
            permanent_level: current_permanent, // Preserve existing permanent level
            expiry: new_expiry,
            verified: current_verified,
        };

        set_user_stats(env, account, &new_stats);

        // Create new token
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

        // Grant Treasury shares equal to badge rarity.
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
