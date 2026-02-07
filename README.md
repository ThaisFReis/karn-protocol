# Karn Protocol

> Merit-based governance on Stellar/Soroban where power = contribution, not capital

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What is Karn Protocol?

Karn Protocol is open-source governance infrastructure that replaces plutocracy (1 token = 1 vote) with merit-based voting. Your influence comes from verified contributions, not your wallet balance.

### Key Features

- **Soulbound Tokens:** Non-transferable NFTs proving contributions
- **Mana Decay:** Voting power that decays over 180 days of inactivity
- **Zero Plutocracy:** You can't buy permanent power
- **Composable:** 3 contracts that work together or independently
- **MIT Licensed:** Fork, customize, deploy for your organization

## Quick Start

See [Getting Started](docs/getting-started/quick-start.md).

## Architecture

The protocol consists of three core contracts:

1.  **Valocracy**: Manages Soulbound Tokens (SBTs), identity, and Mana calculation.
2.  **Governor**: Handles proposal creation, voting logic, and execution execution.
3.  **Treasury**: A transparent vault for funds, supporting scholarship escrows.

## Documentation

- [Concepts](docs/concepts/)
- [Deployment Guide](docs/getting-started/deploy-your-own.md)
- [Contract Reference](docs/contracts/)
- [SDK Reference](docs/sdk/)

## Contributing

See [CONTRIBUTING.md](.github/CONTRIBUTING.md)

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

## License

MIT - See [LICENSE](LICENSE)
