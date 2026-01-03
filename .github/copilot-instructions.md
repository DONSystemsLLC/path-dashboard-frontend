# PATH Dashboard Frontend - AI Agent Instructions

## Project Overview

This is a React 19 + TypeScript + Vite frontend for the PATH (Ψ) Dashboard - a monitoring interface for the DON (Distributed Order Network) Codex backend. The app displays real-time quantum-classical compute system health metrics including coherence scores, drift scores, and system status.

## Critical Architecture Patterns

### Component Import Pattern - INCOMPLETE SETUP
The codebase uses `@/components/*` path aliases in [src/pages/PathDashboard.tsx](../src/pages/PathDashboard.tsx) BUT:
- **Path resolution is NOT configured** in [vite.config.ts](../vite.config.ts) or [tsconfig.app.json](../tsconfig.app.json)
- The `@/components/ui/*` components (Card, Button, Badge) are **referenced but don't exist yet**
- These appear to be planned Shadcn/ui components that need installation

**Action Required:** When adding components, either:
1. Install Shadcn/ui and configure path aliases properly, OR
2. Use relative imports until the UI library is set up

### Environment Variables
Required environment variables (accessed via `import.meta.env`):
- `VITE_PATH_API_BASE` - Backend API URL (defaults to `https://codex-engine-backend.onrender.com`)
- `VITE_PATH_API_KEY` - API authentication key for `/api/path/dashboard/overview` endpoint

Create `.env.local` for local development:
```bash
VITE_PATH_API_BASE=http://localhost:3000
VITE_PATH_API_KEY=your-api-key-here
```

### API Integration Pattern
Direct axios usage for API calls (no React Query wrapper yet):
- Backend endpoint: `${API_BASE}/api/path/dashboard/overview`
- Authentication: `X-API-Key` header
- Polling interval: 60 seconds
- Expected response shape: `{ glyph, status, coherence_score, drift_score }`

## Development Workflow

### Essential Commands
```bash
npm run dev         # Start dev server with HMR (default port 5173)
npm run build       # TypeScript compile + Vite production build
npm run lint        # ESLint check on all .ts/.tsx files
npm run preview     # Preview production build locally
```

### TypeScript Configuration
- **Strict mode enabled**: `"strict": true` with additional checks
- **Bundler module resolution**: Uses Vite's bundler strategy
- **Verbatim module syntax**: Import statements preserved as-is
- **No unused vars/params**: Compiler enforces cleanup
- **React 19 JSX**: Uses new `react-jsx` transform

### Linting Rules (ESLint Flat Config)
Uses modern ESLint 9+ flat config pattern:
- React Hooks rules enforced (correct dependency arrays)
- React Refresh rules for HMR compatibility
- TypeScript-ESLint recommended rules
- Run `npm run lint` before committing

## Domain-Specific Context

### PATH/DON Terminology
This dashboard monitors quantum-classical hybrid compute systems:
- **ΞΔ (Xi Delta)**: Quantum system health indicator
- **Ψ (Psi)**: Quantum wavefunction collapse/measurement operations
- **Coherence Score**: Quantum state stability metric (0-1 scale)
- **Drift Score**: Baseline deviation metric
- **Glyph**: System state identifier/hash

### Styling Approach
Currently uses TailwindCSS utility classes (`p-4`, `grid-cols-2`, `text-muted-foreground`). The `@/components/ui/*` references suggest a future Shadcn/ui integration, but vanilla CSS is present in [src/App.css](../src/App.css) and [src/index.css](../src/index.css).

## Deployment

**Docker Multi-Stage Build** ([Dockerfile](../Dockerfile)):
1. Node 18 Alpine builder: `npm install && npm run build`
2. Nginx Alpine server: Static files served from `/usr/share/nginx/html`
3. Exposes port 80

Likely deployed to Render.com (backend URL suggests this).

## Known Issues & TODOs

1. **Missing UI Component Library**: Card, Button, Badge components referenced but not installed
2. **Missing Path Alias Config**: `@/` imports will fail without Vite/TypeScript config
3. **No Error Boundaries**: API failures display raw error states
4. **Hardcoded Styling Values**: Dynamic Tailwind classes (`text-${color}-500`) don't work with JIT - need conditional class names
5. **Missing Axios Dependency**: PathDashboard imports axios but it's not in package.json

## File Organization

```
src/
├── main.tsx           # React 19 entry point with StrictMode
├── App.tsx            # Root component (currently Vite template)
├── pages/
│   └── PathDashboard.tsx  # Main dashboard component
└── assets/            # Static assets (logos, images)
```

**Convention:** Pages go in `src/pages/`, but routing is not yet set up. Currently App.tsx is not connected to PathDashboard.tsx.

## Adding New Features

When creating new components:
1. Use functional components with hooks (React 19 patterns)
2. Add proper TypeScript interfaces for props and state
3. Follow the polling pattern in PathDashboard for real-time data
4. Use environment variables for configurable values
5. Add proper error handling and loading states

Example component structure:
```typescript
interface ComponentProps {
  prop: string
}

export default function Component({ prop }: ComponentProps) {
  // Implementation
}
```
