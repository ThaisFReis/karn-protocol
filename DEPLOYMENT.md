# Karn Protocol - Testnet Deployment

**Deployment Date:** 2026-02-07
**Network:** Stellar Testnet
**Deployer:** REDACTED_WALLET_ADDRESS_DEPLOYER

---

## Deployed Contract Addresses

### Valocracy Contract ✅
**Address:** `REDACTED_CONTRACT_ID_VALOCRACY_OLD`
- **WASM Hash:** ae32f937c3ec75e2cbd78faa7f2d5817c76d5846cc161e4758874b0374e314a8
- **Functions:** 29 exported (initialize, mint, self_register, get_votes, etc.)

### Governor Contract ✅
**Address:** `REDACTED_CONTRACT_ID_GOVERNOR_OLD`
- **WASM Hash:** ce6dc503e72609fda687564d29847df19a53979431d36b339565d8bb267cc6aa
- **Functions:** 12 exported (initialize, propose, cast_vote, execute, etc.)

### Treasury Contract ✅
**Address:** `REDACTED_CONTRACT_ID_TREASURY_OLD`
- **WASM Hash:** ed2c16e984faf0547307aad45f6590a8576d2eb1fe3a21406e7b92a28d43d677
- **Functions:** 19 exported (initialize, fund_lab, transfer, etc.)

---

## Security Status

✅ **All vulnerabilities resolved:**
- KRN-01 (Critical): Treasury governance enforced
- KRN-02 (High): Genesis Council power-neutral
- KRN-03 (High): Voting snapshot implemented
- KRN-04 (Medium): Integer overflow protection
- KRN-05 (Low): Guardian authorization

---

## Next Steps: Contract Initialization

**⚠️ CONTRACTS MUST BE INITIALIZED BEFORE USE**

### 1. Initialize Valocracy

```bash
stellar contract invoke \
  --id REDACTED_CONTRACT_ID_VALOCRACY_OLD \
  --source deployer \
  --network testnet \
  -- \
  initialize \
  --genesis-members '["<GENESIS_MEMBER_1>", "<GENESIS_MEMBER_2>", "<GENESIS_MEMBER_3>"]' \
  --governor REDACTED_CONTRACT_ID_GOVERNOR_OLD \
  --treasury REDACTED_CONTRACT_ID_TREASURY_OLD \
  --member-valor-id 0 \
  --valor-ids '[0, 10, 20, 70]' \
  --valor-rarities '[5, 100, 20, 50]' \
  --valor-metadatas '["Member", "Leadership", "Track", "Governance"]' \
  --leadership-valor-id 10 \
  --signer <BACKEND_SIGNER_PUBLIC_KEY>
```

**Genesis Members:** 3-5 initial members who receive Leadership badges
**Signer:** Backend public key for self-registration verification

### 2. Initialize Governor

```bash
stellar contract invoke \
  --id REDACTED_CONTRACT_ID_GOVERNOR_OLD \
  --source deployer \
  --network testnet \
  -- \
  initialize \
  --valocracy REDACTED_CONTRACT_ID_VALOCRACY_OLD
```

### 3. Initialize Treasury

```bash
stellar contract invoke \
  --id REDACTED_CONTRACT_ID_TREASURY_OLD \
  --source deployer \
  --network testnet \
  -- \
  initialize \
  --governor REDACTED_CONTRACT_ID_GOVERNOR_OLD \
  --valocracy REDACTED_CONTRACT_ID_VALOCRACY_OLD \
  --asset <USDC_OR_XLM_TOKEN_ADDRESS>
```

**Asset:** Token address for treasury operations (USDC recommended for testnet)

---

## Frontend Configuration

Update your `dapp-karn-ecosystem/frontend/.env.local`:

```bash
# Network
NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org

# Contract Addresses (NEW DEPLOYMENT)
NEXT_PUBLIC_VALOCRACY_CONTRACT=REDACTED_CONTRACT_ID_VALOCRACY_OLD
NEXT_PUBLIC_GOVERNOR_CONTRACT=REDACTED_CONTRACT_ID_GOVERNOR_OLD
NEXT_PUBLIC_TREASURY_CONTRACT=REDACTED_CONTRACT_ID_TREASURY_OLD

# Backend
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

---

## Testing Checklist

After initialization, verify:

- [ ] Valocracy initialized (check total_supply)
- [ ] Genesis members minted Leadership badges
- [ ] Governor can query Valocracy
- [ ] Treasury accepts deposits
- [ ] Self-registration works
- [ ] Proposal creation works
- [ ] Voting with Mana works
- [ ] Treasury transfers require governance

### Test Commands

**Check Valocracy total supply:**
```bash
stellar contract invoke \
  --id REDACTED_CONTRACT_ID_VALOCRACY_OLD \
  --network testnet \
  -- total_supply
```

**Check Governor proposal count:**
```bash
stellar contract invoke \
  --id REDACTED_CONTRACT_ID_GOVERNOR_OLD \
  --network testnet \
  -- proposal_count
```

**Check Treasury governor:**
```bash
stellar contract invoke \
  --id REDACTED_CONTRACT_ID_TREASURY_OLD \
  --network testnet \
  -- governor
```

---

## Explorer Links

### Stellar Expert (Testnet)
- **Valocracy:** https://stellar.expert/explorer/testnet/contract/REDACTED_CONTRACT_ID_VALOCRACY_OLD
- **Governor:** https://stellar.expert/explorer/testnet/contract/REDACTED_CONTRACT_ID_GOVERNOR_OLD
- **Treasury:** https://stellar.expert/explorer/testnet/contract/REDACTED_CONTRACT_ID_TREASURY_OLD

---

## Monitoring

**Recommended monitoring period:** 48 hours minimum

Watch for:
- Transaction success rates
- Gas consumption patterns
- Cross-contract call errors
- Authorization failures
- Unexpected state changes

---

## Mainnet Deployment (Future)

**Prerequisites for mainnet:**
- ✅ All security vulnerabilities resolved (DONE)
- ⏳ External security audit (PENDING)
- ⏳ 48+ hours testnet monitoring (IN PROGRESS)
- ⏳ Bug bounty program (RECOMMENDED)
- ⏳ Community testing (RECOMMENDED)

**Do NOT deploy to mainnet without external audit.**

---

## Support

**Issues:** https://github.com/your-org/karn-protocol/issues
**Security:** Report vulnerabilities via GitHub Security Advisories

---

## Deployment Log

| Timestamp | Contract | Address | Deployer | Status |
|-----------|----------|---------|----------|--------|
| 2026-02-07 | Valocracy | REDACTED_CONTRACT_ID_VALOCRACY_OLD | deployer | ✅ Deployed |
| 2026-02-07 | Governor | REDACTED_CONTRACT_ID_GOVERNOR_OLD | deployer | ✅ Deployed |
| 2026-02-07 | Treasury | REDACTED_CONTRACT_ID_TREASURY_OLD | deployer | ✅ Deployed |

---

**Deployment Complete! 🎉**

All contracts are live on Stellar Testnet and ready for initialization.
