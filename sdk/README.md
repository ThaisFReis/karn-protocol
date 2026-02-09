# @karn_lat/protocol-sdk

[![npm version](https://img.shields.io/npm/v/@karn_lat/protocol-sdk.svg?style=flat&color=purple)](https://www.npmjs.com/package/@karn_lat/protocol-sdk)
[![npm downloads](https://img.shields.io/npm/dm/@karn_lat/protocol-sdk.svg?style=flat&color=purple)](https://www.npmjs.com/package/@karn_lat/protocol-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Stellar: Soroban](https://img.shields.io/badge/Stellar-Soroban-blue.svg)](https://soroban.stellar.org)

TypeScript SDK for integrating **Karn Protocol** contracts (Valocracy, Governor, Treasury) into web apps.

Includes:
- Typed contract clients (thin wrappers over Soroban-generated bindings)
- React provider + hooks for Next.js/React apps
- Multi-wallet connection manager (Freighter, Lobstr, xBull, Rabet, Albedo)
- Utilities (mana decay, polling helpers, simulations)

## Installation

```bash
npm install @karn_lat/protocol-sdk
```

## Requirements

- ESM package (`"type": "module"`)
- Node.js 18+ recommended
- React 18+ only if you use `@karn_lat/protocol-sdk/react` exports

## Import Patterns

The SDK supports root and subpath imports (recommended for tree-shaking):

```typescript
// Root import
import { ValocracyClient, GovernorClient, TreasuryClient } from '@karn_lat/protocol-sdk';

// Subpath imports
import { ValocracyClient } from '@karn_lat/protocol-sdk/clients';
import { useKarn, KarnProvider } from '@karn_lat/protocol-sdk/react';
import { WalletManager } from '@karn_lat/protocol-sdk/wallet';
import { calculateManaAtTimestamp } from '@karn_lat/protocol-sdk/utils';
```

## Network Constants

Common network passphrases:

```ts
export const STELLAR = {
  TESTNET_PASSPHRASE: 'Test SDF Network ; September 2015',
  PUBLIC_PASSPHRASE: 'Public Global Stellar Network ; September 2015',
};
```

Use an RPC URL appropriate for your environment (public testnet RPC, self-hosted RPC, etc.).

## Quick Start (Clients)

```typescript
import { ValocracyClient, GovernorClient, TreasuryClient } from '@karn_lat/protocol-sdk';

// Configuration
const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';
const RPC_URL = 'https://soroban-testnet.stellar.org';

const CONTRACTS = {
  valocracy: 'C...',
  governor: 'C...',
  treasury: 'C...',
};

async function main() {
  const valocracy = new ValocracyClient(NETWORK_PASSPHRASE, RPC_URL, CONTRACTS.valocracy);
  const governor = new GovernorClient(NETWORK_PASSPHRASE, RPC_URL, CONTRACTS.governor);
  const treasury = new TreasuryClient(NETWORK_PASSPHRASE, RPC_URL, CONTRACTS.treasury);

  // Read data
  const level = await valocracy.getLevel('G...');
  const mana = await valocracy.getMana('G...');
  const claimable = await treasury.getClaimableBalance('G...');

  console.log({ level, mana, claimable });

  // Governance read
  const proposal = await governor.getProposal(1n);
  console.log({ proposal });
}

main();
```

## Features

- **Typed clients**: `ValocracyClient`, `GovernorClient`, `TreasuryClient`
- **React**: `KarnProvider`, `useKarn`, `useValocracy`, `useGovernor`, `useTreasury`, `useWallet`, `useMultiWallet`
- **Multi-wallet**: `WalletManager` + adapters
- **Utilities**: mana decay helpers + polling/simulation helpers

## React Usage

Wrap your app in `KarnProvider` (React/Next.js):

```tsx
import { KarnProvider } from '@karn_lat/protocol-sdk/react';

const config = {
  networkPassphrase: 'Test SDF Network ; September 2015',
  rpcUrl: 'https://soroban-testnet.stellar.org',
  contracts: { valocracy: 'C...', governor: 'C...', treasury: 'C...' },
};

function App() {
  return (
    <KarnProvider config={config}>
      <MyComponent />
    </KarnProvider>
  );
}
```

Then, in a component:

```tsx
import { useValocracy, useTreasury } from '@karn_lat/protocol-sdk/react';

export function MyComponent({ address }: { address: string }) {
  const { getLevel, getMana } = useValocracy();
  const { getClaimableBalance } = useTreasury();

  // Call these from effects/actions; they are async.
  // Example omitted for brevity.
  return null;
}
```

## Wallet Support

The wallet module is intended for browser usage. In Next.js, use it in client components only.

```ts
import { WalletManager, WalletType } from '@karn_lat/protocol-sdk/wallet';

const wallets = new WalletManager();
const available = await wallets.getAvailableWallets();

await wallets.connect(WalletType.FREIGHTER);
const address = await wallets.getAddress();
```

Notes:
- **Freighter/Lobstr/xBull/Rabet** availability is detected from injected `window.*` APIs.
- **Albedo** is web-based; this SDK does not inject external scripts. Provide `window.albedo` yourself if you want to use Albedo.

## Utilities

```ts
import { calculateManaAtTimestamp } from '@karn_lat/protocol-sdk/utils';

// Example: project voting power at a given timestamp (use values from on-chain stats/events).
const mana = calculateManaAtTimestamp({
  level: 100,
  expiry: 1_800_000_000,
  now: 1_700_000_000,
});
```

## API Surface

- Clients: `@karn_lat/protocol-sdk/clients`
- React: `@karn_lat/protocol-sdk/react`
- Wallet: `@karn_lat/protocol-sdk/wallet`
- Utils: `@karn_lat/protocol-sdk/utils`
