import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { isClick, type PointerPoint } from "../lib/pointer-gesture";
import {
  STATIC_RESCUE_TIME,
  cycleTime,
  rescueState,
} from "../lib/rescue-timeline";
import {
  FIRE_X,
  HALF_Z,
  INLET,
  ROOM,
  STREET,
  TRUCK_Z,
  WINDOW,
} from "./dimensions";
import { buildBuilding, buildSite } from "./environment";
import { createFirefighter, poseFirefighter } from "./firefighter";
import { disposeTree, softDotTexture } from "./helpers";
import {
  SystemMaterials,
  applyPalette,
  createMaterials,
  type SceneSystem,
} from "./materials";
import { readScenePalette, type ScenePalette } from "./palette";
import { addHit, buildSystems, type HitTarget } from "./systems";
import { LADDER_SECTION, TURNTABLE, buildTruck } from "./truck";

/** What the page asks the scene to emphasize. */
export type SceneHighlight = "xray" | "systems" | "wireframe" | null;
export type SceneFocus = {
  highlight: SceneHighlight;
  system: SceneSystem | null;
};

export type RescueSceneOptions = {
  container: HTMLElement;
  tooltip: { root: HTMLElement; title: HTMLElement; detail: HTMLElement };
  reducedMotion: boolean;
  onHoverSystem: (system: SceneSystem | null) => void;
  onSelectSystem: () => void;
  onContextLost: () => void;
};

export type RescueScene = {
  setFocus: (focus: SceneFocus) => void;
  refreshTheme: () => void;
  dispose: () => void;
};

/** Camera offset from the target at the reference aspect ratio. */
const CAMERA_OFFSET = new THREE.Vector3(41, 22.6, 77);
const TARGET = new THREE.Vector3(-1, 7.4, 5);
/** The user can rotate only around the street side, so the rescue never ends up behind the building. */
const AZIMUTH = { min: -0.2, max: 1.25, swayCenter: 0.42, swayRange: 0.3 };
const IDLE_BEFORE_SWAY_MS = 4000;
const SMOKE_PUFFS = 34;
const SMOKE_LIFE = 5.5;
const WATER_DROPS = 90;
const STOP_X = FIRE_X - TURNTABLE.x;

