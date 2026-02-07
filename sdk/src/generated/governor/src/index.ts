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




export const GovernorError = {
  1: {message:"AlreadyInitialized"},
  2: {message:"NotInitialized"},
  3: {message:"NotAuthorized"},
  4: {message:"ProposalNotFound"},
  5: {message:"VotingNotStarted"},
  6: {message:"VotingEnded"},
  7: {message:"AlreadyVoted"},
  8: {message:"NoVotingPower"},
  9: {message:"ProposalNotSucceeded"},
  10: {message:"ProposalAlreadyExecuted"},
  11: {message:"InvalidProposalState"},
  12: {message:"NotAMember"},
  13: {message:"ReentrancyDetected"}
}


export interface GovernanceConfig {
  /**
 * Minimum Mana required to create a proposal
 */
proposal_threshold: u64;
  /**
 * Percentage of votes required for a proposal to pass (e.g. 51)
 */
quorum_percentage: u64;
  /**
 * Voting delay in seconds (time between proposal creation and voting start)
 */
voting_delay: u64;
  /**
 * Voting period in seconds (duration of voting)
 */
voting_period: u64;
}

/**
 * Storage keys for the Governor contract
 */
export type DataKey = {tag: "Valocracy", values: void} | {tag: "ProposalCount", values: void} | {tag: "Proposal", values: readonly [u64]} | {tag: "Vote", values: readonly [u64, string]} | {tag: "ReentrancyLock", values: void} | {tag: "Config", values: void};


/**
 * An action to execute when proposal succeeds
 */
export interface Action {
  /**
 * Arguments as raw vals (simplified)
 */
args: Array<any>;
  /**
 * Contract to call
 */
contract_id: string;
  /**
 * Function name to invoke
 */
function: string;
}


/**
 * A governance proposal
 */
export interface Proposal {
  /**
 * Actions to execute on success
 */
actions: Array<Action>;
  /**
 * Total votes against
 */
against_votes: u64;
  /**
 * Description of the proposal
 */
description: string;
  /**
 * Timestamp when voting ends
 */
end_time: u64;
  /**
 * Whether the proposal has been executed
 */
executed: boolean;
  /**
 * Total votes in favor
 */
for_votes: u64;
  /**
 * Unique proposal ID
 */
id: u64;
  /**
 * Address that created the proposal
 */
proposer: string;
  /**
 * Timestamp when voting starts
 */
start_time: u64;
}

/**
 * Proposal state enum
 */
export enum ProposalState {
  Pending = 0,
  Active = 1,
  Succeeded = 2,
  Defeated = 3,
  Executed = 4,
}

