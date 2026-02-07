# @karn_lat/protocol-sdk

[![npm version](https://img.shields.io/npm/v/@karn_lat/protocol-sdk.svg?style=flat&color=purple)](https://www.npmjs.com/package/@karn_lat/protocol-sdk)
[![npm downloads](https://img.shields.io/npm/dm/@karn_lat/protocol-sdk.svg?style=flat&color=purple)](https://www.npmjs.com/package/@karn_lat/protocol-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Stellar: Soroban](https://img.shields.io/badge/Stellar-Soroban-blue.svg)](https://soroban.stellar.org)

> **The official TypeScript SDK for Karn Protocol**
>
> Merit-based governance on Stellar/Soroban - where power = contribution, not capital

## Installation

```bash
npm install @karn_lat/protocol-sdk @stellar/stellar-sdk
```

## Quick Start

```typescript
import { 
  ValocracyClient, 
  GovernorClient, 
  TreasuryClient, 
  rpc 
} from '@karn_lat/protocol-sdk';

// Configuration
const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";
const RPC_URL = "https://soroban-testnet.stellar.org";
const CONTRACT_ID = "C..."; 

async function main() {
  const valocracy = new ValocracyClient(NETWORK_PASSPHRASE, RPC_URL, CONTRACT_ID);

  // Read data
  const level = await valocracy.getLevel("G...");
  console.log("User Level:", level);

  // Calculate Mana (client-side)
  const mana = await valocracy.getMana("G...");
  console.log("Voting Power:", mana);
}

main();
```

## Features

- **Typed Clients**: Wrappers for Valocracy, Governor, and Treasury contracts.
- **Mana Decay**: Client-side utility to calculate real-time voting power.
- **React Hooks**: Ready-to-use hooks for React applications (`useValocracy`, `useWallet`).
- **Multi-Wallet**: Helper for wallet connection (Freighter).

## React Usage

Wrap your app in `KarnProvider`:

```tsx
import { KarnProvider } from '@karn_lat/protocol-sdk';

const config = {
  networkPassphrase: "...",
  rpcUrl: "...",
  contracts: { valocracy: "...", governor: "...", treasury: "..." }
};

function App() {
  return (
    <KarnProvider config={config}>
      <MyComponent />
    </KarnProvider>
  );
}
```
