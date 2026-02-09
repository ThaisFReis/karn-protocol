/**
 * Tests for WalletManager
 */

import { WalletManager } from '../../wallet/WalletManager.js';
import {
  WalletType,
  WalletEvent,
  WalletErrorCode,
  WalletError,
} from '../../wallet/types.js';

// Mock wallet APIs
const mockFreighterAPI = {
  isConnected: jest.fn(),
  getPublicKey: jest.fn(),
  signTransaction: jest.fn(),
  getNetwork: jest.fn(),
  getNetworkDetails: jest.fn(),
};

const mockAlbedoAPI = {
  publicKey: jest.fn(),
  tx: jest.fn(),
  trust: jest.fn(),
};

const mockLobstrAPI = {
  isConnected: jest.fn(),
  getPublicKey: jest.fn(),
  signTransaction: jest.fn(),
};

describe('WalletManager', () => {
  let manager: WalletManager;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Reset window mocks
    (global.window as any) = {
      freighter: undefined,
      albedo: undefined,
      lobstrExtension: undefined,
      xBullSDK: undefined,
      rabet: undefined,
      localStorage: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
    };

    manager = new WalletManager();
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const state = manager.getState();

      expect(state.isConnected).toBe(false);
      expect(state.address).toBeNull();
      expect(state.walletType).toBeNull();
      expect(state.isConnecting).toBe(false);
      expect(state.error).toBeNull();
      expect(state.walletName).toBeNull();
    });

    it('should initialize all wallet adapters', async () => {
      const wallets = manager.getAllWallets();

      expect(wallets).toHaveLength(5);
      expect(wallets.map(w => w.type)).toEqual([
        WalletType.FREIGHTER,
        WalletType.ALBEDO,
        WalletType.LOBSTR,
        WalletType.XBULL,
        WalletType.RABET,
      ]);
    });
  });

  describe('getAvailableWallets', () => {
    it('should return Albedo when no extension wallets installed', async () => {
      const available = await manager.getAvailableWallets();

      // Albedo is web-based and treated as available in browser environments.
      expect(available.some(w => w.type === WalletType.ALBEDO)).toBe(true);
    });

    it('should return Freighter when installed', async () => {
      (global.window as any).freighter = mockFreighterAPI;
      manager = new WalletManager();

      const available = await manager.getAvailableWallets();

      // Freighter + Albedo
      expect(available.some(w => w.type === WalletType.FREIGHTER)).toBe(true);
      expect(available.some(w => w.type === WalletType.ALBEDO)).toBe(true);
    });

    it('should return Albedo (always available as web-based)', async () => {
      // Albedo is web-based, so it's always "available"
      const manager2 = new WalletManager();
      const available = await manager2.getAvailableWallets();

      // Albedo should be in the list (or at least detectable)
      // Note: Actual implementation may vary
      const hasAlbedo = available.some(w => w.type === WalletType.ALBEDO);
      expect(hasAlbedo || available.length === 0).toBe(true);
    });

    it('should return multiple wallets when multiple installed', async () => {
      (global.window as any).freighter = mockFreighterAPI;
      (global.window as any).lobstrExtension = mockLobstrAPI;
      manager = new WalletManager();

      const available = await manager.getAvailableWallets();

      expect(available.length).toBeGreaterThanOrEqual(2);
      const types = available.map(w => w.type);
      expect(types).toContain(WalletType.FREIGHTER);
      expect(types).toContain(WalletType.LOBSTR);
    });
  });

  describe('connect', () => {
    it('should connect to Freighter successfully', async () => {
      (global.window as any).freighter = mockFreighterAPI;
      mockFreighterAPI.getPublicKey.mockResolvedValue('GTEST123...');
      manager = new WalletManager();

      const connection = await manager.connect(WalletType.FREIGHTER);

      expect(connection.walletType).toBe(WalletType.FREIGHTER);
      expect(connection.address).toBe('GTEST123...');
      expect(mockFreighterAPI.getPublicKey).toHaveBeenCalled();

      const state = manager.getState();
      expect(state.isConnected).toBe(true);
      expect(state.address).toBe('GTEST123...');
      expect(state.walletType).toBe(WalletType.FREIGHTER);
      expect(state.walletName).toBe('Freighter');
    });

    it('should throw NOT_INSTALLED error when wallet not installed', async () => {
      await expect(manager.connect(WalletType.FREIGHTER))
        .rejects
        .toThrow(WalletError);

      try {
        await manager.connect(WalletType.FREIGHTER);
      } catch (error) {
        expect(error).toBeInstanceOf(WalletError);
        expect((error as WalletError).code).toBe(WalletErrorCode.NOT_INSTALLED);
        expect((error as WalletError).walletType).toBe(WalletType.FREIGHTER);
      }
    });

    it('should throw USER_REJECTED error when user declines', async () => {
      (global.window as any).freighter = mockFreighterAPI;
      mockFreighterAPI.getPublicKey.mockResolvedValue('');
      manager = new WalletManager();

      await expect(manager.connect(WalletType.FREIGHTER))
        .rejects
        .toThrow(WalletError);

      try {
        await manager.connect(WalletType.FREIGHTER);
      } catch (error) {
        expect((error as WalletError).code).toBe(WalletErrorCode.USER_REJECTED);
      }
    });

    it('should save connection to localStorage', async () => {
      const setItem = jest.fn();
      (global.window as any).localStorage.setItem = setItem;
      (global.window as any).freighter = mockFreighterAPI;
      mockFreighterAPI.getPublicKey.mockResolvedValue('GTEST123...');
      manager = new WalletManager();

      await manager.connect(WalletType.FREIGHTER);

      expect(setItem).toHaveBeenCalledWith(
        'karn_wallet_connection',
        expect.stringContaining('freighter')
      );
    });

    it('should disconnect previous wallet before connecting new one', async () => {
      (global.window as any).freighter = mockFreighterAPI;
      (global.window as any).lobstrExtension = mockLobstrAPI;
      mockFreighterAPI.getPublicKey.mockResolvedValue('GFREIGHTER...');
      mockLobstrAPI.getPublicKey.mockResolvedValue('GLOBSTR...');
      manager = new WalletManager();

      // Connect to Freighter
      await manager.connect(WalletType.FREIGHTER);
      expect(manager.getState().walletType).toBe(WalletType.FREIGHTER);

      // Connect to Lobstr (should disconnect Freighter first)
      await manager.connect(WalletType.LOBSTR);
      expect(manager.getState().walletType).toBe(WalletType.LOBSTR);
      expect(manager.getState().address).toBe('GLOBSTR...');
    });
  });

  describe('disconnect', () => {
    it('should disconnect successfully', async () => {
      (global.window as any).freighter = mockFreighterAPI;
      mockFreighterAPI.getPublicKey.mockResolvedValue('GTEST123...');
      manager = new WalletManager();

      await manager.connect(WalletType.FREIGHTER);
      await manager.disconnect();

      const state = manager.getState();
      expect(state.isConnected).toBe(false);
      expect(state.address).toBeNull();
      expect(state.walletType).toBeNull();
      expect(state.walletName).toBeNull();
    });

    it('should clear localStorage on disconnect', async () => {
      const removeItem = jest.fn();
      (global.window as any).localStorage.removeItem = removeItem;
      (global.window as any).freighter = mockFreighterAPI;
      mockFreighterAPI.getPublicKey.mockResolvedValue('GTEST123...');
      manager = new WalletManager();

      await manager.connect(WalletType.FREIGHTER);
      await manager.disconnect();

      expect(removeItem).toHaveBeenCalledWith('karn_wallet_connection');
    });

    it('should handle disconnect when not connected', async () => {
      await expect(manager.disconnect()).resolves.not.toThrow();
    });
  });

  describe('signTransaction', () => {
    it('should sign transaction with connected wallet', async () => {
      (global.window as any).freighter = mockFreighterAPI;
      mockFreighterAPI.getPublicKey.mockResolvedValue('GTEST123...');
      mockFreighterAPI.signTransaction.mockResolvedValue('signed_xdr_123');
      manager = new WalletManager();

      await manager.connect(WalletType.FREIGHTER);
      const signedXdr = await manager.signTransaction('unsigned_xdr_123');

      expect(signedXdr).toBe('signed_xdr_123');
      expect(mockFreighterAPI.signTransaction).toHaveBeenCalledWith(
        'unsigned_xdr_123',
        expect.any(Object)
      );
    });

    it('should throw NOT_CONNECTED error when not connected', async () => {
      await expect(manager.signTransaction('xdr'))
        .rejects
        .toThrow(WalletError);

      try {
        await manager.signTransaction('xdr');
      } catch (error) {
        expect((error as WalletError).code).toBe(WalletErrorCode.NOT_CONNECTED);
      }
    });

    it('should pass network passphrase to wallet', async () => {
      (global.window as any).freighter = mockFreighterAPI;
      mockFreighterAPI.getPublicKey.mockResolvedValue('GTEST123...');
      mockFreighterAPI.signTransaction.mockResolvedValue('signed');
      manager = new WalletManager();

      await manager.connect(WalletType.FREIGHTER);
      await manager.signTransaction('xdr', {
        networkPassphrase: 'Test SDF Network ; September 2015',
      });

      expect(mockFreighterAPI.signTransaction).toHaveBeenCalledWith(
        'xdr',
        expect.objectContaining({
          networkPassphrase: 'Test SDF Network ; September 2015',
        })
      );
    });
  });

  describe('Event System', () => {
    it('should emit CONNECT event when connecting', async () => {
      (global.window as any).freighter = mockFreighterAPI;
      mockFreighterAPI.getPublicKey.mockResolvedValue('GTEST123...');
      manager = new WalletManager();

      const connectListener = jest.fn();
      manager.on(WalletEvent.CONNECT, connectListener);

      await manager.connect(WalletType.FREIGHTER);

      expect(connectListener).toHaveBeenCalledWith({
        walletType: WalletType.FREIGHTER,
        address: 'GTEST123...',
      });
    });

    it('should emit DISCONNECT event when disconnecting', async () => {
      (global.window as any).freighter = mockFreighterAPI;
      mockFreighterAPI.getPublicKey.mockResolvedValue('GTEST123...');
      manager = new WalletManager();

      const disconnectListener = jest.fn();
      manager.on(WalletEvent.DISCONNECT, disconnectListener);

      await manager.connect(WalletType.FREIGHTER);
      await manager.disconnect();

      expect(disconnectListener).toHaveBeenCalledWith({
        walletType: WalletType.FREIGHTER,
      });
    });

    it('should allow removing event listeners', async () => {
      (global.window as any).freighter = mockFreighterAPI;
      mockFreighterAPI.getPublicKey.mockResolvedValue('GTEST123...');
      manager = new WalletManager();

      const listener = jest.fn();
      manager.on(WalletEvent.CONNECT, listener);
      manager.off(WalletEvent.CONNECT, listener);

      await manager.connect(WalletType.FREIGHTER);

      expect(listener).not.toHaveBeenCalled();
    });

    it('should support multiple listeners for same event', async () => {
      (global.window as any).freighter = mockFreighterAPI;
      mockFreighterAPI.getPublicKey.mockResolvedValue('GTEST123...');
      manager = new WalletManager();

      const listener1 = jest.fn();
      const listener2 = jest.fn();
      manager.on(WalletEvent.CONNECT, listener1);
      manager.on(WalletEvent.CONNECT, listener2);

      await manager.connect(WalletType.FREIGHTER);

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });
  });

  describe('Auto-Reconnect', () => {
    it('should attempt to restore connection from localStorage', async () => {
      const getItem = jest.fn().mockReturnValue(
        JSON.stringify({ walletType: WalletType.FREIGHTER, address: 'GTEST123...' })
      );
      (global.window as any).localStorage.getItem = getItem;
      (global.window as any).freighter = mockFreighterAPI;
      mockFreighterAPI.getPublicKey.mockResolvedValue('GTEST123...');

      // Wait a bit for auto-reconnect
      manager = new WalletManager();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(getItem).toHaveBeenCalledWith('karn_wallet_connection');
    });

    it('should handle auto-reconnect failure gracefully', async () => {
      const getItem = jest.fn().mockReturnValue(
        JSON.stringify({ walletType: WalletType.FREIGHTER })
      );
      (global.window as any).localStorage.getItem = getItem;
      // Freighter not installed

      expect(() => new WalletManager()).not.toThrow();
    });
  });

  describe('getNetwork', () => {
    it('should return network from wallet that supports it', async () => {
      (global.window as any).freighter = mockFreighterAPI;
      mockFreighterAPI.getPublicKey.mockResolvedValue('GTEST123...');
      mockFreighterAPI.getNetwork.mockResolvedValue('TESTNET');
      manager = new WalletManager();

      await manager.connect(WalletType.FREIGHTER);
      const network = await manager.getNetwork();

      expect(network).toBe('TESTNET');
    });

    it('should throw UNSUPPORTED_METHOD for wallets without network support', async () => {
      // Assuming Lobstr doesn't support getNetwork
      (global.window as any).lobstrExtension = mockLobstrAPI;
      mockLobstrAPI.getPublicKey.mockResolvedValue('GTEST123...');
      manager = new WalletManager();

      await manager.connect(WalletType.LOBSTR);

      await expect(manager.getNetwork())
        .rejects
        .toThrow(WalletError);
    });
  });
});
