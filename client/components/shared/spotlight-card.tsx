"use client";

import type { ComponentProps, PointerEvent } from "react";
import { cn } from "@/lib/utils";

type SpotlightCardProps = ComponentProps<"div">;

/**
 * Card with a brand-tinted spotlight that follows the pointer.
 * Adapted from reactbits.dev SpotlightCard: theme tokens instead of fixed
 * colors, and the position goes through CSS variables so moving the pointer
 * does not re-render.
 */
export function SpotlightCard({
  className,
  children,
  onPointerMove,
  ...props
}: SpotlightCardProps) {
  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty(
      "--spot-x",
      `${event.clientX - rect.left}px`,
    );
    event.currentTarget.style.setProperty(
      "--spot-y",
      `${event.clientY - rect.top}px`,
    );
    onPointerMove?.(event);
  }

  return (
    <div
      onPointerMove={handlePointerMove}
      className={cn(
        "group/spotlight relative overflow-hidden rounded-xl border bg-card",
        className,
      )}
      {...props}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-focus-within/spotlight:opacity-100 group-hover/spotlight:opacity-100"
        style={{
          background:
            "radial-gradient(260px circle at var(--spot-x, 50%) var(--spot-y, 50%), color-mix(in oklch, var(--primary) 16%, transparent), transparent 70%)",
        }}
      />
      {children}
    </div>
  );
}
