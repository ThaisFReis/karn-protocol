# Wallet Connection Guide

This guide documents the wallet connection flow used in `apps/dapp-karn-ecosystem/frontend/src/contexts/WalletContext.tsx`.

## When to use this guide

Use this if you want:
- a production-ready wallet connect/disconnect flow
- device-aware wallet options (desktop vs mobile)
- persistent session restore
- clear error handling around wallet operations

## Recommended setup

- Use `WalletManager` from `@karn_lat/protocol-sdk`
- Keep one manager instance for the app lifecycle
- Read/write UI state from `manager.getState()`
- Refresh wallet availability using `manager.getAvailableWallets()`

## Minimal React context pattern

```tsx
'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  WalletManager,
  WalletType,
  WalletError,
  WalletErrorCode,
  type WalletMetadata,
  type WalletState,
} from '@karn_lat/protocol-sdk';

type WalletCtx = {
  state: WalletState;
  availableWallets: WalletMetadata[];
  isMobile: boolean;
  connect: (type: WalletType) => Promise<void>;
  disconnect: () => Promise<void>;
};

const WalletContext = createContext<WalletCtx | null>(null);

export function AppWalletProvider({ children }: { children: ReactNode }) {
  const [manager] = useState(() => new WalletManager());
  const [state, setState] = useState<WalletState>(manager.getState());
  const [availableWallets, setAvailableWallets] = useState<WalletMetadata[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  const sync = useCallback(() => {
    setState(manager.getState());
  }, [manager]);

  useEffect(() => {
    sync();
  }, [sync]);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const refreshWallets = useCallback(async () => {
    await manager.getAvailableWallets().catch(() => []);

    const allowed = isMobile
      ? new Set<WalletType>([WalletType.ALBEDO])
      : new Set<WalletType>([WalletType.FREIGHTER, WalletType.ALBEDO]);

    const visible = manager.getAllWallets().filter((w) => allowed.has(w.type));
    setAvailableWallets(visible);
  }, [manager, isMobile]);

  useEffect(() => {
    void refreshWallets();
  }, [refreshWallets]);

  const connect = useCallback(
    async (type: WalletType) => {
      try {
        await manager.connect(type);
        sync();
        await refreshWallets();
      } catch (err) {
        if (err instanceof WalletError) {
          if (err.code === WalletErrorCode.NOT_INSTALLED) {
            throw new Error(`${type} is not installed or not available in this device/browser.`);
          }
          if (err.code === WalletErrorCode.USER_REJECTED) {
            throw new Error('Connection was rejected in the wallet popup/extension.');
          }
        }
        throw err;
      }
    },
    [manager, refreshWallets, sync]
  );

  const disconnect = useCallback(async () => {
    await manager.disconnect();
    sync();
  }, [manager, sync]);

  const value = useMemo(
    () => ({ state, availableWallets, isMobile, connect, disconnect }),
    [state, availableWallets, isMobile, connect, disconnect]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useAppWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error('useAppWallet must be used within AppWalletProvider');
  }
  return ctx;
}
```

## How this maps to the current dApp

The ecosystem dApp uses the same principles:
- single `WalletManager` instance
- `syncFromManager()` after connect
- filtered wallet list by device type
- graceful error handling
- disconnect cleanup

Reference implementation:
- `apps/dapp-karn-ecosystem/frontend/src/contexts/WalletContext.tsx`

## Supported wallets

From the SDK wallet module:
- `WalletType.FREIGHTER`
- `WalletType.ALBEDO`
- `WalletType.LOBSTR`
- `WalletType.XBULL`
- `WalletType.RABET`

Notes:
- Browser extension wallets depend on injected `window.*` APIs.
- Albedo is web-based and works via popup intent.
- In SSR frameworks (Next.js), wallet code must run in client components.

## Signing usage

```ts
const signedXdr = await manager.signTransaction(xdr, {
  networkPassphrase: 'Test SDF Network ; September 2015',
});

const signature = await manager.signMessage('Karn login challenge');
```

## Error handling checklist

Handle `WalletErrorCode` from SDK:
- `NOT_INSTALLED`: wallet extension missing or unsupported environment
- `USER_REJECTED`: user denied connect/sign request
- `NOT_CONNECTED`: attempted signing without an active connection
- `UNSUPPORTED_METHOD`: wallet does not implement requested feature
- `SIGNING_FAILED`: wallet signing failed

## Troubleshooting

1. `No wallet connected`
   - Call `connect(...)` first.
   - Verify `manager.getState().isConnected === true`.

2. `...is not installed`
   - For Freighter/Lobstr/xBull/Rabet, confirm extension is installed and enabled.
   - Refresh page after installing extension.

3. Connection worked before, now fails after reload
   - SDK tries auto-restore via localStorage (`karn_wallet_connection`).
   - If stale, call `disconnect()` and connect again.

4. Transaction signing fails with network issues
   - Pass the correct `networkPassphrase` in `signTransaction(..., { networkPassphrase })`.

## Alternative: React hook

If you do not need a custom context, use:

```tsx
import { useMultiWallet } from '@karn_lat/protocol-sdk/react';

const {
  state,
  availableWallets,
  connect,
  disconnect,
  signTransaction,
  signMessage,
} = useMultiWallet();
```

This wraps `WalletManager` with React state updates and is a good default for small apps.
