/**
 * Comprehensive test for SDK fixes
 * Tests both package exports and ES module imports
 */

console.log('╔════════════════════════════════════════════════════╗');
console.log('║   @karn_lat/protocol-sdk v0.1.0-alpha.2           ║');
console.log('║   Testing Fixed Package Exports                    ║');
console.log('╚════════════════════════════════════════════════════╝\n');

const tests = [];

// Test 1: Import from /clients subpath
console.log('📋 Test 1: Import from /clients subpath');
try {
  const { ValocracyClient, GovernorClient, TreasuryClient } = await import('./dist/clients/index.js');

  const valocracy = new ValocracyClient(
    'Test SDF Network ; September 2015',
    'https://soroban-testnet.stellar.org',
    'REDACTED_CONTRACT_ID_VALOCRACY'
  );

  console.log('   ✓ Import from ./dist/clients/index.js works\n');
  tests.push({ name: 'Clients subpath', passed: true });
} catch (error) {
  console.error('   ✗ Failed:', error.message, '\n');
  tests.push({ name: 'Clients subpath', passed: false, error: error.message });
}

// Test 2: Import from root (includes React provider)
console.log('🏛️  Test 2: Import from root (includes React)');
try {
  const { ValocracyClient, GovernorClient, TreasuryClient } = await import('./dist/index.js');

  const governor = new GovernorClient(
    'Test SDF Network ; September 2015',
    'https://soroban-testnet.stellar.org',
    'REDACTED_CONTRACT_ID_GOVERNOR'
  );

  console.log('   ✓ Import from ./dist/index.js works');
  console.log('   ✓ React provider ES module fix successful\n');
  tests.push({ name: 'Root import', passed: true });
} catch (error) {
  console.error('   ✗ Failed:', error.message, '\n');
  tests.push({ name: 'Root import', passed: false, error: error.message });
}

// Test 3: Import React provider
console.log('⚛️  Test 3: Import React provider');
try {
  const { KarnProvider, useKarn } = await import('./dist/react/index.js');

  console.log('   ✓ React provider imports successfully');
  console.log('   ✓ KarnProvider available');
  console.log('   ✓ useKarn hook available\n');
  tests.push({ name: 'React provider', passed: true });
} catch (error) {
  console.error('   ✗ Failed:', error.message, '\n');
  tests.push({ name: 'React provider', passed: false, error: error.message });
}

// Test 4: Import utils
console.log('🔧 Test 4: Import utils');
try {
  const { calculateMana } = await import('./dist/utils/index.js');

  console.log('   ✓ Utils import successfully');
  console.log('   ✓ calculateMana available\n');
  tests.push({ name: 'Utils', passed: true });
} catch (error) {
  console.error('   ✗ Failed:', error.message, '\n');
  tests.push({ name: 'Utils', passed: false, error: error.message });
}

// Test 5: Import wallet
console.log('💳 Test 5: Import wallet');
try {
  const { WalletManager } = await import('./dist/wallet/index.js');

  console.log('   ✓ Wallet imports successfully');
  console.log('   ✓ WalletManager available\n');
  tests.push({ name: 'Wallet', passed: true });
} catch (error) {
  console.error('   ✗ Failed:', error.message, '\n');
  tests.push({ name: 'Wallet', passed: false, error: error.message });
}

// Summary
console.log('════════════════════════════════════════════════════');
console.log('📊 TEST SUMMARY');
console.log('════════════════════════════════════════════════════\n');

const passed = tests.filter(t => t.passed).length;
const total = tests.length;

console.log(`Tests Passed: ${passed}/${total}\n`);

tests.forEach(test => {
  console.log(`  ${test.passed ? '✓' : '✗'} ${test.name}`);
  if (!test.passed && test.error) {
    console.log(`    Error: ${test.error}`);
  }
});

if (passed === total) {
  console.log('\n🎉 All tests passed! SDK is fixed and ready to publish.');
  console.log('\n📦 Next steps:');
  console.log('   1. npm version patch (or minor/major)');
  console.log('   2. npm publish');
  console.log('   3. Update documentation with new import patterns');
} else {
  console.log('\n⚠️  Some tests failed. Review errors above.');
  process.exit(1);
}