export function createRescueScene(options: RescueSceneOptions): RescueScene {
  const { container, tooltip, reducedMotion } = options;
  const root = document.documentElement;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.style.display = "block";
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xffffff, 95, 175);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 500);
  camera.position.copy(TARGET).add(CAMERA_OFFSET);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(TARGET);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.minPolarAngle = Math.PI * 0.32;
  controls.maxPolarAngle = Math.PI * 0.45;
  controls.minAzimuthAngle = AZIMUTH.min;
  controls.maxAzimuthAngle = AZIMUTH.max;
  // On touch screens the page must keep scrolling, so the scene is not draggable there.
  if (window.matchMedia("(pointer: coarse)").matches) {
    controls.enabled = false;
    renderer.domElement.style.touchAction = "pan-y";
  }
  let lastInteraction = -Infinity;
  let dragging = false;
  controls.addEventListener("start", () => (dragging = true));
  controls.addEventListener("end", () => {
    dragging = false;
    lastInteraction = performance.now();
  });

  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8a8a, 1.5));
  const sun = new THREE.DirectionalLight(0xffffff, 2.1);
  sun.position.set(-24, 46, 34);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {
    left: -40,
    right: 40,
    top: 40,
    bottom: -40,
    near: 1,
    far: 140,
  });
  sun.shadow.bias = -0.0004;
  scene.add(sun);

  const materials = createMaterials();
  const systemMaterials = new SystemMaterials();
  const dot = softDotTexture();

  buildSite(scene, materials);
  const { tank } = buildBuilding(scene, materials);
  const systems = buildSystems(scene, systemMaterials, dot, tank);

  // Fire: light, glow behind the glass and smoke out of the window.
  const fireLight = new THREE.PointLight(0xff7a1a, 0, 14, 1.6);
  fireLight.position.copy(ROOM);
  scene.add(fireLight);
  const glowMaterial = new THREE.SpriteMaterial({
    map: dot,
    color: 0xff8a2a,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const glow = new THREE.Sprite(glowMaterial);
  glow.position.set(FIRE_X, ROOM.y, HALF_Z - 0.8);
  glow.scale.set(5.5, 3.2, 1);
  scene.add(glow);
  const smokeMaterial = new THREE.SpriteMaterial({
    map: dot,
    transparent: true,
    depthWrite: false,
  });
  const smoke = Array.from({ length: SMOKE_PUFFS }, () => {
    const puff = new THREE.Sprite(smokeMaterial.clone());
    scene.add(puff);
    return puff;
  });

  // Truck and crew.
  const truck = buildTruck(materials);
  truck.truck.position.set(-90, 0, TRUCK_Z);
  scene.add(truck.truck);
  addHit(
    systems.hits,
    systems.hitMaterial,
    truck.truck,
    new THREE.Vector3(0, 2, 0),
    [9.5, 4, 2.8],
    {
      system: null,
      label: "Auto Escada Mecânica",
      detail: "Viatura do CBMSC",
    },
  );
  const ladderBase = new THREE.Vector3(FIRE_X, TURNTABLE.y + 0.55, TRUCK_Z);
  const ladderPitch = Math.atan2(
    WINDOW.y - ladderBase.y,
    ladderBase.z - WINDOW.z,
  );
  const ladderReach =
    Math.hypot(WINDOW.y - ladderBase.y, ladderBase.z - WINDOW.z) -
    LADDER_SECTION +
    0.1;
  const climbers = [createFirefighter(materials), createFirefighter(materials)];
  const hoseman = createFirefighter(materials);
  scene.add(...climbers, hoseman);
  const inside = new THREE.Vector3(WINDOW.x, WINDOW.y - 0.9, HALF_Z - 0.6);

  // Hose from the pump panel to the inlet; the hoseman walks along it.
  const hosePath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(FIRE_X + 4.2, 0.9, TRUCK_Z - 1.3),
    new THREE.Vector3(FIRE_X + 4.4, 0.12, TRUCK_Z - 2.4),
    new THREE.Vector3(FIRE_X + 6.5, 0.12, STREET.z0 + 0.6),
    new THREE.Vector3(INLET.x - 1.4, 0.2, INLET.z + 1.4),
    INLET.clone().setY(0.3),
  ]);
  const hoseMaterial = new THREE.MeshStandardMaterial({ roughness: 0.6 });
  const hose = new THREE.Mesh(
    new THREE.TubeGeometry(hosePath, 80, 0.08, 6),
    hoseMaterial,
  );
  hose.castShadow = true;
  scene.add(hose);
  const hoseIndexCount = hose.geometry.index!.count;
  const walkPath = new THREE.CatmullRomCurve3(
    hosePath.points.slice(1).map((p) => p.clone().setY(0.16)),
  );

  // Water jet from the ladder tip into the room.
  const waterGeometry = new THREE.BufferGeometry().setAttribute(
    "position",
    new THREE.Float32BufferAttribute(new Float32Array(WATER_DROPS * 3), 3),
  );
  const waterMaterial = new THREE.PointsMaterial({
    size: 0.45,
    map: dot,
    transparent: true,
    depthWrite: false,
    opacity: 0,
  });
  const water = new THREE.Points(waterGeometry, waterMaterial);
  water.frustumCulled = false;
  scene.add(water);
  const jitter = Array.from({ length: WATER_DROPS }, () => [
    Math.random() - 0.5,
    Math.random() - 0.5,
    Math.random() - 0.5,
  ]);

  // Theme.
  let palette: ScenePalette = readScenePalette(root);
  function refreshTheme() {
    palette = readScenePalette(root);
    applyPalette(materials, systemMaterials, palette);
    hoseMaterial.color.copy(palette.reflective);
    for (const puff of smoke) puff.material.color.copy(palette.smoke);
    waterMaterial.color.copy(palette.water);
    (scene.fog as THREE.Fog).color.copy(palette.background);
  }
  refreshTheme();

  // Size: keep the whole scene in frame on narrow screens by pulling the camera back.
  function resize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const scale = camera.aspect < 1.5 ? Math.pow(1.5 / camera.aspect, 0.7) : 1;
    const direction = camera.position.clone().sub(controls.target).normalize();
    camera.position
      .copy(controls.target)
      .addScaledVector(direction, CAMERA_OFFSET.length() * scale);
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  // Hover, tooltip and click (a release after a drag is not a click).
  let focus: SceneFocus = { highlight: null, system: null };
  let hovered: HitTarget | null = null;
  let pressedAt: PointerPoint | null = null;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  function hideTooltip() {
    tooltip.root.style.opacity = "0";
  }
  function setHovered(next: HitTarget | null) {
    if (next?.system !== hovered?.system)
      options.onHoverSystem(next?.system ?? null);
    hovered = next;
    renderer.domElement.style.cursor = next?.system ? "pointer" : "";
  }
  function onPointerMove(event: PointerEvent) {
    if (dragging) {
      hideTooltip();
      return;
    }
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    const target =
      (raycaster.intersectObjects(systems.hits, false)[0]?.object.userData as
        HitTarget | undefined) ?? null;
    setHovered(target);
    if (!target) return hideTooltip();
    tooltip.title.textContent = target.label;
    tooltip.detail.textContent = target.detail;
    tooltip.root.style.left = `${event.clientX - rect.left}px`;
    tooltip.root.style.top = `${event.clientY - rect.top}px`;
    tooltip.root.style.opacity = "1";
  }
  function onPointerDown(event: PointerEvent) {
    pressedAt = { x: event.clientX, y: event.clientY };
  }
  function onPointerUp(event: PointerEvent) {
    const click = isClick(pressedAt, { x: event.clientX, y: event.clientY });
    pressedAt = null;
    if (click && hovered?.system) options.onSelectSystem();
  }
  function onPointerLeave() {
    hideTooltip();
    setHovered(null);
  }
  const canvas = renderer.domElement;
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointerleave", onPointerLeave);

  // Animation.
  const state = {
    xray: 0,
    wire: 0,
    system: { hydrant: 0, extinguisher: 0, route: 0 } as Record<
      SceneSystem,
      number
    >,
  };
  const start = performance.now();
  const tip = new THREE.Vector3();
  const base = new THREE.Vector3();
  const scratch = new THREE.Vector3();
  const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

  function frame() {
    const seconds = (performance.now() - start) / 1000;
    const t = reducedMotion ? STATIC_RESCUE_TIME : cycleTime(seconds);
    const story = rescueState(t);

    if (
      !reducedMotion &&
      !dragging &&
      performance.now() - lastInteraction > IDLE_BEFORE_SWAY_MS
    ) {
      const wanted =
        AZIMUTH.swayCenter + Math.sin(seconds * 0.09) * AZIMUTH.swayRange;
      const delta = (wanted - controls.getAzimuthalAngle()) * 0.02;
      scratch
        .copy(camera.position)
        .sub(controls.target)
        .applyAxisAngle(THREE.Object3D.DEFAULT_UP, delta);
      camera.position.copy(controls.target).add(scratch);
    }
    controls.update();

    // Fire and smoke.
    const flicker =
      0.82 + 0.18 * Math.sin(seconds * 23) * Math.sin(seconds * 7.3);
    fireLight.intensity = story.fire * 60 * flicker;
    glowMaterial.opacity = story.fire * 0.9 * flicker;
    smoke.forEach((puff, i) => {
      const age = (seconds + (i * SMOKE_LIFE) / SMOKE_PUFFS) % SMOKE_LIFE;
      const k = age / SMOKE_LIFE;
      puff.position.set(
        FIRE_X + Math.sin(i * 1.7 + seconds * 0.4) * 0.5 + k * 2.2,
        ROOM.y + 1 + k * 7,
        HALF_Z + 0.6 + k * 1.5,
      );
      const size = 1 + k * 3.2;
      puff.scale.set(size, size, 1);
      puff.material.opacity = story.smoke * (1 - k) * Math.min(1, k * 6) * 0.55;
    });

    // Truck.
    const x = lerp(-90, STOP_X, story.truckArrive) + story.truckLeave * 100;
    const travelled = x - truck.truck.position.x;
    truck.truck.position.x = x;
    for (const wheel of truck.wheels)
      wheel.rotation.z = (wheel.rotation.z - travelled / 0.58) % (Math.PI * 2);
    const flash = Math.sin(seconds * 14) > 0;
    materials.sirenRed.color.set(story.siren && flash ? 0xff2a1a : 0x5a1a14);
    materials.sirenWhite.color.set(story.siren && !flash ? 0xffffff : 0x777777);
    truck.beacon.intensity = story.siren ? (flash ? 40 : 6) : 0;

    // Ladder.
    truck.yaw.rotation.y = (story.ladderYaw * Math.PI) / 2;
    truck.pitch.rotation.z = story.ladderPitch * ladderPitch;
    truck.fly.position.x = story.ladderExtension * ladderReach;
    truck.truck.updateMatrixWorld(true);
    truck.pitch.getWorldPosition(base);
    truck.fly.localToWorld(tip.set(LADDER_SECTION - 0.2, 0.3, 0));

    // Crew.
    climbers.forEach((climber, k) => {
      const c = story.climbers[k];
      climber.visible = c.visible;
      if (!c.visible) return;
      climber.position.copy(base).lerp(tip, c.climb).lerp(inside, c.enter);
      climber.position.y += 0.1;
      climber.rotation.y = Math.PI;
      poseFirefighter(climber, c.enter > 0 ? "walk" : "climb", seconds + k);
    });
    hose.visible = story.hose > 0.01;
    hose.geometry.setDrawRange(
      0,
      Math.floor((hoseIndexCount * story.hose) / 3) * 3,
    );
    hoseman.visible = story.hoseman.visible;
    if (hoseman.visible) {
      const u = Math.min(0.999, story.hose);
      walkPath.getPointAt(u, hoseman.position);
      walkPath.getTangentAt(u, scratch);
      hoseman.rotation.y =
        Math.atan2(scratch.x, scratch.z) +
        (story.hoseman.returning ? Math.PI : 0);
      poseFirefighter(hoseman, story.hoseman.moving ? "walk" : "idle", seconds);
    }

    // Water.
    waterMaterial.opacity = story.jet * 0.9;
    if (story.jet > 0) {
      const position = waterGeometry.attributes
        .position as THREE.BufferAttribute;
      for (let i = 0; i < WATER_DROPS; i++) {
        const u = (seconds * 1.3 + i / WATER_DROPS) % 1;
        const [jx, jy, jz] = jitter[i];
        scratch.copy(tip).lerp(ROOM, u);
        position.setXYZ(
          i,
          scratch.x + jx * u * 0.9,
          scratch.y + Math.sin(Math.PI * u) * 1.1 + jy * u * 0.5,
          scratch.z + jz * u * 0.9,
        );
      }
      position.needsUpdate = true;
    }

    // Focus from the cards and the legend.
    state.xray = lerp(
      state.xray,
      focus.highlight === "xray" || focus.highlight === "systems" ? 1 : 0,
      0.08,
    );
    state.wire = lerp(
      state.wire,
      focus.highlight === "wireframe" ? 1 : 0,
      0.08,
    );
    const solidOpacity = 1 - state.xray * 0.55 - state.wire * 0.9;
    materials.concrete.opacity = solidOpacity;
    materials.core.opacity = solidOpacity;
    materials.glass.opacity =
      (materials.glass.userData.base as number) * (1 - state.wire);
    materials.edge.color.copy(palette.edge).lerp(palette.primary, state.wire);
    materials.edge.opacity = lerp(
      materials.edge.userData.base as number,
      0.9,
      state.wire,
    );
    const active = focus.system ?? hovered?.system ?? null;
    for (const [system, list] of Object.entries(systemMaterials.bySystem) as [
      SceneSystem,
      THREE.Material[],
    ][]) {
      const wanted = active
        ? active === system
          ? 1
          : -1
        : focus.highlight === "systems"
          ? 1
          : 0;
      const f = (state.system[system] = lerp(
        state.system[system],
        wanted,
        0.1,
      ));
      const k = f >= 0 ? 1 + f * 0.3 : 1 + f * 0.8;
      for (const material of list)
        material.opacity = Math.min(1, (material.userData.base as number) * k);
    }

    systems.updateFlows(seconds);
    renderer.render(scene, camera);
  }

  // Run only while visible: tab in front and scene on screen.
  let onScreen = true;
  let running = false;
  function syncLoop() {
    const shouldRun = onScreen && !document.hidden;
    if (shouldRun === running) return;
    running = shouldRun;
    renderer.setAnimationLoop(shouldRun ? frame : null);
  }
  const intersection = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    syncLoop();
  });
  intersection.observe(container);
  document.addEventListener("visibilitychange", syncLoop);
  syncLoop();

  function onContextLost(event: Event) {
    event.preventDefault();
    renderer.setAnimationLoop(null);
    running = false;
    options.onContextLost();
  }
  canvas.addEventListener("webglcontextlost", onContextLost);

  return {
    setFocus(next) {
      focus = next;
    },
    refreshTheme,
    dispose() {
      canvas.removeEventListener("webglcontextlost", onContextLost);
      renderer.setAnimationLoop(null);
      intersection.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", syncLoop);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      controls.dispose();
      disposeTree(scene);
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
