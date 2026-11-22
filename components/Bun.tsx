"use client";

import { useEffect, useRef, useState } from "react";
import BunSvg from "./BunSvg";

/**
 * Lussebulle-illustrationen. Använder bilden från Figma (public/lussebulle.png)
 * och faller tillbaka på den ritade SVG-bullen om bilden saknas.
 */
export default function Bun({ size = 64, className }: { size?: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  // The image may already have failed before hydration attached onError
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  if (failed) return <BunSvg size={size} className={className} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src="/lussebulle.png"
      alt=""
      aria-hidden
      width={size}
      height={size}
      className={`bun-img ${className ?? ""}`}
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
      draggable={false}
    />
  );
}
