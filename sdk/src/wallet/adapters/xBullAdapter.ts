/**
 * xBull Wallet Adapter
 *
 * Modern Stellar wallet extension
 * https://xbull.app
 */

import {
  WalletAdapter,
  WalletType,
  WalletMetadata,
  SignTransactionOptions,
  WalletError,
  WalletErrorCode,
} from '../types.js';

// xBull SDK types
interface XBullAPI {
  connect(): Promise<{ publicKey: string }>;
  sign(params: { xdr: string; publicKey?: string; network?: string }): Promise<{ signedXDR: string }>;
  isAvailable(): boolean;
}

declare global {
  interface Window {
    xBullSDK?: XBullAPI;
  }
}

export class XBullAdapter implements WalletAdapter {
  type = WalletType.XBULL;

  metadata: WalletMetadata = {
    type: WalletType.XBULL,
    name: 'xBull',
    url: 'https://xbull.app',
    chromeUrl: 'https://chrome.google.com/webstore/detail/xbull-wallet/omajpeaffjgmlpmfejkepdlekgkglhhk',
    description: 'Modern Stellar wallet with advanced features',
    isAvailable: false,
  };

  private api: XBullAPI | null = null;
  private currentAddress: string | null = null;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window !== 'undefined' && window.xBullSDK) {
      this.api = window.xBullSDK;
      this.metadata.isAvailable = this.api.isAvailable();
    }
  }

  async isAvailable(): Promise<boolean> {
    return this.metadata.isAvailable;
  }

  async connect(): Promise<string> {
    if (!this.api) {
      throw new WalletError(
        'xBull is not installed',
        WalletErrorCode.NOT_INSTALLED,
        WalletType.XBULL
      );
    }

    try {
      const result = await this.api.connect();
      this.currentAddress = result.publicKey;
      return result.publicKey;
    } catch (error: any) {
      throw new WalletError(
        `Failed to connect to xBull: ${error.message}`,
        WalletErrorCode.USER_REJECTED,
        WalletType.XBULL
      );
    }
  }

  async disconnect(): Promise<void> {
    this.currentAddress = null;
    this.api = null;
  }

  async getAddress(): Promise<string | null> {
    return this.currentAddress;
  }

  async isConnected(): Promise<boolean> {
    return this.currentAddress !== null;
  }

  async signTransaction(
    xdr: string,
    options?: SignTransactionOptions
  ): Promise<string> {
    if (!this.api) {
      throw new WalletError(
        'xBull is not connected',
        WalletErrorCode.NOT_CONNECTED,
        WalletType.XBULL
      );
    }

    try {
      const result = await this.api.sign({
        xdr,
        publicKey: this.currentAddress || undefined,
        network: options?.networkPassphrase,
      });

      return result.signedXDR;
    } catch (error: any) {
      throw new WalletError(
        `Failed to sign transaction: ${error.message}`,
        WalletErrorCode.SIGNING_FAILED,
        WalletType.XBULL
      );
    }
  }
}
