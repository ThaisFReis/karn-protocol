/**
 * Rabet Wallet Adapter
 *
 * Modern Stellar wallet with built-in swap features
 * https://rabet.io
 */

import {
  WalletAdapter,
  WalletType,
  WalletMetadata,
  SignTransactionOptions,
  WalletError,
  WalletErrorCode,
} from '../types.js';

// Rabet API types
interface RabetAPI {
  connect(): Promise<{ publicKey: string }>;
  sign(xdr: string, opts?: { network?: string }): Promise<{ xdr: string }>;
  disconnect(): Promise<void>;
  isConnected(): Promise<boolean>;
}

declare global {
  interface Window {
    rabet?: RabetAPI;
  }
}

export class RabetAdapter implements WalletAdapter {
  type = WalletType.RABET;

  metadata: WalletMetadata = {
    type: WalletType.RABET,
    name: 'Rabet',
    url: 'https://rabet.io',
    chromeUrl: 'https://chrome.google.com/webstore/detail/rabet/aapjbdekemjjmldlfinkhcmkbcfikkde',
    firefoxUrl: 'https://addons.mozilla.org/en-US/firefox/addon/rabet/',
    description: 'Modern Stellar wallet with built-in swap and DeFi features',
    isAvailable: false,
  };

  private api: RabetAPI | null = null;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window !== 'undefined' && window.rabet) {
      this.api = window.rabet;
      this.metadata.isAvailable = true;
    }
  }

  async isAvailable(): Promise<boolean> {
    return this.metadata.isAvailable;
  }

  async connect(): Promise<string> {
    if (!this.api) {
      throw new WalletError(
        'Rabet is not installed',
        WalletErrorCode.NOT_INSTALLED,
        WalletType.RABET
      );
    }

    try {
      const result = await this.api.connect();
      if (!result.publicKey) {
        throw new WalletError(
          'User rejected connection request',
          WalletErrorCode.USER_REJECTED,
          WalletType.RABET
        );
      }
      return result.publicKey;
    } catch (error: any) {
      if (error instanceof WalletError) throw error;

      throw new WalletError(
        `Failed to connect to Rabet: ${error.message}`,
        WalletErrorCode.UNKNOWN_ERROR,
        WalletType.RABET
      );
    }
  }

  async disconnect(): Promise<void> {
    if (this.api) {
      try {
        await this.api.disconnect();
      } catch {
        // Ignore disconnect errors
      }
    }
    this.api = null;
  }

  async getAddress(): Promise<string | null> {
    if (!this.api) return null;

    try {
      const connected = await this.api.isConnected();
      if (!connected) return null;

      // Rabet doesn't expose getPublicKey directly
      // Need to reconnect to get address
      const result = await this.api.connect();
      return result.publicKey;
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
        'Rabet is not connected',
        WalletErrorCode.NOT_CONNECTED,
        WalletType.RABET
      );
    }

    try {
      const result = await this.api.sign(xdr, {
        network: options?.networkPassphrase,
      });

      return result.xdr;
    } catch (error: any) {
      if (error.message?.includes('User cancelled')) {
        throw new WalletError(
          'User rejected signature request',
          WalletErrorCode.USER_REJECTED,
          WalletType.RABET
        );
      }

      throw new WalletError(
        `Failed to sign transaction: ${error.message}`,
        WalletErrorCode.SIGNING_FAILED,
        WalletType.RABET
      );
    }
  }
}
