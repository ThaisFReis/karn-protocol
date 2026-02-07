# CI/CD Quick Start Guide

**For:** Karn Protocol Developers
**Updated:** 2026-02-07

---

## 🚀 Quick Reference

### Running Tests Locally

Before pushing, run these commands to match CI checks:

```bash
# Contracts
cd contracts/valocracy
cargo fmt --check          # Formatting
cargo clippy -- -D warnings  # Linting
cargo test                 # Tests
soroban contract build     # Build

# SDK
cd ../../sdk
npm ci                     # Install
npm run build              # Build
npm test                   # Tests (if exists)
npm run lint               # Lint (if exists)
```

### Checking Your PR Status

1. Go to your PR on GitHub
2. Scroll to bottom - see status checks:
   - ✅ All green = ready to merge
   - ⚠️ Yellow = in progress
   - ❌ Red = failed (click for details)

### Common CI Failures

| Error | Cause | Fix |
|-------|-------|-----|
| `cargo fmt` failed | Code not formatted | Run `cargo fmt` |
| `clippy` warnings | Linting issues | Fix warnings or allow: `#[allow(clippy::...)]` |
| `tests` failed | Tests failing | Fix tests or update expected behavior |
| `build` failed | Compilation error | Fix Rust/TypeScript errors |

---

## 📦 Making a Release

### Prerequisites

1. ✅ All tests passing on `main`
2. ✅ Version bumped in:
   - `sdk/package.json`
   - Contracts' `Cargo.toml` (if changed)
3. ✅ Changelog updated
4. ✅ `NPM_TOKEN` secret configured

### Steps

1. **Trigger Release Workflow**
   - Go to **Actions** → **Release**
   - Click **Run workflow**
   - Enter version: `0.1.0-beta.1`
   - Select environment: `testnet` or `mainnet`
   - Click **Run workflow**

2. **Monitor Progress**
   - Watch workflow run (takes ~5-10 minutes)
   - Check each job completes successfully

3. **Verify Release**
   - Check GitHub Releases for new release
   - Verify npm: `npm view @karn_lat/protocol-sdk versions`
   - Download and verify checksums

### Version Naming

```
Major.Minor.Patch-prerelease.number

Examples:
  0.1.0-alpha.1    → First alpha
  0.1.0-beta.1     → First beta
  0.1.0-beta.2     → Second beta
  0.1.0            → First stable release
  1.0.0            → Major version (mainnet)
```

---

## 🔒 Security Checks

### Viewing Security Scans

1. Go to **Actions** → **Security & Quality**
2. Click latest run
3. Check jobs:
   - `rust-security`: Vulnerability scan
   - `npm-security`: NPM audit
   - `wasm-size`: Contract size limits

### Fixing Vulnerabilities

**Rust dependencies:**
```bash
cd contracts
cargo audit
cargo update
cargo test
```

**npm dependencies:**
```bash
cd sdk
npm audit fix
npm test
```

---

## 💡 Tips & Tricks

### Speed Up Local Development

**Use cargo check instead of build:**
```bash
cargo check          # ~2x faster than build
cargo check --tests  # Include test code
```

**Skip tests when iterating:**
```bash
cargo build --no-tests
```

**Watch mode for SDK:**
```bash
npm run build -- --watch
```

### Debugging CI Failures

1. **Check logs:** Click failed job → View raw logs
2. **Reproduce locally:** Run same commands as CI
3. **Cache issues:** Clear cache in Settings → Actions → Caches
4. **Ask for help:** Include logs in issue/PR comment

### Branch Protection Rules

To merge to `main`, you need:
- ✅ 1 approval from maintainer
- ✅ All CI checks passing
- ✅ No merge conflicts
- ✅ Linear history (rebase, not merge commits)

---

## 📊 Workflow Badges

Add to your README.md:

```markdown
![CI](https://github.com/karn-protocol/karn-protocol/workflows/CI/badge.svg)
![Security](https://github.com/karn-protocol/karn-protocol/workflows/Security%20&%20Quality/badge.svg)
```

---

## 🆘 Getting Help

**CI issues?**
- Check `.github/README.md` for detailed docs
- See `Docs/CI_CD_IMPLEMENTATION.md` for architecture
- Ask in Discord #dev-help channel

**Release issues?**
- Verify `NPM_TOKEN` is set correctly
- Check npm permissions for `@karn` org
- See release workflow logs for details

**Security alerts?**
- Review weekly security scan results
- Update dependencies regularly
- Consult security team for critical vulnerabilities

---

**Quick Links:**
- [CI Workflow](.github/workflows/ci.yml)
- [Release Workflow](.github/workflows/release.yml)
- [Security Workflow](.github/workflows/security.yml)
- [Full Documentation](.github/README.md)
