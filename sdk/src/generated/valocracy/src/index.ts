import { Buffer } from "buffer";
import { Address } from '@stellar/stellar-sdk';
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from '@stellar/stellar-sdk/contract';
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Typepoint,
  Duration,
} from '@stellar/stellar-sdk/contract';
export * from '@stellar/stellar-sdk'
export * as contract from '@stellar/stellar-sdk/contract'
export * as rpc from '@stellar/stellar-sdk/rpc'

if (typeof window !== 'undefined') {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}





/**
 * Valor type definition with rarity and metadata
 */
export interface Valor {
  /**
 * Metadata string (e.g., description, URI)
 */
metadata: string;
  /**
 * The rarity multiplier for this valor type
 */
rarity: u64;
}


/**
 * User statistics including level and expiration
 */
export interface UserStats {
  /**
 * The expiration timestamp (Unix seconds)
 */
expiry: u64;
  /**
 * The accumulated governance level
 */
level: u64;
  /**
 * The permanent portion of level that never decays (e.g., Founder badge)
 */
permanent_level: u64;
  /**
 * Whether the user has verified their identity (ADR-003)
 */
verified: boolean;
}

export const ValocracyError = {
  /**
   * Contract has already been initialized
   */
  1: {message:"AlreadyInitialized"},
  /**
   * Contract has not been initialized
   */
  2: {message:"NotInitialized"},
  /**
   * Caller is not authorized (not a member or not the governor)
   */
  3: {message:"NotAuthorized"},
  /**
   * Valor ID does not exist
   */
  4: {message:"NonExistentValor"},
  /**
   * Token ID does not exist
   */
  5: {message:"NonExistentToken"},
  /**
   * Account does not exist
   */
  6: {message:"NonExistentAccount"},
  /**
   * Token is soulbound and cannot be transferred
   */
  7: {message:"TokenSoulbound"},
  /**
   * User has already self-registered (has a Member badge)
   */
  8: {message:"AlreadyRegistered"},
  /**
   * Invalid signature
   */
  9: {message:"InvalidSignature"},
  /**
   * Nonce already used
   */
  10: {message:"NonceUsed"},
  /**
   * Signature expired
   */
  11: {message:"SignatureExpired"},
  /**
   * Invalid Valor ID
   */
  12: {message:"InvalidValorId"},
  /**
   * Mint not authorized
   */
  13: {message:"MintNotAuthorized"},
  /**
   * Badge not mintable
   */
  14: {message:"BadgeNotMintable"},
  /**
   * Reentrancy detected
   */
  15: {message:"ReentrancyDetected"}
}

/**
 * Storage keys for the contract
 */
export type DataKey = {tag: "Admin", values: void} | {tag: "Initialized", values: void} | {tag: "Founder", values: void} | {tag: "Governor", values: void} | {tag: "Treasury", values: void} | {tag: "TotalSupply", values: void} | {tag: "MemberValorId", values: void} | {tag: "TokenValorId", values: readonly [u64]} | {tag: "ValorData", values: readonly [u64]} | {tag: "UserStats", values: readonly [string]} | {tag: "TokenOwner", values: readonly [u64]} | {tag: "Signer", values: void} | {tag: "UsedNonce", values: readonly [string, u64]};

