//! Treasury - Governance-Controlled Asset Management for Valocracy
//!
//! 🏛️ VALOCRACY MODEL: Treasury is managed collectively, not individually.
//!
//! ## Principles
//! - **All withdrawals require governance approval** - No permissionless redemptions
//! - **Collective decision-making** - Community votes on every fund movement
//! - **Contribution-based power** - Voting weighted by Mana (earned through participation)
//! - **No admin keys** - Even core team needs community approval to withdraw
//!
//! ## Architecture
//! - Shares track contribution-based allocation (informational/potential)
//! - Only the Governor contract can move funds via `transfer()`
//! - Valocracy contract allocates shares when minting badges
//! - Restricted reserves isolate scholarship funds from general treasury

#![no_std]

mod storage;
mod vault;

use soroban_sdk::{contract, contractimpl, contracterror, token, Address, Env, Symbol, BytesN};

use storage::{
    get_valocracy, get_governor, get_asset_token, get_total_shares, get_user_shares,
    set_valocracy, set_governor, set_asset_token, set_total_shares, set_user_shares,
    extend_instance_ttl,
    is_locked, acquire_lock, release_lock,
    // KRN-01: Restricted reserves (scholarship funds)
    get_restricted_reserves, set_restricted_reserves,
    // Lab Escrow
    get_lab, set_lab, get_lab_counter, set_lab_counter, get_claimable, set_claimable,
    Lab, LabStatus,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum TreasuryError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    NotAuthorized = 3,
    InsufficientShares = 4,
    InsufficientAssets = 5,
    ZeroAmount = 6,
    ReentrancyDetected = 7,
    MathOverflow = 8,
    LabNotFound = 9,
    LabNotActive = 10,
    InsufficientClaimable = 11,
}

#[contract]
pub struct TreasuryContract;

#[contractimpl]
impl TreasuryContract {
    // ============ Initialization ============

    /// Initialize the Treasury contract.
    ///
    /// No admin: stores valocracy, governor, and asset token addresses.
    /// All privileged operations go through the governor (governance).
    pub fn initialize(
        env: Env,
        valocracy: Address,
        governor: Address,
        asset_token: Address,
    ) -> Result<(), TreasuryError> {
        if get_governor(&env).is_some() {
            return Err(TreasuryError::AlreadyInitialized);
        }

        set_valocracy(&env, &valocracy);
        set_governor(&env, &governor);
        set_asset_token(&env, &asset_token);
        set_total_shares(&env, 0);

        extend_instance_ttl(&env);
        Ok(())
    }

    // ============ Governor-Only Config ============

    /// Update the governor contract address (migration path).
    /// Only callable by the current governor.
    pub fn update_governor(env: Env, new_governor: Address) -> Result<(), TreasuryError> {
        let governor = get_governor(&env).ok_or(TreasuryError::NotInitialized)?;
        governor.require_auth();
        set_governor(&env, &new_governor);
        env.events().publish((Symbol::new(&env, "governor_update"),), new_governor);
        Ok(())
    }

    // ============ Share Accounting (Called by Valocracy) ============

