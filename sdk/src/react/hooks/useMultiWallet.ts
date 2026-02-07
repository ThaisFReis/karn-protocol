/**
 * React hook for multi-wallet support
 *
 * Provides React-friendly interface to WalletManager with automatic state updates
 *
 * @example
 * ```tsx
 * import { useMultiWallet, WalletType } from '@karn/sdk';
 *
 * function MyComponent() {
 *   const {
 *     state,
 *     availableWallets,
 *     connect,
 *     disconnect,
 *     signTransaction,
 *   } = useMultiWallet();
 *
 *   return (
 *     <div>
 *       {!state.isConnected ? (
 *         availableWallets.map(wallet => (
 *           <button key={wallet.type} onClick={() => connect(wallet.type)}>
 *             Connect {wallet.name}
 *           </button>
 *         ))
 *       ) : (
 *         <div>
 *           <p>Connected: {state.address}</p>
 *           <p>Wallet: {state.walletName}</p>
 *           <button onClick={disconnect}>Disconnect</button>
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  WalletManager,
  WalletType,
  WalletState,
  WalletMetadata,
  WalletConnection,
  WalletEvent,
  SignTransactionOptions,
  WalletError,
} from '../../wallet/index.js';

export interface UseMultiWalletReturn {
  /** Current wallet state */
  state: WalletState;

  /** List of available (installed) wallets */
  availableWallets: WalletMetadata[];

  /** List of all supported wallets (including unavailable) */
  allWallets: WalletMetadata[];

  /** Connect to a specific wallet */
  connect: (walletType: WalletType) => Promise<WalletConnection>;

  /** Disconnect from current wallet */
  disconnect: () => Promise<void>;

  /** Sign a transaction with current wallet */
  signTransaction: (xdr: string, options?: SignTransactionOptions) => Promise<string>;

  /** Sign a message (if supported) */
  signMessage: (message: string) => Promise<string>;

  /** Get current network (if supported) */
  getNetwork: () => Promise<string>;

  /** Get current address */
  getAddress: () => Promise<string | null>;

  /** Check if connected */
  isConnected: () => Promise<boolean>;

  /** Wallet manager instance (for advanced usage) */
  manager: WalletManager;
}

/**
 * Hook for multi-wallet support
 */
export function useMultiWallet(): UseMultiWalletReturn {
  // Create manager instance (persists across re-renders)
  const managerRef = useRef<WalletManager>();
  if (!managerRef.current) {
    managerRef.current = new WalletManager();
  }
  const manager = managerRef.current;

  // State
  const [state, setState] = useState<WalletState>(manager.getState());
  const [availableWallets, setAvailableWallets] = useState<WalletMetadata[]>([]);
  const [allWallets] = useState<WalletMetadata[]>(manager.getAllWallets());

  // Update state when wallet events occur
  useEffect(() => {
    const handleConnect = () => setState(manager.getState());
    const handleDisconnect = () => setState(manager.getState());
    const handleAccountChanged = () => setState(manager.getState());
    const handleNetworkChanged = () => setState(manager.getState());

    manager.on(WalletEvent.CONNECT, handleConnect);
    manager.on(WalletEvent.DISCONNECT, handleDisconnect);
    manager.on(WalletEvent.ACCOUNT_CHANGED, handleAccountChanged);
    manager.on(WalletEvent.NETWORK_CHANGED, handleNetworkChanged);

    return () => {
      manager.off(WalletEvent.CONNECT, handleConnect);
      manager.off(WalletEvent.DISCONNECT, handleDisconnect);
      manager.off(WalletEvent.ACCOUNT_CHANGED, handleAccountChanged);
      manager.off(WalletEvent.NETWORK_CHANGED, handleNetworkChanged);
    };
  }, [manager]);

  // Load available wallets on mount
  useEffect(() => {
    let mounted = true;

    async function loadAvailableWallets() {
      const wallets = await manager.getAvailableWallets();
      if (mounted) {
        setAvailableWallets(wallets);
      }
    }

    loadAvailableWallets();

    return () => {
      mounted = false;
    };
  }, [manager]);

  // Connect to wallet
  const connect = useCallback(
    async (walletType: WalletType): Promise<WalletConnection> => {
      const connection = await manager.connect(walletType);
      setState(manager.getState());
      return connection;
    },
    [manager]
  );

  // Disconnect from wallet
  const disconnect = useCallback(async (): Promise<void> => {
    await manager.disconnect();
    setState(manager.getState());
  }, [manager]);

  // Sign transaction
  const signTransaction = useCallback(
    async (xdr: string, options?: SignTransactionOptions): Promise<string> => {
      return await manager.signTransaction(xdr, options);
    },
    [manager]
  );

  // Sign message
  const signMessage = useCallback(
    async (message: string): Promise<string> => {
      return await manager.signMessage(message);
    },
    [manager]
  );

  // Get network
  const getNetwork = useCallback(async (): Promise<string> => {
    return await manager.getNetwork();
  }, [manager]);

  // Get address
  const getAddress = useCallback(async (): Promise<string | null> => {
    return await manager.getAddress();
  }, [manager]);

  // Check if connected
  const isConnected = useCallback(async (): Promise<boolean> => {
    return await manager.isConnected();
  }, [manager]);

  return {
    state,
    availableWallets,
    allWallets,
    connect,
    disconnect,
    signTransaction,
    signMessage,
    getNetwork,
    getAddress,
    isConnected,
    manager,
  };
}
