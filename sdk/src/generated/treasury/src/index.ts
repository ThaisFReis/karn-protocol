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




export const TreasuryError = {
  1: {message:"AlreadyInitialized"},
  2: {message:"NotInitialized"},
  3: {message:"NotAuthorized"},
  4: {message:"InsufficientShares"},
  5: {message:"InsufficientAssets"},
  6: {message:"ZeroAmount"},
  7: {message:"ReentrancyDetected"},
  8: {message:"MathOverflow"},
  9: {message:"LabNotFound"},
  10: {message:"LabNotActive"},
  11: {message:"InsufficientClaimable"}
}


/**
 * Lab Funding Struct
 */
export interface Lab {
  funder: string;
  id: u32;
  scholarship_per_member: i128;
  status: LabStatus;
  total_amount: i128;
}

/**
 * Storage keys for the Treasury contract
 */
export type DataKey = {tag: "Valocracy", values: void} | {tag: "Governor", values: void} | {tag: "AssetToken", values: void} | {tag: "TotalShares", values: void} | {tag: "UserShares", values: readonly [string]} | {tag: "ReentrancyLock", values: void} | {tag: "LabCounter", values: void} | {tag: "Lab", values: readonly [u32]} | {tag: "ClaimableBalance", values: readonly [string]};

/**
 * Status of a Lab
 */
export type LabStatus = {tag: "Active", values: void} | {tag: "Cancelled", values: void} | {tag: "Completed", values: void};