    /// Allocate shares to a user account — called by Valocracy contract
    ///
    /// 📊 SHARE ACCOUNTING: Shares track contribution-based allocation of treasury value.
    ///
    /// In Valocracy:
    /// - Shares represent potential economic interest proportional to contribution
    /// - Shares are allocated when badges are minted (based on rarity)
    /// - **Shares CANNOT be individually redeemed** (no permissionless withdraw)
    /// - Shares may be used for:
    ///   * Informational: Track member's proportional contribution
    ///   * Governance weight: Additional voting power (if implemented)
    ///   * Future distributions: Basis for governance-approved airdrops
    ///
    /// All actual fund movements require governance approval via `transfer()`.
    pub fn deposit(env: Env, receiver: Address, shares: i128) -> Result<(), TreasuryError> {
        let valocracy = get_valocracy(&env).ok_or(TreasuryError::NotInitialized)?;
        valocracy.require_auth();

        if shares <= 0 {
            return Err(TreasuryError::ZeroAmount);
        }

        // Validate deposit amount
        // First deposit should meet minimum to prevent inflation attacks
        let is_first_deposit = get_total_shares(&env) == 0;
        vault::validate_deposit(shares, is_first_deposit)?;

        // Update user shares
        let current_shares = get_user_shares(&env, &receiver);
        let new_user_shares = current_shares.checked_add(shares)
            .ok_or(TreasuryError::MathOverflow)?;
        set_user_shares(&env, &receiver, new_user_shares);

        // Update total shares
        let total = get_total_shares(&env);
        let new_total = total.checked_add(shares)
            .ok_or(TreasuryError::MathOverflow)?;
        set_total_shares(&env, new_total);

        extend_instance_ttl(&env);

        env.events().publish(
            (Symbol::new(&env, "deposit"), receiver),
            shares,
        );

        Ok(())
    }

    // ============ Withdraw (DEPRECATED - Use Governance) ============

    /// ⚠️ DEPRECATED: Individual withdrawals are not allowed in Valocracy.
    ///
    /// In Valocracy, all Treasury withdrawals must be approved through governance.
    /// Members cannot unilaterally redeem shares for assets.
    ///
    /// To withdraw funds:
    /// 1. Create a governance proposal requesting funds
    /// 2. Community votes on the proposal (weighted by Mana)
    /// 3. If approved, Governor executes and calls `spend()` to transfer funds
    ///
    /// This function is kept for backward compatibility but always returns NotAuthorized.
    /// Use the governance process via `spend()` instead.
    pub fn withdraw(
        _env: Env,
        _caller: Address,
        _receiver: Address,
        _shares: i128,
    ) -> Result<i128, TreasuryError> {
        // VALOCRACY PRINCIPLE: Treasury is managed collectively, not individually
        // All withdrawals require governance approval
        Err(TreasuryError::NotAuthorized)
    }

    // ============ View Functions ============

    /// Get the underlying asset token address
    pub fn asset(env: Env) -> Option<Address> {
        get_asset_token(&env)
    }

    /// Get total assets in the treasury by querying the actual token balance
    ///
    /// KRN-01 FIX: Excludes restricted reserves (scholarship funds) from shareholder assets.
    /// This prevents shareholders from withdrawing scholarship money.
    pub fn total_assets(env: Env) -> i128 {
        let total_balance = match get_asset_token(&env) {
            Some(asset) => {
                let client = token::TokenClient::new(&env, &asset);
                client.balance(&env.current_contract_address())
            }
            None => 0,
        };

        // KRN-01: Exclude restricted reserves (scholarship funds)
        let restricted = get_restricted_reserves(&env);
        total_balance.saturating_sub(restricted)
    }

    /// Get total shares outstanding
    pub fn total_shares(env: Env) -> i128 {
        get_total_shares(&env)
    }

    /// Get shares for a specific user
    pub fn shares_of(env: Env, account: Address) -> i128 {
        get_user_shares(&env, &account)
    }

    /// Preview how many assets a share amount would yield
    ///
    /// Uses vault math with virtual offsets for security.
    /// Rounds down (user gets slightly less, vault keeps remainder).
    pub fn preview_withdraw(env: Env, shares: i128) -> Result<i128, TreasuryError> {
        let total_shares = get_total_shares(&env);
        let total_assets = Self::total_assets(env);

        // Use secure vault math with virtual offsets and checked arithmetic
        vault::convert_to_assets(shares, total_assets, total_shares)
    }

    /// Get valocracy contract address
    pub fn valocracy(env: Env) -> Option<Address> {
        get_valocracy(&env)
    }

    /// Get governor contract address
    pub fn governor(env: Env) -> Option<Address> {
        get_governor(&env)
    }

