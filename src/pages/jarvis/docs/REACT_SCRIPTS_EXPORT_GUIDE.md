# JARVIS TASK MATRIX: REACT-SCRIPTS EXPORT & EXTERNAL INTEGRATION SPECIFICATION

## 1. Architectural Critique & Tooling Deficiencies (Rule 2 Compliance)

### 1.1 Technical Deficiencies of `react-scripts` (Create React App)
1. **Deprecated Status**: `react-scripts` was officially deprecated and archived by the React core team on April 12, 2023. It receives no security patches, dependency updates, or optimizations.
2. **Tailwind CSS v4 Incompatibility**: Jarvis utilizes Tailwind CSS v4 (`@tailwindcss/vite` and `@import "tailwindcss";`). `react-scripts` relies on Webpack 5 with an unconfigurable PostCSS pipeline that cannot natively process Tailwind v4 CSS imports without either downgrading to Tailwind CSS v3 or patching Webpack via `@craco/craco`.
3. **React 19 vs React 18 Peer Dependency Friction**: Jarvis runs on React 19 (`react@^19.0.1`, `motion@^12.23.24`). Most legacy `react-scripts` codebases run on React 17 or 18. Installing packages targeting React 19 into a React 18 CRA codebase triggers npm peer dependency conflicts (`ERESOLVE`).
4. **Build and HMR Velocity**: Webpack in `react-scripts` bundles cold starts and hot module reloads significantly slower than Vite's native ES module architecture.

### 1.2 Superior Alternative Architecture
**Migrate the host website from `react-scripts` to Vite.**
- Transitioning to Vite retains full React and TypeScript compatibility.
- Directly supports Tailwind CSS v4, fast builds, and modern ESM dependencies.
- Eliminates legacy Webpack build baggage while deploying cleanly to Netlify.

If maintaining `react-scripts` in the host project is strictly required, adhere to the integration procedure in Section 2.

---

## 2. External Integration Pipeline

### 2.1 Dependency Synchronization
Run the following installation command in the target `react-scripts` project:

```bash
# If using npm (use --legacy-peer-deps if host is on React 18):
npm install @supabase/supabase-js lucide-react motion --legacy-peer-deps

# If using yarn:
yarn add @supabase/supabase-js lucide-react motion
```

*Note: If the host project is using Tailwind CSS v3, ensure `tailwindcss`, `postcss`, and `autoprefixer` are installed:*
```bash
npm install -D tailwindcss@^3.4.0 postcss autoprefixer
```

---

### 2.2 File System Transfer Manifest
Transfer the following directory hierarchy into the host application under `src/modules/jarvis/` or `src/features/jarvis/`:

```
src/
└── features/
    └── jarvis/
        ├── assets/
        │   └── images/
        │       └── ambient_mesh_canvas_1790294153399.jpg
        ├── components/
        │   ├── AuthModal.tsx
        │   ├── BinSortingModal.tsx
        │   ├── CartesianScatterCanvas.tsx
        │   ├── CommandPaletteModal.tsx
        │   ├── CommandSpotlightModal.tsx
        │   ├── CompletionParticleBurst.tsx
        │   ├── ControlsToolbar.tsx
        │   ├── EisenhowerMatrixView.tsx
        │   ├── GuidanceBubble.tsx
        │   ├── ImpactEffortMatrixView.tsx
        │   ├── MegaTaskBinBar.tsx
        │   ├── Navbar.tsx
        │   ├── PrioritizedListView.tsx
        │   ├── TaskCard.tsx
        │   ├── TaskInputModal.tsx
        │   └── WorkloadDistributionMeter.tsx
        ├── constants/
        │   └── definitions.ts
        ├── services/
        │   ├── authService.ts
        │   ├── priorityEngine.ts
        │   ├── storageAdapter.ts
        │   ├── supabaseClient.ts
        │   └── supabaseRepository.ts
        ├── types/
        │   └── task.ts
        ├── utils/
        │   └── uuid.ts
        ├── JarvisTaskMatrix.tsx    <-- Renamed and encapsulated from App.tsx
        └── index.ts                <-- Public interface export
```

---

### 2.3 Host Tailwind CSS Configuration (For Tailwind v3 in react-scripts)
In the target project's `tailwind.config.js`, include the Jarvis component paths:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/features/jarvis/**/*.{js,jsx,ts,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      animation: {
        'pulse-subtle': 'pulseSubtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        pulseSubtle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.02)' },
        }
      }
    },
  },
  plugins: [],
};
```

Ensure standard glow utilities are placed in the host project's global CSS (`src/index.css`):

```css
.glow-cyan-hover:hover {
  box-shadow: 0 10px 25px -5px rgba(6, 182, 212, 0.25), 0 8px 10px -6px rgba(6, 182, 212, 0.2);
}
.glow-rose-hover:hover {
  box-shadow: 0 10px 25px -5px rgba(244, 63, 94, 0.25), 0 8px 10px -6px rgba(244, 63, 94, 0.2);
}
.glow-emerald-hover:hover {
  box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.25), 0 8px 10px -6px rgba(16, 185, 129, 0.2);
}
.glow-purple-hover:hover {
  box-shadow: 0 10px 25px -5px rgba(168, 85, 247, 0.25), 0 8px 10px -6px rgba(168, 85, 247, 0.2);
}
```

---

### 2.4 Environment Variables Configuration (`.env`)
In `react-scripts`, custom client-side environment variables must begin with `REACT_APP_`.
Add the following keys to the host project's `.env` file:

```env
REACT_APP_SUPABASE_URL=https://<your-project-ref>.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

*Note: The existing `supabaseClient.ts` in Jarvis supports both `REACT_APP_` and `VITE_` variable prefixes.*

---

### 2.5 Page Mount Example in Host App (React Router or Page Route)

```tsx
/**
 * @fileoverview Host Page integration for Jarvis Task Matrix.
 * Compatible with React Router v6 or direct component mounting.
 */

import React from 'react';
import { JarvisTaskMatrix } from './features/jarvis';

export const JarvisPage: React.FC = () => {
  return (
    <div className="w-full min-h-screen">
      <JarvisTaskMatrix />
    </div>
  );
};

export default JarvisPage;
```

---

### 2.6 Netlify Build & Deployment Configuration
Ensure the host application contains a `netlify.toml` in the repository root for single-page application (SPA) routing:

```toml
[build]
  command = "npm run build"
  publish = "build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "20"
```
In the Netlify dashboard under **Site configuration > Environment variables**, configure:
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`
