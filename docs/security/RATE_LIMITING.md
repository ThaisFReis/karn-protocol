# Rate Limiting Strategy (SC-001.9)

**Last Updated:** 2026-02-07
**Status:** Implemented (Backend) / Native (Contract)

This document outlines the rate limiting strategy for Karn Protocol to prevent Denial of Service (DoS) attacks and abuse of the governance system.

---

## 1. Backend / Guardian Level (Primary Defense)

The **Keeper/Guardian** (backend API) acts as the primary gatekeeper for all state-changing operations that require off-chain validation (Minting, Registration).

### Strategy: Token Bucket & IP Rate Limiting
We use `express-rate-limit` middleware on all API routes, with stricter limits on signature-generating endpoints.

#### Default API Limits
- **Scope:** Global (per IP)
- **Limit:** 100 requests per 15 minutes
- **Impact:** Prevents general API spam and scraping.

#### Sensitive Endpoints (`/mint`, `/register`)
- **Scope:** Per Wallet Address (authenticated) + Per IP
- **Limit:** 
    - **Registration:** 1 attempt per 24 hours per wallet.
    - **Minting:** 5 requests per hour per wallet.
- **Justification:** Minting requires cryptographic signatures and database writes. Limiting this prevents signature replay spam and database exhaustion.

### Circuit Breakers
- If the backend detects abnormal failure rates from the Soroban RPC execution, it will temporarily pause new signature issuance to protect the network.

---

## 2. Contract Level (Secondary Defense)

Smart contracts on Soroban do not implement explicit "rate limiting" logic (e.g., storing timestamps per call) to avoid state bloat and excessive rent costs. Instead, we rely on **Economic Barriers** and **Protocol Protocol**.

### Economic Barriers (Fees & Resources)
- **Transaction Fees:** Every operation costs XLM. High-frequency spam is economically disincentivized.
- **Rent (State Expiry):** Creating new ledger entries (e.g., spamming proposals) requires rent payments.
- **Resource Limits:** Soroban enforces per-transaction and per-ledger CPU/RAM limits. Contracts are optimized to stay well within these limits for legitimate use, but spam attacks will hit network-level caps quickly.

### Protocol Constraints
- **Sequence Numbers:** The `self_register` and `mint` functions require a unique nonce signed by the backend. Once a nonce is used, it cannot be replayed. This effectively delegates rate limiting to the backend signer.
- **Voting Power (Mana):** To create a proposal, a user must have sufficient Manifested Mana (voting power). This prevents fresh accounts or low-contribution members from spamming proposals.
- **Voting Period:** Governance actions take time (7 days). This natural delay prevents high-frequency governance attacks.

---

## 3. Frontend Level (User Experience)

The frontend implements client-side limiting to improve UX and reduce load on the backend.

### Debouncing & Throttling
- **Button Clicks:** All state-changing buttons (Mint, Vote) are disabled immediately after click and re-enabled only after transaction confirmation or failure.
- **RPC Queries:** `useSWR` or similar caching strategies are used to prevent redundant data fetching (e.g., `get_user_stats` is cached for 30 seconds).
- **Toast Notifications:** Users receive clear feedback ("Transaction in progress", "Please wait") to prevent rage-clicking.

---

## Summary of Layers

| Layer | Mechanism | Target | Status |
|-------|-----------|--------|--------|
| **Frontend** | Debouncing / Caching | UX / Accidental Spam | Implemented |
| **Backend** | `express-rate-limit` | DoS / API Abuse | Implemented |
| **Backend** | Signature Throttling | Sybil / Replay Attacks | Implemented (Auth) |
| **Contract** | Nonce / Sequence # | Replay Attacks | Implemented (SC-001.4) |
| **Contract** | Network Fees / Rent | Economic Spam | Native (Soroban) |
