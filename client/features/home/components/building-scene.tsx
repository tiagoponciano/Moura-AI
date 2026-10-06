"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { RescueScene, SceneFocus } from "../scene/create-rescue-scene";

/** After this many lost WebGL contexts in a row the scene gives up and the page shows without it. */
const MAX_RESTARTS = 3;

type BuildingSceneProps = {
  focus: SceneFocus;
  className?: string;
};

/** Client-only host for the three.js rescue scene; three is loaded on demand. */
export function BuildingScene({ focus, className }: BuildingSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<RescueScene | null>(null);
  const focusRef = useRef(focus);
  const [generation, setGeneration] = useState(0);
  const [failed, setFailed] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    focusRef.current = focus;
    sceneRef.current?.setFocus(focus);
  }, [focus]);

  useEffect(() => {
    sceneRef.current?.refreshTheme();
  }, [resolvedTheme]);

  useEffect(() => {
    if (generation > MAX_RESTARTS) return;
    let cancelled = false;
    let scene: RescueScene | null = null;

    import("../scene/create-rescue-scene")
      .then(({ createRescueScene }) => {
        const container = containerRef.current;
        if (cancelled || !container) return;
        scene = createRescueScene({
          container,
          reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches,
          onContextLost: () => setGeneration((value) => value + 1),
        });
        scene.setFocus(focusRef.current);
        sceneRef.current = scene;
      })
      .catch((error: unknown) => {
        // No WebGL or the chunk failed to load: the page works without the scene.
        console.error("Home scene unavailable", error);
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      scene?.dispose();
      sceneRef.current = null;
    };
  }, [generation]);

  if (failed || generation > MAX_RESTARTS) return null;

  return (
    <div ref={containerRef} className={cn("overflow-hidden", className)} />
  );
}
