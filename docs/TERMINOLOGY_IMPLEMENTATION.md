# Terminology System Implementation Guide

**Date:** 2026-02-07
**Status:** Phase 2 Complete (TypeScript SDK + React Context)
**Next:** Phase 3 (Frontend Integration)

---

## What Was Implemented

The hybrid abstraction layer enables protocol adaptation **without modifying smart contracts**. Anyone can deploy Karn's contracts and use custom terminology in their frontend.

### Phase 1: ✅ Documentation
- **File:** `docs/PROTOCOL_ADAPTATION_GUIDE.md`
- **Contents:** 5 example use cases with terminology mappings, deployment guide, FAQ
- **Purpose:** Show how to adapt the protocol for different communities

### Phase 2: ✅ TypeScript SDK
- **File:** `frontend/src/config/terminology.ts`
  - Interface definitions (`TerminologyConfig`, `TerminologyTerm`)
  - 5 preset configurations (Karn, Co-op, DAO, Community, Gig)
  - Helper functions to load configs

- **File:** `frontend/src/contexts/TerminologyContext.tsx`
  - React context for terminology
  - `useTerminology()` hook
  - Persistence to localStorage
  - HOC wrapper for legacy components

- **File:** `frontend/src/components/TerminologySwitcher.tsx`
  - UI component to switch presets (for demos)
  - Compact and full versions
  - Info badge showing current mode

---

## How to Use the Terminology System

### 1. Wrap Your App with TerminologyProvider

```typescript
// app/layout.tsx or _app.tsx
import { TerminologyProvider } from '@/contexts/TerminologyContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <TerminologyProvider>
          {children}
        </TerminologyProvider>
      </body>
    </html>
  );
}
```

### 2. Use Terminology in Components

**Before (hardcoded):**
```typescript
function BadgesPage() {
  return (
    <div>
      <h1>My Badges</h1>
      <p>Earn Badges to increase your Mana</p>
    </div>
  );
}
```

**After (adaptive):**
```typescript
import { useTerminology } from '@/contexts/TerminologyContext';

function BadgesPage() {
  const { term, ui } = useTerminology();

  return (
    <div>
      <h1>{ui('myBadges')}</h1>
      <p>Earn {term('badge', true)} to increase your {term('mana')}</p>
    </div>
  );
}
```

**Result:**
- Karn mode: "My Badges - Earn Badges to increase your Mana"
- Co-op mode: "My Membership - Earn Membership Tiers to increase your Voting Shares"
- DAO mode: "My Contributions - Earn Contributor Badges to increase your Governance Power"

### 3. Use Action Verbs

```typescript
function MintBadgeButton() {
  const { action, term } = useTerminology();

  return (
    <button>
      {action('mint')} {term('badge')}
    </button>
  );
}
```

**Result:**
- Karn: "Mint Badge"
- Co-op: "Award Tier"
- DAO: "Award Badge"

### 4. Combine with i18n

```typescript
// locales/en.ts
export const en = {
  badges: {
    hero: "Your {badgeTerm}",
    earnMore: "Earn more {badgeTerm} to gain {manaTerm}",
    empty: "You don't have any {badgeTerm} yet"
  }
}

// Component
import { useLanguage } from '@/contexts/LanguageContext';
import { useTerminology } from '@/contexts/TerminologyContext';

function BadgesHero() {
  const { t } = useLanguage();
  const { term } = useTerminology();

  return (
    <div>
      <h1>{t('badges.hero', { badgeTerm: term('badge', true) })}</h1>
      <p>{t('badges.earnMore', {
        badgeTerm: term('badge', true),
        manaTerm: term('mana')
      })}</p>
    </div>
  );
}
```

---

## Migration Checklist

### Priority 1: Core Pages (User-Facing Text)

- [ ] **Landing Page** (`app/page.tsx`)
  - Replace "Badge", "Mana", "Lab" with `term()`
  - Update hero section, features, benefits

- [ ] **Dashboard** (`app/profile/page.tsx`)
  - Update welcome message
  - Stats labels ("Mana", "Badges")
  - Section headers