    // ============ Governance-Controlled Transfers (VALOCRACY) ============

    /// Transfer treasury assets — ONLY callable by the Governor contract
    ///
    /// 🏛️ VALOCRACY PRINCIPLE: All treasury movements require governance approval.
    ///
    /// This is the ONLY way to move funds from the Treasury. It is invoked as part
    /// of executing an approved governance proposal:
    ///
    /// 1. Member creates proposal: "Send X tokens to address Y"
    /// 2. Community votes (weighted by Mana = contribution-based power)
    /// 3. If approved: Governor calls this function to execute the transfer
    /// 4. If rejected: No transfer happens
    ///
    /// This enforces collective decision-making instead of individual redemptions.
    /// Even core team members cannot withdraw without community approval.
    pub fn transfer(
        env: Env,
        receiver: Address,
        amount: i128,
    ) -> Result<(), TreasuryError> {
        // CRITICAL: Only Governor can call this
        let governor = get_governor(&env).ok_or(TreasuryError::NotInitialized)?;
        governor.require_auth();

        if amount <= 0 {
            return Err(TreasuryError::ZeroAmount);
        }

        // Check lock
        if is_locked(&env) {
            return Err(TreasuryError::ReentrancyDetected);
        }
        acquire_lock(&env);

        let asset_token = get_asset_token(&env).ok_or(TreasuryError::NotInitialized)?;
        let client = token::TokenClient::new(&env, &asset_token);

        let balance = client.balance(&env.current_contract_address());
        if balance < amount {
            release_lock(&env);
            return Err(TreasuryError::InsufficientAssets);
        }

        client.transfer(&env.current_contract_address(), &receiver, &amount);

        extend_instance_ttl(&env);

        env.events().publish(
            (Symbol::new(&env, "transfer"), receiver),
            amount,
        );

        release_lock(&env);
        Ok(())
    }

    /// Legacy alias for transfer() — kept for backward compatibility
    ///
    /// Use `transfer()` instead. This function will be removed in future versions.
    pub fn spend(
        env: Env,
        receiver: Address,
        amount: i128,
    ) -> Result<(), TreasuryError> {
        Self::transfer(env, receiver, amount)
    }

    // ============ Scholarship Escrow ============

    /// Fund a new Lab (Scholarship)
    ///
    /// Only callable by the funder.
    pub fn fund_lab(
        env: Env,
        funder: Address,
        total_amount: i128,
        scholarship_per_member: i128,
    ) -> Result<u32, TreasuryError> {
        funder.require_auth();

        if total_amount <= 0 || scholarship_per_member <= 0 {
            return Err(TreasuryError::ZeroAmount);
        }

        // Get or create lab ID
        let lab_id = get_lab_counter(&env);
        let new_lab_id = lab_id.checked_add(1).ok_or(TreasuryError::MathOverflow)?;
        set_lab_counter(&env, new_lab_id);

        // Transfer funds from funder to treasury
        let asset_token = get_asset_token(&env).ok_or(TreasuryError::NotInitialized)?;
        let client = token::TokenClient::new(&env, &asset_token);
        client.transfer(&funder, &env.current_contract_address(), &total_amount);

        // KRN-01: Increment restricted reserves
        // These funds are escrowed for scholarships and cannot be withdrawn by shareholders
        let current_restricted = get_restricted_reserves(&env);
        let new_restricted = current_restricted
            .checked_add(total_amount)
            .ok_or(TreasuryError::MathOverflow)?;
        set_restricted_reserves(&env, new_restricted);

        // Create lab
        let lab = Lab {
            id: new_lab_id,
            funder: funder.clone(),
            total_amount,
            scholarship_per_member,
            status: LabStatus::Active,
        };
        set_lab(&env, &lab);

        extend_instance_ttl(&env);

        env.events().publish(
            (Symbol::new(&env, "lab_funded"), new_lab_id),
            (funder, total_amount),
        );

        Ok(new_lab_id)
    }

