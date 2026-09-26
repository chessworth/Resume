# MIGRATION SPECIFICATION: REACT-SCRIPTS (CREATE REACT APP) TO VITE

## 1. Technical Rationale & Architectural Advantages

| Metric | `react-scripts` (Webpack 5) | Vite (Rollup / esbuild) |
| :--- | :--- | :--- |
| **Status** | Deprecated / Unmaintained (April 2023) | Industry Standard / Actively Maintained |
| **Dev Server Cold Start** | 15s – 60s+ (Bundles entire app before serving) | < 300ms (Native ESM on-demand compilation) |
| **Hot Module Replacement (HMR)** | Slow (Full dependency chain re-bundle) | Instantaneous (Sub-millisecond module swap) |
| **Tailwind CSS v4** | Incompatible without CRACO/WebPack ejecting | Native first-class support (`@tailwindcss/vite`) |
| **Production Bundling** | Heavy Webpack output | Lean Rollup chunking & dynamic code splitting |
| **Netlify Compatibility** | Standard | Optimized (Faster Netlify build pipelines) |

---

## 2. Migration Protocol: Step-by-Step

### Step 2.1: Remove `react-scripts` and Install Vite Tooling
In the root directory of the existing website repository, execute:

```bash
# 1. Uninstall legacy Create React App dependencies
npm uninstall react-scripts

# 2. Install modern Vite dev server and TypeScript/React plugins
npm install -D vite @vitejs/plugin-react @types/node

# 3. If using Tailwind CSS v4 (Recommended to match Jarvis):
npm install tailwindcss @tailwindcss/vite
```

---

### Step 2.2: Relocate and Update `index.html`
In `react-scripts`, `index.html` resides in the `public/` directory. Vite requires `index.html` to be located in the **project root**.

1. **Move `public/index.html` to the project root (`./index.html`)**:
   ```bash
   mv public/index.html ./index.html
   ```

2. **Update HTML Content**:
   - Strip all `%PUBLIC_URL%` placeholders (Vite serves public assets automatically from `/`).
   - Add the explicit module script entry pointing to your React root (`src/index.tsx` or `src/main.tsx`).

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
    <title>Jarvis Task Matrix</title>
  </head>
  <body>
    <div id="root"></div>
    <!-- CRITICAL: Vite requires the root script entry point tag -->
    <script type="module" src="/src/index.tsx"></script>
  </body>
</html>
```
*(If your entry file is `src/main.tsx`, adjust the `src` attribute accordingly).*

---

### Step 2.3: Create Vite Configuration (`vite.config.ts`)
Create `vite.config.ts` in the project root:

```typescript
/**
 * @fileoverview Vite build and dev server configuration.
 * Replaces legacy react-scripts Webpack configuration.
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

---

### Step 2.4: Update `tsconfig.json`
`react-scripts` uses older TypeScript compiler options. Update your `tsconfig.json` to leverage modern ESNext features and DOM types:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": false,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Paths */
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src", "vite.config.ts"]
}
```

Create a Vite client types declaration file at `src/vite-env.d.ts`:

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

---

### Step 2.5: Environment Variables Migration (`REACT_APP_` -> `VITE_`)
Vite uses `import.meta.env` with the `VITE_` prefix instead of Webpack's `process.env.REACT_APP_`.

1. **Update `.env` file**:
   ```env
   # Replace:
   # REACT_APP_SUPABASE_URL=...
   # REACT_APP_SUPABASE_ANON_KEY=...

   # With:
   VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-anon-key>
   ```

2. **Codebase Environment Access**:
   - `src/services/supabaseClient.ts` in Jarvis is **already polymorphic**: it checks `import.meta.env.VITE_*` and falls back to `process.env.REACT_APP_*` automatically.
   - For your existing website's other services, search and replace:
     - Find: `process.env.REACT_APP_`
     - Replace: `import.meta.env.VITE_`

---

### Step 2.6: Update `package.json` Scripts
Replace the legacy `react-scripts` task runners with Vite commands:

```json
{
  "scripts": {
    "start": "vite",
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

---

### Step 2.7: Update Netlify Configuration (`netlify.toml`)
Because Vite outputs to `dist/` rather than Create React App's `build/`, update your publish directory in `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "20"
```

In the Netlify dashboard under **Site configuration > Environment variables**, add:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## 3. Jarvis Module Integration into Migrated Website

### Step 3.1: Copy Jarvis Module
Copy the entire `src/` folder of the Jarvis applet into your newly migrated project under `src/features/jarvis/`:

```
src/
└── features/
    └── jarvis/
        ├── assets/
        ├── components/
        ├── constants/
        ├── services/
        ├── types/
        ├── utils/
        ├── JarvisTaskMatrix.tsx
        └── index.ts
```

### Step 3.2: Direct Mount
Because the host website is now running on Vite, Tailwind v4 and React 19 operate natively with zero peer dependency conflicts or CRACO workarounds:

```tsx
/**
 * @fileoverview Main entry page for Jarvis in Vite host app.
 */
import React from 'react';
import { JarvisTaskMatrix } from './features/jarvis';

export const JarvisRoute: React.FC = () => {
  return (
    <div className="w-full min-h-screen bg-slate-900">
      <JarvisTaskMatrix />
    </div>
  );
};

export default JarvisRoute;
```

---

## 4. Verification & Health Check Sequence

Execute this terminal validation checklist:

```bash
# 1. Clean legacy artifacts
rm -rf node_modules package-lock.json build dist

# 2. Fresh installation
npm install

# 3. Type check validation
npx tsc --noEmit

# 4. Local Vite server launch
npm run dev

# 5. Production build test
npm run build
```
Verify terminal output confirms build completed under `dist/` in < 5 seconds.
