import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  STATIC_RESCUE_TIME,
  cycleTime,
  rescueState,
  rungStep,
} from "../lib/rescue-timeline";
import {
  FIRE_FLOOR_Y,
  FIRE_X,
  HALF_Z,
  INLET,
  ROOM,
  STREET,
  TRUCK_Z,
  WINDOW,
} from "./dimensions";
import { buildBuilding, buildSite } from "./environment";
import { STRIDE, createFirefighter, poseFirefighter } from "./firefighter";
import { cylinder, disposeTree, softDotTexture } from "./helpers";
import {
  SystemMaterials,
  applyPalette,
  createMaterials,
  type SceneSystem,
} from "./materials";
import { readScenePalette, type ScenePalette } from "./palette";
import { buildSystems } from "./systems";
import { LADDER_SECTION, RUNG_SPACING, TURNTABLE, buildTruck } from "./truck";

/** What the page asks the scene to emphasize. */
export type SceneHighlight = "systems" | null;
export type SceneFocus = {
  highlight: SceneHighlight;
};

export type RescueSceneOptions = {
  container: HTMLElement;
  reducedMotion: boolean;
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
/** How far climbers lean into the ladder, in radians. */
const CLIMB_LEAN = 0.35;
/** Where each climber stands inside to fight the fire, at the edge of the burning room. */
const ATTACK = [
  new THREE.Vector3(-2.6, FIRE_FLOOR_Y, HALF_Z - 1.5),
  new THREE.Vector3(-1.4, FIRE_FLOOR_Y, HALF_Z - 2.4),
];

/** Interpolates two headings the short way round. */
function lerpAngle(a: number, b: number, k: number) {
  const delta = Math.atan2(Math.sin(b - a), Math.cos(b - a));
  return a + delta * k;
}

export function createRescueScene(options: RescueSceneOptions): RescueScene {
  const { container, reducedMotion } = options;
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
  buildBuilding(scene, materials);
  const systems = buildSystems(scene, systemMaterials, dot);

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
  // The ladder turns toward the entry window, which is off to the side of the
  // turntable, so it is aimed by heading, rise and length.
  const ladderBase = new THREE.Vector3(FIRE_X, TURNTABLE.y + 0.55, TRUCK_Z);
  const ladderRun = Math.hypot(
    WINDOW.x - ladderBase.x,
    ladderBase.z - WINDOW.z,
  );
  const ladderYaw = Math.atan2(
    ladderBase.z - WINDOW.z,
    WINDOW.x - ladderBase.x,
  );
  const ladderPitch = Math.atan2(WINDOW.y - ladderBase.y, ladderRun);
  const ladderReach =
    Math.hypot(WINDOW.y - ladderBase.y, ladderRun) - LADDER_SECTION + 0.1;
  /** Heading of a climber facing the ladder (and the building). */
  const facingLadder = Math.atan2(
    WINDOW.x - ladderBase.x,
    WINDOW.z - ladderBase.z,
  );
  const climbers = [createFirefighter(materials), createFirefighter(materials)];
  const hoseman = createFirefighter(materials);
  scene.add(...climbers, hoseman);
  const inside = new THREE.Vector3(WINDOW.x, FIRE_FLOOR_Y, HALF_Z - 0.6);
  const doorway = inside.distanceTo(WINDOW);
  const approach = ATTACK.map((point) => inside.distanceTo(point));
  const facingFire = ATTACK.map((point) =>
    Math.atan2(ROOM.x - point.x, ROOM.z - point.z),
  );
  const nozzle = new THREE.Vector3();

  // Hose from the pump panel to the inlet; the hoseman walks along it carrying
  // a rolled hose. The laid hose shows only once connected, with a metal
  // coupling at each end, so it never trails behind the hoseman.
  const hosePath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(FIRE_X + 4.2, 0.9, TRUCK_Z - 1.3),
    new THREE.Vector3(FIRE_X + 4.4, 0.12, TRUCK_Z - 2.4),
    new THREE.Vector3(FIRE_X + 6.5, 0.12, STREET.z0 + 0.6),
    new THREE.Vector3(INLET.x - 1.4, 0.2, INLET.z + 1.4),
    INLET.clone().setY(0.3),
  ]);
  const hoseMaterial = new THREE.MeshStandardMaterial({
    roughness: 0.75,
    transparent: true,
  });
  const hose = new THREE.Mesh(
    new THREE.TubeGeometry(hosePath, 120, 0.12, 10),
    hoseMaterial,
  );
  hose.castShadow = true;
  scene.add(hose);
  for (const u of [0, 1]) {
    const coupling = cylinder(0.17, 0.32, materials.metal, [0, 0, 0], {
      parent: hose,
      segments: 12,
    });
    hosePath.getPointAt(u, coupling.position);
    coupling.quaternion.setFromUnitVectors(
      THREE.Object3D.DEFAULT_UP,
      hosePath.getTangentAt(u),
    );
  }
  const rollMaterial = new THREE.MeshStandardMaterial({ roughness: 0.75 });
  const roll = cylinder(0.3, 0.16, rollMaterial, [0, 1.02, 0.36], {
    parent: hoseman,
    segments: 16,
  });
  roll.rotation.z = Math.PI / 2;
  const walkPath = new THREE.CatmullRomCurve3(
    hosePath.points.slice(1).map((p) => p.clone().setY(0.16)),
  );
  const walkLength = walkPath.getLength();

  // Water jet from the first climber's nozzle into the burning room.
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
  // Drawn after the additive fire glow, which would otherwise wash the drops out.
  water.renderOrder = 4;
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
    hoseMaterial.color.copy(palette.hose);
    rollMaterial.color.copy(palette.hose);
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

  let focus: SceneFocus = { highlight: null };
  const canvas = renderer.domElement;

  // Animation.
  const state = {
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
    truck.yaw.rotation.y = story.ladderYaw * ladderYaw;
    truck.pitch.rotation.z = story.ladderPitch * ladderPitch;
    truck.fly.position.x = story.ladderExtension * ladderReach;
    truck.truck.updateMatrixWorld(true);
    truck.pitch.getWorldPosition(base);
    truck.fly.localToWorld(tip.set(LADDER_SECTION - 0.2, 0.3, 0));

    // Crew: climbers face the ladder on the way up and down, rung by rung,
    // step in through the entry window, then advance holding the line and
    // turn to face the fire.
    const rungs = Math.max(1, Math.round(base.distanceTo(tip) / RUNG_SPACING));
    climbers.forEach((climber, k) => {
      const c = story.climbers[k];
      climber.visible = c.visible;
      if (!c.visible) return;
      const step = rungStep(c.climb, rungs);
      climber.position
        .copy(base)
        .lerp(tip, step.travel)
        .lerp(inside, c.enter)
        .lerp(ATTACK[k], c.advance);
      climber.rotation.set(
        CLIMB_LEAN * (1 - c.enter),
        lerpAngle(facingLadder, facingFire[k], Math.min(1, c.advance * 3)),
        0,
        "YXZ",
      );
      let lift: number;
      if (c.advance > 0)
        lift = poseFirefighter(
          climber,
          "carry",
          c.advance < 1 ? ((c.advance * approach[k]) / STRIDE) * Math.PI : 0,
        );
      else if (c.enter > 0)
        lift = poseFirefighter(
          climber,
          "walk",
          ((c.enter * doorway) / STRIDE) * Math.PI,
        );
      else lift = poseFirefighter(climber, "climb", step.phase);
      climber.position.y += 0.1 + lift;
    });
    hose.visible = story.hose > 0;
    hoseMaterial.opacity = story.hose;
    hoseman.visible = story.hoseman.visible;
    if (hoseman.visible) {
      const u = Math.min(0.999, story.hoseman.walk);
      walkPath.getPointAt(u, hoseman.position);
      walkPath.getTangentAt(u, scratch);
      hoseman.rotation.y =
        Math.atan2(scratch.x, scratch.z) +
        (story.hoseman.returning ? Math.PI : 0);
      const carrying = story.hoseman.moving && !story.hoseman.returning;
      roll.visible = carrying;
      hoseman.position.y += story.hoseman.moving
        ? poseFirefighter(
            hoseman,
            carrying ? "carry" : "walk",
            ((story.hoseman.walk * walkLength) / STRIDE) * Math.PI,
          )
        : poseFirefighter(hoseman, "idle", seconds * 2);
    }

    // Water.
    waterMaterial.opacity = story.jet * 0.9;
    if (story.jet > 0) {
      const leader = climbers[0];
      nozzle
        .set(Math.sin(leader.rotation.y), 0, Math.cos(leader.rotation.y))
        .multiplyScalar(0.6)
        .add(leader.position);
      nozzle.y += 1.3;
      const position = waterGeometry.attributes
        .position as THREE.BufferAttribute;
      for (let i = 0; i < WATER_DROPS; i++) {
        const u = (seconds * 1.3 + i / WATER_DROPS) % 1;
        const [jx, jy, jz] = jitter[i];
        scratch.copy(nozzle).lerp(ROOM, u);
        position.setXYZ(
          i,
          scratch.x + jx * u * 0.9,
          scratch.y + Math.sin(Math.PI * u) * 0.4 + jy * u * 0.5,
          scratch.z + jz * u * 0.9,
        );
      }
      position.needsUpdate = true;
    }

    // Focus from the module cards.
    for (const [system, list] of Object.entries(systemMaterials.bySystem) as [
      SceneSystem,
      THREE.Material[],
    ][]) {
      const wanted = focus.highlight === "systems" ? 1 : 0;
      const f = (state.system[system] = lerp(
        state.system[system],
        wanted,
        0.1,
      ));
      const k = 1 + f * 0.3;
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
      controls.dispose();
      disposeTree(scene);
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
