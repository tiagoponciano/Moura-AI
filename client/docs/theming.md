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
| `ThemeToggle` | `components/theme-toggle.tsx` | Sidebar footer button; cycles the theme |
| `@custom-variant dark` | `app/globals.css` | Makes Tailwind `dark:` utilities match descendants of `.dark` |

## Rules and behavior

`ThemeToggle` cycles on each click and shows the current mode:

| Current | Label / icon | Next on click |
|---|---|---|
| `light` | Tema claro / `Sun` | `dark` |
| `dark` | Tema escuro / `Moon` | `system` |
| `system` | Tema do sistema / `Monitor` | `light` |

- The choice is stored in `localStorage` under the key `theme` (per browser, not per user).
- An inline script injected by `next-themes` applies the stored theme before first paint, so there is no light flash on reload.
- CSS transitions are disabled for the instant of switching (`disableTransitionOnChange`), so colors change at once.
- When the sidebar is collapsed to icons, the toggle shows only the icon with the label as a tooltip.

## What this does NOT do

- No per-user persistence (there is no auth or database); clearing site data resets to `system`.
- Generated `.docx` files are not affected by the theme.

## Gotchas

- **Hydration warning on `<html>`** → the `class` attribute differs between server and client because the theme script runs first. → `suppressHydrationWarning` on `<html>` is intentional; do not remove it.
- **Toggle label flickers to the wrong mode on load** → reading `theme` during SSR. → `ThemeToggle` renders `system` until mounted (`useSyncExternalStore` with a `false` server snapshot); keep that pattern for any UI that depends on the resolved theme.
- **A new component stays light in dark mode** → it uses a hardcoded color. → Replace it with the matching token, or add an explicit `dark:` variant.
