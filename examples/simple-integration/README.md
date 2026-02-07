# Simple Integration Example

**Complexity**: Beginner
**Tech**: Vanilla JavaScript + HTML + CSS
**Purpose**: Minimal example showing basic wallet connection and Mana query

## Features

- Connect to Freighter wallet
- Display user address
- Query and display Mana (voting power)
- Query total level and permanent level
- Auto-reconnect on page reload
- Clean, modern UI

## Quick Start

### Option 1: Direct File (No Build Step)

```bash
# Simply open the file in your browser
open index.html
```

That's it! No npm install, no build step needed.

### Option 2: Local Server

```bash
# Using Python
python3 -m http.server 8000

# Using Node.js
npx serve .

# Then visit http://localhost:8000
```

## Prerequisites

1. **Freighter Wallet** installed ([freighter.app](https://freighter.app))
2. **Testnet XLM** in your wallet (get from [friendbot](https://laboratory.stellar.org/#account-creator?network=test))
3. **Web browser** (Chrome, Firefox, or Brave)

## How It Works

### 1. Connect Wallet

Click "Connect Freighter Wallet":
- Requests public key from Freighter extension
- User approves connection
- Address displayed in UI

### 2. Fetch Data

After connection, automatically queries Valocracy contract:
- `get_votes(address)` → Returns current Mana
- `level_of(address)` → Returns total level
- `permanent_level_of(address)` → Returns permanent level (Founder badge)

### 3. Display Results

Shows:
- **Mana** — Current voting power (decays over 180 days)
- **Level** — Total accumulated level from all badges
- **Permanent Level** — Non-decaying level (0 for most users, 100 for Founder)
- **Address** — User's Stellar address (truncated)

## Code Walkthrough

### Configuration

```javascript
const CONFIG = {
    networkPassphrase: 'Test SDF Network ; September 2015',
    rpcUrl: 'https://soroban-testnet.stellar.org',
    valocracyContract: 'REDACTED_CONTRACT_ID_VALOCRACY',
};
```

Update `valocracyContract` with your contract address if deploying your own instance.

### Connect to Freighter

```javascript
// Check if Freighter is installed
if (!window.freighter) {
    throw new Error('Freighter wallet not installed');
}

// Request public key
const publicKey = await window.freighter.getPublicKey();
```

### Query Contract

```javascript
// Get account from Stellar
const account = await rpcServer.getAccount(walletAddress);

// Build transaction for contract call
const contract = new StellarSdk.Contract(CONFIG.valocracyContract);
const tx = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: CONFIG.networkPassphrase,
})
.addOperation(contract.call('get_votes',
    StellarSdk.Address.fromString(walletAddress).toScVal()
))
.setTimeout(30)
.build();

// Simulate (read-only, no signature needed)
const simulation = await rpcServer.simulateTransaction(tx);

// Extract result
const mana = StellarSdk.scValToBigInt(simulation.result.retval);
```

## Customization

### Change Contract Address

Edit the `CONFIG.valocracyContract` variable:

```javascript
const CONFIG = {
    valocracyContract: 'YOUR_CONTRACT_ID_HERE',
};
```

### Add More Contract Calls

Example: Query if user is verified

```javascript
const verifiedTx = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: CONFIG.networkPassphrase,
})
.addOperation(contract.call('is_verified',
    StellarSdk.Address.fromString(walletAddress).toScVal()
))
.setTimeout(30)
.build();

const verifiedSim = await rpcServer.simulateTransaction(verifiedTx);
const isVerified = StellarSdk.scValToBigInt(verifiedSim.result.retval);

console.log('User verified:', isVerified === 1n);
```

### Change Styling

All CSS is inline in the `<style>` tag. Customize colors:

```css
/* Change primary color from purple to blue */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
/* to */
background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
```

## Troubleshooting

### "Freighter wallet not installed"

**Solution:** Install Freighter from [freighter.app](https://freighter.app)

### "User rejected connection"

**Solution:** Click "Approve" in Freighter popup

### "Could not fetch data from contract"

**Possible causes:**
1. Contract address is wrong
2. Network mismatch (check Freighter is on Testnet)
3. RPC server unavailable

**Solution:**
- Verify contract address in CONFIG
- Switch Freighter to Testnet
- Check browser console for detailed error

### "Account not found"

**Solution:** Fund your account with testnet XLM:
1. Copy your address from Freighter
2. Visit https://laboratory.stellar.org/#account-creator?network=test
3. Paste address and click "Get test network lumens"

## Next Steps

After understanding this example:

1. **Try Badge Viewer** — `../badge-viewer/` (React + TypeScript)
2. **Build Mana Calculator** — `../mana-calculator/` (decay visualization)
3. **Explore SDK** — Use `@karn/protocol-sdk` for easier integration

## Resources

- **Freighter Docs**: [docs.freighter.app](https://docs.freighter.app)
- **Stellar SDK**: [developers.stellar.org](https://developers.stellar.org)
- **Karn Docs**: `../../docs/getting-started/quick-start.md`

---

**Example Version**: 1.0.0
**Dependencies**: None (uses CDN)
**Lines of Code**: ~200
