//! Vault utilities for share/asset calculations
//!
//! Implements ERC4626-style vault math with security hardening:
//! - Checked arithmetic to prevent overflow
//! - Explicit rounding down (favor the vault)
//! - Minimum deposit to prevent first-depositor attack
//! - Virtual shares offset for inflation resistance

use crate::TreasuryError;

/// Minimum initial deposit to prevent first-depositor attack
///
/// This prevents an attacker from depositing 1 wei, then donating large amounts
/// to inflate the share price and capture other depositors' funds.
pub const MIN_INITIAL_DEPOSIT: i128 = 1000;

/// Virtual shares offset for inflation resistance
///
/// Adding a virtual offset makes it harder to manipulate the share price
/// by donating assets directly to the vault.
pub const VIRTUAL_SHARES: i128 = 1000;

/// Virtual assets offset (paired with virtual shares)
pub const VIRTUAL_ASSETS: i128 = 1;

/// Calculate shares from assets based on ratio
///
/// Similar to ERC4626 convertToShares with security improvements:
/// - Uses checked arithmetic to prevent overflow
/// - Rounds down (user gets slightly fewer shares, vault keeps remainder)
/// - Uses virtual offsets to prevent inflation attacks
pub fn convert_to_shares(
    assets: i128,
    total_assets: i128,
    total_shares: i128,
) -> Result<i128, TreasuryError> {
    // Add virtual offsets for security
    let total_assets_virtual = total_assets
        .checked_add(VIRTUAL_ASSETS)
        .ok_or(TreasuryError::MathOverflow)?;
    let total_shares_virtual = total_shares
        .checked_add(VIRTUAL_SHARES)
        .ok_or(TreasuryError::MathOverflow)?;

    // shares = (assets * total_shares_virtual) / total_assets_virtual
    // This rounds down, favoring the vault
    let numerator = assets
        .checked_mul(total_shares_virtual)
        .ok_or(TreasuryError::MathOverflow)?;

    let shares = numerator
        .checked_div(total_assets_virtual)
        .ok_or(TreasuryError::MathOverflow)?;

    Ok(shares)
}

/// Calculate assets from shares based on ratio
///
/// Similar to ERC4626 convertToAssets with security improvements:
/// - Uses checked arithmetic to prevent overflow
/// - Rounds down (user gets slightly fewer assets, vault keeps remainder)
/// - Uses virtual offsets to prevent manipulation
pub fn convert_to_assets(
    shares: i128,
    total_assets: i128,
    total_shares: i128,
) -> Result<i128, TreasuryError> {
    if total_shares == 0 {
        return Ok(0);
    }

    // Add virtual offsets for security
    let total_assets_virtual = total_assets
        .checked_add(VIRTUAL_ASSETS)
        .ok_or(TreasuryError::MathOverflow)?;
    let total_shares_virtual = total_shares
        .checked_add(VIRTUAL_SHARES)
        .ok_or(TreasuryError::MathOverflow)?;

    // assets = (shares * total_assets_virtual) / total_shares_virtual
    // This rounds down, favoring the vault
    let numerator = shares
        .checked_mul(total_assets_virtual)
        .ok_or(TreasuryError::MathOverflow)?;

    let assets = numerator
        .checked_div(total_shares_virtual)
        .ok_or(TreasuryError::MathOverflow)?;

    Ok(assets)
}

/// Validate that a deposit amount meets minimum requirements
pub fn validate_deposit(shares: i128, is_first_deposit: bool) -> Result<(), TreasuryError> {
    // Prevent zero-share deposits
    if shares <= 0 {
        return Err(TreasuryError::ZeroAmount);
    }

    // First deposit must meet minimum to prevent inflation attack
    if is_first_deposit && shares < MIN_INITIAL_DEPOSIT {
        return Err(TreasuryError::ZeroAmount); // Reuse error for simplicity
    }

    Ok(())
}