export interface Client {
  /**
   * Construct and simulate a asset transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get the underlying asset token address
   */
  asset: (options?: {
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
   * Construct and simulate a spend transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Spend treasury assets — only callable by the Governor contract
   * 
   * This is invoked as part of executing an approved governance proposal.
   */
  spend: ({receiver, amount}: {receiver: string, amount: i128}, options?: {
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
   * Construct and simulate a deposit transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Deposit shares to a user account
   * 
   * This is called by the Valocracy contract when minting NFTs.
   * Shares represent the user's claim on treasury assets.
   */
  deposit: ({receiver, shares}: {receiver: string, shares: i128}, options?: {
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
   * Construct and simulate a fund_lab transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Fund a new Lab (Scholarship)
   * 
   * Only callable by the funder.
   */
  fund_lab: ({funder, total_amount, scholarship_per_member}: {funder: string, total_amount: i128, scholarship_per_member: i128}, options?: {
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
  }) => Promise<AssembledTransaction<Result<u32>>>

  /**
   * Construct and simulate a governor transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get governor contract address
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
   * Construct and simulate a withdraw transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Withdraw assets by burning shares
   * 
   * Converts shares to underlying assets based on current ratio.
   */
  withdraw: ({caller, receiver, shares}: {caller: string, receiver: string, shares: i128}, options?: {
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
  }) => Promise<AssembledTransaction<Result<i128>>>

  /**
   * Construct and simulate a shares_of transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get shares for a specific user
   */
  shares_of: ({account}: {account: string}, options?: {
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
  }) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a valocracy transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get valocracy contract address
   */
  valocracy: (options?: {
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
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Initialize the Treasury contract.
   * 
   * No admin: stores valocracy, governor, and asset token addresses.
   * All privileged operations go through the governor (governance).
   */
  initialize: ({valocracy, governor, asset_token}: {valocracy: string, governor: string, asset_token: string}, options?: {
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
   * Construct and simulate a total_assets transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get total assets in the treasury by querying the actual token balance
   */
  total_assets: (options?: {
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
  }) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a total_shares transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get total shares outstanding
   */
  total_shares: (options?: {
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
  }) => Promise<AssembledTransaction<i128>>

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
   * Construct and simulate a preview_withdraw transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Preview how many assets a share amount would yield
   */
  preview_withdraw: ({shares}: {shares: i128}, options?: {
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
  }) => Promise<AssembledTransaction<Result<i128>>>

  /**
   * Construct and simulate a approve_scholarship transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Approve scholarship for a member
   * 
   * Releases scholarship funds to a member's claimable balance.
   * Only callable by governor (governance/admin/mentor approval).
   */
  approve_scholarship: ({lab_id, member}: {lab_id: u32, member: string}, options?: {
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
   * Construct and simulate a withdraw_scholarship transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Withdraw scholarship funds
   * 
   * Allows members to withdraw their approved scholarship funds.
   * Updated to check claimable balance instead of shares.
   */
  withdraw_scholarship: ({member, amount}: {member: string, amount: i128}, options?: {
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
   * Construct and simulate a get_claimable_balance transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get claimable balance for a member
   * 
   * Returns the amount of scholarship funds available for withdrawal.
   */
  get_claimable_balance: ({member}: {member: string}, options?: {
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
  }) => Promise<AssembledTransaction<i128>>

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
      new ContractSpec([ "AAAAAAAAACZHZXQgdGhlIHVuZGVybHlpbmcgYXNzZXQgdG9rZW4gYWRkcmVzcwAAAAAABWFzc2V0AAAAAAAAAAAAAAEAAAPoAAAAEw==",
        "AAAAAAAAAIdTcGVuZCB0cmVhc3VyeSBhc3NldHMg4oCUIG9ubHkgY2FsbGFibGUgYnkgdGhlIEdvdmVybm9yIGNvbnRyYWN0CgpUaGlzIGlzIGludm9rZWQgYXMgcGFydCBvZiBleGVjdXRpbmcgYW4gYXBwcm92ZWQgZ292ZXJuYW5jZSBwcm9wb3NhbC4AAAAABXNwZW5kAAAAAAAAAgAAAAAAAAAIcmVjZWl2ZXIAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAABAAAD6QAAA+0AAAAAAAAH0AAAAA1UcmVhc3VyeUVycm9yAAAA",
        "AAAAAAAAAJNEZXBvc2l0IHNoYXJlcyB0byBhIHVzZXIgYWNjb3VudAoKVGhpcyBpcyBjYWxsZWQgYnkgdGhlIFZhbG9jcmFjeSBjb250cmFjdCB3aGVuIG1pbnRpbmcgTkZUcy4KU2hhcmVzIHJlcHJlc2VudCB0aGUgdXNlcidzIGNsYWltIG9uIHRyZWFzdXJ5IGFzc2V0cy4AAAAAB2RlcG9zaXQAAAAAAgAAAAAAAAAIcmVjZWl2ZXIAAAATAAAAAAAAAAZzaGFyZXMAAAAAAAsAAAABAAAD6QAAA+0AAAAAAAAH0AAAAA1UcmVhc3VyeUVycm9yAAAA",
        "AAAAAAAAAGZVcGdyYWRlIHRoZSBjb250cmFjdCB0byBhIG5ldyBXQVNNIGhhc2guCk9ubHkgY2FsbGFibGUgYnkgdGhlIGdvdmVybm9yIChyZXF1aXJlcyBnb3Zlcm5hbmNlIHByb3Bvc2FsKS4AAAAAAAd1cGdyYWRlAAAAAAEAAAAAAAAADW5ld193YXNtX2hhc2gAAAAAAAPuAAAAIAAAAAEAAAPpAAAD7QAAAAAAAAfQAAAADVRyZWFzdXJ5RXJyb3IAAAA=",
        "AAAAAAAAADpGdW5kIGEgbmV3IExhYiAoU2Nob2xhcnNoaXApCgpPbmx5IGNhbGxhYmxlIGJ5IHRoZSBmdW5kZXIuAAAAAAAIZnVuZF9sYWIAAAADAAAAAAAAAAZmdW5kZXIAAAAAABMAAAAAAAAADHRvdGFsX2Ftb3VudAAAAAsAAAAAAAAAFnNjaG9sYXJzaGlwX3Blcl9tZW1iZXIAAAAAAAsAAAABAAAD6QAAAAQAAAfQAAAADVRyZWFzdXJ5RXJyb3IAAAA=",
        "AAAAAAAAAB1HZXQgZ292ZXJub3IgY29udHJhY3QgYWRkcmVzcwAAAAAAAAhnb3Zlcm5vcgAAAAAAAAABAAAD6AAAABM=",
        "AAAAAAAAAF9XaXRoZHJhdyBhc3NldHMgYnkgYnVybmluZyBzaGFyZXMKCkNvbnZlcnRzIHNoYXJlcyB0byB1bmRlcmx5aW5nIGFzc2V0cyBiYXNlZCBvbiBjdXJyZW50IHJhdGlvLgAAAAAId2l0aGRyYXcAAAADAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAACHJlY2VpdmVyAAAAEwAAAAAAAAAGc2hhcmVzAAAAAAALAAAAAQAAA+kAAAALAAAH0AAAAA1UcmVhc3VyeUVycm9yAAAA",
        "AAAAAAAAAB5HZXQgc2hhcmVzIGZvciBhIHNwZWNpZmljIHVzZXIAAAAAAAlzaGFyZXNfb2YAAAAAAAABAAAAAAAAAAdhY2NvdW50AAAAABMAAAABAAAACw==",
        "AAAAAAAAAB5HZXQgdmFsb2NyYWN5IGNvbnRyYWN0IGFkZHJlc3MAAAAAAAl2YWxvY3JhY3kAAAAAAAAAAAAAAQAAA+gAAAAT",
        "AAAAAAAAAKNJbml0aWFsaXplIHRoZSBUcmVhc3VyeSBjb250cmFjdC4KCk5vIGFkbWluOiBzdG9yZXMgdmFsb2NyYWN5LCBnb3Zlcm5vciwgYW5kIGFzc2V0IHRva2VuIGFkZHJlc3Nlcy4KQWxsIHByaXZpbGVnZWQgb3BlcmF0aW9ucyBnbyB0aHJvdWdoIHRoZSBnb3Zlcm5vciAoZ292ZXJuYW5jZSkuAAAAAAppbml0aWFsaXplAAAAAAADAAAAAAAAAAl2YWxvY3JhY3kAAAAAAAATAAAAAAAAAAhnb3Zlcm5vcgAAABMAAAAAAAAAC2Fzc2V0X3Rva2VuAAAAABMAAAABAAAD6QAAA+0AAAAAAAAH0AAAAA1UcmVhc3VyeUVycm9yAAAA",
        "AAAAAAAAAEVHZXQgdG90YWwgYXNzZXRzIGluIHRoZSB0cmVhc3VyeSBieSBxdWVyeWluZyB0aGUgYWN0dWFsIHRva2VuIGJhbGFuY2UAAAAAAAAMdG90YWxfYXNzZXRzAAAAAAAAAAEAAAAL",
        "AAAAAAAAABxHZXQgdG90YWwgc2hhcmVzIG91dHN0YW5kaW5nAAAADHRvdGFsX3NoYXJlcwAAAAAAAAABAAAACw==",
        "AAAAAAAAAF1VcGRhdGUgdGhlIGdvdmVybm9yIGNvbnRyYWN0IGFkZHJlc3MgKG1pZ3JhdGlvbiBwYXRoKS4KT25seSBjYWxsYWJsZSBieSB0aGUgY3VycmVudCBnb3Zlcm5vci4AAAAAAAAPdXBkYXRlX2dvdmVybm9yAAAAAAEAAAAAAAAADG5ld19nb3Zlcm5vcgAAABMAAAABAAAD6QAAA+0AAAAAAAAH0AAAAA1UcmVhc3VyeUVycm9yAAAA",
        "AAAABAAAAAAAAAAAAAAADVRyZWFzdXJ5RXJyb3IAAAAAAAALAAAAAAAAABJBbHJlYWR5SW5pdGlhbGl6ZWQAAAAAAAEAAAAAAAAADk5vdEluaXRpYWxpemVkAAAAAAACAAAAAAAAAA1Ob3RBdXRob3JpemVkAAAAAAAAAwAAAAAAAAASSW5zdWZmaWNpZW50U2hhcmVzAAAAAAAEAAAAAAAAABJJbnN1ZmZpY2llbnRBc3NldHMAAAAAAAUAAAAAAAAAClplcm9BbW91bnQAAAAAAAYAAAAAAAAAElJlZW50cmFuY3lEZXRlY3RlZAAAAAAABwAAAAAAAAAMTWF0aE92ZXJmbG93AAAACAAAAAAAAAALTGFiTm90Rm91bmQAAAAACQAAAAAAAAAMTGFiTm90QWN0aXZlAAAACgAAAAAAAAAVSW5zdWZmaWNpZW50Q2xhaW1hYmxlAAAAAAAACw==",
        "AAAAAAAAADJQcmV2aWV3IGhvdyBtYW55IGFzc2V0cyBhIHNoYXJlIGFtb3VudCB3b3VsZCB5aWVsZAAAAAAAEHByZXZpZXdfd2l0aGRyYXcAAAABAAAAAAAAAAZzaGFyZXMAAAAAAAsAAAABAAAD6QAAAAsAAAfQAAAADVRyZWFzdXJ5RXJyb3IAAAA=",
        "AAAAAAAAAJtBcHByb3ZlIHNjaG9sYXJzaGlwIGZvciBhIG1lbWJlcgoKUmVsZWFzZXMgc2Nob2xhcnNoaXAgZnVuZHMgdG8gYSBtZW1iZXIncyBjbGFpbWFibGUgYmFsYW5jZS4KT25seSBjYWxsYWJsZSBieSBnb3Zlcm5vciAoZ292ZXJuYW5jZS9hZG1pbi9tZW50b3IgYXBwcm92YWwpLgAAAAATYXBwcm92ZV9zY2hvbGFyc2hpcAAAAAACAAAAAAAAAAZsYWJfaWQAAAAAAAQAAAAAAAAABm1lbWJlcgAAAAAAEwAAAAEAAAPpAAAD7QAAAAAAAAfQAAAADVRyZWFzdXJ5RXJyb3IAAAA=",
        "AAAAAAAAAI5XaXRoZHJhdyBzY2hvbGFyc2hpcCBmdW5kcwoKQWxsb3dzIG1lbWJlcnMgdG8gd2l0aGRyYXcgdGhlaXIgYXBwcm92ZWQgc2Nob2xhcnNoaXAgZnVuZHMuClVwZGF0ZWQgdG8gY2hlY2sgY2xhaW1hYmxlIGJhbGFuY2UgaW5zdGVhZCBvZiBzaGFyZXMuAAAAAAAUd2l0aGRyYXdfc2Nob2xhcnNoaXAAAAACAAAAAAAAAAZtZW1iZXIAAAAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAEAAAPpAAAD7QAAAAAAAAfQAAAADVRyZWFzdXJ5RXJyb3IAAAA=",
        "AAAAAAAAAGVHZXQgY2xhaW1hYmxlIGJhbGFuY2UgZm9yIGEgbWVtYmVyCgpSZXR1cm5zIHRoZSBhbW91bnQgb2Ygc2Nob2xhcnNoaXAgZnVuZHMgYXZhaWxhYmxlIGZvciB3aXRoZHJhd2FsLgAAAAAAABVnZXRfY2xhaW1hYmxlX2JhbGFuY2UAAAAAAAABAAAAAAAAAAZtZW1iZXIAAAAAABMAAAABAAAACw==",
        "AAAAAQAAABJMYWIgRnVuZGluZyBTdHJ1Y3QAAAAAAAAAAAADTGFiAAAAAAUAAAAAAAAABmZ1bmRlcgAAAAAAEwAAAAAAAAACaWQAAAAAAAQAAAAAAAAAFnNjaG9sYXJzaGlwX3Blcl9tZW1iZXIAAAAAAAsAAAAAAAAABnN0YXR1cwAAAAAH0AAAAAlMYWJTdGF0dXMAAAAAAAAAAAAADHRvdGFsX2Ftb3VudAAAAAs=",
        "AAAAAgAAACZTdG9yYWdlIGtleXMgZm9yIHRoZSBUcmVhc3VyeSBjb250cmFjdAAAAAAAAAAAAAdEYXRhS2V5AAAAAAkAAAAAAAAAGlZhbG9jcmFjeSBjb250cmFjdCBhZGRyZXNzAAAAAAAJVmFsb2NyYWN5AAAAAAAAAAAAADFHb3Zlcm5vciBjb250cmFjdCBhZGRyZXNzIChhdXRob3JpemVkIGZvciBzcGVuZHMpAAAAAAAACEdvdmVybm9yAAAAAAAAABZVbmRlcmx5aW5nIGFzc2V0IHRva2VuAAAAAAAKQXNzZXRUb2tlbgAAAAAAAAAAABhUb3RhbCBzaGFyZXMgb3V0c3RhbmRpbmcAAAALVG90YWxTaGFyZXMAAAAAAQAAABZVc2VyIGFkZHJlc3MgLT4gc2hhcmVzAAAAAAAKVXNlclNoYXJlcwAAAAAAAQAAABMAAAAAAAAAD1JlZW50cmFuY3kgbG9jawAAAAAOUmVlbnRyYW5jeUxvY2sAAAAAAAAAAAAfTGFiIGNvdW50ZXIgKGZvciBJRCBnZW5lcmF0aW9uKQAAAAAKTGFiQ291bnRlcgAAAAAAAQAAAA1MYWIgSUQgLT4gTGFiAAAAAAAAA0xhYgAAAAABAAAABAAAAAEAAAA1VXNlciBhZGRyZXNzIC0+IENsYWltYWJsZSBiYWxhbmNlIChTY2hvbGFyc2hpcCBmdW5kcykAAAAAAAAQQ2xhaW1hYmxlQmFsYW5jZQAAAAEAAAAT",
        "AAAAAgAAAA9TdGF0dXMgb2YgYSBMYWIAAAAAAAAAAAlMYWJTdGF0dXMAAAAAAAADAAAAAAAAAAAAAAAGQWN0aXZlAAAAAAAAAAAAAAAAAAlDYW5jZWxsZWQAAAAAAAAAAAAAAAAAAAlDb21wbGV0ZWQAAAA=" ]),
      options
    )
  }

}