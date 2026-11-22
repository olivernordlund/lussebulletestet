// Many lussebullar slowly floating up behind the big screen (decorative only).

const rnd = (i: number, salt: number) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

export default function FloatingBuns({ count = 26, allBlurred = false }: { count?: number; allBlurred?: boolean }) {
  return (
    <div className="float-buns" aria-hidden>
      {Array.from({ length: count }, (_, i) => {
        const depth = rnd(i, 1); // 0 = far away, 1 = right in front of the camera
        // Exaggerated depth: tiny far-away buns, huge close-up ones
        const size = Math.round(110 + Math.pow(depth, 1.6) * 560);
        const duration = 34 - depth * 20 + rnd(i, 2) * 8; // close buns move faster
        // Out of focus at both ends: far background and close foreground
        const blur = allBlurred
          ? 7 + Math.abs(depth - 0.5) * 14 // everything soft, so the bars stay in focus
          : depth < 0.35 ? (0.35 - depth) * 22 : depth > 0.82 ? (depth - 0.82) * 45 : 0;
        return (
          <span
            key={i}
            className="float-bun"
            style={{
              left: `${(rnd(i, 3) * 100).toFixed(1)}%`,
              width: size,
              height: size,
              opacity: 0.45 + depth * 0.55,
              filter: blur > 0.5 ? `blur(${blur.toFixed(1)}px)` : undefined,
              animationDuration: `${duration.toFixed(1)}s`,
              animationDelay: `${(-rnd(i, 4) * duration).toFixed(1)}s`,
              ["--sway" as string]: `${Math.round((rnd(i, 5) * 120 - 60) * (0.5 + depth))}px`,
              ["--spin" as string]: `${Math.round(rnd(i, 6) * 720 - 360)}deg`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/lussebulle.png" alt="" draggable={false} />
          </span>
        );
      })}
    </div>
  );
}
