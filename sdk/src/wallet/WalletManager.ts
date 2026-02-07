/**
 * WalletManager - Central coordinator for all wallet adapters
 *
 * Manages wallet selection, connection state, and provides unified API
 * for interacting with any supported Stellar wallet.
 *
 * Usage:
 *   const manager = new WalletManager();
 *   const wallets = manager.getAvailableWallets();
 *   await manager.connect(WalletType.FREIGHTER);
 *   const signedXdr = await manager.signTransaction(xdr);
 */

import {
  WalletAdapter,
  WalletType,
  WalletState,
  WalletMetadata,
  WalletConnection,
  WalletEvent,
  WalletEventPayload,
  WalletEventListener,
  SignTransactionOptions,
  WalletError,
  WalletErrorCode,
} from './types.js';

import { FreighterAdapter } from './adapters/FreighterAdapter.js';
import { AlbedoAdapter } from './adapters/AlbedoAdapter.js';
import { LobstrAdapter } from './adapters/LobstrAdapter.js';
import { XBullAdapter } from './adapters/xBullAdapter.js';
import { RabetAdapter } from './adapters/RabetAdapter.js';

export class WalletManager {
  private adapters: Map<WalletType, WalletAdapter>;
  private currentAdapter: WalletAdapter | null = null;
  private state: WalletState;
  private eventListeners: Map<WalletEvent, Set<WalletEventListener>>;

  constructor() {
    // Initialize all wallet adapters
    this.adapters = new Map([
      [WalletType.FREIGHTER, new FreighterAdapter() as WalletAdapter],
      [WalletType.ALBEDO, new AlbedoAdapter() as WalletAdapter],
      [WalletType.LOBSTR, new LobstrAdapter() as WalletAdapter],
      [WalletType.XBULL, new XBullAdapter() as WalletAdapter],
      [WalletType.RABET, new RabetAdapter() as WalletAdapter],
    ]);

    // Initialize state
    this.state = {
      isConnected: false,
      address: null,
      walletType: null,
      isConnecting: false,
      error: null,
      walletName: null,
    };

    // Initialize event listeners
    this.eventListeners = new Map([
      [WalletEvent.CONNECT, new Set()],
      [WalletEvent.DISCONNECT, new Set()],
      [WalletEvent.ACCOUNT_CHANGED, new Set()],
      [WalletEvent.NETWORK_CHANGED, new Set()],
    ]);

    // Try to restore previous connection from localStorage
    this.restoreConnection();
  }

  /**
   * Get all available (installed) wallets
   */
  async getAvailableWallets(): Promise<WalletMetadata[]> {
    const available: WalletMetadata[] = [];

    for (const adapter of this.adapters.values()) {
      if (await adapter.isAvailable()) {
        available.push(adapter.metadata);
      }
    }

    return available;
  }

  /**
   * Get all wallet metadata (including unavailable wallets)
   */
  getAllWallets(): WalletMetadata[] {
    return Array.from(this.adapters.values()).map((adapter) => adapter.metadata);
  }

  /**
   * Get current wallet state
   */
  getState(): WalletState {
    return { ...this.state };
  }

  /**
   * Connect to a specific wallet
   */
  async connect(walletType: WalletType): Promise<WalletConnection> {
    const adapter = this.adapters.get(walletType);

    if (!adapter) {
      throw new WalletError(
        `Wallet type ${walletType} is not supported`,
        WalletErrorCode.UNSUPPORTED_METHOD
      );
    }

    // Check if wallet is available
    const isAvailable = await adapter.isAvailable();
    if (!isAvailable) {
      throw new WalletError(
        `${adapter.metadata.name} is not installed`,
        WalletErrorCode.NOT_INSTALLED,
        walletType
      );
    }

    // Disconnect any existing connection
    if (this.currentAdapter) {
      await this.disconnect();
    }

    // Update state
    this.state.isConnecting = true;
    this.state.error = null;

    try {
      // Connect to wallet
      const address = await adapter.connect();

      // Update state
      this.currentAdapter = adapter;
      this.state.isConnected = true;
      this.state.address = address;
      this.state.walletType = walletType;
      this.state.walletName = adapter.metadata.name;
      this.state.isConnecting = false;

      // Save to localStorage for auto-reconnect
      this.saveConnection(walletType, address);

      // Emit connect event
      this.emitEvent(WalletEvent.CONNECT, { walletType, address });

      return {
        walletType,
        address,
        adapter,
      };
    } catch (error: any) {
      this.state.isConnecting = false;
      this.state.error = error.message;

      if (error instanceof WalletError) {
        throw error;
      }

      throw new WalletError(
        `Failed to connect to ${adapter.metadata.name}: ${error.message}`,
        WalletErrorCode.UNKNOWN_ERROR,
        walletType
      );
    }
  }

