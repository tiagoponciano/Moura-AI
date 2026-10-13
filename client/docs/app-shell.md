# App shell

How the frame around every module works now: the module registry, the sidebar, the header breadcrumb and the home page. For developers adding or renaming a module.

## What this is

Every module page renders inside `app/(app)/layout.tsx`: a collapsible sidebar on the left, a 48px header on top (sidebar trigger, breadcrumb, theme toggle) and a scrollable content area. `app/layout.tsx` only sets the fonts, `ThemeProvider` and `TooltipProvider`; the login and access pages use `app/(auth)/layout.tsx` instead and have no sidebar (see `authentication.md`). The list of modules is declared once, in `lib/modules.ts`, and read by the sidebar, the breadcrumb and the home page.

Invariants:

- Adding a module means adding an entry to `MODULES`, creating `features/<name>/` with an `index.ts`, and an `app/(app)/<href>/page.tsx` that renders what the feature exports. Nothing else lists modules. `(app)` is a route group: it does not appear in the URL.
- `status` is display-only. It changes badges and copy; it never hides a route or blocks navigation.

## Surface

### `lib/modules.ts`

| Export                | Type                                           | Contract                                                                |
| --------------------- | ---------------------------------------------- | ----------------------------------------------------------------------- |
| `MODULES`             | `AppModule[]`                                  | Order is the display order in the sidebar and on the home page          |
| `MODULE_STATUS_LABEL` | `Record<ModuleStatus, string>`                 | `available` → `Disponível`, `preview` → `Prévia`, `soon` → `Em breve`   |
| `findModule`          | `(pathname: string) => AppModule \| undefined` | First module whose `href` is a prefix of `pathname`; `undefined` on `/` |

```ts
type AppModule = {
  href: string; // route, leading slash, English, e.g. "/documents"
  label: string; // sidebar item, breadcrumb, card title
  summary: string; // one sentence, shown on the home card
  icon: LucideIcon;
  status: "available" | "preview" | "soon";
};
```

### Components (`components/layout/`)

| Component    | Where                            | Notes                                                                                                                                                               |
| ------------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AppSidebar` | `app/(app)/layout.tsx`           | Logo + name linking to `/`, an "Início" item, one item per module, then "Administração" (`/admin`) when `isAdmin`; the footer holds `UserMenu` and the company name |
| `UserMenu`   | `AppSidebar` footer              | Signed-in user and "Sair"; renders nothing without Supabase or a session (see `authentication.md`)                                                                  |
| `PageTitle`  | header in `app/(app)/layout.tsx` | `Moura Engenharia / <label>`; `Administração` under `/admin`; just `Moura Engenharia` on `/` and on other routes that match no module                               |

`app/(app)/layout.tsx` is an async Server Component: it calls `isCurrentUserAdmin()` and passes the result to `AppSidebar` as `isAdmin`. The flag only hides or shows the link; access to `/admin` is decided by the proxy (see `features/admin/docs/admin-console.md`).
| `ThemeToggle` | header in `app/(app)/layout.tsx` | See `theming.md` |

## Rules and behavior

| `status`    | Sidebar badge | Home card badge      | Home card icon                        |
| ----------- | ------------- | -------------------- | ------------------------------------- |
| `available` | none          | none                 | solid `primary` tile                  |
| `preview`   | `Prévia`      | `Prévia` (secondary) | solid `primary` tile                  |
| `soon`      | `Em breve`    | `Em breve` (outline) | `muted` tile, `muted-foreground` icon |

Every home card is a link to its `href` with an arrow in the top-right corner; there is no call-to-action text.

- Active sidebar item: `pathname.startsWith(href)` for modules and "Administração", exact match for "Início".
- "Administração" is not a module: it is not in `MODULES`, has no home card and no status badge.
- With the sidebar collapsed to icons, labels become tooltips, status badges and the company name are hidden, and `UserMenu` shrinks to the avatar.
- `/` renders `HomeShowcase` from `@/features/home`: the title, one card per module and the 3D rescue scene. See `features/home/docs/home-rescue-scene.md`.
- The brand mark is `public/brand/moura-logo.png` (transparent PNG). In dark mode it sits on a light tile (`dark:bg-white/90`) because the graphite gear disappears on a dark background. `app/icon.png` (same logo, 512px) is the favicon.
- The product is called "Moura Engenharia" (tab title, sidebar, breadcrumb). The chat assistant shared by the modules is called "Moura AI" and keeps the robot avatar.
- `PageHeader` (`components/shared/page-header.tsx`) shows the page title; its `description` is not printed under it but shown in a tooltip on an info icon next to the title.
- The chat composer has no visible keyboard hint; "Enter envia · Shift+Enter quebra a linha" is the tooltip of the send button, also while it is disabled.
- Route folders and `href`s are in English (`/documents`, `/classification`, `/floor-plans`); labels and copy are in Portuguese.
- Placeholder modules (`features/floor-plans`) export a `<Name>Placeholder` component that renders `ComingSoon` (`components/shared/coming-soon.tsx`) with `title`, `description`, `icon` and an optional `plans` list shown under "O que está previsto".

## What this does NOT do

- `status` is not access control. Every module is reachable by URL whatever its `status`; who may enter at all is decided by the login gate in `authentication.md`.
- `PageTitle` does not show sub-pages; a nested route still reads `Moura Engenharia / <module>`.
- `findModule` is prefix-based, so a module whose `href` is a prefix of another (`/plan` and `/plantas`) would match the wrong one. Keep `href`s prefix-free.

## Gotchas

- **Page file grows logic and markup** → `page.tsx` should only compose what features export. → Put the module's components in `features/<name>/components/`, state in `features/<name>/hooks/`, pure logic in `features/<name>/lib/` and server code in `features/<name>/server/`.
- **ESLint `no-restricted-imports` error** → a route imported a feature's internals, shared code imported a feature, or a feature imported another feature. → Import from `@/features/<name>` (or `/server`), and move code shared by two features up to `components/` or `lib/`.
- **Module added but missing from the sidebar** → entry added to a local array instead of `MODULES`. → Only `lib/modules.ts` feeds the shell.
- **Badge or footer visible in the collapsed sidebar** → custom element without the `group-data-[collapsible=icon]:hidden` class. → `SidebarMenuBadge` hides itself; plain elements need the class.
