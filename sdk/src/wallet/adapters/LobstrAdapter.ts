/**
 * Lobstr Wallet Adapter
 *
 * Popular Stellar mobile wallet with extension support
 * https://lobstr.co
 */

import {
  WalletAdapter,
  WalletType,
  WalletMetadata,
  SignTransactionOptions,
  WalletError,
  WalletErrorCode,
} from '../types.js';

// Lobstr Extension API (similar to Freighter)
interface LobstrAPI {
  isConnected(): Promise<boolean>;
  getPublicKey(): Promise<string>;
  signTransaction(xdr: string, opts?: { network?: string }): Promise<string>;
}

declare global {
  interface Window {
    lobstrExtension?: LobstrAPI;
  }
}

export class LobstrAdapter implements WalletAdapter {
  type = WalletType.LOBSTR;

  metadata: WalletMetadata = {
    type: WalletType.LOBSTR,
    name: 'Lobstr',
    url: 'https://lobstr.co',
    chromeUrl: 'https://chrome.google.com/webstore/detail/lobstr-extension/cmgchfbiagidgmjmfjkhldngnmlfpnog',
    description: 'Popular Stellar wallet with mobile and extension support',
    isAvailable: false,
  };

  private api: LobstrAPI | null = null;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window !== 'undefined' && window.lobstrExtension) {
      this.api = window.lobstrExtension;
      this.metadata.isAvailable = true;
    }
  }

  async isAvailable(): Promise<boolean> {
    return this.metadata.isAvailable;
  }

  async connect(): Promise<string> {
    if (!this.api) {
      throw new WalletError(
        'Lobstr Extension is not installed',
        WalletErrorCode.NOT_INSTALLED,
        WalletType.LOBSTR
      );
    }

    try {
      const publicKey = await this.api.getPublicKey();
      if (!publicKey) {
        throw new WalletError(
          'User rejected connection request',
          WalletErrorCode.USER_REJECTED,
          WalletType.LOBSTR
        );
      }
      return publicKey;
    } catch (error: any) {
      if (error instanceof WalletError) throw error;

      throw new WalletError(
        `Failed to connect to Lobstr: ${error.message}`,
        WalletErrorCode.UNKNOWN_ERROR,
        WalletType.LOBSTR
      );
    }
  }

  async disconnect(): Promise<void> {
    this.api = null;
  }

  async getAddress(): Promise<string | null> {
    if (!this.api) return null;

    try {
      const connected = await this.api.isConnected();
      if (!connected) return null;

      return await this.api.getPublicKey();
    } catch {
      return null;
    }
  }

  async isConnected(): Promise<boolean> {
    if (!this.api) return false;

    try {
      return await this.api.isConnected();
    } catch {
      return false;
    }
  }

  async signTransaction(
    xdr: string,
    options?: SignTransactionOptions
  ): Promise<string> {
    if (!this.api) {
      throw new WalletError(
        'Lobstr is not connected',
        WalletErrorCode.NOT_CONNECTED,
        WalletType.LOBSTR
      );
    }

    try {
      const signedXdr = await this.api.signTransaction(xdr, {
        network: options?.networkPassphrase,
      });

      return signedXdr;
    } catch (error: any) {
      throw new WalletError(
        `Failed to sign transaction: ${error.message}`,
        WalletErrorCode.SIGNING_FAILED,
        WalletType.LOBSTR
      );
    }
  }
}
