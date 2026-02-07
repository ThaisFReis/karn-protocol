/**
 * Karn Protocol Multi-Wallet Support
 *
 * Provides unified interface for connecting to multiple Stellar wallets:
 * - Freighter (official Stellar extension)
 * - Albedo (web-based, no extension required)
 * - Lobstr (popular mobile + extension)
 * - xBull (modern wallet with advanced features)
 * - Rabet (DeFi-focused wallet with built-in swap)
 *
 * - Rabet (DeFi-focused wallet with built-in swap)
 */

// Core wallet manager
export { WalletManager } from './WalletManager.js';

// Type definitions
export {
  WalletType,
  WalletState,
  WalletMetadata,
  WalletAdapter,
  WalletConnection,
  WalletEvent,
  WalletEventPayload,
  WalletEventListener,
  SignTransactionOptions,
  WalletError,
  WalletErrorCode,
} from './types.js';

// Individual wallet adapters (for advanced usage)
export { FreighterAdapter } from './adapters/FreighterAdapter.js';
export { AlbedoAdapter } from './adapters/AlbedoAdapter.js';
export { LobstrAdapter } from './adapters/LobstrAdapter.js';
export { XBullAdapter } from './adapters/xBullAdapter.js';
export { RabetAdapter } from './adapters/RabetAdapter.js';
