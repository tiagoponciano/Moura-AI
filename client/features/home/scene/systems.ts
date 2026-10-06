import * as THREE from "three";
import {
  CORE,
  EXIT_X,
  FLOOR_HEIGHT,
  FLOORS,
  HALF_Z,
  INLET,
  RISER,
  ROOF,
  SLAB,
} from "./dimensions";
import { box, cylinder, segments } from "./helpers";
import type { SystemMaterials } from "./materials";

const PEOPLE_PER_ROUTE = 6;

/** Hydrants, extinguishers and escape routes. */
export function buildSystems(
  scene: THREE.Scene,
  materials: SystemMaterials,
  dot: THREE.Texture,
) {
  // Hydrants: riser through the core, a cabinet per floor and the inlet.
  cylinder(
    0.09,
    ROOF + 0.2,
    materials.mesh("hydrant", 0.9),
    [RISER.x, ROOF / 2, RISER.z],
    {
      parent: scene,
      cast: false,
    },
  ).renderOrder = 2;
  for (let i = 0; i < FLOORS; i++) {
    const position = new THREE.Vector3(
      RISER.x - 0.55,
      i * FLOOR_HEIGHT + SLAB + 1.25,
      RISER.z,
    );
    box(
      [0.95, 1.25, 0.35],
      materials.mesh("hydrant", 0.85),
      position.toArray(),
      {
        parent: scene,
        edges: materials.line("hydrant"),
        cast: false,
      },
    ).renderOrder = 2;
  }
  scene.add(
    new THREE.LineSegments(
      segments([
        [RISER.x, 0.05, RISER.z, RISER.x, 0.05, INLET.z],
        [RISER.x, 0.05, INLET.z, RISER.x, 0.2, INLET.z],
      ]),
      materials.line("hydrant", 0.7),
    ),
  );
  cylinder(0.26, 0.55, materials.mesh("hydrant"), INLET.toArray(), {
    parent: scene,
  }).renderOrder = 2;

  // Extinguishers: three per floor.
  for (let i = 0; i < FLOORS; i++) {
    for (const [x, z] of [
      [-10.6, -5.8],
      [-1.5, 5.8],
      [2.5, -5.8],
    ]) {
      const position = new THREE.Vector3(x, i * FLOOR_HEIGHT + SLAB + 0.45, z);
      cylinder(
        0.18,
        0.62,
        materials.mesh("extinguisher", 0.95),
        position.toArray(),
        {
          parent: scene,
          cast: false,
        },
      ).renderOrder = 2;
    }
  }

  // Escape routes: corridor → stair core → down to the ground floor → exit → sidewalk.
  const flows: {
    points: THREE.Vector3[];
    lengths: number[];
    geometry: THREE.BufferGeometry;
  }[] = [];
  for (let i = 0; i < FLOORS; i++) {
    const y = i * FLOOR_HEIGHT + SLAB + 0.15;
    const raw: number[][] = [
      [-11, y, 0],
      [CORE.x0, y, 0],
      [EXIT_X, y, 0],
    ];
    for (let k = i - 1; k >= 0; k--) {
      raw.push(
        [EXIT_X, k * FLOOR_HEIGHT + SLAB + 0.15 + FLOOR_HEIGHT * 0.5, 0],
        [EXIT_X, k * FLOOR_HEIGHT + SLAB + 0.15, 0],
      );
    }
    raw.push([EXIT_X, SLAB + 0.15, HALF_Z], [EXIT_X, 0.25, HALF_Z + 4]);
    const points = raw.map(([x, py, z]) => new THREE.Vector3(x, py, z));
    scene.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points.slice(0, 3)),
        materials.line("route", 0.4),
      ),
    );

    const lengths = [0];
    for (let p = 1; p < points.length; p++)
      lengths.push(lengths[p - 1] + points[p].distanceTo(points[p - 1]));
    const geometry = new THREE.BufferGeometry().setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        new Float32Array(PEOPLE_PER_ROUTE * 3),
        3,
      ),
    );
    const people = new THREE.Points(geometry, materials.points("route", dot));
    people.frustumCulled = false;
    people.renderOrder = 3;
    scene.add(people);
    flows.push({ points, lengths, geometry });
  }
  scene.add(
    new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(EXIT_X, SLAB + 0.15, 0),
        new THREE.Vector3(EXIT_X, SLAB + 0.15, HALF_Z),
        new THREE.Vector3(EXIT_X, 0.25, HALF_Z + 4),
      ]),
      materials.line("route", 0.6),
    ),
  );

  const cursor = new THREE.Vector3();
  /** Moves the dots that represent people walking to the exit. */
  function updateFlows(seconds: number) {
    flows.forEach((flow, r) => {
      const total = flow.lengths.at(-1)!;
      const position = flow.geometry.attributes
        .position as THREE.BufferAttribute;
      for (let i = 0; i < PEOPLE_PER_ROUTE; i++) {
        const s =
          (seconds * 2.2 + (i * total) / PEOPLE_PER_ROUTE + r * 1.9) % total;
        let p = 1;
        while (p < flow.points.length - 1 && s > flow.lengths[p]) p++;
        const span = flow.lengths[p] - flow.lengths[p - 1];
        cursor
          .copy(flow.points[p - 1])
          .lerp(
            flow.points[p],
            span > 0 ? (s - flow.lengths[p - 1]) / span : 0,
          );
        position.setXYZ(i, cursor.x, cursor.y, cursor.z);
      }
      position.needsUpdate = true;
    });
  }

  return { updateFlows };
}
