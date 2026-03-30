# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server (Vite HMR)
npm run build        # Type-check + production build (parallel)
npm run build-only   # Production build only
npm run type-check   # TypeScript check only (vue-tsc)
npm run lint         # ESLint with auto-fix
npm run preview      # Preview production build
```

No test framework is configured in this project.

## Code Style

- Write all code comments in Spanish.


## Tech Stack

- **Vue 3** (Composition API, `<script setup>` SFCs)
- **TypeScript** via `vue-tsc`
- **Vite** build tool
- **PrimeVue 4** component library with `@primeuix/themes` theming
- **Tailwind CSS 4** + `tailwindcss-primeui` integration
- **Appwrite** (backend-as-a-service): database, storage, authentication
- **Vue Router 4** (client-side SPA routing)
- **PapaParse** for CSV import/export

## Architecture

### Project Structure

```
src/
├── componentes/       # Reusable UI components
├── paginas/           # Route-level page components
├── servicios/         # Business logic and data layer
├── router.ts          # Vue Router config
├── App.vue            # Root component
├── main.ts            # Entry point
└── main.css           # Global styles + Tailwind + PrimeVue overrides
```

### Routing

Routes are defined in [src/router.ts](src/router.ts) and map to page components:
- `/` → `PaginaHome` — warehouse list
- `/login` → `PaginaLogin`
- `/galpones` → `PaginaGalpones`
- `/galpon/:id` → `PaginaGalpon` — single warehouse with shelves
- `/estante/:estante` → `PaginaEstante` — shelf detail
- `/productos` → `PaginaProductos` — product catalog
- `/movimientos` → `PaginaMovimientos`
- `/historial` → `PaginaHistorial` (admin only)
- `/listas` → `PaginaListas` (admin only)

### Service Layer

All backend interaction goes through [src/servicios/](src/servicios/):

- **`appwrite.ts`** — Appwrite client, `account`, and `Usuario` (global reactive ref for current user)
- **`TablesDbService.ts`** — All Appwrite database CRUD. Also holds global cached state:
  - `Inventarios` — reactive ref of cached inventory rows
  - `Listas` — reactive ref of lookup lists (fabricantes, grupos, almacenistas, etc.)
  - `dialogoHistorial` — reactive ref controlling the history dialog
- **`StorageService.ts`** — Product image upload/download via Appwrite Storage
- **`ImportarExportar.ts`** — CSV import/export logic using PapaParse
- **`modelos.ts`** — All TypeScript type definitions
- **`shared.ts`** — Shared utilities (e.g., building location hierarchy strings)

### Data Model

Defined in [src/servicios/modelos.ts](src/servicios/modelos.ts):
- `Producto` — product catalog items
- `Inventario` — hierarchical location: Galpon → Estante → Nivel → Sección → Caja
- `Cantidades` — stock quantity records per location
- `Movimientos` — movement transactions with justification
- `Lista` — lookup/reference lists (fabricantes, grupos, etc.)
- `Historial` — audit trail entries

### State Management

No external state library. Uses Vue 3 reactivity (`ref`, `computed`, `watchEffect`) directly. Global state lives in service files as exported reactive refs (e.g., `Usuario`, `Inventarios`, `Listas` from `TablesDbService.ts`).

### Authentication

- Appwrite Account-based auth with session management
- `Usuario` reactive ref (from `appwrite.ts`) holds the current Appwrite user object or `null`
- Admin-only pages (`/historial`, `/listas`) check `Usuario.value` before showing controls
- Export buttons for Historial are restricted to specific user IDs (`imad`, `giovanni`)

### Styling

- Brand color: `--azul-megatom: rgb(38,44,83)` (defined in `main.css`)
- PrimeVue component overrides in `main.css`
- Tooltips are hidden on mobile via CSS
- Path alias: `@/` → `src/`

### Environment Variables

Configured via `.env` (Appwrite credentials):
- `VITE_APPWRITE_PROJECT_ID`
- `VITE_APPWRITE_ENDPOINT`
- `VITE_APPWRITE_DATABASE_ID`
- `VITE_APPWRITE_BUCKET_ID`
- `VITE_APPWRITE_DEV_KEY`
