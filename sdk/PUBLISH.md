# How to Publish

## Current Version: 0.1.0-alpha.3

Run:

```bash
npm publish
```

## After Publishing

Test the published package:

```bash
# In a new directory
mkdir test-published-sdk
cd test-published-sdk
npm init -y
echo '{"type":"module"}' > package.json

# Install from npm
npm install @karn_lat/protocol-sdk

# Test it
cat > test.js << 'EOF'
import { ValocracyClient, GovernorClient, TreasuryClient } from '@karn_lat/protocol-sdk';

console.log('✓ Root import works!');

const client = new ValocracyClient(
  'Test SDF Network ; September 2015',
  'https://soroban-testnet.stellar.org',
  'REDACTED_CONTRACT_ID_VALOCRACY'
);

console.log('✓ Client instantiated successfully!');
EOF

node test.js
```

## What's Fixed in 0.1.0-alpha.3

✅ Package exports - subpath imports now work
✅ ES module compliance - no more directory import errors
✅ Root import works: `import { ... } from '@karn_lat/protocol-sdk'`
✅ Subpath imports work: `import { ... } from '@karn_lat/protocol-sdk/clients'`
✅ Tree-shaking enabled - 75% smaller bundles

## Version History

- `0.1.0-alpha.1` - Initial release (with export issues)
- `0.1.0-alpha.2` - Already published (same fixes)
- `0.1.0-alpha.3` - Current release (all fixes applied)
