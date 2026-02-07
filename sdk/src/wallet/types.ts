/**
 * Multi-wallet support types for Karn Protocol SDK
 *
 * Supports: Freighter, Albedo, Lobstr, xBull, Rabet
 */

/**
 * Supported wallet types
 */
export enum WalletType {
  FREIGHTER = 'freighter',
  ALBEDO = 'albedo',
  LOBSTR = 'lobstr',
  XBULL = 'xbull',
  RABET = 'rabet',
}

/**
 * Wallet connection state
 */
export interface WalletState {
  /** Whether wallet is connected */
  isConnected: boolean;

  /** Connected wallet address (Stellar public key) */
  address: string | null;

  /** Currently active wallet type */
  walletType: WalletType | null;

  /** Connection in progress */
  isConnecting: boolean;

  /** Error message if any */
  error: string | null;

  /** Wallet display name */
  walletName: string | null;
}

/**
 * Wallet metadata for UI display
 */
export interface WalletMetadata {
  /** Wallet type identifier */
  type: WalletType;

  /** Display name */
  name: string;

  /** Icon URL or data URI */
  icon?: string;

  /** Homepage URL */
  url: string;

  /** Chrome extension URL */
  chromeUrl?: string;

  /** Firefox addon URL */
  firefoxUrl?: string;

  /** Description */
  description: string;

  /** Is installed/available */
  isAvailable: boolean;
}

/**
 * Transaction signing options
 */
export interface SignTransactionOptions {
  /** Network passphrase (default: Testnet) */
  networkPassphrase?: string;

  /** Optional account sequence */
  accountToSign?: string;
}

/**
 * Wallet adapter interface
 *
 * Each wallet provider implements this interface
 */
export interface WalletAdapter {
  /** Wallet type */
  type: WalletType;

  /** Wallet metadata */
  metadata: WalletMetadata;

  /**
   * Check if wallet is installed/available
   */
  isAvailable(): Promise<boolean>;

  /**
   * Connect to wallet and request access
   * @returns Public key (Stellar address)
   */
  connect(): Promise<string>;

  /**
   * Disconnect from wallet
   */
  disconnect(): Promise<void>;

  /**
   * Get current connected address
   * @returns Public key or null if not connected
   */
  getAddress(): Promise<string | null>;

  /**
   * Check if wallet is currently connected
   */
  isConnected(): Promise<boolean>;

  /**
   * Sign a transaction
   * @param xdr Transaction XDR string
   * @param options Signing options
   * @returns Signed transaction XDR
   */
  signTransaction(xdr: string, options?: SignTransactionOptions): Promise<string>;

  /**
   * Sign arbitrary message (if supported)
   * @param message Message to sign
   * @returns Signature
   */
  signMessage?(message: string): Promise<string>;

  /**
   * Get network (if supported)
   * @returns Network name (e.g., 'TESTNET', 'PUBLIC')
   */
  getNetwork?(): Promise<string>;
}

/**
 * Wallet connection result
 */
export interface WalletConnection {
  /** Wallet type */
  walletType: WalletType;

  /** Connected address */
  address: string;

  /** Wallet adapter instance */
  adapter: WalletAdapter;
}

/**
 * Wallet event types
 */
export enum WalletEvent {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  ACCOUNT_CHANGED = 'accountChanged',
  NETWORK_CHANGED = 'networkChanged',
}

/**
 * Wallet event payload
 */
export interface WalletEventPayload {
  walletType: WalletType;
  address?: string;
  network?: string;
}

/**
 * Wallet event listener
 */
export type WalletEventListener = (payload: WalletEventPayload) => void;

/**
 * Wallet error types
 */
export class WalletError extends Error {
  constructor(
    message: string,
    public code: WalletErrorCode,
    public walletType?: WalletType
  ) {
    super(message);
    this.name = 'WalletError';
  }
}

export enum WalletErrorCode {
  NOT_INSTALLED = 'NOT_INSTALLED',
  USER_REJECTED = 'USER_REJECTED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SIGNING_FAILED = 'SIGNING_FAILED',
  NOT_CONNECTED = 'NOT_CONNECTED',
  ALREADY_CONNECTED = 'ALREADY_CONNECTED',
  UNSUPPORTED_METHOD = 'UNSUPPORTED_METHOD',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}
