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
    isAvailable: true, // Albedo is always available (web-based)
  };

  private currentAddress: string | null = null;

  async isAvailable(): Promise<boolean> {
    // Albedo is web-based, always available
    // Load script if not present
    if (typeof window !== 'undefined' && !window.albedo) {
      await this.loadAlbedoScript();
    }
    return true;
  }

  private async loadAlbedoScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.albedo) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@albedo-link/intent@latest/lib/albedo.intent.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Albedo'));
      document.head.appendChild(script);
    });
  }

  async connect(): Promise<string> {
    await this.isAvailable();

    if (!window.albedo) {
      throw new WalletError(
        'Albedo failed to load',
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
