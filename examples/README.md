# Karn Protocol - Example Applications

This directory contains complete example applications demonstrating how to integrate with Karn Protocol.

## Examples

### 1. Simple Integration (`simple-integration/`)
**Complexity**: Beginner
**Tech**: Vanilla JavaScript
**Purpose**: Minimal example showing basic wallet connection and Mana query

### 2. Badge Viewer (`badge-viewer/`)
**Complexity**: Intermediate
**Tech**: React + TypeScript
**Purpose**: Display user badges and levels with real-time data

### 3. Mana Calculator (`mana-calculator/`)
**Complexity**: Intermediate
**Tech**: React + TypeScript
**Purpose**: Calculate and visualize Mana decay over time

### 4. Governance Dashboard (`governance-dashboard/`)
**Complexity**: Advanced
**Tech**: Next.js + TypeScript
**Purpose**: Complete governance interface for viewing and voting on proposals

## Quick Start

Each example includes:
- `README.md` — Setup and usage instructions
- `package.json` — Dependencies
- Complete source code
- Example `.env` configuration

### Installation

```bash
# Choose an example
cd examples/badge-viewer

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with contract addresses

# Start development server
npm run dev
```

## Learning Path

**New to Karn?** Start here:
1. Read `simple-integration/` — Basic concepts
2. Try `badge-viewer/` — React integration
3. Build `mana-calculator/` — Complex calculations
4. Study `governance-dashboard/` — Full application

## Requirements

- Node.js 18+
- Stellar wallet (Freighter, Albedo, or Lobstr)
- Basic TypeScript knowledge (for React examples)

## Documentation

- **Getting Started**: `../docs/getting-started/quick-start.md`
- **SDK Documentation**: `../sdk/README.md`
- **Contract Reference**: `../docs/contracts/CONTRACT_REFERENCE.md`

## Support

- GitHub Issues: [github.com/karn-protocol/karn/issues](https://github.com/karn-protocol/karn/issues)
- Discord: [Karn Community](https://discord.gg/vVFupt4JxN) (coming soon)

---

**Examples Version**: 1.0.0
**Last Updated**: 2026-02-07