export interface Client {
  /**
   * Construct and simulate a execute transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Execute a succeeded proposal
   */
  execute: ({proposal_id}: {proposal_id: u64}, options?: {
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
   * Construct and simulate a propose transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Create a new proposal.
   * 
   * Open to any member (level > 0 in the Valocracy contract).
   */
  propose: ({proposer, description, actions}: {proposer: string, description: string, actions: Array<Action>}, options?: {
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
   * Construct and simulate a upgrade transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Upgrade the contract to a new WASM hash.
   * Only callable by the governor itself (requires governance proposal).
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
   * Construct and simulate a cast_vote transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Cast a vote on a proposal
   */
  cast_vote: ({voter, proposal_id, support}: {voter: string, proposal_id: u64, support: boolean}, options?: {
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
   * Construct and simulate a has_voted transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Check if an account has voted on a proposal
   */
  has_voted: ({proposal_id, voter}: {proposal_id: u64, voter: string}, options?: {
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
   * Initialize the Governor contract.
   * 
   * No admin: only stores the Valocracy contract address for membership checks
   * and voting power queries.
   */
  initialize: ({valocracy}: {valocracy: string}, options?: {
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
   * Construct and simulate a get_proposal transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get a proposal by ID
   */
  get_proposal: ({proposal_id}: {proposal_id: u64}, options?: {
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
  }) => Promise<AssembledTransaction<Option<Proposal>>>

  /**
   * Construct and simulate a update_config transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Update governance configuration.
   * Only callable by the Governor (self-governance).
   */
  update_config: ({config}: {config: GovernanceConfig}, options?: {
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
   * Construct and simulate a proposal_count transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get the number of proposals
   */
  proposal_count: (options?: {
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
   * Construct and simulate a get_proposal_state transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get the current state of a proposal
   */
  get_proposal_state: ({proposal_id}: {proposal_id: u64}, options?: {
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
  }) => Promise<AssembledTransaction<Result<ProposalState>>>

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
      new ContractSpec([ "AAAAAAAAABxFeGVjdXRlIGEgc3VjY2VlZGVkIHByb3Bvc2FsAAAAB2V4ZWN1dGUAAAAAAQAAAAAAAAALcHJvcG9zYWxfaWQAAAAABgAAAAEAAAPpAAAD7QAAAAAAAAfQAAAADUdvdmVybm9yRXJyb3IAAAA=",
        "AAAAAAAAAFFDcmVhdGUgYSBuZXcgcHJvcG9zYWwuCgpPcGVuIHRvIGFueSBtZW1iZXIgKGxldmVsID4gMCBpbiB0aGUgVmFsb2NyYWN5IGNvbnRyYWN0KS4AAAAAAAAHcHJvcG9zZQAAAAADAAAAAAAAAAhwcm9wb3NlcgAAABMAAAAAAAAAC2Rlc2NyaXB0aW9uAAAAABAAAAAAAAAAB2FjdGlvbnMAAAAD6gAAB9AAAAAGQWN0aW9uAAAAAAABAAAD6QAAAAYAAAfQAAAADUdvdmVybm9yRXJyb3IAAAA=",
        "AAAAAAAAAG1VcGdyYWRlIHRoZSBjb250cmFjdCB0byBhIG5ldyBXQVNNIGhhc2guCk9ubHkgY2FsbGFibGUgYnkgdGhlIGdvdmVybm9yIGl0c2VsZiAocmVxdWlyZXMgZ292ZXJuYW5jZSBwcm9wb3NhbCkuAAAAAAAAB3VwZ3JhZGUAAAAAAQAAAAAAAAANbmV3X3dhc21faGFzaAAAAAAAA+4AAAAgAAAAAQAAA+kAAAPtAAAAAAAAB9AAAAANR292ZXJub3JFcnJvcgAAAA==",
        "AAAAAAAAABlDYXN0IGEgdm90ZSBvbiBhIHByb3Bvc2FsAAAAAAAACWNhc3Rfdm90ZQAAAAAAAAMAAAAAAAAABXZvdGVyAAAAAAAAEwAAAAAAAAALcHJvcG9zYWxfaWQAAAAABgAAAAAAAAAHc3VwcG9ydAAAAAABAAAAAQAAA+kAAAAGAAAH0AAAAA1Hb3Zlcm5vckVycm9yAAAA",
        "AAAAAAAAACtDaGVjayBpZiBhbiBhY2NvdW50IGhhcyB2b3RlZCBvbiBhIHByb3Bvc2FsAAAAAAloYXNfdm90ZWQAAAAAAAACAAAAAAAAAAtwcm9wb3NhbF9pZAAAAAAGAAAAAAAAAAV2b3RlcgAAAAAAABMAAAABAAAAAQ==",
        "AAAAAAAAAB5HZXQgdmFsb2NyYWN5IGNvbnRyYWN0IGFkZHJlc3MAAAAAAAl2YWxvY3JhY3kAAAAAAAAAAAAAAQAAA+gAAAAT",
        "AAAAAAAAAIdJbml0aWFsaXplIHRoZSBHb3Zlcm5vciBjb250cmFjdC4KCk5vIGFkbWluOiBvbmx5IHN0b3JlcyB0aGUgVmFsb2NyYWN5IGNvbnRyYWN0IGFkZHJlc3MgZm9yIG1lbWJlcnNoaXAgY2hlY2tzCmFuZCB2b3RpbmcgcG93ZXIgcXVlcmllcy4AAAAACmluaXRpYWxpemUAAAAAAAEAAAAAAAAACXZhbG9jcmFjeQAAAAAAABMAAAABAAAD6QAAA+0AAAAAAAAH0AAAAA1Hb3Zlcm5vckVycm9yAAAA",
        "AAAAAAAAABRHZXQgYSBwcm9wb3NhbCBieSBJRAAAAAxnZXRfcHJvcG9zYWwAAAABAAAAAAAAAAtwcm9wb3NhbF9pZAAAAAAGAAAAAQAAA+gAAAfQAAAACFByb3Bvc2Fs",
        "AAAAAAAAAFFVcGRhdGUgZ292ZXJuYW5jZSBjb25maWd1cmF0aW9uLgpPbmx5IGNhbGxhYmxlIGJ5IHRoZSBHb3Zlcm5vciAoc2VsZi1nb3Zlcm5hbmNlKS4AAAAAAAANdXBkYXRlX2NvbmZpZwAAAAAAAAEAAAAAAAAABmNvbmZpZwAAAAAH0AAAABBHb3Zlcm5hbmNlQ29uZmlnAAAAAQAAA+kAAAPtAAAAAAAAB9AAAAANR292ZXJub3JFcnJvcgAAAA==",
        "AAAAAAAAABtHZXQgdGhlIG51bWJlciBvZiBwcm9wb3NhbHMAAAAADnByb3Bvc2FsX2NvdW50AAAAAAAAAAAAAQAAAAY=",
        "AAAABAAAAAAAAAAAAAAADUdvdmVybm9yRXJyb3IAAAAAAAANAAAAAAAAABJBbHJlYWR5SW5pdGlhbGl6ZWQAAAAAAAEAAAAAAAAADk5vdEluaXRpYWxpemVkAAAAAAACAAAAAAAAAA1Ob3RBdXRob3JpemVkAAAAAAAAAwAAAAAAAAAQUHJvcG9zYWxOb3RGb3VuZAAAAAQAAAAAAAAAEFZvdGluZ05vdFN0YXJ0ZWQAAAAFAAAAAAAAAAtWb3RpbmdFbmRlZAAAAAAGAAAAAAAAAAxBbHJlYWR5Vm90ZWQAAAAHAAAAAAAAAA1Ob1ZvdGluZ1Bvd2VyAAAAAAAACAAAAAAAAAAUUHJvcG9zYWxOb3RTdWNjZWVkZWQAAAAJAAAAAAAAABdQcm9wb3NhbEFscmVhZHlFeGVjdXRlZAAAAAAKAAAAAAAAABRJbnZhbGlkUHJvcG9zYWxTdGF0ZQAAAAsAAAAAAAAACk5vdEFNZW1iZXIAAAAAAAwAAAAAAAAAElJlZW50cmFuY3lEZXRlY3RlZAAAAAAADQ==",
        "AAAAAAAAACNHZXQgdGhlIGN1cnJlbnQgc3RhdGUgb2YgYSBwcm9wb3NhbAAAAAASZ2V0X3Byb3Bvc2FsX3N0YXRlAAAAAAABAAAAAAAAAAtwcm9wb3NhbF9pZAAAAAAGAAAAAQAAA+kAAAfQAAAADVByb3Bvc2FsU3RhdGUAAAAAAAfQAAAADUdvdmVybm9yRXJyb3IAAAA=",
        "AAAAAQAAAAAAAAAAAAAAEEdvdmVybmFuY2VDb25maWcAAAAEAAAAKk1pbmltdW0gTWFuYSByZXF1aXJlZCB0byBjcmVhdGUgYSBwcm9wb3NhbAAAAAAAEnByb3Bvc2FsX3RocmVzaG9sZAAAAAAABgAAAD1QZXJjZW50YWdlIG9mIHZvdGVzIHJlcXVpcmVkIGZvciBhIHByb3Bvc2FsIHRvIHBhc3MgKGUuZy4gNTEpAAAAAAAAEXF1b3J1bV9wZXJjZW50YWdlAAAAAAAABgAAAElWb3RpbmcgZGVsYXkgaW4gc2Vjb25kcyAodGltZSBiZXR3ZWVuIHByb3Bvc2FsIGNyZWF0aW9uIGFuZCB2b3Rpbmcgc3RhcnQpAAAAAAAADHZvdGluZ19kZWxheQAAAAYAAAAtVm90aW5nIHBlcmlvZCBpbiBzZWNvbmRzIChkdXJhdGlvbiBvZiB2b3RpbmcpAAAAAAAADXZvdGluZ19wZXJpb2QAAAAAAAAG",
        "AAAAAgAAACZTdG9yYWdlIGtleXMgZm9yIHRoZSBHb3Zlcm5vciBjb250cmFjdAAAAAAAAAAAAAdEYXRhS2V5AAAAAAYAAAAAAAAAGlZhbG9jcmFjeSBjb250cmFjdCBhZGRyZXNzAAAAAAAJVmFsb2NyYWN5AAAAAAAAAAAAABlUb3RhbCBudW1iZXIgb2YgcHJvcG9zYWxzAAAAAAAADVByb3Bvc2FsQ291bnQAAAAAAAABAAAAE1Byb3Bvc2FsIGRhdGEgYnkgSUQAAAAACFByb3Bvc2FsAAAAAQAAAAYAAAABAAAAM1ZvdGUgcmVjb3JkOiAocHJvcG9zYWxfaWQsIHZvdGVyKSAtPiBib29sIChzdXBwb3J0KQAAAAAEVm90ZQAAAAIAAAAGAAAAEwAAAAAAAAAPUmVlbnRyYW5jeSBsb2NrAAAAAA5SZWVudHJhbmN5TG9jawAAAAAAAAAAABhHb3Zlcm5hbmNlIGNvbmZpZ3VyYXRpb24AAAAGQ29uZmlnAAA=",
        "AAAAAQAAACtBbiBhY3Rpb24gdG8gZXhlY3V0ZSB3aGVuIHByb3Bvc2FsIHN1Y2NlZWRzAAAAAAAAAAAGQWN0aW9uAAAAAAADAAAAIkFyZ3VtZW50cyBhcyByYXcgdmFscyAoc2ltcGxpZmllZCkAAAAAAARhcmdzAAAD6gAAAAAAAAAQQ29udHJhY3QgdG8gY2FsbAAAAAtjb250cmFjdF9pZAAAAAATAAAAF0Z1bmN0aW9uIG5hbWUgdG8gaW52b2tlAAAAAAhmdW5jdGlvbgAAABE=",
        "AAAAAQAAABVBIGdvdmVybmFuY2UgcHJvcG9zYWwAAAAAAAAAAAAACFByb3Bvc2FsAAAACQAAAB1BY3Rpb25zIHRvIGV4ZWN1dGUgb24gc3VjY2VzcwAAAAAAAAdhY3Rpb25zAAAAA+oAAAfQAAAABkFjdGlvbgAAAAAAE1RvdGFsIHZvdGVzIGFnYWluc3QAAAAADWFnYWluc3Rfdm90ZXMAAAAAAAAGAAAAG0Rlc2NyaXB0aW9uIG9mIHRoZSBwcm9wb3NhbAAAAAALZGVzY3JpcHRpb24AAAAAEAAAABpUaW1lc3RhbXAgd2hlbiB2b3RpbmcgZW5kcwAAAAAACGVuZF90aW1lAAAABgAAACZXaGV0aGVyIHRoZSBwcm9wb3NhbCBoYXMgYmVlbiBleGVjdXRlZAAAAAAACGV4ZWN1dGVkAAAAAQAAABRUb3RhbCB2b3RlcyBpbiBmYXZvcgAAAAlmb3Jfdm90ZXMAAAAAAAAGAAAAElVuaXF1ZSBwcm9wb3NhbCBJRAAAAAAAAmlkAAAAAAAGAAAAIUFkZHJlc3MgdGhhdCBjcmVhdGVkIHRoZSBwcm9wb3NhbAAAAAAAAAhwcm9wb3NlcgAAABMAAAAcVGltZXN0YW1wIHdoZW4gdm90aW5nIHN0YXJ0cwAAAApzdGFydF90aW1lAAAAAAAG",
        "AAAAAwAAABNQcm9wb3NhbCBzdGF0ZSBlbnVtAAAAAAAAAAANUHJvcG9zYWxTdGF0ZQAAAAAAAAUAAAAbV2FpdGluZyBmb3Igdm90aW5nIHRvIHN0YXJ0AAAAAAdQZW5kaW5nAAAAAAAAAAAQVm90aW5nIGlzIGFjdGl2ZQAAAAZBY3RpdmUAAAAAAAEAAAAfUHJvcG9zYWwgc3VjY2VlZGVkIChxdW9ydW0gbWV0KQAAAAAJU3VjY2VlZGVkAAAAAAAAAgAAACJQcm9wb3NhbCBkZWZlYXRlZCAocXVvcnVtIG5vdCBtZXQpAAAAAAAIRGVmZWF0ZWQAAAADAAAAGlByb3Bvc2FsIGhhcyBiZWVuIGV4ZWN1dGVkAAAAAAAIRXhlY3V0ZWQAAAAE" ]),
      options
    )
  }
  public readonly fromJSON = {
    execute: this.txFromJSON<Result<void>>,
        propose: this.txFromJSON<Result<u64>>,
        upgrade: this.txFromJSON<Result<void>>,
        cast_vote: this.txFromJSON<Result<u64>>,
        has_voted: this.txFromJSON<boolean>,
        valocracy: this.txFromJSON<Option<string>>,
        initialize: this.txFromJSON<Result<void>>,
        get_proposal: this.txFromJSON<Option<Proposal>>,
        update_config: this.txFromJSON<Result<void>>,
        proposal_count: this.txFromJSON<u64>,
        get_proposal_state: this.txFromJSON<Result<ProposalState>>
  }
}