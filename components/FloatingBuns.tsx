import { memo } from "react";

// Many lussebullar slowly floating up behind the big screen (decorative only).
// Performance: the out-of-focus look comes from pre-blurred images
// (public/bun-soft.png, public/bun-blur.png) instead of a CSS blur filter,
// so the browser only has to move finished images around.

const rnd = (i: number, salt: number) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

// The bun images have ~18% transparent padding on each side (room for the blur)
const PAD_SCALE = 1.36;

function FloatingBuns({ count = 22, allBlurred = false }: { count?: number; allBlurred?: boolean }) {
  return (
    <div className="float-buns" aria-hidden>
      {Array.from({ length: count }, (_, i) => {
        const depth = rnd(i, 1); // 0 = far away, 1 = right in front of the camera
        const size = Math.round((110 + Math.pow(depth, 1.6) * 560) * PAD_SCALE);
        const duration = 34 - depth * 20 + rnd(i, 2) * 8; // close buns move faster
        // Out of focus at both ends: far background and close foreground
        const blur = allBlurred
          ? 7 + Math.abs(depth - 0.5) * 14
          : depth < 0.35 ? (0.35 - depth) * 22 : depth > 0.82 ? (depth - 0.82) * 45 : 0;
        const src = blur < 0.5 ? "/bun-sharp.png" : blur < 6 ? "/bun-soft.png" : "/bun-blur.png";
        return (
          <span
            key={i}
            className="float-bun"
            style={{
              left: `${(rnd(i, 3) * 100).toFixed(1)}%`,
              width: size,
              height: size,
              opacity: 0.45 + depth * 0.55,
              animationDuration: `${duration.toFixed(1)}s`,
              animationDelay: `${(-rnd(i, 4) * duration).toFixed(1)}s`,
              ["--sway" as string]: `${Math.round((rnd(i, 5) * 120 - 60) * (0.5 + depth))}px`,
              ["--spin" as string]: `${Math.round(rnd(i, 6) * 720 - 360)}deg`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" draggable={false} decoding="async" />
          </span>
        );
      })}
    </div>
  );
}

export default memo(FloatingBuns);
