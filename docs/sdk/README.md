# SDK Reference

Documentation for the `@karn_lat/protocol-sdk` TypeScript library.

## Start Here

- [SDK README](../../sdk/README.md)
- [Wallet Connection Guide](./WALLET_CONNECT_GUIDE.md)
- [SDK Test Coverage & Examples](./SDK_TESTS_IMPLEMENTATION.md)

## Install

```bash
npm install @karn_lat/protocol-sdk
```

## Quick Usage

```ts
import { ValocracyClient, WalletManager, WalletType } from '@karn_lat/protocol-sdk';

const wallets = new WalletManager();
await wallets.connect(WalletType.FREIGHTER);

const valocracy = new ValocracyClient(
  'Test SDF Network ; September 2015',
  'https://soroban-testnet.stellar.org',
  'C...'
);
```