  /**
   * Disconnect from current wallet
   */
  async disconnect(): Promise<void> {
    if (!this.currentAdapter) {
      return;
    }

    const walletType = this.state.walletType;

    try {
      await this.currentAdapter.disconnect();
    } catch (error) {
      // Ignore disconnect errors
      console.warn('Error during disconnect:', error);
    }

    // Clear state
    this.currentAdapter = null;
    this.state.isConnected = false;
    this.state.address = null;
    this.state.walletType = null;
    this.state.walletName = null;
    this.state.error = null;

    // Clear localStorage
    this.clearConnection();

    // Emit disconnect event
    if (walletType) {
      this.emitEvent(WalletEvent.DISCONNECT, { walletType });
    }
  }

  /**
   * Get current connected address
   */
  async getAddress(): Promise<string | null> {
    if (!this.currentAdapter) {
      return null;
    }

    return await this.currentAdapter.getAddress();
  }

  /**
   * Check if wallet is connected
   */
  async isConnected(): Promise<boolean> {
    if (!this.currentAdapter) {
      return false;
    }

    return await this.currentAdapter.isConnected();
  }

  /**
   * Sign a transaction with current wallet
   */
  async signTransaction(
    xdr: string,
    options?: SignTransactionOptions
  ): Promise<string> {
    if (!this.currentAdapter) {
      throw new WalletError(
        'No wallet connected',
        WalletErrorCode.NOT_CONNECTED
      );
    }

    return await this.currentAdapter.signTransaction(xdr, options);
  }

  /**
   * Sign a message (if supported by wallet)
   */
  async signMessage(message: string): Promise<string> {
    if (!this.currentAdapter) {
      throw new WalletError(
        'No wallet connected',
        WalletErrorCode.NOT_CONNECTED
      );
    }

    if (!this.currentAdapter.signMessage) {
      throw new WalletError(
        `${this.state.walletName} does not support message signing`,
        WalletErrorCode.UNSUPPORTED_METHOD,
        this.state.walletType || undefined
      );
    }

    return await this.currentAdapter.signMessage(message);
  }

  /**
   * Get current network (if supported by wallet)
   */
  async getNetwork(): Promise<string> {
    if (!this.currentAdapter) {
      throw new WalletError(
        'No wallet connected',
        WalletErrorCode.NOT_CONNECTED
      );
    }

    if (!this.currentAdapter.getNetwork) {
      throw new WalletError(
        `${this.state.walletName} does not support network detection`,
        WalletErrorCode.UNSUPPORTED_METHOD,
        this.state.walletType || undefined
      );
    }

    return await this.currentAdapter.getNetwork();
  }

  /**
   * Add event listener
   */
  on(event: WalletEvent, listener: WalletEventListener): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.add(listener);
    }
  }

  /**
   * Remove event listener
   */
  off(event: WalletEvent, listener: WalletEventListener): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * Emit event to all listeners
   */
  private emitEvent(event: WalletEvent, payload: WalletEventPayload): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((listener) => listener(payload));
    }
  }

  /**
   * Save connection to localStorage for auto-reconnect
   */
  private saveConnection(walletType: WalletType, address: string): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(
        'karn_wallet_connection',
        JSON.stringify({ walletType, address })
      );
    } catch (error) {
      console.warn('Failed to save wallet connection:', error);
    }
  }

  /**
   * Clear connection from localStorage
   */
  private clearConnection(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem('karn_wallet_connection');
    } catch (error) {
      console.warn('Failed to clear wallet connection:', error);
    }
  }

  /**
   * Restore previous connection from localStorage
   */
  private async restoreConnection(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem('karn_wallet_connection');
      if (!saved) return;

      const { walletType } = JSON.parse(saved);

      // Try to reconnect silently
      await this.connect(walletType);
    } catch (error) {
      // Silent fail - user can manually reconnect
      console.debug('Failed to restore wallet connection:', error);
      this.clearConnection();
    }
  }
}
