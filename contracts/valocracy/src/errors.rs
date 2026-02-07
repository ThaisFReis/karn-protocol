//! Custom error types for the Valocracy contract

use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum ValocracyError {
    /// Contract has already been initialized
    AlreadyInitialized = 1,
    /// Contract has not been initialized
    NotInitialized = 2,
    /// Caller is not authorized (not a member or not the governor)
    NotAuthorized = 3,
    /// Valor ID does not exist
    NonExistentValor = 4,
    /// Token ID does not exist
    NonExistentToken = 5,
    /// Account does not exist
    NonExistentAccount = 6,
    /// Token is soulbound and cannot be transferred
    TokenSoulbound = 7,
    /// User has already self-registered (has a Member badge)
    AlreadyRegistered = 8,
    /// Invalid signature
    InvalidSignature = 9,
    /// Nonce already used
    NonceUsed = 10,
    /// Signature expired
    SignatureExpired = 11,
    /// Invalid Valor ID
    InvalidValorId = 12,
    /// Mint not authorized
    MintNotAuthorized = 13,
    /// Badge not mintable
    BadgeNotMintable = 14,
    /// Reentrancy detected
    ReentrancyDetected = 15,
}
