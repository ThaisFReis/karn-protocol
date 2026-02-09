/**
 * Albedo Wallet Adapter
 *
 * Web-based Stellar wallet (no extension required)
 * https://albedo.link
 */

import {
  WalletAdapter,
  WalletType,
  WalletMetadata,
  SignTransactionOptions,
  WalletError,
  WalletErrorCode,
} from '../types.js';

// Albedo API types
interface AlbedoAPI {
  publicKey(options?: { require_existing?: boolean }): Promise<{ pubkey: string }>;
  tx(options: {
    xdr: string;
    network?: string;
    pubkey?: string;
    submit?: boolean;
  }): Promise<{ signed_envelope_xdr: string; tx_hash?: string; network?: string }>;
  trust(options: { asset_code: string; asset_issuer: string }): Promise<any>;
}

declare global {
  interface Window {
    albedo?: AlbedoAPI;
  }
}

export class AlbedoAdapter implements WalletAdapter {
  type = WalletType.ALBEDO;

  metadata: WalletMetadata = {
    type: WalletType.ALBEDO,
    name: 'Albedo',
    url: 'https://albedo.link',
    description: 'Web-based Stellar wallet with seamless browser integration',
    // Albedo is web-based, but availability is environment-dependent.
    // We treat it as "available" only when the runtime can actually invoke it.
    isAvailable: false,
  };

  private currentAddress: string | null = null;

  async isAvailable(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    return !!window.albedo;
  }

  async connect(): Promise<string> {
    if (!(await this.isAvailable()) || !window.albedo) {
      throw new WalletError(
        'Albedo is not available in this environment',
        WalletErrorCode.NOT_INSTALLED,
        WalletType.ALBEDO
      );
    }

    try {
      const result = await window.albedo.publicKey({ require_existing: false });
      this.currentAddress = result.pubkey;
      return result.pubkey;
    } catch (error: any) {
      throw new WalletError(
        `Failed to connect to Albedo: ${error.message}`,
        WalletErrorCode.USER_REJECTED,
        WalletType.ALBEDO
      );
    }
  }

  async disconnect(): Promise<void> {
    this.currentAddress = null;
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
    await this.isAvailable();

    if (!window.albedo) {
      throw new WalletError(
        'Albedo is not available',
        WalletErrorCode.NOT_CONNECTED,
        WalletType.ALBEDO
      );
    }

    try {
      const result = await window.albedo.tx({
        xdr,
        network: options?.networkPassphrase || 'testnet',
        pubkey: this.currentAddress || undefined,
        submit: false, // Don't auto-submit
      });

      return result.signed_envelope_xdr;
    } catch (error: any) {
      throw new WalletError(
        `Failed to sign transaction: ${error.message}`,
        WalletErrorCode.SIGNING_FAILED,
        WalletType.ALBEDO
      );
    }
  }
}
