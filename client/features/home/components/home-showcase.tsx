"use client";

import { createTimeline, stagger } from "animejs";
import { useEffect, useMemo, useRef, useState } from "react";
import type { SceneFocus, SceneHighlight } from "../scene/create-rescue-scene";
import { BuildingScene } from "./building-scene";
import { HomeHero } from "./home-hero";
import { ModuleGrid } from "./module-grid";

/** What each module card emphasizes in the scene while hovered. */
const HIGHLIGHT_BY_MODULE: Record<string, SceneHighlight> = {
  "/classification": "systems",
};

/** Home page: rescue scene in the background, product name on top, module cards below. */
export function HomeShowcase() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [moduleHref, setModuleHref] = useState<string | null>(null);

  const focus = useMemo<SceneFocus>(
    () => ({
      highlight: moduleHref ? (HIGHLIGHT_BY_MODULE[moduleHref] ?? null) : null,
    }),
    [moduleHref],
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    const targets = (name: string) =>
      root.querySelectorAll(`[data-animate="${name}"]`);
    const timeline = createTimeline({ defaults: { ease: "outCubic" } })
      .add(targets("word"), {
        opacity: [0, 1],
        translateY: [18, 0],
        delay: stagger(90),
        duration: 700,
      })
      .add(
        targets("subtitle"),
        { opacity: [0, 1], translateY: [10, 0], duration: 600 },
        "-=400",
      )
      .add(
        targets("card"),
        {
          opacity: [0, 1],
          translateY: [16, 0],
          delay: stagger(80),
          duration: 600,
        },
        "-=300",
      );
    return () => {
      timeline.revert();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="relative flex min-h-[max(100%,640px)] flex-col justify-between gap-6 md:gap-8 px-4 pt-10 pb-8 md:px-8 lg:px-14"
    >
      {/* Below md the scene is a block between the title and the cards; above it fills the page. */}
      <BuildingScene
        className="relative order-2 -mx-4 h-80 md:absolute md:inset-0 md:order-none md:mx-0 md:h-auto"
        focus={focus}
      />
      <div className="pointer-events-none relative order-1">
        <HomeHero />
      </div>
      <div className="relative order-3">
        <ModuleGrid onFocus={setModuleHref} />
      </div>
    </div>
  );
}
