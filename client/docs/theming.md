# Theming (light / dark mode)

How the app's color theme is chosen, stored and applied. For developers adding screens or components.

## What this is

Every page supports light and dark mode. `next-themes` toggles a `dark` class on `<html>`; the shadcn color tokens in `app/globals.css` (`:root` for light, `.dark` for dark) do the rest.

Invariants:

- Components use only theme tokens (`bg-background`, `bg-card`, `bg-muted`, `text-muted-foreground`, `bg-primary`, `text-destructive`, `border`…). A hardcoded color (`bg-white`, `text-gray-500`, hex values) will not switch with the theme.
- The default is `system`: with no stored choice, the theme follows the OS `prefers-color-scheme` and tracks it live.

## Surface

| Piece | Location | Role |
|---|---|---|
| `ThemeProvider` (from `next-themes`) | `app/layout.tsx` | `attribute="class"`, `defaultTheme="system"`, `enableSystem`, `disableTransitionOnChange` |
| `ThemeToggle` | `components/layout/theme-toggle.tsx` | Icon-only dropdown at the right end of the top header (`app/layout.tsx`) |
| `@custom-variant dark` | `app/globals.css` | Makes Tailwind `dark:` utilities match descendants of `.dark` |

## Rules and behavior

The trigger is a ghost icon button (`aria-label="Alterar tema"`) showing the **resolved** theme: `Sun` when light, `Moon` when dark. With `system`, it shows whichever the OS currently resolves to. The menu opens aligned to the right edge and offers a radio group with the stored choice checked:

| Item | Value | Icon |
|---|---|---|
| Claro | `light` | `Sun` |
| Escuro | `dark` | `Moon` |
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
- **A new component stays light in dark mode** → it uses a hardcoded color. → Replace it with the matching token, or add an explicit `dark:` variant.
