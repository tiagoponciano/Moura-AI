# App shell

How the frame around every module works now: the module registry, the sidebar, the header breadcrumb and the home page. For developers adding or renaming a module.

## What this is

Every route renders inside `app/layout.tsx`: a collapsible sidebar on the left, a 48px header on top (sidebar trigger, breadcrumb, theme toggle) and a scrollable content area. The list of modules is declared once, in `lib/modules.ts`, and read by the sidebar, the breadcrumb and the home page.

Invariants:

- Adding a module means adding an entry to `MODULES` and creating `app/<href>/page.tsx`. Nothing else lists modules.
- `status` is display-only. It changes badges and copy; it never hides a route or blocks navigation.

## Surface

### `lib/modules.ts`

| Export | Type | Contract |
|---|---|---|
| `MODULES` | `AppModule[]` | Order is the display order in the sidebar and on the home page |
| `MODULE_STATUS_LABEL` | `Record<ModuleStatus, string>` | `available` → `Disponível`, `preview` → `Prévia`, `soon` → `Em breve` |
| `findModule` | `(pathname: string) => AppModule \| undefined` | First module whose `href` is a prefix of `pathname`; `undefined` on `/` |

```ts
type AppModule = {
  href: string;        // route, leading slash, e.g. "/documentos"
  label: string;       // sidebar item, breadcrumb, card title
  summary: string;     // one sentence, shown on the home card
  icon: LucideIcon;
  status: "available" | "preview" | "soon";
};
```

### Components (`components/layout/`)

| Component | Where | Notes |
|---|---|---|
| `AppSidebar` | `app/layout.tsx` | Brand header linking to `/`, an "Início" item, then one item per module |
| `PageTitle` | header in `app/layout.tsx` | `Moura AI / <label>`; just `Moura AI` on `/` and on routes that match no module |
| `ThemeToggle` | header in `app/layout.tsx` | See `theming.md` |

## Rules and behavior

| `status` | Sidebar badge | Home card badge | Home card icon | Home card call to action |
|---|---|---|---|---|
| `available` | none | `Disponível` (secondary) | brand tint | `Abrir` |
| `preview` | `Prévia` | `Prévia` (secondary) | brand tint | `Abrir` |
| `soon` | `Em breve` | `Em breve` (outline) | muted | `Ver detalhes` |

- Active sidebar item: `pathname.startsWith(href)` for modules, exact match for "Início".
- With the sidebar collapsed to icons, labels become tooltips, and status badges and the footer are hidden.
- `/` renders the home page (`app/page.tsx`): headline, one card per module, and a three-step explanation of document filling. It is a server component with no data fetching.
- Placeholder modules use `ComingSoon` (`components/shared/coming-soon.tsx`) with `title`, `description`, `icon` and an optional `plans` list shown under "O que está previsto".

## What this does NOT do

- No access control. Every module is reachable by URL whatever its `status`.
- `PageTitle` does not show sub-pages; a nested route still reads `Moura AI / <module>`.
- `findModule` is prefix-based, so a module whose `href` is a prefix of another (`/plan` and `/plantas`) would match the wrong one. Keep `href`s prefix-free.

## Gotchas

- **Module added but missing from the sidebar** → entry added to a local array instead of `MODULES`. → Only `lib/modules.ts` feeds the shell.
- **Badge or footer visible in the collapsed sidebar** → custom element without the `group-data-[collapsible=icon]:hidden` class. → `SidebarMenuBadge` hides itself; plain elements need the class.
