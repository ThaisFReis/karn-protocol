//! Vault utilities for share/asset calculations using ERC4626-style math.

use crate::TreasuryError;

/// Minimum initial deposit to prevent first-depositor attack.
pub const MIN_INITIAL_DEPOSIT: i128 = 1000;

/// Virtual shares offset for inflation resistance.
pub const VIRTUAL_SHARES: i128 = 1000;

/// Virtual assets offset (paired with virtual shares)
pub const VIRTUAL_ASSETS: i128 = 1;

/// Calculate shares from assets. Rounds down favoring the vault. Uses virtual offsets.
#[allow(dead_code)]
pub fn convert_to_shares(
    assets: i128,
    total_assets: i128,
    total_shares: i128,
) -> Result<i128, TreasuryError> {
    let total_assets_virtual = total_assets
        .checked_add(VIRTUAL_ASSETS)
        .ok_or(TreasuryError::MathOverflow)?;
    let total_shares_virtual = total_shares
        .checked_add(VIRTUAL_SHARES)
        .ok_or(TreasuryError::MathOverflow)?;

    let numerator = assets
        .checked_mul(total_shares_virtual)
        .ok_or(TreasuryError::MathOverflow)?;

    let shares = numerator
        .checked_div(total_assets_virtual)
        .ok_or(TreasuryError::MathOverflow)?;

    Ok(shares)
}

/// Calculate assets from shares. Rounds down favoring the vault. Uses virtual offsets.
pub fn convert_to_assets(
    shares: i128,
    total_assets: i128,
    total_shares: i128,
) -> Result<i128, TreasuryError> {
    if total_shares == 0 {
        return Ok(0);
    }

    let total_assets_virtual = total_assets
        .checked_add(VIRTUAL_ASSETS)
        .ok_or(TreasuryError::MathOverflow)?;
    let total_shares_virtual = total_shares
        .checked_add(VIRTUAL_SHARES)
        .ok_or(TreasuryError::MathOverflow)?;

    let numerator = shares
        .checked_mul(total_assets_virtual)
        .ok_or(TreasuryError::MathOverflow)?;

    let assets = numerator
        .checked_div(total_shares_virtual)
        .ok_or(TreasuryError::MathOverflow)?;

    Ok(assets)
}

/// Validate that a deposit amount meets minimum requirements.
pub fn validate_deposit(shares: i128, is_first_deposit: bool) -> Result<(), TreasuryError> {
    if shares <= 0 {
        return Err(TreasuryError::ZeroAmount);
    }

    if is_first_deposit && shares < MIN_INITIAL_DEPOSIT {
        return Err(TreasuryError::ZeroAmount);
    }

    Ok(())
}
