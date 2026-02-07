# GitHub Actions Workflows

This directory contains automated CI/CD workflows for the Karn Protocol repository.

## Workflows Overview

### 1. CI (`ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

**Jobs:**
- **Contracts**
  - `contracts-build`: Build all Soroban contracts
  - `contracts-test`: Run contract unit tests
  - `contracts-format`: Check Rust code formatting
  - `contracts-clippy`: Lint contracts with Clippy

- **SDK**
  - `sdk-build`: Build TypeScript SDK
  - `sdk-test`: Run SDK tests
  - `sdk-lint`: Lint SDK code

- **Integration**
  - `integration-test`: Run end-to-end integration tests (PR only)
  - `all-checks`: Final check that all jobs passed

**Artifacts:**
- Contract WASM files (7 days retention)
- SDK dist/ files (7 days retention)

**Caching:**
- Rust cargo registry and build cache
- Node.js npm cache

---

### 2. Release (`release.yml`)

**Trigger:** Manual workflow dispatch

**Inputs:**
- `version`: Version to release (e.g., `0.1.0-beta.1`)
- `environment`: Target environment (`testnet` or `mainnet`)

**Jobs:**
- **build-contracts**: Build optimized contract WASMs
- **publish-sdk**: Publish SDK to npm
  - Beta versions → `npm publish --tag beta`
  - Stable versions → `npm publish --tag latest`
- **create-release**: Create GitHub release with:
  - Contract bundle (.tar.gz + SHA256 checksum)
  - SDK package (.tgz)
  - Auto-generated release notes
- **deploy-contracts**: Deployment notice (manual intervention required)

**Artifacts:**
- Contract bundle (90 days retention)
- SDK package (90 days retention)

**Secrets Required:**
- `NPM_TOKEN`: npm authentication token for publishing
- `GITHUB_TOKEN`: Automatically provided by GitHub

**Release Types:**
- Prerelease: Versions containing `alpha` or `beta`
- Production: All other versions

---

### 3. Security & Quality (`security.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Weekly schedule (Mondays at 00:00 UTC)

**Jobs:**
- **Rust Security**
  - `rust-security`: Run `cargo audit` for vulnerability scanning
  - `rust-outdated`: Check for outdated dependencies

- **NPM Security**
  - `npm-security`: Run `npm audit` for package vulnerabilities
  - `npm-outdated`: Check for outdated packages

- **Compliance**
  - `license-check`: Verify license compliance
  - `docs-check`: Ensure documentation exists and builds

- **Quality**
  - `coverage`: Generate code coverage reports
  - `wasm-size`: Analyze contract sizes and enforce limits
  - `dependency-tree`: Generate dependency analysis

**Size Limits:**
- Max WASM size: 256 KB (Soroban limit)
- Warning threshold: 200 KB

**Coverage:**
- Uploads to Codecov (optional)
- Runs for all contracts

---

## Setup Requirements

### 1. Repository Secrets

Add these secrets in **Settings → Secrets → Actions**:

| Secret | Description | Required For |
|--------|-------------|--------------|
| `NPM_TOKEN` | npm access token | Release workflow |

### 2. Repository Settings

**Branch Protection** (recommended for `main` branch):
- ✅ Require status checks before merging
  - `All Checks Passed` (from CI)
  - `contracts-build`
  - `contracts-test`
  - `sdk-build`
- ✅ Require pull request reviews
- ✅ Require linear history
- ✅ Include administrators

**Actions Permissions:**
- ✅ Allow GitHub Actions to create and approve pull requests
- ✅ Read and write permissions for workflows

### 3. npm Setup

To publish to npm, create an access token:

