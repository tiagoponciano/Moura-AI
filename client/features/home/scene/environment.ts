import * as THREE from "three";
import {
  CORE,
  FLOOR_HEIGHT,
  FLOORS,
  HALF_X,
  HALF_Z,
  ROOF,
  SLAB,
  STREET,
  EXIT_X,
} from "./dimensions";
import { box, cylinder, dashTexture, segments } from "./helpers";
import type { SceneMaterials } from "./materials";

/** Ground shadows, faint site grid, sidewalk, street with a dashed center line, and trees. */
export function buildSite(scene: THREE.Scene, m: SceneMaterials) {
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), m.shadow);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const grid: number[][] = [];
  for (let v = -40; v <= 40; v += 2) {
    grid.push([v, 0.005, -40, v, 0.005, 40], [-40, 0.005, v, 40, 0.005, v]);
  }
  scene.add(new THREE.LineSegments(segments(grid), m.fine));

  const sidewalkDepth = STREET.z0 - HALF_Z + 2.5;
  box(
    [110, 0.16, sidewalkDepth],
    m.sidewalk,
    [0, 0.08, STREET.z0 - sidewalkDepth / 2],
    {
      parent: scene,
      cast: false,
    },
  );

  const streetCenter = (STREET.z0 + STREET.z1) / 2;
  const street = new THREE.Mesh(
    new THREE.PlaneGeometry(110, STREET.z1 - STREET.z0),
    m.street,
  );
  street.rotation.x = -Math.PI / 2;
  street.position.set(0, 0.01, streetCenter);
  street.receiveShadow = true;
  scene.add(street);

  m.marking.map = dashTexture(36);
  const centerLine = new THREE.Mesh(
    new THREE.PlaneGeometry(110, 0.18),
    m.marking,
  );
  centerLine.rotation.x = -Math.PI / 2;
  centerLine.position.set(0, 0.02, streetCenter);
  scene.add(centerLine);

  const crownGeometry = new THREE.IcosahedronGeometry(1.5, 0);
  for (const x of [-19, -13.5, 15, 21]) {
    cylinder(0.16, 2.2, m.trunk, [x, 1.25, HALF_Z + 3.2], {
      parent: scene,
      segments: 6,
    });
    const crown = new THREE.Mesh(crownGeometry, m.foliage);
    crown.position.set(x, 3.4, HALF_Z + 3.2);
    crown.castShadow = true;
    scene.add(crown);
  }
}

