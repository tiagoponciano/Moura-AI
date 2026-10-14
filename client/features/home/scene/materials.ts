import * as THREE from "three";
import { edgeFadeTexture } from "./helpers";
import type { ScenePalette } from "./palette";

export type SceneSystem = "hydrant" | "extinguisher" | "route";

/** Opacities are not colors, so they live here rather than in CSS tokens. */
const OPACITY = {
  light: { glass: 0.22, edge: 0.42, fine: 0.16, shadow: 0.16 },
  dark: { glass: 0.2, edge: 0.32, fine: 0.12, shadow: 0.35 },
};

export function createMaterials() {
  const fade = edgeFadeTexture();
  return {
    concrete: new THREE.MeshStandardMaterial({ roughness: 0.92 }),
    core: new THREE.MeshStandardMaterial({ roughness: 0.95 }),
    glass: new THREE.MeshStandardMaterial({
      roughness: 0.15,
      metalness: 0.1,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    sidewalk: new THREE.MeshStandardMaterial({
      roughness: 1,
      transparent: true,
      alphaMap: fade,
    }),
    street: new THREE.MeshStandardMaterial({
      roughness: 1,
      transparent: true,
      alphaMap: fade,
    }),
    marking: new THREE.MeshBasicMaterial({ transparent: true, alphaMap: fade }),
    trunk: new THREE.MeshStandardMaterial({ roughness: 1 }),
    foliage: new THREE.MeshStandardMaterial({
      roughness: 1,
      flatShading: true,
    }),
    truck: new THREE.MeshStandardMaterial({ roughness: 0.45, metalness: 0.15 }),
    truckDark: new THREE.MeshStandardMaterial({ roughness: 0.7 }),
    metal: new THREE.MeshStandardMaterial({ roughness: 0.3, metalness: 0.8 }),
    windshield: new THREE.MeshStandardMaterial({ roughness: 0.1 }),
    tire: new THREE.MeshStandardMaterial({ roughness: 0.9 }),
    suit: new THREE.MeshStandardMaterial({ roughness: 0.85 }),
    helmet: new THREE.MeshStandardMaterial({ roughness: 0.4 }),
    reflective: new THREE.MeshStandardMaterial({
      roughness: 0.3,
      emissiveIntensity: 0.25,
    }),
    sirenRed: new THREE.MeshBasicMaterial(),
    sirenWhite: new THREE.MeshBasicMaterial(),
    edge: new THREE.LineBasicMaterial({ transparent: true, depthWrite: false }),
    fine: new THREE.LineBasicMaterial({ transparent: true, depthWrite: false }),
    shadow: new THREE.ShadowMaterial(),
  };
}

export type SceneMaterials = ReturnType<typeof createMaterials>;

/** Materials of the fire protection systems, drawn in the brand color. */
export class SystemMaterials {
  readonly bySystem: Record<SceneSystem, THREE.Material[]> = {
    hydrant: [],
    extinguisher: [],
    route: [],
  };

  mesh(system: SceneSystem, base = 1) {
    return this.track(
      system,
      base,
      new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false }),
    );
  }

  line(system: SceneSystem, base = 1) {
    return this.track(
      system,
      base,
      new THREE.LineBasicMaterial({ transparent: true, depthWrite: false }),
    );
  }

  points(system: SceneSystem, map: THREE.Texture) {
    return this.track(
      system,
      1,
      new THREE.PointsMaterial({
        size: 0.8,
        map,
        transparent: true,
        depthWrite: false,
      }),
    );
  }

  private track<T extends THREE.Material>(
    system: SceneSystem,
    base: number,
    material: T,
  ): T {
    material.userData.base = base;
    this.bySystem[system].push(material);
    return material;
  }
}

export function applyPalette(
  materials: SceneMaterials,
  systems: SystemMaterials,
  palette: ScenePalette,
) {
  const opacity = palette.dark ? OPACITY.dark : OPACITY.light;
  const m = materials;
  m.concrete.color.copy(palette.concrete);
  m.core.color.copy(palette.core);
  m.glass.color.copy(palette.glass);
  m.glass.opacity = opacity.glass;
  m.sidewalk.color.copy(palette.sidewalk);
  m.street.color.copy(palette.street);
  m.marking.color.copy(palette.marking);
  m.trunk.color.copy(palette.trunk);
  m.foliage.color.copy(palette.foliage);
  m.truck.color.copy(palette.truck);
  m.truckDark.color.copy(palette.tire);
  m.metal.color.copy(palette.metal);
  m.windshield.color.copy(palette.edge).lerp(palette.glass, 0.25);
  m.tire.color.copy(palette.tire);
  m.suit.color.copy(palette.suit);
  m.helmet.color.copy(palette.helmet);
  m.reflective.color.copy(palette.reflective);
  m.reflective.emissive.copy(palette.reflective);
  m.edge.color.copy(palette.edge);
  m.edge.userData.base = opacity.edge;
  m.edge.opacity = opacity.edge;
  m.fine.color.copy(palette.edge);
  m.fine.opacity = opacity.fine;
  m.shadow.opacity = opacity.shadow;
  for (const list of Object.values(systems.bySystem)) {
    for (const material of list)
      (material as THREE.MeshBasicMaterial).color.copy(palette.primary);
  }
}
