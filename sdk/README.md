# @karn/protocol-sdk

The official TypeScript SDK for interacting with the Karn Protocol (Valocracy) on Stellar/Soroban.

## Installation

```bash
npm install @karn/protocol-sdk @stellar/stellar-sdk
```

## Quick Start

```typescript
import { 
  ValocracyClient, 
  GovernorClient, 
  TreasuryClient, 
  rpc 
} from '@karn/protocol-sdk';

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
import { KarnProvider } from '@karn/protocol-sdk';

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
