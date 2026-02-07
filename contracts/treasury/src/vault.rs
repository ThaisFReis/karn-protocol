//! Vault utilities for share/asset calculations

/// Calculate shares from assets based on ratio
/// 
/// Similar to ERC4626 convertToShares
pub fn convert_to_shares(assets: i128, total_assets: i128, total_shares: i128) -> i128 {
    if total_assets == 0 {
        return assets; // 1:1 for initial deposits
    }
    (assets * total_shares) / total_assets
}

/// Calculate assets from shares based on ratio
/// 
/// Similar to ERC4626 convertToAssets
pub fn convert_to_assets(shares: i128, total_assets: i128, total_shares: i128) -> i128 {
    if total_shares == 0 {
        return 0;
    }
    (shares * total_assets) / total_shares
}