1. Go to [npmjs.com](https://www.npmjs.com/)
2. Click your profile → **Access Tokens**
3. **Generate New Token** → Select **Automation**
4. Copy the token and add as `NPM_TOKEN` secret

**Important:** The SDK package name is `@karn/protocol-sdk`. Ensure you have:
- Created the `@karn` organization on npm
- Added yourself as a maintainer
- Set package to public: `"publishConfig": { "access": "public" }`

### 4. Codecov Setup (Optional)

For code coverage reports:

1. Sign up at [codecov.io](https://codecov.io/)
2. Add the repository
3. No token needed for public repos
4. Coverage reports will appear on PRs automatically

---

## Usage Examples

### Running CI Locally

**Test contract build:**
```bash
cd contracts/valocracy
soroban contract build
cargo test
cargo fmt --check
cargo clippy
```

**Test SDK build:**
```bash
cd sdk
npm ci
npm run build
npm test
npm run lint
```

### Creating a Release

1. Go to **Actions** tab in GitHub
2. Select **Release** workflow
3. Click **Run workflow**
4. Fill in:
   - Version: `0.1.0-beta.1`
   - Environment: `testnet`
5. Click **Run workflow**

The workflow will:
- Build contracts
- Publish SDK to npm with `@beta` tag
- Create GitHub release
- Upload artifacts

### Checking Security

Security scans run automatically, but you can also run manually:

```bash
# Rust security audit
cd contracts
cargo audit

# NPM security audit
cd sdk
npm audit

# Check outdated dependencies
cargo outdated
npm outdated
```

---

## Workflow Status Badges

Add these to your main README.md:

```markdown
![CI](https://github.com/karn-protocol/karn-protocol/workflows/CI/badge.svg)
![Security](https://github.com/karn-protocol/karn-protocol/workflows/Security%20&%20Quality/badge.svg)
[![codecov](https://codecov.io/gh/karn-protocol/karn-protocol/branch/main/graph/badge.svg)](https://codecov.io/gh/karn-protocol/karn-protocol)
```

---

## Troubleshooting

### CI Fails on Contract Build

**Error:** `soroban: command not found`

**Solution:** The workflow installs Soroban CLI automatically. If failing, check Rust version compatibility.

### SDK Tests Fail

**Error:** `npm test` fails with "No tests found"

**Solution:** Tests are optional (`continue-on-error: true`). Add tests to `sdk/test/` when ready.

### Release Fails on npm Publish

**Error:** `403 Forbidden` or `401 Unauthorized`

**Solutions:**
1. Verify `NPM_TOKEN` is set correctly
2. Check token has automation permissions
3. Verify package name `@karn/protocol-sdk` is available
4. Ensure you're a maintainer of `@karn` org

### WASM Size Limit Exceeded

**Error:** `Contract exceeds Soroban size limit`

**Solutions:**
1. Enable release optimizations in `Cargo.toml`:
   ```toml
   [profile.release]
   opt-level = "z"
   lto = true
   codegen-units = 1
   ```
2. Remove unused dependencies
3. Use `cargo bloat` to identify large functions
4. Consider splitting contract logic

### Coverage Upload Fails

**Error:** Codecov upload fails

**Solution:** Coverage is optional. Set `CODECOV_TOKEN` secret if using private repo.

---

## Performance Optimization

### Cache Effectiveness

Workflows use caching to speed up builds:
- **Rust**: `~/.cargo/` + `target/` (~60% faster rebuilds)
- **Node**: `~/.npm/` (~80% faster npm ci)

### Parallelization

Jobs run in parallel where possible:
- Contract build + SDK build (parallel)
- Contract tests (sequential per contract)
- Security scans (parallel)

**Average CI time:**
- First run (no cache): ~8-12 minutes
- Cached runs: ~3-5 minutes
- Security scans: ~2-4 minutes

---

## Maintenance

### Updating Workflows

When modifying workflows:
1. Test locally using [act](https://github.com/nektos/act)
2. Create PR with workflow changes
3. Verify on test branch before merging
4. Update this README if adding new jobs

### Dependency Updates

Weekly security workflow checks for outdated dependencies. To update:

**Rust dependencies:**
```bash
cd contracts
cargo update
cargo test
```

**npm dependencies:**
```bash
cd sdk
npm update
npm test
```

### Soroban CLI Updates

Update Soroban CLI version in workflows:
```yaml
- name: Install Soroban CLI
  run: cargo install --locked soroban-cli@<version> --features opt
```

Check latest version: https://github.com/stellar/soroban-tools/releases

---

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Soroban Documentation](https://soroban.stellar.org/)
- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Codecov Documentation](https://docs.codecov.com/)

---

**Last Updated:** 2026-02-07
**Maintainer:** Karn Protocol Team