    /// Approve scholarship for a member
    ///
    /// Releases scholarship funds to a member's claimable balance.
    /// Only callable by governor (governance/admin/mentor approval).
    pub fn approve_scholarship(
        env: Env,
        lab_id: u32,
        member: Address,
    ) -> Result<(), TreasuryError> {
        let governor = get_governor(&env).ok_or(TreasuryError::NotInitialized)?;
        governor.require_auth();

        // Get lab
        let lab = get_lab(&env, lab_id).ok_or(TreasuryError::LabNotFound)?;

        // Verify lab is active
        if lab.status != LabStatus::Active {
            return Err(TreasuryError::LabNotActive);
        }

        // Calculate scholarship amount
        let scholarship_amount = lab.scholarship_per_member;

        // Increase member's claimable balance
        let current_claimable = get_claimable(&env, &member);
        let new_claimable = current_claimable
            .checked_add(scholarship_amount)
            .ok_or(TreasuryError::MathOverflow)?;
        set_claimable(&env, &member, new_claimable);

        extend_instance_ttl(&env);

        env.events().publish(
            (Symbol::new(&env, "scholarship_released"), lab_id, member.clone()),
            scholarship_amount,
        );

        Ok(())
    }

    /// Get claimable balance for a member
    ///
    /// Returns the amount of scholarship funds available for withdrawal.
    pub fn get_claimable_balance(env: Env, member: Address) -> i128 {
        get_claimable(&env, &member)
    }

    /// Withdraw scholarship funds
    ///
    /// Allows members to withdraw their approved scholarship funds.
    /// Updated to check claimable balance instead of shares.
    pub fn withdraw_scholarship(
        env: Env,
        member: Address,
        amount: i128,
    ) -> Result<(), TreasuryError> {
        member.require_auth();

        if amount <= 0 {
            return Err(TreasuryError::ZeroAmount);
        }

        // Check claimable balance
        let claimable = get_claimable(&env, &member);
        if claimable < amount {
            return Err(TreasuryError::InsufficientClaimable);
        }

        // Reduce claimable balance
        let new_claimable = claimable
            .checked_sub(amount)
            .ok_or(TreasuryError::MathOverflow)?;
        set_claimable(&env, &member, new_claimable);

        // KRN-01: Decrement restricted reserves
        // Scholarship funds are being released, so reduce the reserved amount
        let current_restricted = get_restricted_reserves(&env);
        let new_restricted = current_restricted
            .checked_sub(amount)
            .ok_or(TreasuryError::MathOverflow)?;
        set_restricted_reserves(&env, new_restricted);

        // Transfer assets to member
        let asset_token = get_asset_token(&env).ok_or(TreasuryError::NotInitialized)?;
        let client = token::TokenClient::new(&env, &asset_token);
        client.transfer(&env.current_contract_address(), &member, &amount);

        extend_instance_ttl(&env);

        env.events().publish(
            (Symbol::new(&env, "scholarship_withdrawn"), member),
            amount,
        );

        Ok(())
    }

    /// Upgrade the contract to a new WASM hash.
    /// Only callable by the governor (requires governance proposal).
    pub fn upgrade(env: Env, new_wasm_hash: BytesN<32>) -> Result<(), TreasuryError> {
        let governor = get_governor(&env).ok_or(TreasuryError::NotInitialized)?;
        governor.require_auth();
        
        env.deployer().update_current_contract_wasm(new_wasm_hash.clone());
        
        env.events().publish(
            (Symbol::new(&env, "contract_upgraded"),),
            new_wasm_hash,
        );
        
        extend_instance_ttl(&env);
        Ok(())
    }
}

#[cfg(test)]
mod test;

#[cfg(test)]
mod test_comprehensive;

#[cfg(test)]
mod test_valocracy;
