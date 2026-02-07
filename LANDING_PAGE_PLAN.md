# Landing Page Plan: Karn Protocol Presentation

This document outlines the structure, content, and design for the landing page of **Karn Protocol**, an open-source governance infrastructure on Stellar/Soroban.

## 1. Vision & Strategy

The landing page serves as the primary gateway for developers, DAO founders, and community organizers. It must communicate the shift from **Plutocracy** to **Valocracy** (contribution-based governance) through premium visuals and clear messaging.

### Target Audience
- **DAO Founders**: Looking for alternatives to whale-dominated voting.
- **Protocol Developers**: Interested in building on top of merit-based infrastructure.
- **Social Impact Organizations**: Needing a way to reward verified impact.
- **Stellar Ecosystem**: Users looking for innovative Soroban use cases.

---

## 2. Page Structure (Sections)

### I. Hero Section (First Impression)
- **Title**: *Govern with Contribution, Not Capital.*
- **Sub-headline**: The open-source protocol for Valocracy. Merit-based voting power where influence is earned through work, not bought.
- **Visuals**: Abstract interactive mesh or a 3D badge representing the "Soulbound Identity".
- **CTAs**: 
  - `Get Started` (Links to Docs)
  - `View on GitHub` (Social proof)

### II. The Problem (The "Why")
- A dark, contrasting section highlighting the pitfalls of current Governance:
  - ❌ **Plutocracy**: 1 token = 1 vote.
  - ❌ **Whale Dominance**: Governance capture by capital.
  - ❌ **Inactivity**: Stale voting power with no decay.

### III. The Solution: Valocracy (The "How")
- Three core pillars explained with icons/animations:
  - **Contribution-First**: Verification of work leads to voting power.
  - **Dynamic Mana**: Power decays over 180 days, rewarding active members.
  - **Soulbound Proof**: Identity that cannot be traded or bought.

### IV. Core Features (The "What")
- **Modular Smart Contracts**: 
  - **Valocracy**: Identity & Mana calculations.
  - **Governor**: Proposals & Snapshot-based voting.
  - **Treasury**: Secure, governance-controlled vault.
- **Security Hardened**: Built-in protection against common Soroban vulnerabilities.
- **SDK & Tooling**: Developer-first experience with TypeScript/Rust clients.

### V. Use Cases (Market Fit)
- **Digital Cooperatives**: Voting that reflects labor.
- **Impact DAOs**: Rewarding social and environmental work.
- **Educational Hubs**: Power based on learning achievements.

### VI. Technical Specs & Ecosystem
- Built on **Stellar Soroban**.
- **Rust** implementation for high performance and safety.
- Open-source **MIT** License.

### VII. Final CTA (Footer)
- Quote: *"Influence comes from what you do, not what you own."*
- Links to Socials (Discord, X, GitHub).

---

## 3. Design Aesthetics

> [!IMPORTANT]
> The design must feel **Premium** and **State-of-the-Art**.

- **Color Palette**: 
  - Deep Obsidian (`#0A0A0B`) Background.
  - Electric Purple & Cyan accents for "Mana" and "Identity" themes.
  - Vibrant Green for "Security/Success" states.
- **Typography**: 
  - *Inter* for body (clean, readable).
  - *JetBrains Mono* for technical highlights and code snippets.
- **Effects**:
  - **Glassmorphism**: Translucent cards with blurred backdrops.
  - **Micro-animations**: Subtle hover states on buttons and cards.
  - **Scroll Progress**: A "Mana bar" that fills as the user scrolls down.

---

## 4. Implementation Phase

### Phase 1: Foundation
- [ ] Initialize Next.js project with Tailwind CSS.
- [ ] Set up design tokens (colors, fonts).
- [ ] Implement Hero and basic layout.

### Phase 2: Interactive Components
- [ ] Build the "Mana Decay" visualizer (interactive slider showing decay over time).
- [ ] Create the "Modular Architecture" diagram using SVG/Mermaid.

### Phase 3: Content & Polish
- [ ] Integrate SEO meta tags and social preview images.
- [ ] Add entry animations using Motion (framer-motion).
- [ ] Final responsive testing.

---

## 5. Verification Plan

- **Accessibility**: Ensure WCAG compliance for contrast and navigation.
- **Performance**: Lighthouse score > 90 across all categories.
- **Messaging**: Conduct a user walk-through to ensure the concept of "Mana" is easily understood.
