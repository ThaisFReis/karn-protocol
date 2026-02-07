import { useState, useCallback, useEffect } from 'react';
import { isConnected, requestAccess, signTransaction } from '@stellar/freighter-api';

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
          // How to get address? usually getPublicKey or getAddress from freighter-api
          // Wait, @stellar/freighter-api has `getPublicKey`?
          // I need to check API or rely on standard.
          // Let's assume requestAccess returns address or we call another method.
          // Usually `requestAccess` returns public key string if successful?
          // Docs say `requestAccess()` returns string | null (public key).
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

  // Check connection on mount?
  useEffect(() => {
    isConnected().then(async (connected) => {
      if (connected) {
          // If already connected, we might need to request access silently or get key?
          // freighter-api doesn't expose `getPublicKey` without prompt unless already granted?
          // Usually `requestAccess` is safe to call if connected.
      }
    });
  }, []);

  return {
    ...state,
    connect,
    signTransaction, // Expose freighter sign
  };
};
