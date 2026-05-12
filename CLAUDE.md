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
- `/imprimir/:tipo` → `PaginaImprimir` — printable views
- `/solicitud` → `PaginaSolicitudActual` — current order/request
- `/solicitudes` → `PaginaSolicitudes` — order history

### Service Layer

All backend interaction goes through [src/servicios/](src/servicios/):

- **`firebase.ts`** — Firebase app initialization; exports `auth`, `db` (Firestore), and `storage`
- **`TablesDbService.ts`** — All Firestore CRUD via generic typed functions (`Crear`, `Actualizar`, `Eliminar`, `ObtenerTodos`, etc.). Uses `FirestoreDataConverter` to map `id` to/from Firestore document ID. Two converter variants: plain (`createConverter`) and date-aware (`createConverterConFecha`) for models with `fechaCreacion`.
- **`StorageService.ts`** — Product image upload/download via Firebase Storage
- **`ImportarExportar.ts`** — CSV import/export logic using PapaParse
- **`modelos.ts`** — All TypeScript type definitions
- **`globalStore.ts`** — Pinia store for global app state: `Listas`, `Galpones`, `Productos`, `Cantidades`, `GalponSeleccionado`, `EstanteSeleccionado`, `dialogoHistorial`. Also exposes helper methods (`ObtenerLista`, `ObtenerUbicaciones`, etc.). Loaded once at app startup via `CargarTodo()` in `App.vue`.
- **`authStore.ts`** — Pinia store for auth state: `Usuario` (`UserCredential | undefined`), `logIn`, `logOut`.
- **`historialService.ts`** — Helpers to write and query `Historial` entries in Firestore.
- **`sharedFunctions.ts`** — Shared utilities; currently exports `FormatoFechaHora(fecha: Date): string` for Spanish/Venezuela locale date formatting.

### Data Model

Defined in [src/servicios/modelos.ts](src/servicios/modelos.ts):
- `Producto` — product catalog items (nombre, codigo, descripcion, pesoUnitario, grupoId, fabricanteId, estadoId, imagenUrl)
- `Galpon` → `Estante` → `Nivel` → `Seccion` → `Caja` — nested hierarchical location structure. **The entire hierarchy is stored as a single Firestore document per `Galpon`** (not separate subcollections). Mutations to shelves/sections/boxes require updating the whole Galpon document.
- `Cantidades` — stock quantity records (productoId, cajaId, cantidad)
- `Movimientos` — movement transactions (tipo: `'INGRESO'|'EGRESO'|'TRASLADO'`, productoId, cantidad, cajaId, cajaIdDestino for transfers, almacenistaId, justificacion, creadoPor)
- `Lista` — lookup/reference lists (fabricantes, grupos, almacenistas, estados); filtered by `tipo: TipoLista`
- `Historial` — audit trail entries (idElemento, usuario, accion, anterior, actual, fechaCreacion)
- `Solicitud` — purchase/transfer requests (solicitante, direccion, telefono, procesada, productosCantidad[])

### State Management

Uses **Pinia** stores (no Vuex). Two stores:
- `useGlobalStore()` — app data (Galpones, Productos, Cantidades, Listas, GalponSeleccionado, EstanteSeleccionado, CajaSeleccionada, solicitudActual). Never call at module level; always call inside functions or component setup.
- `useAuthStore()` — authentication state (`Usuario: UserCredential | undefined`).

The same rule applies to any helper file that uses a store (e.g. `ImportarExportar.ts`, `historialService.ts`): call `useXStore()` inside the function body, not at the top of the module, or Pinia will throw `"getActivePinia() was called but there was no active Pinia"`.

### Authentication

- Firebase Authentication; `Usuario` ref in `authStore` holds a `UserCredential` or `undefined`.
- Admin-only pages (`/historial`, `/listas`) check `authStore.Usuario` before showing controls.
- Export buttons for Historial are restricted to specific user display names (`Imad`, `Giovanni`).

### Styling

- Brand color: `--azul-megatom: rgb(38,44,83)` (defined in `main.css`)
- PrimeVue component overrides in `main.css`
- Tooltips are hidden on mobile via CSS
- Path alias: `@/` → `src/`

### PrimeVue Components

All PrimeVue components are registered globally in [src/main.ts](src/main.ts) — import is not needed in SFCs. Registered components include: `Menubar`, `Button`, `DataView`, `Panel`, `ConfirmDialog`, `Dialog`, `InputText`, `Select`, `InputNumber`, `Textarea`, `FileUpload`, `FloatLabel`, `Card`, `Message`, `Fieldset`, `Listbox`, `ToggleSwitch`, `ProgressBar`, `Password`, `DatePicker`, `ToggleButton`, `ProgressSpinner`, `Menu`, `Tag`, `SelectButton`, `InputMask`. The UI locale is Spanish (`es.json`).

### Audit Trail Pattern

After any create/update/delete operation, call `RegistrarHistorial(idElemento, accion, anterior?, actual?)` from `historialService.ts`. The `Stringify()` helper converts a `Producto` to a human-readable string for before/after snapshots. This is how the `/historial` page is populated.

### Firebase Configuration

Firebase config se carga desde variables de entorno en `.env.local` (ignorado por git). Ver `.env.example` para las claves necesarias. Todas usan el prefijo `VITE_FIREBASE_`.
