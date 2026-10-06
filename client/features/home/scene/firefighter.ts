import * as THREE from "three";
import { box, cylinder } from "./helpers";
import type { SceneMaterials } from "./materials";

export type FirefighterPose = "walk" | "climb" | "idle";

type Limbs = {
  legL: THREE.Group;
  legR: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
};

function limb(
  size: [number, number, number],
  material: THREE.Material,
  x: number,
  y: number,
  parent: THREE.Object3D,
) {
  const pivot = new THREE.Group();
  pivot.position.set(x, y, 0);
  parent.add(pivot);
  box(size, material, [0, -size[1] / 2, 0], { parent: pivot });
  return pivot;
}

/** Low-poly firefighter: suit with reflective bands, air cylinder and helmet. Faces +z. */
export function createFirefighter(m: SceneMaterials) {
  const body = new THREE.Group();
  body.scale.setScalar(1.25);
  const limbs: Limbs = {
    legL: limb([0.17, 0.85, 0.2], m.suit, -0.11, 0.88, body),
    legR: limb([0.17, 0.85, 0.2], m.suit, 0.11, 0.88, body),
    armL: limb([0.13, 0.62, 0.15], m.suit, -0.32, 1.5, body),
    armR: limb([0.13, 0.62, 0.15], m.suit, 0.32, 1.5, body),
  };
  box([0.48, 0.66, 0.3], m.suit, [0, 1.2, 0], { parent: body });
  box([0.5, 0.07, 0.32], m.reflective, [0, 1.0, 0], { parent: body });
  box([0.5, 0.07, 0.32], m.reflective, [0, 1.36, 0], { parent: body });
  box([0.26, 0.42, 0.16], m.metal, [0, 1.25, -0.23], { parent: body });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), m.suit);
  head.position.y = 1.68;
  body.add(head);
  const helmet = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    m.helmet,
  );
  helmet.position.y = 1.72;
  helmet.castShadow = true;
  body.add(helmet);
  cylinder(0.23, 0.03, m.helmet, [0, 1.72, 0], { parent: body });
  body.userData.limbs = limbs;
  body.visible = false;
  return body;
}

export function poseFirefighter(
  body: THREE.Group,
  pose: FirefighterPose,
  seconds: number,
) {
  const { legL, legR, armL, armR } = body.userData.limbs as Limbs;
  const swing = Math.sin(seconds * 9);
  if (pose === "walk") {
    legL.rotation.x = swing * 0.55;
    legR.rotation.x = -swing * 0.55;
    armL.rotation.x = -swing * 0.45;
    armR.rotation.x = swing * 0.45;
  } else if (pose === "climb") {
    legL.rotation.x = -0.5 + swing * 0.45;
    legR.rotation.x = -0.5 - swing * 0.45;
    armL.rotation.x = -2.5 + swing * 0.4;
    armR.rotation.x = -2.5 - swing * 0.4;
  } else {
    legL.rotation.x = legR.rotation.x = 0;
    armL.rotation.x = armR.rotation.x = -0.6;
  }
}
