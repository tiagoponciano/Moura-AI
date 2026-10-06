"use client";

import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { SceneSystem } from "../scene/materials";
import type { RescueScene, SceneFocus } from "../scene/create-rescue-scene";

/** After this many lost WebGL contexts in a row the scene gives up and the page shows without it. */
const MAX_RESTARTS = 3;

type BuildingSceneProps = {
  focus: SceneFocus;
  onHoverSystem: (system: SceneSystem | null) => void;
  className?: string;
};

/** Client-only host for the three.js rescue scene; three is loaded on demand. */
export function BuildingScene({
  focus,
  onHoverSystem,
  className,
}: BuildingSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLSpanElement>(null);
  const detailRef = useRef<HTMLSpanElement>(null);
  const sceneRef = useRef<RescueScene | null>(null);
  const focusRef = useRef(focus);
  const hoverRef = useRef(onHoverSystem);
  const [generation, setGeneration] = useState(0);
  const [failed, setFailed] = useState(false);
  const router = useRouter();
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    focusRef.current = focus;
    sceneRef.current?.setFocus(focus);
  }, [focus]);

  useEffect(() => {
    hoverRef.current = onHoverSystem;
  }, [onHoverSystem]);

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
          tooltip: {
            root: tooltipRef.current!,
            title: titleRef.current!,
            detail: detailRef.current!,
          },
          reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches,
          onHoverSystem: (system) => hoverRef.current(system),
          onSelectSystem: () => router.push("/classification"),
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
  }, [generation, router]);

  if (failed || generation > MAX_RESTARTS) return null;

  return (
    <div ref={containerRef} className={cn("overflow-hidden", className)}>
      <div
        ref={tooltipRef}
        role="tooltip"
        className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+12px)] rounded-md bg-foreground px-3 py-1.5 text-xs whitespace-nowrap text-background opacity-0 transition-opacity"
      >
        <span ref={titleRef} className="block font-medium" />
        <span ref={detailRef} className="block opacity-70" />
      </div>
    </div>
  );
}
