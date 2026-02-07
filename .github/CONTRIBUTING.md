# Contributing to Karn Protocol

Thank you for your interest in contributing to Karn Protocol! We welcome contributions from everyone.

## Code of Conduct

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.

## How to Contribute

1.  **Fork the repository**
2.  **Create a branch**: `git checkout -b feature/my-feature`
3.  **Make your changes**
4.  **Commit your changes**: `git commit -m 'feat: add my feature'`
5.  **Push to the branch**: `git push origin feature/my-feature`
6.  **Open a Pull Request**

## Development Setup

### Protocols (Smart Contracts)

1.  **Prerequisites**:
    - Rust (stable)
    - Soroban CLI (`cargo install soroban-cli`)
    - Target `wasm32-unknown-unknown`

2.  **Build & Test**:
    ```bash
    cd contracts
    cargo build --target wasm32-unknown-unknown --release
    cargo test
    ```

### SDK

1.  **Prerequisites**:
    - Node.js (v18+)
    - npm or pnpm

2.  **Build & Test**:
    ```bash
    cd sdk
    npm install
    npm run build
    npm test
    ```

## Style Guide

-   **Rust**: Follow standard Rust idioms. Run `cargo fmt` before committing.
-   **TypeScript**: Use `prettier` and `eslint`. Run `npm run lint` before committing.

## Reporting Bugs

Please open an issue on GitHub with a detailed description of the bug, including steps to reproduce and environment details.
