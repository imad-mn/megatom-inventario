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
- **Firebase** (backend-as-a-service): Firestore database, Storage, Authentication
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

- **`firebase.ts`** — Firebase app initialization; exports `auth`, `db` (Firestore), and `storage`
- **`TablesDbService.ts`** — All Firestore CRUD via generic typed functions (`Crear`, `Actualizar`, `Eliminar`, `ObtenerTodos`, etc.). Uses `FirestoreDataConverter` to map `id` to/from Firestore document ID. Two converter variants: plain (`createConverter`) and date-aware (`createConverterConFecha`) for models with `fechaCreacion`.
- **`StorageService.ts`** — Product image upload/download via Firebase Storage
- **`ImportarExportar.ts`** — CSV import/export logic using PapaParse
- **`modelos.ts`** — All TypeScript type definitions
- **`shared.ts`** — Global reactive state (`Usuario`, `Listas`, `GalponSeleccionado`, `EstanteSeleccionado`, `dialogoHistorial`) and shared utilities

### Data Model

Defined in [src/servicios/modelos.ts](src/servicios/modelos.ts):
- `Producto` — product catalog items
- `Galpon` → `Estante` → `Nivel` → `Seccion` → `Caja` — nested hierarchical location structure stored as a single Firestore document per `Galpon`
- `Cantidades` — stock quantity records per caja
- `Movimientos` — movement transactions with justification
- `Lista` — lookup/reference lists (fabricantes, grupos, almacenistas, usuario)
- `Historial` — audit trail entries

### State Management

No external state library. Uses Vue 3 reactivity (`ref`, `computed`, `watchEffect`) directly. Global state lives as exported reactive refs in `shared.ts` (`Usuario`, `Listas`, `GalponSeleccionado`, `EstanteSeleccionado`, `dialogoHistorial`).

### Authentication

- Firebase Authentication; `Usuario` reactive ref (from `shared.ts`) holds a `UserCredential` or `undefined`
- Admin-only pages (`/historial`, `/listas`) check `Usuario.value` before showing controls
- Export buttons for Historial are restricted to specific user display names (`imad`, `giovanni`)

### Styling

- Brand color: `--azul-megatom: rgb(38,44,83)` (defined in `main.css`)
- PrimeVue component overrides in `main.css`
- Tooltips are hidden on mobile via CSS
- Path alias: `@/` → `src/`

### Firebase Configuration

Firebase config is hardcoded in [src/servicios/firebase.ts](src/servicios/firebase.ts) (project: `megatom-project`). No `.env` file is required for Firebase connectivity.
