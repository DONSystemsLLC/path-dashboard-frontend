# PATH Dashboard Frontend - AI Agent Instructions

## Project Overview

React 19 + TypeScript + Vite SPA monitoring the DON Codex PATH (Ψ) quantum-classical compute system. Displays real-time health metrics (coherence/drift scores) and collapse event feeds for quantum wavefunction measurement operations.

## Architecture & Component Patterns

### Custom UI Component System
Lightweight custom implementation (NOT Shadcn/ui) in `src/components/ui/`:
- **Card/CardContent**: Minimal wrapper components with TailwindCSS classes
- **Button**: Variant-based styling (`default`, `outline`, `ghost`)
- **Badge**: Simple inline status indicators (`default`, `outline`)
- All use `forwardRef` pattern for proper ref forwarding
- Extend base HTML element props (`ButtonHTMLAttributes`, `HTMLAttributes<HTMLDivElement>`)

Pattern for new UI components:
```tsx
import { forwardRef } from 'react'
import type { HTMLAttributes } from 'react'

interface ComponentProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'custom'
}

export const Component = forwardRef<HTMLDivElement, ComponentProps>(
  ({ className = '', variant = 'default', ...props }, ref) => (
    <div ref={ref} className={`base-classes ${className}`} {...props} />
  )
)
Component.displayName = 'Component'
```

### Path Aliases (Configured)
- `@/*` resolves to `./src/*` (configured in both [vite.config.ts](vite.config.ts) and [tsconfig.app.json](tsconfig.app.json))
- Use `@/components/ui/card` for absolute imports from src root

### Environment Variables
**Required** for runtime (accessed via `import.meta.env`):
- `VITE_PATH_API_BASE` - Backend URL (prod: `https://api.resotrace.com`)
- `VITE_AUTH_TOKEN` - Bearer token for API authentication (`/api/path/dashboard/overview` and `/api/path/collapse-feed`)
- `VITE_GLYPH_STREAM` - Collapse feed topic filter (default: `Ψ_PATH_COLLAPSE`)

**Optional** runtime-only vars (used by [start.sh](start.sh), NOT in JS bundle):
- `QCCS_API_URL`, `QCCS_API_KEY`, `PATH_TENANT_ID` - For ΞΔ collapse broadcasts on container startup

`.env.local` example:
```bash
VITE_PATH_API_BASE=http://localhost:3000
VITE_AUTH_TOKEN=your-bearer-token
VITE_GLYPH_STREAM=Ψ_PATH_COLLAPSE
```

### API Integration Pattern
Direct **axios** usage (no React Query):
- All endpoints require `Authorization: Bearer` token authentication
- Include `withCredentials: true` for cookie-based sessions
- Use `AbortController` for cleanup in `useEffect` cleanup functions
- Pattern: fetch on mount + interval polling (e.g., 60s for health checks)
- Handle loading states explicitly with `useState<boolean>`

Example from [CollapseFeed.tsx](src/components/CollapseFeed.tsx):
```tsx
useEffect(() => {
  const controller = new AbortController()
  async function fetch() {
    try {
      const res = await axios.get(url, { 
        headers: { 
          "Authorization": `Bearer ${AUTH_TOKEN}`,
          "Content-Type": "application/json"
        },
        withCredentials: true,
        signal: controller.signal 
      })
      setState(res.data)
    } catch (err) {
      if (!controller.signal.aborted) console.error(err)
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }
  void fetch()
  return () => controller.abort()
}, [])
```

## Development Commands

```bash
npm run dev         # Vite dev server (port 5173, HMR enabled)
npm run build       # TypeScript check + production build
npm run lint        # ESLint check (must pass before commits)
npm run preview     # Test production build locally
```

## TypeScript & Linting

**TypeScript strictness** ([tsconfig.app.json](tsconfig.app.json)):
- `strict: true` + `noUnusedLocals` + `noUnusedParameters` enabled
- Path alias: `@/*` maps to `./src/*`
- React 19 JSX transform (`"jsx": "react-jsx"`)

**ESLint** (flat config in [eslint.config.js](eslint.config.js)):
- React Hooks dependency array enforcement
- React Refresh fast reload compatibility checks
- TypeScript-ESLint recommended rules

## Domain Terminology

**PATH/DON Quantum-Classical System:**
- **ΞΔ (Xi Delta)**: System health anchor, broadcast on container boot
- **Ψ (Psi)**: Wavefunction collapse operations/measurement events
- **Coherence Score**: Quantum stability (0-1 scale, ≥0.8 = green, ≥0.5 = yellow, <0.5 = red)
- **Drift Score**: Deviation from baseline reference
- **Glyph**: Unique system state hash/identifier
- **Collapse Feed**: Real-time event stream of quantum measurements

See [PathDashboard.tsx](src/pages/PathDashboard.tsx) for metric color thresholds.

## Deployment & Docker

**Multi-stage build** ([Dockerfile](Dockerfile)):
1. Node 18 Alpine: `npm ci && npm run build`
2. Nginx Alpine: Serve static files from `/usr/share/nginx/html`

**Container startup** ([start.sh](start.sh)):
- Health check: Verifies nginx serves on port 80
- **ΞΔ broadcast**: Auto-sends collapse event to QCCS API if `QCCS_API_URL` + `QCCS_API_KEY` set
- CollapseFeed snapshot: Renders initial HTML from API data

**Render.com deployment** ([render.yaml](render.yaml)):
- Free tier web service with Docker runtime
- Build-time: `VITE_*` vars baked into JS bundle
- Runtime: `QCCS_*` + `PATH_TENANT_ID` used only by start.sh boot script

## File Structure

```
src/
├── main.tsx                  # React 19 entry (StrictMode)
├── App.tsx                   # Root component → PathDashboard
├── pages/
│   └── PathDashboard.tsx     # Main dashboard (health cards + collapse feed)
├── components/
│   ├── CollapseFeed.tsx      # Event stream component
│   └── ui/                   # Custom UI primitives (forwardRef pattern)
│       ├── card.tsx
│       ├── button.tsx
│       └── badge.tsx
```

## Common Gotchas

1. **Dynamic Tailwind classes DON'T work**: `text-${color}-500` breaks JIT mode. Use conditional class strings:
   ```tsx
   const getColor = (score: number) => {
     if (score >= 0.8) return "text-green-500"
     if (score >= 0.5) return "text-yellow-500"
     return "text-red-500"
   }
   ```

2. **Always abort fetch on unmount**:
   ```tsx
   useEffect(() => {
     const controller = new AbortController()
     // ... fetch logic ...
     return () => controller.abort()
   }, [])
   ```

3. **Environment variables**: Only `VITE_*` prefixed vars are in browser bundle. Others (QCCS_*, PATH_TENANT_ID) are server-side only.

4. **Void operator for async effects**: Use `void fetch()` to satisfy ESLint no-floating-promises rule
