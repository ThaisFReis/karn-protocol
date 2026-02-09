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

function deriveAlbedoNetwork(networkPassphrase?: string): 'testnet' | 'public' {
  if (!networkPassphrase) return 'testnet';
  const p = networkPassphrase.toLowerCase();
  if (p.includes('public global stellar network') || p.includes('public')) return 'public';
  return 'testnet';
}

export class AlbedoAdapter implements WalletAdapter {
  type = WalletType.ALBEDO;

  metadata: WalletMetadata = {
    type: WalletType.ALBEDO,
    name: 'Albedo',
    url: 'https://albedo.link',
    description: 'Web-based Stellar wallet with seamless browser integration',
    isAvailable: false,
  };

  private currentAddress: string | null = null;

  async isAvailable(): Promise<boolean> {
    // Albedo works via popup (intent) in any browser environment.
    const available = typeof window !== 'undefined';
    this.metadata.isAvailable = available;
    return available;
  }

  async connect(): Promise<string> {
    if (!(await this.isAvailable())) {
      throw new WalletError(
        'Albedo is not available in this environment',
        WalletErrorCode.NOT_INSTALLED,
        WalletType.ALBEDO
      );
    }

    try {
      const mod = await import('@albedo-link/intent');
      const albedo = (mod as any).default ?? mod;
      const result = await albedo.publicKey({ require_existing: false });
      this.currentAddress = result.pubkey as string;
      return this.currentAddress;
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
    if (!(await this.isAvailable())) {
      throw new WalletError(
        'Albedo is not available',
        WalletErrorCode.NOT_CONNECTED,
        WalletType.ALBEDO
      );
    }

    try {
      const mod = await import('@albedo-link/intent');
      const albedo = (mod as any).default ?? mod;

      const result = await albedo.tx({
        xdr,
        network: deriveAlbedoNetwork(options?.networkPassphrase),
      });

      return result.signed_envelope_xdr as string;
    } catch (error: any) {
      throw new WalletError(
        `Failed to sign transaction: ${error.message}`,
        WalletErrorCode.SIGNING_FAILED,
        WalletType.ALBEDO
      );
    }
  }

  async signMessage(message: string): Promise<string> {
    if (!(await this.isAvailable())) {
      throw new WalletError(
        'Albedo is not available',
        WalletErrorCode.NOT_CONNECTED,
        WalletType.ALBEDO
      );
    }

    try {
      const mod = await import('@albedo-link/intent');
      const albedo = (mod as any).default ?? mod;
      const result = await albedo.signMessage({ message });
      return result.signature as string;
    } catch (error: any) {
      throw new WalletError(
        `Failed to sign message: ${error.message}`,
        WalletErrorCode.SIGNING_FAILED,
        WalletType.ALBEDO
      );
    }
  }
}
