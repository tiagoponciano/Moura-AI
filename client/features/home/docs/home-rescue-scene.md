# Home rescue scene

How the home page (`/`) works now: the three.js scene of a building fire and an aerial ladder rescue behind the product name and the module cards. For developers changing the home page or the scene.

## What this is

`app/page.tsx` renders `HomeShowcase` (from `@/features/home`): the title "Moura Engenharia", a legend of fire protection systems, one card per module, and `BuildingScene`, which loads the three.js scene on demand and draws it behind everything else. The scene is decoration with light interaction; every navigation also works without it.

Invariants:

- The scene never blocks the page. If WebGL or the scene chunk fails, `BuildingScene` renders nothing and logs `Home scene unavailable`; title, legend and cards still work.
- Everything that moves in the story is a pure function of cycle time (`rescueState` in `lib/rescue-timeline.ts`). Nothing accumulates between frames, so pausing, resuming, theme changes and remounts cannot drift the animation.
- Colors come only from CSS tokens (`--primary`, `--background`, `--scene-*` in `app/globals.css`); opacities live in `scene/materials.ts`. The truck uses `--scene-truck` (fire-engine red), not `--primary`.

## Surface

### Feature layout (`client/features/home/`)

| File                                | Role                                                                                                    |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `index.ts`                          | Exports `HomeShowcase` only                                                                             |
| `components/home-showcase.tsx`      | Client. Layout, focus state shared by cards/legend/scene, anime.js entrance                             |
| `components/home-hero.tsx`          | Title (one `span` per word) and subtitle                                                                |
| `components/module-grid.tsx`        | `nav` with one `ModuleCard` per entry of `MODULES`                                                      |
| `components/module-card.tsx`        | `Link` + `SpotlightCard`; reports hover/focus as the module `href`                                      |
| `components/scene-legend.tsx`       | Buttons "Hidrantes", "Extintores", "Rotas de fuga"; reports hover/focus as a `SceneSystem`              |
| `components/building-scene.tsx`     | Client. Dynamic-imports the scene, owns the tooltip DOM, restarts after a lost WebGL context            |
| `scene/create-rescue-scene.ts`      | `createRescueScene(options) → { setFocus, refreshTheme, dispose }`: renderer, camera, loop, interaction |
| `scene/environment.ts`              | Site (shadows, grid, sidewalk, street, trees) and building (slabs, columns, glass, core, roof, canopy)  |
| `scene/systems.ts`                  | Hydrants, extinguishers, escape routes, hover boxes and the dots walking the routes                     |
| `scene/truck.ts`, `firefighter.ts`  | Aerial ladder truck with turn/raise/extend groups; low-poly firefighter with walk/climb/idle poses      |
| `scene/materials.ts`, `palette.ts`  | Material set, per-theme opacities; reading tokens from CSS                                              |
| `scene/dimensions.ts`, `helpers.ts` | Layout constants in meters; geometry, texture and disposal helpers                                      |
| `lib/rescue-timeline.ts`            | `RESCUE_CYCLE`, `STATIC_RESCUE_TIME`, `cycleTime`, `rescueState`, `rungStep` (tested)                   |
| `lib/pointer-gesture.ts`            | `isClick(down, up, tolerance = 6)` (tested)                                                             |

`SpotlightCard` (`components/shared/spotlight-card.tsx`) is app-wide: a `div` card with a `color-mix` of `--primary` in a radial gradient that follows the pointer through `--spot-x` / `--spot-y`, visible on hover or focus within. Adapted from reactbits.dev.

### Scene API

```ts
createRescueScene({
  container, // element the canvas is appended to; its size drives the canvas
  tooltip, // { root, title, detail } elements the scene positions and fills
  reducedMotion, // true → still frame at STATIC_RESCUE_TIME, no camera sway
  onHoverSystem, // (system | null) => void, called only when the hovered system changes
  onSelectSystem, // () => void, a click (not a drag) on a fire protection system
  onContextLost, // () => void, WebGL context lost; the caller recreates the scene
});
setFocus({
  highlight: "xray" | "systems" | "wireframe" | null,
  system: SceneSystem | null,
});
refreshTheme(); // re-read CSS tokens; called when next-themes' resolvedTheme changes
dispose(); // stop the loop, remove listeners and observers, free GPU memory, remove the canvas
```

## Rules and behavior

### The story (one cycle = 44 s)

| Seconds     | What happens                                                                                        |
| ----------- | --------------------------------------------------------------------------------------------------- |
| 1.5–4       | Fire grows in the 3rd floor room at `x = -6` (orange light + glow); smoke from 2 s                  |
| 3–9         | Truck drives in from `x = -90` and stops with the turntable in front of the window (ease-out)       |
| 2.8–41.8    | Siren lights alternate red/white and a red point light flashes                                      |
| 9.5–11      | Ladder turns 90° toward the building                                                                |
| 10–14       | The hoseman walks from the pump panel to the inlet (registro de recalque), carrying nothing         |
| 14–14.5     | The hose fades in, already connected from the pump panel to the inlet; the hoseman idles beside it  |
| 11–12.8     | Ladder rises to the angle that reaches the window                                                   |
| 12.8–14.5   | Fly section extends                                                                                 |
| 14.8 / 16.3 | First / second firefighter climbs for 4.2 s, then steps inside in 0.7 s and is hidden               |
| 18.5–24     | Water jet from the ladder tip into the room; fire fades 19–25, smoke fades 21–28                    |
| 25.5 / 27   | First / second firefighter steps back out in 0.7 s, climbs down for 4.2 s and is hidden at the base |
| 32.3–34.9   | Ladder retracts, lowers, turns back (both climbers are off it from 31.9 s)                          |
| 33–33.5     | The hose fades out                                                                                  |
| 33.6–37.4   | The hoseman walks back to the truck and is hidden at 37.5                                           |
| 37.8–41.8   | Truck drives off (ease-in)                                                                          |

