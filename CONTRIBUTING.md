# Contributing to TrackPrint

Thank you for taking a look at this portfolio project. Contributions are welcome — this guide covers the layout and the most common extension points.

## Project structure

```
src/
├── adapters/          # External APIs (Nominatim, OSRM, Google Maps) behind interfaces
├── assets/styles/     # Global SCSS tokens and themes
├── components/        # Vue UI (Composition API, `<script setup>`)
├── composables/       # Reusable Vue logic — components should use these, not Pinia directly
├── config/            # Static app data (vehicles, fuels, units, map styles)
├── constants/         # Shared magic numbers, defaults, and localStorage keys
├── services/
│   ├── calculations/  # Pure fuel & emissions math (no Vue, no DOM)
│   ├── units/         # Unit conversion helpers
│   ├── googleMaps/    # Google REST client and JS loader
│   └── pdf/           # PDF map rendering helpers
├── stores/            # Pinia state + trip calculation orchestration
├── types/             # Shared TypeScript interfaces
└── utils/             # Small helpers (polyline decode, PDF template, labels)
```

### Data flow

```
Components → Composables → Stores (state)
                         → Services (calculations)
                         → Adapters (geocoding / routing)
```

Provider selection is driven by environment variables (see [README.md](./README.md)). No `if (provider)` branches in UI code — use `getGeocodingAdapter()` / `getRoutingAdapter()` from `src/adapters`.

## Local setup

```bash
npm install
cp .env.example .env
npm run dev
```

Run `npm run typecheck`, `npm run test`, and `npm run build` before opening a pull request.

**Release version:** bump `version` in `package.json` only — `src/appMeta.ts` derives `APP_VERSION` and the dev-proxy User-Agent; `api/nominatim/` reads the same file for production.

## Screenshots

When updating the README visuals, replace the files in `docs/` (keep the same names so links stay valid):

| File | When to capture |
| --- | --- |
| `screenshot-form.png` | Empty trip form — no route calculated yet |
| `screenshot-results.png` | After calculation — results panel + route on map |

Use a consistent viewport (e.g. desktop ~1280px) and theme (light or dark) across both images.

## Adding a new vehicle type

1. Open [`src/config/vehicles.ts`](src/config/vehicles.ts).
2. Add an object to the `VEHICLES` array:

```js
{
  id: 'pickup',           // unique slug — used internally
  label: 'Pickup truck',  // shown in the UI
  icon: 'truck',          // Tabler icon id — see src/utils/tablerIcons.ts
  consumptionL100km: 12.0, // litres per 100 km (fossil fuels & plug-in fossil leg)
  consumptionKWhKm: 0.28, // kWh per km (electric & plug-in electric leg)
}
```

3. Save and verify in the trip form slider — no other files need changes unless you want custom copy elsewhere.

Consumption values are reference averages; users can still adjust the slider at runtime.

## Adding a new fuel type

1. Open [`src/config/fuels.ts`](src/config/fuels.ts).
2. Add an object to the `FUELS` array:

```js
{
  id: 'lpg',
  label: 'LPG',
  unit: 'litre',              // 'litre' or 'kwh'
  co2PerUnit: 1.51,           // kg CO₂ per litre or kWh
  consumptionL100Factor: 1.1, // multiplier on vehicle L/100km; null for pure electric
}
```

3. If the fuel needs special behaviour (e.g. split electric/fossil like plug-in), update [`src/services/calculations/fuelService.ts`](src/services/calculations/fuelService.ts) and [`src/services/calculations/emissionsService.ts`](src/services/calculations/emissionsService.ts). For standard fossil or electric fuels, config alone is enough.

4. For a new fuel **identifier** used in conditionals, add a constant in [`src/constants/index.ts`](src/constants/index.ts) and reference it instead of string literals.

## Adding a map / geocoding provider

Implement `IGeocodingAdapter` or `IRoutingAdapter` under `src/adapters/`, register the class in [`src/adapters/registry.ts`](src/adapters/registry.ts), and document the new env value in `.env.example` and README.

## Code style

- Vue components: Composition API with `<script setup>`.
- File naming: `PascalCase.vue` for components; `camelCase.ts` elsewhere.
- Keep calculation logic in `services/calculations/` — composables orchestrate, they do not embed formulas.
- Prefer imports from `@/constants` and `@/types` over duplicated literals or inline interfaces.
