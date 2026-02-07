# Karn Protocol - Starter Templates

Pre-configured templates for building applications with Karn Protocol integration.

## Available Templates

### 1. Next.js Starter (`nextjs-starter/`)
**Best for**: Full-stack applications, production apps
**Features**:
- Next.js 16 App Router
- TypeScript + ESLint
- Tailwind CSS v4
- Karn SDK pre-integrated
- Multi-wallet support (Freighter, Albedo, Lobstr)
- Ready-to-use components
- Environment configuration

### 2. React Starter (`react-starter/`)
**Best for**: Single-page applications, client-side apps
**Features**:
- React 19 + Vite
- TypeScript
- Tailwind CSS
- Karn SDK integration
- Wallet connection hooks
- Example components

### 3. Vanilla JS Starter (`vanilla-starter/`)
**Best for**: Simple integrations, learning, prototypes
**Features**:
- No build step required
- Pure JavaScript + HTML + CSS
- CDN-based dependencies
- Minimal setup
- Great for learning

## Quick Start

### Using a Template

```bash
# 1. Copy template to your project directory
cp -r templates/nextjs-starter my-karn-app
cd my-karn-app

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local with your contract addresses

# 4. Start development server
npm run dev

# 5. Visit http://localhost:3000
```

### Template Structure

Each template includes:
- `README.md` — Setup instructions
- `package.json` — Dependencies and scripts
- `.env.example` — Environment variable template
- `src/` — Source code with examples
- Configuration files (tailwind.config.js, tsconfig.json, etc.)

## Choosing a Template

### Use Next.js Starter if you want:
- Server-side rendering (SSR)
- API routes for backend logic
- Production-ready architecture
- SEO optimization
- Full-featured application

### Use React Starter if you want:
- Client-side only application
- Simpler deployment (static hosting)
- Faster development iterations
- Lightweight bundle

### Use Vanilla JS Starter if you want:
- No build tooling
- Quick prototypes
- Learning environment
- Minimal dependencies

## What's Included

### All Templates Include:

✅ **Wallet Integration**
- Connect/disconnect functionality
- Multi-wallet support
- Auto-reconnect on page reload
- Wallet state management

✅ **Contract Integration**
- Pre-configured Valocracy client
- Example contract calls (Mana, Level)
- TypeScript types (Next.js, React)
- Error handling

✅ **UI Components**
- Wallet connection button
- User info display
- Mana/Level cards
- Loading states
- Error messages

✅ **Configuration**
- Environment variables
- Network configuration (testnet/mainnet)
- Contract addresses
- RPC URLs

### Next.js Starter Extras:

- **App Router** — Modern Next.js routing
- **API Routes** — Backend endpoints
- **Server Components** — Better performance
- **Metadata API** — SEO optimization
- **Middleware** — Request handling

### React Starter Extras:

- **Vite** — Fast build tool
- **Hot Module Replacement** — Instant updates
- **Component Library Ready** — Easy to add UI libs
- **Testing Setup** — Jest + React Testing Library

## Customization

### Add More Contract Calls

**Next.js/React:**
```typescript
// src/hooks/useKarn.ts
export function useKarn(address: string) {
    const [badges, setBadges] = useState([]);

    useEffect(() => {
        async function fetchBadges() {
            // Query contracts for badges
            // Update state
        }
        fetchBadges();
    }, [address]);

    return { badges };
}
```

**Vanilla JS:**
```javascript
async function fetchBadges(address) {
    // Query contract
    const result = await queryContract('list_badges', address);
    return result;
}
```

### Add Styling

**Tailwind (Next.js/React):**
```tsx
<div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-lg">
    <h1 className="text-2xl font-bold text-white">My Component</h1>
</div>
```

**CSS (Vanilla):**
```css
.my-component {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 24px;
    border-radius: 12px;
}
```

### Add Pages

**Next.js:**
```bash
# Create new page
mkdir src/app/badges
touch src/app/badges/page.tsx

# Accessible at /badges
```

**React:**
```bash
# Install React Router
npm install react-router-dom

# Add to src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
```

## Deployment

### Next.js

**Vercel** (Recommended):
```bash
npm install -g vercel
vercel
```

**Other Platforms:**
- Build: `npm run build`
- Start: `npm run start`
- Deploy build output

### React

**Static Hosting** (Vercel, Netlify, GitHub Pages):
```bash
npm run build
# Deploy dist/ directory
```

### Vanilla JS

**Any Web Host:**
- Upload files to web server
- No build step needed

## Support

- **Documentation**: `../docs/`
- **Examples**: `../examples/`
- **GitHub**: [github.com/karn-protocol/karn](https://github.com/karn-protocol/karn)
- **Discord**: [Karn Community](https://discord.gg/karn) (coming soon)

## Contributing

Found a bug or want to improve a template?

1. Fork the repository
2. Create feature branch
3. Make improvements
4. Submit pull request

---

**Templates Version**: 1.0.0
**Last Updated**: 2026-02-07
**Maintained By**: Karn Protocol Team