- [ ] **Badges Page** (`app/profile/badges/page.tsx`)
  - Page title
  - Descriptions
  - Empty states

- [ ] **Governance Page** (`app/profile/governance/page.tsx`)
  - Proposal terminology
  - Voting actions
  - Results display

- [ ] **Scholarship/Labs Page** (`app/profile/scholarship/page.tsx`)
  - "Lab" → terminology
  - "Scholarship" → terminology
  - Claim actions

### Priority 2: Components

- [ ] **Sidebar** (`components/Sidebar.tsx`)
  - Navigation labels
  - Add terminology switcher (optional, for demos)

- [ ] **WalletButton** (`components/WalletButton.tsx`)
  - No changes needed (wallet-specific)

- [ ] **Profile Components** (`components/profile/*`)
  - Badge cards
  - Mana displays
  - Action buttons

### Priority 3: Hooks and Utils

- [ ] **useBadges** (`hooks/useBadges.ts`)
  - Keep contract calls as-is
  - Terminology is presentation-only

- [ ] **useValocracy** (`hooks/useValocracy.ts`)
  - No changes needed
  - Returns raw data from contract

### Priority 4: i18n Files

- [ ] **Update all locale files** (`locales/*.ts`)
  - Convert hardcoded terms to placeholders
  - Example: "Badge" → "{badgeTerm}"
  - Update all 170+ translation keys

---

## Example: Complete Migration

### Before

```typescript
// app/profile/badges/page.tsx
'use client';

export default function BadgesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">My Badges</h1>
        <p className="text-xl text-gray-600">
          Earn Badges to increase your Mana and voting power
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <BadgeCard />
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Available Badges</h2>
        <p className="text-gray-600">
          Complete tasks to unlock new Badges
        </p>
      </div>
    </div>
  );
}
```

### After

```typescript
// app/profile/badges/page.tsx
'use client';

import { useTerminology } from '@/contexts/TerminologyContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function BadgesPage() {
  const { term, ui, action } = useTerminology();
  const { t } = useLanguage();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{ui('myBadges')}</h1>
        <p className="text-xl text-gray-600">
          {t('badges.heroDesc', {
            badgeTerm: term('badge', true),
            manaTerm: term('mana')
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <BadgeCard />
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">
          {t('badges.availableTitle', { badgeTerm: term('badge', true) })}
        </h2>
        <p className="text-gray-600">
          {t('badges.availableDesc', { badgeTerm: term('badge', true) })}
        </p>
      </div>
    </div>
  );
}
```

### Updated Locale File

```typescript
// locales/en.ts
export const en = {
  // ... existing keys ...
  badges: {
    heroDesc: "Earn {badgeTerm} to increase your {manaTerm} and voting power",
    availableTitle: "Available {badgeTerm}",
    availableDesc: "Complete tasks to unlock new {badgeTerm}",
    // ... rest of keys with placeholders ...
  }
}
```

---

## Configuration Options

### Option 1: Environment Variable (Deployment-Time)

```bash
# .env.local
NEXT_PUBLIC_TERMINOLOGY_PRESET=dao
```

**Result:** Entire app uses DAO terminology, locked at build time.

### Option 2: User Switcher (Demo/Development)

```typescript
// Add to Sidebar or Settings
import { TerminologySwitcher } from '@/components/TerminologySwitcher';

<TerminologySwitcher />
```

**Result:** Users can switch between presets live (great for demos).

### Option 3: Custom Config (White-Label)

```typescript
// config/custom-terminology.ts
export const MY_CUSTOM_CONFIG: TerminologyConfig = {
  protocolName: "My Protocol",
  tagline: "My custom tagline",
  badge: {
    singular: "Token",
    plural: "Tokens",
    description: "Custom description"
  },
  // ... rest of config
};

// Use in app
<TerminologyProvider initialConfig={MY_CUSTOM_CONFIG}>
  {children}
</TerminologyProvider>
```

---

## Testing the System

### 1. Test All Presets

```bash
# Set each preset and verify UI
NEXT_PUBLIC_TERMINOLOGY_PRESET=karn npm run dev
NEXT_PUBLIC_TERMINOLOGY_PRESET=coop npm run dev
NEXT_PUBLIC_TERMINOLOGY_PRESET=dao npm run dev
```

