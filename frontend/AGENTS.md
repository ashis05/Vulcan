# frontend/AGENTS.md — VULCAN Expo app

Stack-specific rules for the React Native + Expo (TypeScript, Expo Router) app. Combine with root `../AGENTS.md`. Read `Design/DESIGN.md` (§3 tokens, §6 components, §8 screens) before any UI work — the navigable HTML prototype in `Design/screens/` is the visual spec; translate every value from `Design/screens/shared/tokens.css` into `src/theme/`.

## Structure (from PLAN.md §5)

- `src/app/` — expo-router routes (`(auth)`, `(onboarding)`, `(tabs)`, modal/stack routes per DESIGN.md §7).
- `src/components/` — shared, reusable UI from DESIGN.md §6 specs. Move a component here only if reused on 2+ screens; otherwise keep it local to its feature.
- `src/features/` — feature modules: today, train, nutrition, progress, profile.
- `src/engine/` — personalization **pure functions**, no React/framework imports, no I/O. Deterministic and unit-tested with `vitest`.
- `src/lib/` — supabase client, API client (FastAPI), hooks.
- `src/theme/` — tokens translated from DESIGN.md §3; also wired into `tailwind.config.js`.
- `Design/` — the design system + navigable HTML prototype (reference only, not shipped in the app bundle).

## Conventions

- **Stack:** Expo Router (file-based), NativeWind for styling, TanStack Query for **server** state (data from Supabase/API), Zustand for **UI** state (wizard, active session). Never use both for the same data.
- **Data flow (hard rule):** all CRUD via supabase-js directly (RLS-secured). AI only via the API client in `src/lib/` → FastAPI, authenticated with the Supabase access token (`Authorization: Bearer`). The app never talks to Gemini directly.
- **Engine purity:** `src/engine/` imports only its own modules + shared types. Keep it free of React, AsyncStorage, navigation, and any side effects. Targets are computed, never stored as the source of truth.
- **Theme discipline:** every color, radius, spacing, and font value comes from `src/theme/` (DESIGN.md tokens). No one-off hex values or magic spacing. Touch targets ≥44px; respect reduce-motion (DESIGN.md §11).
- **Offline tolerance:** the active workout session persists to AsyncStorage on every keystroke and survives app kill. Mutations queue (TanStack Query) and sync on reconnect; show the offline banner (DESIGN.md §9).
- **Env:** `frontend/.env` holds only `EXPO_PUBLIC_*` values; only `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_API_URL`. The anon key is safe; nothing else goes here. Commit only `.env.example`.

## Testing & verification (exit gates)

- Engine modules get `vitest` unit tests: known-input cases, floor clamping, unit round-trips, edge cases (e.g., first-ever set = PR, equal performance ≠ PR). Run `vitest run` before finishing.
- Before claiming a phase "Done when" item: run the relevant tests, typecheck (`tsc --noEmit`), and lint. For device-dependent items, state what you ran and the evidence.
- Manual checks (real device, airplane mode, kill-and-resume) must be reported with what was observed, not assumed.