### Crew motion

- **Climbing** goes rung by rung: `rungStep(progress, rungs)` keeps the body on a rung and moves to the next with a smoothstep: `travel` equals linear progress on every rung, eases between them and never moves backwards. `rungs` is the base-to-tip distance divided by `RUNG_SPACING` (0.42 m). Limbs alternate once per rung (`phase` advances π per rung). Climbers always face the building and lean 0.35 rad into the ladder; the lean fades out as they step through the window. Coming down is the same motion in reverse, still facing the ladder.
- **Walking** drives the leg swing from distance covered, not from time: the phase advances π per `STRIDE` (1.1 m), so the feet do not slide when the hoseman accelerates or slows (the walk is eased in and out). `poseFirefighter` returns a vertical lift (up to 0.06) that the scene adds, so the body rises over each step.
- **Idle** keeps the legs straight and the arms slightly forward with a small breathing motion.

Escape route dots walk every floor's route continuously, independent of the story.

### Interaction

| Input                                     | Result                                                                                                                                                                       |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Drag (mouse / pen)                        | Orbits the camera; azimuth clamped to `[-0.2, 1.25]` rad (street side only), polar to `[0.32π, 0.45π]`; no zoom, no pan                                                      |
| No drag for 4 s                           | Camera eases back into a slow sway around azimuth `0.42 ± 0.3` rad                                                                                                           |
| Touch screen (`pointer: coarse`)          | Orbiting is off and the canvas allows vertical panning, so the page scrolls                                                                                                  |
| Hover a system, the truck or the inlet    | Tooltip with label and detail; systems also set the legend button active                                                                                                     |
| Press and release within 6 px on a system | Navigates to `/classification`. A release farther away was a drag and does nothing                                                                                           |
| Hover / focus a legend button             | That system at full strength, the other two dimmed to 20%                                                                                                                    |
| Hover / focus a module card               | `/documents` → x-ray (concrete 45% opaque); `/classification` → x-ray and all systems emphasized; `/floor-plans` → wireframe (solids almost transparent, edges in `primary`) |

Legend focus wins over scene hover; with neither, a card can emphasize all systems.

### Lifecycle and robustness

1. `BuildingScene` imports `scene/create-rescue-scene` inside an effect, so three.js loads only on the home page and never during SSR.
2. The render loop runs only while the container intersects the viewport and the tab is visible (`IntersectionObserver` + `visibilitychange`); there is exactly one loop (`renderer.setAnimationLoop`).
3. A `ResizeObserver` on the container resizes the canvas (sidebar collapse included). Below an aspect ratio of 1.5 the camera moves back by `(1.5 / aspect)^0.7` to keep the building in frame.
4. On `webglcontextlost` the loop stops and `BuildingScene` disposes the scene and creates a new one; after 3 restarts it gives up and renders nothing.
5. Unmount (navigating away) calls `dispose`: geometries, materials and textures are released and the context is force-lost, so returning to `/` repeatedly keeps one canvas.

### Layout

From `md` up the scene fills the showcase (`absolute inset-0`) with the title on top and the cards at the bottom; the legend sits at the left middle from `lg`. Below `md` the scene is a 320px block between the title and the stacked cards. The showcase is at least `max(100%, 640px)` tall.

With `prefers-reduced-motion: reduce` the scene renders the still frame at 16.2 s (truck parked, ladder up, hose connected, first firefighter on it), the camera does not sway and the entrance animation is skipped (elements start visible because their `opacity-0` is `motion-safe:` only).

## What this does NOT do

- The scene is illustrative. Dimensions, quantities and the "pó ABC 4 kg" detail do not come from any CBMSC rule or from the classification module.
- Cards and the legend do not depend on the scene: they navigate and render the same with WebGL off.
- No zoom or pan, and no orbit on touch screens.
- Hovering the truck shows a tooltip but clicking it does nothing; only fire protection systems navigate.
- The hose is not laid out on screen: it appears whole once connected. Climbers appear and disappear at the turntable; they are not shown getting on or off the truck.
- Smoke, glow and water ignore walls and depth sorting is approximate for translucent parts (glass, smoke).

## Gotchas

- **A drag that ended over a hydrant opened Classificação** → `click` fires after every drag. → Navigation goes through `pointerdown`/`pointerup` and `isClick`; never listen to `click` on the canvas.
- **Unlimited orbit hid the story and fought the sway** → the truck is in front of the building. → Keep `minAzimuthAngle` / `maxAzimuthAngle`; the sway target must stay inside them.
- **Animation sped up after switching tabs** → a second `requestAnimationFrame` chain was started on `visibilitychange`. → Only `renderer.setAnimationLoop` drives frames, toggled by `syncLoop`.
- **Colors black or wrong after adding a token** → three.js cannot parse `oklch()`; `palette.ts` paints the value on a canvas and reads it back, and an unknown token reads as black. → Add the token under both `:root` and `.dark` and to `SCENE_TOKENS`.
- **The hose looked like a yellow trail following the hoseman** → it was drawn progressively along the walk path. → The hose shows only once connected (`hose` is its opacity); `hoseman.walk` drives the hoseman's position.
- **Feet slid while walking** → limb swing came from elapsed time while position followed an eased curve. → Drive the walk phase from distance covered (`STRIDE`).
- **Console warning `PCFSoftShadowMap has been removed`** → three ≥ 0.18x. → Use `PCFShadowMap`.
