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

type FreighterModule = {
  isConnected?: () => Promise<boolean>;
  getPublicKey?: () => Promise<string>;
  signTransaction?: (
    xdr: string,
    opts?: { network?: string; networkPassphrase?: string; accountToSign?: string }
  ) => Promise<string>;
  getNetwork?: () => Promise<string>;
  getNetworkDetails?: () => Promise<{ network: string; networkPassphrase: string }>;
};

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

  private freighter: FreighterModule | null = null;

  private canUseBrowserFreighterApi(): boolean {
    // In Node/Jest we may have `global.window` mocked but without real browser globals.
    // `@stellar/freighter-api` touches `window.location.origin` at import time.
    return (
      typeof window !== 'undefined' &&
      typeof (window as any).location?.origin === 'string' &&
      typeof document !== 'undefined'
    );
  }

  private async loadFreighter(): Promise<FreighterModule> {
    if (this.freighter) return this.freighter;

    // 1) Prefer legacy window injection if present (also used by our Jest tests).
    if (typeof window !== 'undefined') {
      const injected = (window as any).freighter as FreighterModule | undefined;
      if (injected) {
        this.freighter = injected;
        return injected;
      }
    }

    // 2) In real browsers, use the official module API.
    if (!this.canUseBrowserFreighterApi()) {
      throw new WalletError('Freighter is not installed', WalletErrorCode.NOT_INSTALLED, WalletType.FREIGHTER);
    }

    try {
      const mod = (await import('@stellar/freighter-api')) as unknown as FreighterModule;
      this.freighter = mod;
      return mod;
    } catch {
      throw new WalletError('Freighter is not installed', WalletErrorCode.NOT_INSTALLED, WalletType.FREIGHTER);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const freighter = await this.loadFreighter();
      if (typeof freighter.isConnected !== 'function') return false;
      await freighter.isConnected();
      this.metadata.isAvailable = true;
      return true;
    } catch {
      this.metadata.isAvailable = false;
      return false;
    }
  }

  async connect(): Promise<string> {
    const freighter = await this.loadFreighter();
    if (typeof freighter.getPublicKey !== 'function') {
      throw new WalletError('Freighter API is unavailable', WalletErrorCode.NOT_INSTALLED, WalletType.FREIGHTER);
    }

    try {
      const publicKey = await freighter.getPublicKey();
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
    // Keep module cached, just mark unavailable until next check.
    this.metadata.isAvailable = false;
  }

  async getAddress(): Promise<string | null> {
    try {
      const freighter = await this.loadFreighter();
      if (typeof freighter.isConnected !== 'function' || typeof freighter.getPublicKey !== 'function') return null;

      const connected = await freighter.isConnected();
      if (!connected) return null;

      return await freighter.getPublicKey();
    } catch {
      return null;
    }
  }

  async isConnected(): Promise<boolean> {
    try {
      const freighter = await this.loadFreighter();
      if (typeof freighter.isConnected !== 'function') return false;
      return await freighter.isConnected();
    } catch {
      return false;
    }
  }

  async signTransaction(
    xdr: string,
    options?: SignTransactionOptions
  ): Promise<string> {
    const freighter = await this.loadFreighter();
    if (typeof freighter.signTransaction !== 'function') {
      throw new WalletError('Freighter is not connected', WalletErrorCode.NOT_CONNECTED, WalletType.FREIGHTER);
    }

    try {
      const signedXdr = await freighter.signTransaction(xdr, {
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
    const freighter = await this.loadFreighter();
    if (typeof freighter.getNetwork !== 'function') {
      throw new WalletError('Freighter is not connected', WalletErrorCode.NOT_CONNECTED, WalletType.FREIGHTER);
    }

    try {
      return await freighter.getNetwork();
    } catch (error: any) {
      throw new WalletError(
        `Failed to get network: ${error.message}`,
        WalletErrorCode.NETWORK_ERROR,
        WalletType.FREIGHTER
      );
    }
  }
}