export interface Client {
  /**
   * Construct and simulate a mint transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Mint a new soulbound NFT to an account.
   * 
   * Requires authorization from a valid minter for the specific badge category.
   * - Governance/Leadership/Track: See RBAC matrix
   * - Community: Any member
   */
  mint: ({minter, recipient, valor_id}: {minter: string, recipient: string, valor_id: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<u64>>>

  /**
   * Construct and simulate a name transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get the contract name
   */
  name: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a revoke transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Revoke (burn) a badge token.
   * 
   * Governor-only. Removes the token, reduces the user's level by
   * the badge's rarity value. Used for governance-decided removal.
   */
  revoke: ({token_id}: {token_id: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a symbol transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get the contract symbol
   */
  symbol: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a founder transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get the founder address
   */
  founder: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Option<string>>>

  /**
   * Construct and simulate a upgrade transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Upgrade the contract to a new WASM hash.
   * Only callable by the governor (requires governance proposal).
   */
  upgrade: ({new_wasm_hash}: {new_wasm_hash: Buffer}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a governor transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get the governor contract address
   */
  governor: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Option<string>>>

  /**
   * Construct and simulate a level_of transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get the raw level of an account (without decay)
   */
  level_of: ({account}: {account: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a owner_of transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get the owner of a token
   */
  owner_of: ({token_id}: {token_id: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Option<string>>>

  /**
   * Construct and simulate a treasury transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get the treasury contract address
   */
  treasury: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Option<string>>>

  /**
   * Construct and simulate a expiry_of transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get the expiry timestamp of an account
   */
  expiry_of: ({account}: {account: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a get_votes transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get the current voting power (Mana) of an account
   * 
   * Mana = MEMBER_FLOOR + bonus (decay applies to extra_level only)
   * Registered accounts always retain at least MEMBER_FLOOR voting power.
   */
  get_votes: ({account}: {account: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a rarity_of transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get the rarity of a valor type
   */
  rarity_of: ({valor_id}: {valor_id: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a set_valor transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Create or update a Valor type with rarity and metadata.
   * 
   * Governor-only. Badge type changes require a governance proposal.
   */
  set_valor: ({valor_id, rarity, metadata}: {valor_id: u64, rarity: u64, metadata: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Initialize the Valocracy contract.
   * 
   * No admin: sets all configuration at once. Registers initial valor types,
   * mints the Founder badge, and stores the member badge ID for self-registration.
   * 
   * # Arguments
   * * `founder` - Address that receives the permanent Founder badge
   * * `governor` - Governor contract address
   * * `treasury` - Treasury contract address
   * * `name` - Contract name
   * * `symbol` - Contract symbol
   * * `member_valor_id` - Valor ID used by self_register() (the Member badge)
   * * `valor_ids` - List of valor IDs to register
   * * `valor_rarities` - List of rarities (parallel to valor_ids)
   * * `valor_metadatas` - List of metadata strings (parallel to valor_ids)
   * * `founder_valor_id` - Which valor_id is the Founder badge
   */
  initialize: ({founder, governor, treasury, member_valor_id, valor_ids, valor_rarities, valor_metadatas, founder_valor_id, signer}: {founder: string, governor: string, treasury: string, member_valor_id: u64, valor_ids: Array<u64>, valor_rarities: Array<u64>, valor_metadatas: Array<string>, founder_valor_id: u64, signer: Buffer}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a is_verified transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Check if a member has completed identity verification (ADR-003).
   * 
   * Returns false if the account is not registered.
   */
  is_verified: ({account}: {account: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a metadata_of transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get the metadata of a valor type
   */
  metadata_of: ({valor_id}: {valor_id: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a valor_id_of transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get the valor ID linked to a token
   */
  valor_id_of: ({token_id}: {token_id: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Option<u64>>>

  /**
   * Construct and simulate a set_verified transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Set the verification status of a member (ADR-003).
   * 
   * Governor-only. Used after identity verification is complete.
   * Unverified members cannot withdraw funds from the treasury.
   */
  set_verified: ({member, verified}: {member: string, verified: boolean}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a total_supply transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get total supply of minted tokens
   */
  total_supply: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a guardian_mint transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Mint a new soulbound NFT using backend signature (Guardian).
   * 
   * Payload: account | valor_id | nonce | expiry
   */
  guardian_mint: ({account, valor_id, signature, nonce, expiry}: {account: string, valor_id: u64, signature: Buffer, nonce: u64, expiry: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<u64>>>

  /**
   * Construct and simulate a self_register transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  self_register: ({caller, signature, nonce, expiry}: {caller: string, signature: Buffer, nonce: u64, expiry: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<u64>>>

  /**
   * Construct and simulate a calculate_mana transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Calculate Mana (voting power with Member Floor)
   * 
   * Formula: Mana = floor + bonus
   * - floor = MEMBER_FLOOR (fixed constant, e.g. 5)
   * - extra_level = level - floor
   * - bonus = (extra_level * time_remaining) / VACANCY_PERIOD
   * 
   * Inactive members decay to exactly MEMBER_FLOOR regardless of their
   * accumulated level. Legacy status offers zero protection against inactivity.
   */
  calculate_mana: ({level, permanent_level, expiry, current_time}: {level: u64, permanent_level: u64, expiry: u64, current_time: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a vacancy_period transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get the vacancy period (180 days in seconds)
   */
  vacancy_period: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a update_governor transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Update the governor contract address (migration path).
   * Only callable by the current governor.
   */
  update_governor: ({new_governor}: {new_governor: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a update_treasury transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Update the treasury contract address.
   * Only callable by the current governor.
   */
  update_treasury: ({new_treasury}: {new_treasury: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a has_voting_power transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Check if account has any active voting power
   * 
   * Any registered account (level > 0) always has at least MEMBER_FLOOR voting power.
   */
  has_voting_power: ({account}: {account: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a permanent_level_of transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get the permanent level of an account
   */
  permanent_level_of: ({account}: {account: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u64>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAAAAALtNaW50IGEgbmV3IHNvdWxib3VuZCBORlQgdG8gYW4gYWNjb3VudC4KClJlcXVpcmVzIGF1dGhvcml6YXRpb24gZnJvbSBhIHZhbGlkIG1pbnRlciBmb3IgdGhlIHNwZWNpZmljIGJhZGdlIGNhdGVnb3J5LgotIEdvdmVybmFuY2UvTGVhZGVyc2hpcC9UcmFjazogU2VlIFJCQUMgbWF0cml4Ci0gQ29tbXVuaXR5OiBBbnkgbWVtYmVyAAAAAARtaW50AAAAAwAAAAAAAAAGbWludGVyAAAAAAATAAAAAAAAAAlyZWNpcGllbnQAAAAAAAATAAAAAAAAAAh2YWxvcl9pZAAAAAYAAAABAAAD6QAAAAYAAAfQAAAADlZhbG9jcmFjeUVycm9yAAA=",
        "AAAAAAAAABVHZXQgdGhlIGNvbnRyYWN0IG5hbWUAAAAAAAAEbmFtZQAAAAAAAAABAAAAEA==",
        "AAAAAAAAAJpSZXZva2UgKGJ1cm4pIGEgYmFkZ2UgdG9rZW4uCgpHb3Zlcm5vci1vbmx5LiBSZW1vdmVzIHRoZSB0b2tlbiwgcmVkdWNlcyB0aGUgdXNlcidzIGxldmVsIGJ5CnRoZSBiYWRnZSdzIHJhcml0eSB2YWx1ZS4gVXNlZCBmb3IgZ292ZXJuYW5jZS1kZWNpZGVkIHJlbW92YWwuAAAAAAAGcmV2b2tlAAAAAAABAAAAAAAAAAh0b2tlbl9pZAAAAAYAAAABAAAD6QAAA+0AAAAAAAAH0AAAAA5WYWxvY3JhY3lFcnJvcgAA",
        "AAAAAAAAABdHZXQgdGhlIGNvbnRyYWN0IHN5bWJvbAAAAAAGc3ltYm9sAAAAAAAAAAAAAQAAABA=",
        "AAAAAAAAABdHZXQgdGhlIGZvdW5kZXIgYWRkcmVzcwAAAAAHZm91bmRlcgAAAAAAAAAAAQAAA+gAAAAT",
        "AAAAAAAAAGZVcGdyYWRlIHRoZSBjb250cmFjdCB0byBhIG5ldyBXQVNNIGhhc2guCk9ubHkgY2FsbGFibGUgYnkgdGhlIGdvdmVybm9yIChyZXF1aXJlcyBnb3Zlcm5hbmNlIHByb3Bvc2FsKS4AAAAAAAd1cGdyYWRlAAAAAAEAAAAAAAAADW5ld193YXNtX2hhc2gAAAAAAAPuAAAAIAAAAAEAAAPpAAAD7QAAAAAAAAfQAAAADlZhbG9jcmFjeUVycm9yAAA=",
        "AAAAAAAAACFHZXQgdGhlIGdvdmVybm9yIGNvbnRyYWN0IGFkZHJlc3MAAAAAAAAIZ292ZXJub3IAAAAAAAAAAQAAA+gAAAAT",
        "AAAAAAAAAC9HZXQgdGhlIHJhdyBsZXZlbCBvZiBhbiBhY2NvdW50ICh3aXRob3V0IGRlY2F5KQAAAAAIbGV2ZWxfb2YAAAABAAAAAAAAAAdhY2NvdW50AAAAABMAAAABAAAABg==",
        "AAAAAAAAABhHZXQgdGhlIG93bmVyIG9mIGEgdG9rZW4AAAAIb3duZXJfb2YAAAABAAAAAAAAAAh0b2tlbl9pZAAAAAYAAAABAAAD6AAAABM=",
        "AAAAAAAAACFHZXQgdGhlIHRyZWFzdXJ5IGNvbnRyYWN0IGFkZHJlc3MAAAAAAAAIdHJlYXN1cnkAAAAAAAAAAQAAA+gAAAAT",
        "AAAAAAAAACZHZXQgdGhlIGV4cGlyeSB0aW1lc3RhbXAgb2YgYW4gYWNjb3VudAAAAAAACWV4cGlyeV9vZgAAAAAAAAEAAAAAAAAAB2FjY291bnQAAAAAEwAAAAEAAAAG",
        "AAAAAAAAALhHZXQgdGhlIGN1cnJlbnQgdm90aW5nIHBvd2VyIChNYW5hKSBvZiBhbiBhY2NvdW50CgpNYW5hID0gTUVNQkVSX0ZMT09SICsgYm9udXMgKGRlY2F5IGFwcGxpZXMgdG8gZXh0cmFfbGV2ZWwgb25seSkKUmVnaXN0ZXJlZCBhY2NvdW50cyBhbHdheXMgcmV0YWluIGF0IGxlYXN0IE1FTUJFUl9GTE9PUiB2b3RpbmcgcG93ZXIuAAAACWdldF92b3RlcwAAAAAAAAEAAAAAAAAAB2FjY291bnQAAAAAEwAAAAEAAAAG",
        "AAAAAAAAAB5HZXQgdGhlIHJhcml0eSBvZiBhIHZhbG9yIHR5cGUAAAAAAAlyYXJpdHlfb2YAAAAAAAABAAAAAAAAAAh2YWxvcl9pZAAAAAYAAAABAAAABg==",
        "AAAAAAAAAHlDcmVhdGUgb3IgdXBkYXRlIGEgVmFsb3IgdHlwZSB3aXRoIHJhcml0eSBhbmQgbWV0YWRhdGEuCgpHb3Zlcm5vci1vbmx5LiBCYWRnZSB0eXBlIGNoYW5nZXMgcmVxdWlyZSBhIGdvdmVybmFuY2UgcHJvcG9zYWwuAAAAAAAACXNldF92YWxvcgAAAAAAAAMAAAAAAAAACHZhbG9yX2lkAAAABgAAAAAAAAAGcmFyaXR5AAAAAAAGAAAAAAAAAAhtZXRhZGF0YQAAABAAAAABAAAD6QAAA+0AAAAAAAAH0AAAAA5WYWxvY3JhY3lFcnJvcgAA",
        "AAAAAAAAAshJbml0aWFsaXplIHRoZSBWYWxvY3JhY3kgY29udHJhY3QuCgpObyBhZG1pbjogc2V0cyBhbGwgY29uZmlndXJhdGlvbiBhdCBvbmNlLiBSZWdpc3RlcnMgaW5pdGlhbCB2YWxvciB0eXBlcywKbWludHMgdGhlIEZvdW5kZXIgYmFkZ2UsIGFuZCBzdG9yZXMgdGhlIG1lbWJlciBiYWRnZSBJRCBmb3Igc2VsZi1yZWdpc3RyYXRpb24uCgojIEFyZ3VtZW50cwoqIGBmb3VuZGVyYCAtIEFkZHJlc3MgdGhhdCByZWNlaXZlcyB0aGUgcGVybWFuZW50IEZvdW5kZXIgYmFkZ2UKKiBgZ292ZXJub3JgIC0gR292ZXJub3IgY29udHJhY3QgYWRkcmVzcwoqIGB0cmVhc3VyeWAgLSBUcmVhc3VyeSBjb250cmFjdCBhZGRyZXNzCiogYG5hbWVgIC0gQ29udHJhY3QgbmFtZQoqIGBzeW1ib2xgIC0gQ29udHJhY3Qgc3ltYm9sCiogYG1lbWJlcl92YWxvcl9pZGAgLSBWYWxvciBJRCB1c2VkIGJ5IHNlbGZfcmVnaXN0ZXIoKSAodGhlIE1lbWJlciBiYWRnZSkKKiBgdmFsb3JfaWRzYCAtIExpc3Qgb2YgdmFsb3IgSURzIHRvIHJlZ2lzdGVyCiogYHZhbG9yX3Jhcml0aWVzYCAtIExpc3Qgb2YgcmFyaXRpZXMgKHBhcmFsbGVsIHRvIHZhbG9yX2lkcykKKiBgdmFsb3JfbWV0YWRhdGFzYCAtIExpc3Qgb2YgbWV0YWRhdGEgc3RyaW5ncyAocGFyYWxsZWwgdG8gdmFsb3JfaWRzKQoqIGBmb3VuZGVyX3ZhbG9yX2lkYCAtIFdoaWNoIHZhbG9yX2lkIGlzIHRoZSBGb3VuZGVyIGJhZGdlAAAACmluaXRpYWxpemUAAAAAAAkAAAAAAAAAB2ZvdW5kZXIAAAAAEwAAAAAAAAAIZ292ZXJub3IAAAATAAAAAAAAAAh0cmVhc3VyeQAAABMAAAAAAAAAD21lbWJlcl92YWxvcl9pZAAAAAAGAAAAAAAAAAl2YWxvcl9pZHMAAAAAAAPqAAAABgAAAAAAAAAOdmFsb3JfcmFyaXRpZXMAAAAAA+oAAAAGAAAAAAAAAA92YWxvcl9tZXRhZGF0YXMAAAAD6gAAABAAAAAAAAAAEGZvdW5kZXJfdmFsb3JfaWQAAAAGAAAAAAAAAAZzaWduZXIAAAAAA+4AAAAgAAAAAQAAA+kAAAPtAAAAAAAAB9AAAAAOVmFsb2NyYWN5RXJyb3IAAA==",
        "AAAAAAAAAHFDaGVjayBpZiBhIG1lbWJlciBoYXMgY29tcGxldGVkIGlkZW50aXR5IHZlcmlmaWNhdGlvbiAoQURSLTAwMykuCgpSZXR1cm5zIGZhbHNlIGlmIHRoZSBhY2NvdW50IGlzIG5vdCByZWdpc3RlcmVkLgAAAAAAAAtpc192ZXJpZmllZAAAAAABAAAAAAAAAAdhY2NvdW50AAAAABMAAAABAAAAAQ==",
        "AAAAAAAAACBHZXQgdGhlIG1ldGFkYXRhIG9mIGEgdmFsb3IgdHlwZQAAAAttZXRhZGF0YV9vZgAAAAABAAAAAAAAAAh2YWxvcl9pZAAAAAYAAAABAAAAEA==",
        "AAAAAAAAACJHZXQgdGhlIHZhbG9yIElEIGxpbmtlZCB0byBhIHRva2VuAAAAAAALdmFsb3JfaWRfb2YAAAAAAQAAAAAAAAAIdG9rZW5faWQAAAAGAAAAAQAAA+gAAAAG",
        "AAAAAAAAAKxTZXQgdGhlIHZlcmlmaWNhdGlvbiBzdGF0dXMgb2YgYSBtZW1iZXIgKEFEUi0wMDMpLgoKR292ZXJub3Itb25seS4gVXNlZCBhZnRlciBpZGVudGl0eSB2ZXJpZmljYXRpb24gaXMgY29tcGxldGUuClVudmVyaWZpZWQgbWVtYmVycyBjYW5ub3Qgd2l0aGRyYXcgZnVuZHMgZnJvbSB0aGUgdHJlYXN1cnkuAAAADHNldF92ZXJpZmllZAAAAAIAAAAAAAAABm1lbWJlcgAAAAAAEwAAAAAAAAAIdmVyaWZpZWQAAAABAAAAAQAAA+kAAAPtAAAAAAAAB9AAAAAOVmFsb2NyYWN5RXJyb3IAAA==",
        "AAAAAAAAACFHZXQgdG90YWwgc3VwcGx5IG9mIG1pbnRlZCB0b2tlbnMAAAAAAAAMdG90YWxfc3VwcGx5AAAAAAAAAAEAAAAG",
        "AAAAAAAAAGpNaW50IGEgbmV3IHNvdWxib3VuZCBORlQgdXNpbmcgYmFja2VuZCBzaWduYXR1cmUgKEd1YXJkaWFuKS4KClBheWxvYWQ6IGFjY291bnQgfCB2YWxvcl9pZCB8IG5vbmNlIHwgZXhwaXJ5AAAAAAANZ3VhcmRpYW5fbWludAAAAAAAAAUAAAAAAAAAB2FjY291bnQAAAAAEwAAAAAAAAAIdmFsb3JfaWQAAAAGAAAAAAAAAAlzaWduYXR1cmUAAAAAAAPuAAAAQAAAAAAAAAAFbm9uY2UAAAAAAAAGAAAAAAAAAAZleHBpcnkAAAAAAAYAAAABAAAD6QAAAAYAAAfQAAAADlZhbG9jcmFjeUVycm9yAAA=",
        "AAAAAAAAAAAAAAANc2VsZl9yZWdpc3RlcgAAAAAAAAQAAAAAAAAABmNhbGxlcgAAAAAAEwAAAAAAAAAJc2lnbmF0dXJlAAAAAAAD7gAAAEAAAAAAAAAABW5vbmNlAAAAAAAABgAAAAAAAAAGZXhwaXJ5AAAAAAAGAAAAAQAAA+kAAAAGAAAH0AAAAA5WYWxvY3JhY3lFcnJvcgAA",
        "AAAAAAAAAWZDYWxjdWxhdGUgTWFuYSAodm90aW5nIHBvd2VyIHdpdGggTWVtYmVyIEZsb29yKQoKRm9ybXVsYTogTWFuYSA9IGZsb29yICsgYm9udXMKLSBmbG9vciA9IE1FTUJFUl9GTE9PUiAoZml4ZWQgY29uc3RhbnQsIGUuZy4gNSkKLSBleHRyYV9sZXZlbCA9IGxldmVsIC0gZmxvb3IKLSBib251cyA9IChleHRyYV9sZXZlbCAqIHRpbWVfcmVtYWluaW5nKSAvIFZBQ0FOQ1lfUEVSSU9ECgpJbmFjdGl2ZSBtZW1iZXJzIGRlY2F5IHRvIGV4YWN0bHkgTUVNQkVSX0ZMT09SIHJlZ2FyZGxlc3Mgb2YgdGhlaXIKYWNjdW11bGF0ZWQgbGV2ZWwuIExlZ2FjeSBzdGF0dXMgb2ZmZXJzIHplcm8gcHJvdGVjdGlvbiBhZ2FpbnN0IGluYWN0aXZpdHkuAAAAAAAOY2FsY3VsYXRlX21hbmEAAAAAAAQAAAAAAAAABWxldmVsAAAAAAAABgAAAAAAAAAPcGVybWFuZW50X2xldmVsAAAAAAYAAAAAAAAABmV4cGlyeQAAAAAABgAAAAAAAAAMY3VycmVudF90aW1lAAAABgAAAAEAAAAG",
        "AAAAAAAAACxHZXQgdGhlIHZhY2FuY3kgcGVyaW9kICgxODAgZGF5cyBpbiBzZWNvbmRzKQAAAA52YWNhbmN5X3BlcmlvZAAAAAAAAAAAAAEAAAAG",
        "AAAAAAAAAF1VcGRhdGUgdGhlIGdvdmVybm9yIGNvbnRyYWN0IGFkZHJlc3MgKG1pZ3JhdGlvbiBwYXRoKS4KT25seSBjYWxsYWJsZSBieSB0aGUgY3VycmVudCBnb3Zlcm5vci4AAAAAAAAPdXBkYXRlX2dvdmVybm9yAAAAAAEAAAAAAAAADG5ld19nb3Zlcm5vcgAAABMAAAABAAAD6QAAA+0AAAAAAAAH0AAAAA5WYWxvY3JhY3lFcnJvcgAA",
        "AAAAAAAAAExVcGRhdGUgdGhlIHRyZWFzdXJ5IGNvbnRyYWN0IGFkZHJlc3MuCk9ubHkgY2FsbGFibGUgYnkgdGhlIGN1cnJlbnQgZ292ZXJub3IuAAAAD3VwZGF0ZV90cmVhc3VyeQAAAAABAAAAAAAAAAxuZXdfdHJlYXN1cnkAAAATAAAAAQAAA+kAAAPtAAAAAAAAB9AAAAAOVmFsb2NyYWN5RXJyb3IAAA==",
        "AAAAAAAAAH9DaGVjayBpZiBhY2NvdW50IGhhcyBhbnkgYWN0aXZlIHZvdGluZyBwb3dlcgoKQW55IHJlZ2lzdGVyZWQgYWNjb3VudCAobGV2ZWwgPiAwKSBhbHdheXMgaGFzIGF0IGxlYXN0IE1FTUJFUl9GTE9PUiB2b3RpbmcgcG93ZXIuAAAAABBoYXNfdm90aW5nX3Bvd2VyAAAAAQAAAAAAAAAHYWNjb3VudAAAAAATAAAAAQAAAAE=",
        "AAAAAAAAACVHZXQgdGhlIHBlcm1hbmVudCBsZXZlbCBvZiBhbiBhY2NvdW50AAAAAAAAEnBlcm1hbmVudF9sZXZlbF9vZgAAAAAAAQAAAAAAAAAHYWNjb3VudAAAAAATAAAAAQAAAAY=",
        "AAAAAQAAAC5WYWxvciB0eXBlIGRlZmluaXRpb24gd2l0aCByYXJpdHkgYW5kIG1ldGFkYXRhAAAAAAAAAAAABVZhbG9yAAAAAAAAAgAAAChNZXRhZGF0YSBzdHJpbmcgKGUuZy4sIGRlc2NyaXB0aW9uLCBVUkkpAAAACG1ldGFkYXRhAAAAEAAAAClUaGUgcmFyaXR5IG11bHRpcGxpZXIgZm9yIHRoaXMgdmFsb3IgdHlwZQAAAAAAAAZyYXJpdHkAAAAAAAY=",
        "AAAAAQAAAC5Vc2VyIHN0YXRpc3RpY3MgaW5jbHVkaW5nIGxldmVsIGFuZCBleHBpcmF0aW9uAAAAAAAAAAAACVVzZXJTdGF0cwAAAAAAAAQAAAAnVGhlIGV4cGlyYXRpb24gdGltZXN0YW1wIChVbml4IHNlY29uZHMpAAAAAAZleHBpcnkAAAAAAAYAAAAgVGhlIGFjY3VtdWxhdGVkIGdvdmVybmFuY2UgbGV2ZWwAAAAFbGV2ZWwAAAAAAAAGAAAARlRoZSBwZXJtYW5lbnQgcG9ydGlvbiBvZiBsZXZlbCB0aGF0IG5ldmVyIGRlY2F5cyAoZS5nLiwgRm91bmRlciBiYWRnZSkAAAAAAA9wZXJtYW5lbnRfbGV2ZWwAAAAABgAAADZXaGV0aGVyIHRoZSB1c2VyIGhhcyB2ZXJpZmllZCB0aGVpciBpZGVudGl0eSAoQURSLTAwMykAAAAAAAh2ZXJpZmllZAAAAAE=",
        "AAAABAAAAAAAAAAAAAAADlZhbG9jcmFjeUVycm9yAAAAAAAPAAAAJUNvbnRyYWN0IGhhcyBhbHJlYWR5IGJlZW4gaW5pdGlhbGl6ZWQAAAAAAAASQWxyZWFkeUluaXRpYWxpemVkAAAAAAABAAAAIUNvbnRyYWN0IGhhcyBub3QgYmVlbiBpbml0aWFsaXplZAAAAAAAAA5Ob3RJbml0aWFsaXplZAAAAAAAAgAAADtDYWxsZXIgaXMgbm90IGF1dGhvcml6ZWQgKG5vdCBhIG1lbWJlciBvciBub3QgdGhlIGdvdmVybm9yKQAAAAANTm90QXV0aG9yaXplZAAAAAAAAAMAAAAXVmFsb3IgSUQgZG9lcyBub3QgZXhpc3QAAAAAEE5vbkV4aXN0ZW50VmFsb3IAAAAEAAAAF1Rva2VuIElEIGRvZXMgbm90IGV4aXN0AAAAABBOb25FeGlzdGVudFRva2VuAAAABQAAABZBY2NvdW50IGRvZXMgbm90IGV4aXN0AAAAAAASTm9uRXhpc3RlbnRBY2NvdW50AAAAAAAGAAAALFRva2VuIGlzIHNvdWxib3VuZCBhbmQgY2Fubm90IGJlIHRyYW5zZmVycmVkAAAADlRva2VuU291bGJvdW5kAAAAAAAHAAAANVVzZXIgaGFzIGFscmVhZHkgc2VsZi1yZWdpc3RlcmVkIChoYXMgYSBNZW1iZXIgYmFkZ2UpAAAAAAAAEUFscmVhZHlSZWdpc3RlcmVkAAAAAAAACAAAABFJbnZhbGlkIHNpZ25hdHVyZQAAAAAAABBJbnZhbGlkU2lnbmF0dXJlAAAACQAAABJOb25jZSBhbHJlYWR5IHVzZWQAAAAAAAlOb25jZVVzZWQAAAAAAAAKAAAAEVNpZ25hdHVyZSBleHBpcmVkAAAAAAAAEFNpZ25hdHVyZUV4cGlyZWQAAAALAAAAEEludmFsaWQgVmFsb3IgSUQAAAAOSW52YWxpZFZhbG9ySWQAAAAAAAwAAAATTWludCBub3QgYXV0aG9yaXplZAAAAAARTWludE5vdEF1dGhvcml6ZWQAAAAAAAANAAAAEkJhZGdlIG5vdCBtaW50YWJsZQAAAAAAEEJhZGdlTm90TWludGFibGUAAAAOAAAAE1JlZW50cmFuY3kgZGV0ZWN0ZWQAAAAAElJlZW50cmFuY3lEZXRlY3RlZAAAAAAADw==",
        "AAAAAgAAAB1TdG9yYWdlIGtleXMgZm9yIHRoZSBjb250cmFjdAAAAAAAAAAAAAAHRGF0YUtleQAAAAANAAAAAAAAAEpBZG1pbiBhZGRyZXNzIChrZXB0IGZvciBiYWNrd2FyZCBjb21wYXQgZHVyaW5nIG1pZ3JhdGlvbiwgd2lsbCBiZSByZW1vdmVkKQAAAAAABUFkbWluAAAAAAAAAAAAAClXaGV0aGVyIHRoZSBjb250cmFjdCBoYXMgYmVlbiBpbml0aWFsaXplZAAAAAAAAAtJbml0aWFsaXplZAAAAAAAAAAAMkZvdW5kZXIgYWRkcmVzcyAocmVjZWl2ZXMgcGVybWFuZW50IEZvdW5kZXIgYmFkZ2UpAAAAAAAHRm91bmRlcgAAAAAAAAAAGUdvdmVybm9yIGNvbnRyYWN0IGFkZHJlc3MAAAAAAAAIR292ZXJub3IAAAAAAAAAGVRyZWFzdXJ5IGNvbnRyYWN0IGFkZHJlc3MAAAAAAAAIVHJlYXN1cnkAAAAAAAAAFlRvdGFsIHN1cHBseSBvZiB0b2tlbnMAAAAAAAtUb3RhbFN1cHBseQAAAAAAAAAAOVRoZSB2YWxvcl9pZCB1c2VkIGJ5IHNlbGZfcmVnaXN0ZXIoKSBmb3IgdGhlIE1lbWJlciBiYWRnZQAAAAAAAA1NZW1iZXJWYWxvcklkAAAAAAAAAQAAABxUb2tlbiBJRCAtPiBWYWxvciBJRCBtYXBwaW5nAAAADFRva2VuVmFsb3JJZAAAAAEAAAAGAAAAAQAAAB5WYWxvciBJRCAtPiBWYWxvciBkYXRhIG1hcHBpbmcAAAAAAAlWYWxvckRhdGEAAAAAAAABAAAABgAAAAEAAAAcQWNjb3VudCAtPiBVc2VyU3RhdHMgbWFwcGluZwAAAAlVc2VyU3RhdHMAAAAAAAABAAAAEwAAAAEAAAAhVG9rZW4gSUQgLT4gT3duZXIgYWRkcmVzcyBtYXBwaW5nAAAAAAAAClRva2VuT3duZXIAAAAAAAEAAAAGAAAAAAAAAC1CYWNrZW5kIHB1YmxpYyBrZXkgZm9yIHNpZ25hdHVyZSB2ZXJpZmljYXRpb24AAAAAAAAGU2lnbmVyAAAAAAABAAAAOVVzZWQgbm9uY2VzIGZvciByZXBsYXkgcHJvdGVjdGlvbjogKEFkZHJlc3MsIHU2NCkgLT4gYm9vbAAAAAAAAAlVc2VkTm9uY2UAAAAAAAACAAAAEwAAAAY=" ]),
      options
    )
  }

}