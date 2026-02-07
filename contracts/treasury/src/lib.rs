//! Treasury - Asset Vault for Valocracy
//!
//! Manages treasury funds and distributes shares to contributors based on their rarity.
//! No admin: all spends go through governance. Similar to ERC4626 vault pattern.

#![no_std]

mod storage;
mod vault;

use soroban_sdk::{contract, contractimpl, contracterror, token, Address, Env, Symbol};

use storage::{
    get_valocracy, get_governor, get_asset_token, get_total_shares, get_user_shares,
    set_valocracy, set_governor, set_asset_token, set_total_shares, set_user_shares,
    extend_instance_ttl,
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

    // ============ Deposit (Called by Valocracy) ============

    /// Deposit shares to a user account
    ///
    /// This is called by the Valocracy contract when minting NFTs.
    /// Shares represent the user's claim on treasury assets.
    pub fn deposit(env: Env, receiver: Address, shares: i128) -> Result<(), TreasuryError> {
        let valocracy = get_valocracy(&env).ok_or(TreasuryError::NotInitialized)?;
        valocracy.require_auth();

        if shares <= 0 {
            return Err(TreasuryError::ZeroAmount);
        }

        // Update user shares
        let current_shares = get_user_shares(&env, &receiver);
        set_user_shares(&env, &receiver, current_shares + shares);

        // Update total shares
        let total = get_total_shares(&env);
        set_total_shares(&env, total + shares);

        extend_instance_ttl(&env);

        env.events().publish(
            (Symbol::new(&env, "deposit"), receiver),
            shares,
        );

        Ok(())
    }

    // ============ Withdraw ============

    /// Withdraw assets by burning shares
    ///
    /// Converts shares to underlying assets based on current ratio.
    pub fn withdraw(
        env: Env,
        caller: Address,
        receiver: Address,
        shares: i128,
    ) -> Result<i128, TreasuryError> {
        caller.require_auth();

        if shares <= 0 {
            return Err(TreasuryError::ZeroAmount);
        }

        let user_shares = get_user_shares(&env, &caller);
        if user_shares < shares {
            return Err(TreasuryError::InsufficientShares);
        }

        // Calculate assets to withdraw
        let assets = Self::preview_withdraw(env.clone(), shares)?;

        if assets <= 0 {
            return Err(TreasuryError::InsufficientAssets);
        }

        // Update user shares
        set_user_shares(&env, &caller, user_shares - shares);

        // Update total shares
        let total = get_total_shares(&env);
        set_total_shares(&env, total - shares);

        // Transfer assets to receiver
        let asset_token = get_asset_token(&env).ok_or(TreasuryError::NotInitialized)?;
        let client = token::TokenClient::new(&env, &asset_token);
        client.transfer(&env.current_contract_address(), &receiver, &assets);

        extend_instance_ttl(&env);

        env.events().publish(
            (Symbol::new(&env, "withdraw"), caller, receiver),
            (assets, shares),
        );

        Ok(assets)
    }

    // ============ View Functions ============

    /// Get the underlying asset token address
    pub fn asset(env: Env) -> Option<Address> {
        get_asset_token(&env)
    }

    /// Get total assets in the treasury by querying the actual token balance
    pub fn total_assets(env: Env) -> i128 {
        match get_asset_token(&env) {
            Some(asset) => {
                let client = token::TokenClient::new(&env, &asset);
                client.balance(&env.current_contract_address())
            }
            None => 0,
        }
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
    pub fn preview_withdraw(env: Env, shares: i128) -> Result<i128, TreasuryError> {
        let total_shares = get_total_shares(&env);
        if total_shares == 0 {
            return Ok(0);
        }

        let total_assets = Self::total_assets(env);

        // assets = (total_assets * shares) / total_shares
        Ok((total_assets * shares) / total_shares)
    }

    /// Get valocracy contract address
    pub fn valocracy(env: Env) -> Option<Address> {
        get_valocracy(&env)
    }

    /// Get governor contract address
    pub fn governor(env: Env) -> Option<Address> {
        get_governor(&env)
    }

    // ============ Spend (Called by Governor) ============

    /// Spend treasury assets — only callable by the Governor contract
    ///
    /// This is invoked as part of executing an approved governance proposal.
    pub fn spend(
        env: Env,
        receiver: Address,
        amount: i128,
    ) -> Result<(), TreasuryError> {
        let governor = get_governor(&env).ok_or(TreasuryError::NotInitialized)?;
        governor.require_auth();

        if amount <= 0 {
            return Err(TreasuryError::ZeroAmount);
        }

        let asset_token = get_asset_token(&env).ok_or(TreasuryError::NotInitialized)?;
        let client = token::TokenClient::new(&env, &asset_token);

        let balance = client.balance(&env.current_contract_address());
        if balance < amount {
            return Err(TreasuryError::InsufficientAssets);
        }

        client.transfer(&env.current_contract_address(), &receiver, &amount);

        extend_instance_ttl(&env);

        env.events().publish(
            (Symbol::new(&env, "spend"), receiver),
            amount,
        );

        Ok(())
    }
}
