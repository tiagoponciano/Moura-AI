import { Color, SRGBColorSpace } from "three";

const SCENE_TOKENS = [
  "concrete",
  "core",
  "glass",
  "edge",
  "sidewalk",
  "street",
  "marking",
  "trunk",
  "foliage",
  "suit",
  "truck",
  "helmet",
  "reflective",
  "tire",
  "metal",
  "smoke",
  "water",
] as const;

export type SceneToken = (typeof SCENE_TOKENS)[number];

export type ScenePalette = Record<
  SceneToken | "primary" | "background",
  Color
> & {
  dark: boolean;
};

/**
 * Reads the `--scene-*`, `--primary` and `--background` tokens from the page.
 * They are authored in oklch, which three.js cannot parse, so each value is
 * painted on a 1×1 canvas and read back as sRGB.
 */
export function readScenePalette(root: HTMLElement): ScenePalette {
  const style = getComputedStyle(root);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true })!;

  function toColor(token: string): Color {
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = "#000";
    context.fillStyle = style.getPropertyValue(token).trim() || "#000";
    context.fillRect(0, 0, 1, 1);
    const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
    return new Color().setRGB(r / 255, g / 255, b / 255, SRGBColorSpace);
  }

  const palette = {
    primary: toColor("--primary"),
    background: toColor("--background"),
    dark: root.classList.contains("dark"),
  } as ScenePalette;
  for (const token of SCENE_TOKENS)
    palette[token] = toColor(`--scene-${token}`);
  return palette;
}