/** Concrete frame, glass curtain, stair core, roof equipment and entrance canopy. */
export function buildBuilding(scene: THREE.Scene, m: SceneMaterials) {
  for (let i = 0; i <= FLOORS; i++) {
    box(
      [HALF_X * 2 + 0.4, SLAB, HALF_Z * 2 + 0.4],
      m.concrete,
      [0, i * FLOOR_HEIGHT + SLAB / 2, 0],
      {
        parent: scene,
        edges: m.edge,
      },
    );
  }

  const columnHeight = FLOOR_HEIGHT - SLAB;
  const columnGeometry = new THREE.BoxGeometry(0.45, columnHeight, 0.45);
  const frontGlass = new THREE.PlaneGeometry(HALF_X * 2, columnHeight);
  const sideGlass = new THREE.PlaneGeometry(HALF_Z * 2, columnHeight);
  for (let i = 0; i < FLOORS; i++) {
    const y0 = i * FLOOR_HEIGHT + SLAB;
    const y = y0 + columnHeight / 2;
    for (const x of [-HALF_X, -4, 4, HALF_X]) {
      for (const z of [-HALF_Z, HALF_Z]) {
        const column = new THREE.Mesh(columnGeometry, m.concrete);
        column.position.set(x, y, z);
        column.castShadow = true;
        scene.add(column);
      }
    }
    for (const z of [-HALF_Z, HALF_Z]) {
      const pane = new THREE.Mesh(frontGlass, m.glass);
      pane.position.set(0, y, z * 0.995);
      pane.renderOrder = 1;
      scene.add(pane);
    }
    for (const x of [-HALF_X, HALF_X]) {
      const pane = new THREE.Mesh(sideGlass, m.glass);
      pane.rotation.y = Math.PI / 2;
      pane.position.set(x * 0.997, y, 0);
      pane.renderOrder = 1;
      scene.add(pane);
    }

    const y1 = y0 + columnHeight;
    const mullions: number[][] = [];
    for (let x = -HALF_X + 2; x < HALF_X; x += 2) {
      mullions.push(
        [x, y0, HALF_Z, x, y1, HALF_Z],
        [x, y0, -HALF_Z, x, y1, -HALF_Z],
      );
    }
    for (let z = -HALF_Z + 2; z < HALF_Z; z += 2) {
      mullions.push(
        [HALF_X, y0, z, HALF_X, y1, z],
        [-HALF_X, y0, z, -HALF_X, y1, z],
      );
    }
    for (const z of [-HALF_Z, HALF_Z])
      mullions.push([-HALF_X, y0 + 1.05, z, HALF_X, y0 + 1.05, z]);
    scene.add(new THREE.LineSegments(segments(mullions), m.fine));

    const stairs: number[][] = [];
    for (let s = 0; s < 9; s++) {
      const x = CORE.x0 + 0.6 + (3.6 * s) / 9;
      const sy = y0 + (columnHeight * 0.5 * s) / 9;
      stairs.push([x, sy, CORE.z0 + 0.4, x, sy, -0.15]);
      const x2 = CORE.x1 - 0.6 - (3.6 * s) / 9;
      const sy2 = y0 + columnHeight * 0.5 + (columnHeight * 0.5 * s) / 9;
      stairs.push([x2, sy2, 0.15, x2, sy2, CORE.z1 - 0.4]);
    }
    scene.add(new THREE.LineSegments(segments(stairs), m.fine));
  }

  const coreHeight = ROOF + 3;
  const coreWidth = CORE.x1 - CORE.x0;
  const coreX = (CORE.x0 + CORE.x1) / 2;
  for (const z of [CORE.z0, CORE.z1]) {
    box([coreWidth, coreHeight, 0.25], m.core, [coreX, coreHeight / 2, z], {
      parent: scene,
      edges: m.fine,
    });
  }
  box(
    [0.25, coreHeight, CORE.z1 - CORE.z0],
    m.core,
    [CORE.x1, coreHeight / 2, 0],
    { parent: scene, edges: m.fine },
  );
  box(
    [coreWidth + 0.3, 0.3, CORE.z1 - CORE.z0 + 0.3],
    m.concrete,
    [coreX, coreHeight + 0.15, 0],
    {
      parent: scene,
      edges: m.edge,
    },
  );

  const parapet: [number, number, number, number][] = [
    [HALF_X * 2 + 0.4, 0.2, 0, HALF_Z + 0.1],
    [HALF_X * 2 + 0.4, 0.2, 0, -HALF_Z - 0.1],
    [0.2, HALF_Z * 2 + 0.4, HALF_X + 0.1, 0],
    [0.2, HALF_Z * 2 + 0.4, -HALF_X - 0.1, 0],
  ];
  for (const [w, d, x, z] of parapet) {
    box([w, 0.9, d], m.concrete, [x, ROOF + SLAB + 0.45, z], {
      parent: scene,
      edges: m.edge,
    });
  }

  const tank = box([3.4, 2.2, 3.4], m.core, [-6.5, ROOF + SLAB + 1.5, -2.5], {
    parent: scene,
    edges: m.edge,
  });
  box([5, 0.22, 2.6], m.concrete, [EXIT_X, 3.0, HALF_Z + 1.3], {
    parent: scene,
    edges: m.edge,
  });
  for (const x of [EXIT_X - 1.9, EXIT_X + 1.9]) {
    box([0.14, 2.9, 0.14], m.concrete, [x, 1.45, HALF_Z + 2.45], {
      parent: scene,
    });
  }
  return { tank };
}
