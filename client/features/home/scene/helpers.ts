import * as THREE from "three";

type BoxOptions = {
  parent?: THREE.Object3D;
  edges?: THREE.LineBasicMaterial | null;
  cast?: boolean;
};

export function box(
  size: [number, number, number],
  material: THREE.Material,
  position: [number, number, number],
  { parent, edges = null, cast = true }: BoxOptions = {},
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  mesh.castShadow = cast;
  mesh.receiveShadow = true;
  if (edges)
    mesh.add(
      new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), edges),
    );
  parent?.add(mesh);
  return mesh;
}

export function cylinder(
  radius: number,
  height: number,
  material: THREE.Material,
  position: [number, number, number],
  {
    parent,
    segments = 16,
    cast = true,
  }: { parent?: THREE.Object3D; segments?: number; cast?: boolean } = {},
): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, height, segments),
    material,
  );
  mesh.position.set(...position);
  mesh.castShadow = cast;
  parent?.add(mesh);
  return mesh;
}

/** Line segments from `[x0, y0, z0, x1, y1, z1]` tuples. */
export function segments(list: number[][]): THREE.BufferGeometry {
  return new THREE.BufferGeometry().setAttribute(
    "position",
    new THREE.Float32BufferAttribute(list.flat(), 3),
  );
}

/** Soft round sprite used for smoke, glow, water and people on the escape routes. */
export function softDotTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const context = canvas.getContext("2d")!;
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.4, "rgba(255,255,255,0.8)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

/** Horizontal alpha ramp that fades the street toward both ends. */
export function edgeFadeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 4;
  const context = canvas.getContext("2d")!;
  const gradient = context.createLinearGradient(0, 0, 256, 0);
  gradient.addColorStop(0, "#000");
  gradient.addColorStop(0.22, "#fff");
  gradient.addColorStop(0.78, "#fff");
  gradient.addColorStop(1, "#000");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 4);
  return new THREE.CanvasTexture(canvas);
}

/** Dashed center line: a repeating stripe. */
export function dashTexture(repeat: number): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 4;
  const context = canvas.getContext("2d")!;
  context.fillStyle = "#fff";
  context.fillRect(0, 0, 36, 4);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.repeat.set(repeat, 1);
  return texture;
}

/** Releases every GPU resource under `root`. Safe to call on shared materials and textures. */
export function disposeTree(root: THREE.Object3D) {
  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    mesh.geometry?.dispose();
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : mesh.material
        ? [mesh.material]
        : [];
    for (const material of materials) {
      for (const value of Object.values(material)) {
        if (value instanceof THREE.Texture) value.dispose();
      }
      material.dispose();
    }
  });
}
