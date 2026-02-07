//! Custom error types for the Valocracy contract

use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum ValocracyError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    NotAuthorized = 3,
    NonExistentValor = 4,
    NonExistentToken = 5,
    NonExistentAccount = 6,
    TokenSoulbound = 7,
    AlreadyRegistered = 8,
    InvalidSignature = 9,
    NonceUsed = 10,
    SignatureExpired = 11,
    InvalidValorId = 12,
    MintNotAuthorized = 13,
    BadgeNotMintable = 14,
    ReentrancyDetected = 15,
}
