# Theming (light / dark mode)

How the app's color theme is chosen, stored and applied. For developers adding screens or components.

## What this is

Every page supports light and dark mode. `next-themes` toggles a `dark` class on `<html>`; the shadcn color tokens in `app/globals.css` (`:root` for light, `.dark` for dark) do the rest.

Invariants:

- Components use only theme tokens (`bg-background`, `bg-card`, `bg-muted`, `text-muted-foreground`, `bg-primary`, `text-destructive`, `border`…). A hardcoded color (`bg-white`, `text-gray-500`, hex values) will not switch with the theme.
- The default is `system`: with no stored choice, the theme follows the OS `prefers-color-scheme` and tracks it live.

## Surface

| Piece                                | Location                             | Role                                                                                      |
| ------------------------------------ | ------------------------------------ | ----------------------------------------------------------------------------------------- |
| `ThemeProvider` (from `next-themes`) | `app/layout.tsx`                     | `attribute="class"`, `defaultTheme="system"`, `enableSystem`, `disableTransitionOnChange` |
| `ThemeToggle`                        | `components/layout/theme-toggle.tsx` | Icon-only dropdown at the right end of the top header (`app/layout.tsx`)                  |
| `@custom-variant dark`               | `app/globals.css`                    | Makes Tailwind `dark:` utilities match descendants of `.dark`                             |

## Rules and behavior

### Palette

Colors come from the Moura logo (`public/brand/moura-logo.png`): the flame's red (light mode) and orange (dark mode) drive `primary`, `ring`, `sidebar-primary` and, as a light tint, `accent` / `sidebar-accent` (hover and active states). Neutrals follow the logo's graphite gear: near-neutral grays (chroma ≤ 0.004).

| Token         | Light                  | Dark                   | Used for                                                                 |
| ------------- | ---------------------- | ---------------------- | ------------------------------------------------------------------------ |
| `primary`     | `oklch(0.57 0.21 33)`  | `oklch(0.7 0.17 45)`   | buttons, user chat bubbles, home card icons, 3D scene highlights         |
| `accent`      | `oklch(0.96 0.025 45)` | `oklch(0.28 0.04 45)`  | hover backgrounds of cards, chips and menu items                         |
| `success`     | `oklch(0.58 0.13 155)` | `oklch(0.72 0.14 155)` | "filled" checks in the fields panel and confirmed tool calls in the chat |
| `destructive` | shadcn default         | shadcn default         | validation errors                                                        |

The home 3D scene has its own tokens, declared in `:root` / `.dark` but not mapped in `@theme inline` (they are not Tailwind utilities): `--scene-concrete`, `--scene-core`, `--scene-glass`, `--scene-edge`, `--scene-sidewalk`, `--scene-street`, `--scene-marking`, `--scene-trunk`, `--scene-foliage`, `--scene-suit`, `--scene-truck`, `--scene-helmet`, `--scene-reflective`, `--scene-tire`, `--scene-metal`, `--scene-smoke`, `--scene-water`. The scene also reads `--primary` (fire protection systems) and `--background` (fog). It re-reads them when the resolved theme changes; see `features/home/docs/home-rescue-scene.md`.

`success` is not a shadcn default: it is declared in `:root` / `.dark` and mapped to `--color-success` in `@theme inline`, so `text-success`, `bg-success/5`, `border-success/30` work like any other token. The `chart-*` tokens are left at the shadcn grayscale defaults (no charts exist).

### Typography

`next/font` loads IBM Plex Sans (400, 500, 600, 700) into `--font-plex-sans` and IBM Plex Mono (400, 500) into `--font-plex-mono` on `<html>`; `@theme inline` maps `--font-sans` and `--font-mono` to them. `--font-heading` follows `--font-sans`. Plex is not a variable font, so a weight outside that list (e.g. `font-light`) falls back to the nearest loaded one.

### Theme selection

The trigger is a ghost icon button (`aria-label="Alterar tema"`) showing the **resolved** theme: `Sun` when light, `Moon` when dark. With `system`, it shows whichever the OS currently resolves to. The menu opens aligned to the right edge and offers a radio group with the stored choice checked:

| Item    | Value    | Icon      |
| ------- | -------- | --------- |
| Claro   | `light`  | `Sun`     |
| Escuro  | `dark`   | `Moon`    |
| Sistema | `system` | `Monitor` |

- The choice is stored in `localStorage` under the key `theme` (per browser, not per user).
- An inline script injected by `next-themes` applies the stored theme before first paint, so there is no light flash on reload.
- CSS transitions are disabled for the instant of switching (`disableTransitionOnChange`), so colors change at once.

## What this does NOT do

- No per-user persistence (there is no auth or database); clearing site data resets to `system`.
- Generated `.docx` files are not affected by the theme.

## Gotchas

- **Hydration warning on `<html>`** → the `class` attribute differs between server and client because the theme script runs first. → `suppressHydrationWarning` on `<html>` is intentional; do not remove it.
- **Theme-dependent UI shows the wrong state on load** → `useTheme()` returns `undefined` during SSR. → Prefer swapping with the `dark:` variant in CSS, as the trigger icons do (`dark:hidden` / `hidden dark:block`). Reading `theme` in render is safe only inside content that mounts on the client, like the open dropdown menu.
- **Text renders in a serif font** → `--font-sans` in `@theme inline` points at itself or at an undefined variable, so the browser falls back to its default. → It must be `var(--font-plex-sans)`, the variable `next/font` sets in `app/layout.tsx`.
- **New utility classes have no effect in `next dev`** → the dev server's Tailwind output went stale after a branch switch or a large move of files. → Restart `pnpm run dev`; `pnpm run build` always regenerates it.
- **A new component stays light in dark mode** → it uses a hardcoded color. → Replace it with the matching token, or add an explicit `dark:` variant.
