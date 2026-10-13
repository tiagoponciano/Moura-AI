import Image from "next/image";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: { tile: "size-8 rounded-lg", image: 28 },
  md: { tile: "size-10 rounded-lg", image: 34 },
  lg: { tile: "size-14 rounded-xl", image: 46 },
} as const;

type BrandLogoProps = { size?: keyof typeof SIZES };

/** The Moura logo on a light tile in dark mode, where the logo's dark ink would disappear. */
export function BrandLogo({ size = "md" }: BrandLogoProps) {
  const { tile, image } = SIZES[size];
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center dark:bg-white/90",
        tile,
      )}
    >
      <Image
        src="/brand/moura-logo.png"
        alt="Moura"
        width={image}
        height={image}
        priority
      />
    </div>
  );
}
