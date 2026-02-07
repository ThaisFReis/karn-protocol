import { useState, useCallback, useEffect } from 'react';
import * as freighter from '@stellar/freighter-api';
// @ts-ignore
const { isConnected, requestAccess, signTransaction } = freighter;

interface WalletState {
  isConnected: boolean;
  address: string | null;
  isConnecting: boolean;
  error: string | null;
}

export const useWallet = () => {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    address: null,
    isConnecting: false,
    error: null,
  });

  const connect = useCallback(async () => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));
    try {
      const allowed = await requestAccess();
      if (allowed) {

          const address = allowed; 
          if (address) {
            setState({
              isConnected: true,
              address: address, // Type check: allowed is string
              isConnecting: false,
              error: null,
            });
          } else {
             throw new Error("Access denied");
          }
      } else {
        throw new Error("User denied access");
      }
    } catch (err: any) {
      setState(prev => ({ ...prev, isConnecting: false, error: err.message || "Failed to connect" }));
    }
  }, []);

  // Check connection on mount
  useEffect(() => {
    isConnected().then(async (connected) => {
      if (connected) {

      }
    });
  }, []);

  return {
    ...state,
    connect,
    signTransaction, // Expose freighter sign
  };
};