### 2. Check Translation Coverage

Ensure all hardcoded terms are replaced:

```bash
# Search for remaining hardcoded terms
grep -r "Badge" frontend/src/app
grep -r "Mana" frontend/src/app
grep -r "Lab" frontend/src/app
grep -r "Scholarship" frontend/src/app
```

Should only find matches in:
- Comments
- Type definitions
- Contract interaction code (intentional)

### 3. Test i18n + Terminology Together

```typescript
// Should work: PT + Co-op terminology
setLanguage('pt');
setPreset('coop');

// Should work: ES + DAO terminology
setLanguage('es');
setPreset('dao');
```

---

## Performance Considerations

### Minimal Impact

- **No contract changes** - same gas costs
- **Context overhead** - negligible (2 providers)
- **Bundle size** - ~5KB for all presets
- **Runtime cost** - string lookups (instant)

### Optimization

If concerned about bundle size:
```typescript
// Only include presets you need
import { KARN_TERMINOLOGY } from '@/config/terminology';

// Don't import unused presets
// import { COOP_TERMINOLOGY } from '@/config/terminology'; // ❌ Skip if not used
```

---

## Common Patterns

### Pattern 1: Conditional Text

```typescript
const { term } = useTerminology();

<p>
  {hasBadges
    ? `You have ${count} ${term('badge', count !== 1)}`
    : `You don't have any ${term('badge', true)} yet`
  }
</p>
```

### Pattern 2: Dynamic Titles

```typescript
const { term, ui } = useTerminology();

useEffect(() => {
  document.title = `${ui('myBadges')} - ${term('governance').singular}`;
}, [term, ui]);
```

### Pattern 3: Form Labels

```typescript
const { term, action } = useTerminology();

<label>
  {term('badge')} Type
</label>
<select>
  <option>Member {term('badge')}</option>
  <option>Leadership {term('badge')}</option>
</select>
<button>{action('mint')}</button>
```

---

## Next Steps

### Phase 3: Frontend Integration (2-4 hours)

1. Update all pages to use `term()`, `action()`, `ui()`
2. Update i18n files with placeholders
3. Add TerminologySwitcher to Sidebar (optional)
4. Test all presets with all languages

### Phase 4: Documentation (1 hour)

1. Update README with terminology instructions
2. Add examples to CLAUDE.md
3. Create video demo showing preset switching
4. Document custom preset creation

### Phase 5: Deployment Templates (2 hours)

1. Create deployment script accepting preset parameter
2. Add GitHub Actions for multi-preset deployments
3. Create example deployments:
   - karn.vercel.app (Karn preset)
   - coop-demo.vercel.app (Co-op preset)
   - dao-demo.vercel.app (DAO preset)

---

## FAQs

### Q: Does this affect smart contracts?
**A:** No. Contracts are unchanged. Terminology is purely frontend.

### Q: Can I mix presets for different pages?
**A:** Not recommended. Users expect consistent terminology throughout the app. Use one preset per deployment.

### Q: What about backend API responses?
**A:** Backend returns raw data. Terminology translation happens in the frontend.

### Q: Can I customize just one term?
**A:** Yes! Spread the preset and override:
```typescript
const customConfig = {
  ...KARN_TERMINOLOGY,
  badge: {
    singular: "Token",
    plural: "Tokens"
  }
};
```

### Q: How do I add a new preset?
**A:** Add to `terminology.ts`:
```typescript
export const MY_PRESET: TerminologyConfig = { ... };

// Add to TERMINOLOGY_PRESETS array
export const TERMINOLOGY_PRESETS = [
  // ... existing
  { value: 'mypreset', label: 'My Preset', config: MY_PRESET }
];
```

---

## Summary

✅ **Phase 1 Complete:** Comprehensive adaptation guide with 5 use cases
✅ **Phase 2 Complete:** TypeScript SDK with 5 presets, React context, switcher component

🎯 **Ready for:** Frontend integration (updating existing pages/components)

🚀 **Result:** Anyone can fork Karn's contracts and deploy with custom terminology, zero contract modifications needed.
