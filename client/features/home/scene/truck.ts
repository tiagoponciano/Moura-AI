import * as THREE from "three";
import { box, cylinder, segments } from "./helpers";
import type { SceneMaterials } from "./materials";

/** Turntable position on the truck, in truck space (the cab faces +x). */
export const TURNTABLE = { x: -3.5, y: 3.1 } as const;
/** Length of each ladder section. */
export const LADDER_SECTION = 6.6;
/** Distance between ladder rungs. */
export const RUNG_SPACING = 0.42;

function ladderSection(
  length: number,
  width: number,
  y: number,
  m: SceneMaterials,
) {
  const group = new THREE.Group();
  for (const z of [-width / 2, width / 2]) {
    box([length, 0.14, 0.09], m.metal, [length / 2, y, z], { parent: group });
  }
  const rungs: number[][] = [];
  for (let x = 0.3; x < length; x += RUNG_SPACING)
    rungs.push([x, y, -width / 2, x, y, width / 2]);
  group.add(new THREE.LineSegments(segments(rungs), m.edge));
  return group;
}

/**
 * Aerial ladder truck (auto escada mecânica). The ladder is three nested
 * groups so it can turn (`yaw`, around y), rise (`pitch`, around z) and
 * extend (`fly`, along x) independently.
 */
export function buildTruck(m: SceneMaterials) {
  const truck = new THREE.Group();
  box([9.2, 0.45, 2.3], m.truckDark, [0, 0.95, 0], { parent: truck });
  box([6.3, 1.75, 2.5], m.truck, [-1.35, 2.05, 0], {
    parent: truck,
    edges: m.edge,
  });
  box([2.6, 2.05, 2.5], m.truck, [3.2, 2.2, 0], {
    parent: truck,
    edges: m.edge,
  });
  box([0.06, 0.85, 2.2], m.windshield, [4.52, 2.7, 0], { parent: truck });
  for (const z of [-1.26, 1.26]) {
    box([1.1, 0.7, 0.04], m.windshield, [3.5, 2.75, z], { parent: truck });
    box([6.32, 0.14, 0.04], m.reflective, [-1.35, 1.55, z], { parent: truck });
    for (let k = 0; k < 3; k++) {
      box([1.8, 1.2, 0.03], m.truck, [-3.6 + k * 2.05, 2.15, z * 1.004], {
        parent: truck,
        edges: m.edge,
      });
    }
  }
  box([0.3, 0.25, 2.4], m.metal, [4.6, 1.15, 0], { parent: truck });
  box([0.32, 0.2, 0.75], m.sirenRed, [3.1, 3.33, -0.45], {
    parent: truck,
    cast: false,
  });
  box([0.32, 0.2, 0.75], m.sirenWhite, [3.1, 3.33, 0.45], {
    parent: truck,
    cast: false,
  });
  const beacon = new THREE.PointLight(0xff2a1a, 0, 16, 1.5);
  beacon.position.set(3.1, 3.8, 0);
  truck.add(beacon);

  const wheels: THREE.Group[] = [];
  for (const x of [-3.3, -2.1, 3.0]) {
    for (const z of [-1.2, 1.2]) {
      const wheel = new THREE.Group();
      wheel.position.set(x, 0.58, z);
      truck.add(wheel);
      cylinder(0.58, 0.42, m.tire, [0, 0, 0], {
        parent: wheel,
        segments: 20,
      }).rotation.x = Math.PI / 2;
      cylinder(0.27, 0.44, m.metal, [0, 0, 0], {
        parent: wheel,
        segments: 10,
      }).rotation.x = Math.PI / 2;
      wheels.push(wheel);
    }
  }

  cylinder(0.85, 0.3, m.truckDark, [TURNTABLE.x, TURNTABLE.y - 0.15, 0], {
    parent: truck,
    segments: 24,
  });
  const yaw = new THREE.Group();
  yaw.position.set(TURNTABLE.x, TURNTABLE.y, 0);
  truck.add(yaw);
  box([1.2, 0.6, 1.1], m.truck, [0, 0.3, 0], { parent: yaw, edges: m.edge });
  const pitch = new THREE.Group();
  pitch.position.set(0, 0.55, 0);
  yaw.add(pitch);
  pitch.add(ladderSection(LADDER_SECTION, 0.9, 0, m));
  const fly = ladderSection(LADDER_SECTION, 0.7, 0.14, m);
  pitch.add(fly);
  box([0.35, 0.25, 0.25], m.truckDark, [LADDER_SECTION - 0.1, 0.2, 0], {
    parent: fly,
  });

  return { truck, wheels, beacon, yaw, pitch, fly };
}
