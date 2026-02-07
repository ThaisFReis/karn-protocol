/**
 * Freighter Wallet Adapter
 *
 * Official Stellar wallet extension
 * https://freighter.app
 */

import {
  WalletAdapter,
  WalletType,
  WalletMetadata,
  SignTransactionOptions,
  WalletError,
  WalletErrorCode,
} from '../types.js';

// Freighter API types (from @stellar/freighter-api)
interface FreighterAPI {
  isConnected(): Promise<boolean>;
  getPublicKey(): Promise<string>;
  signTransaction(
    xdr: string,
    opts?: { network?: string; networkPassphrase?: string; accountToSign?: string }
  ): Promise<string>;
  getNetwork(): Promise<string>;
  getNetworkDetails(): Promise<{ network: string; networkPassphrase: string }>;
}

declare global {
  interface Window {
    freighter?: FreighterAPI;
  }
}

export class FreighterAdapter implements WalletAdapter {
  type = WalletType.FREIGHTER;

  metadata: WalletMetadata = {
    type: WalletType.FREIGHTER,
    name: 'Freighter',
    url: 'https://freighter.app',
    chromeUrl: 'https://chrome.google.com/webstore/detail/freighter/bcacfldlkkdogcmkkibnjlakofdplcbk',
    firefoxUrl: 'https://addons.mozilla.org/en-US/firefox/addon/freighter/',
    description: 'Official Stellar wallet extension with Soroban support',
    isAvailable: false,
  };

  private api: FreighterAPI | null = null;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window !== 'undefined' && window.freighter) {
      this.api = window.freighter;
      this.metadata.isAvailable = true;
    }
  }

  async isAvailable(): Promise<boolean> {
    return this.metadata.isAvailable;
  }

  async connect(): Promise<string> {
    if (!this.api) {
      throw new WalletError(
        'Freighter is not installed. Please install from https://freighter.app',
        WalletErrorCode.NOT_INSTALLED,
        WalletType.FREIGHTER
      );
    }

    try {
      const publicKey = await this.api.getPublicKey();
      if (!publicKey) {
        throw new WalletError(
          'User rejected connection request',
          WalletErrorCode.USER_REJECTED,
          WalletType.FREIGHTER
        );
      }
      return publicKey;
    } catch (error: any) {
      if (error instanceof WalletError) throw error;

      throw new WalletError(
        `Failed to connect to Freighter: ${error.message}`,
        WalletErrorCode.UNKNOWN_ERROR,
        WalletType.FREIGHTER
      );
    }
  }

  async disconnect(): Promise<void> {
    // Freighter doesn't have explicit disconnect
    // Connection state is managed by extension
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
        'Freighter is not connected',
        WalletErrorCode.NOT_CONNECTED,
        WalletType.FREIGHTER
      );
    }

    try {
      const signedXdr = await this.api.signTransaction(xdr, {
        networkPassphrase: options?.networkPassphrase,
        accountToSign: options?.accountToSign,
      });

      return signedXdr;
    } catch (error: any) {
      if (error.message?.includes('User declined')) {
        throw new WalletError(
          'User rejected signature request',
          WalletErrorCode.USER_REJECTED,
          WalletType.FREIGHTER
        );
      }

      throw new WalletError(
        `Failed to sign transaction: ${error.message}`,
        WalletErrorCode.SIGNING_FAILED,
        WalletType.FREIGHTER
      );
    }
  }

  async getNetwork(): Promise<string> {
    if (!this.api) {
      throw new WalletError(
        'Freighter is not connected',
        WalletErrorCode.NOT_CONNECTED,
        WalletType.FREIGHTER
      );
    }

    try {
      return await this.api.getNetwork();
    } catch (error: any) {
      throw new WalletError(
        `Failed to get network: ${error.message}`,
        WalletErrorCode.NETWORK_ERROR,
        WalletType.FREIGHTER
      );
    }
  }
}
