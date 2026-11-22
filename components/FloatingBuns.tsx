// Many lussebullar slowly floating up behind the big screen (decorative only).

const rnd = (i: number, salt: number) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

export default function FloatingBuns({ count = 26 }: { count?: number }) {
  return (
    <div className="float-buns" aria-hidden>
      {Array.from({ length: count }, (_, i) => {
        const depth = rnd(i, 1); // 0 = far away, 1 = close
        const size = Math.round(50 + depth * 170);
        const duration = 26 - depth * 12 + rnd(i, 2) * 8; // close buns move faster
        return (
          <span
            key={i}
            className="float-bun"
            style={{
              left: `${(rnd(i, 3) * 100).toFixed(1)}%`,
              width: size,
              height: size,
              opacity: 0.55 + depth * 0.45,
              filter: depth < 0.3 ? `blur(${((0.3 - depth) * 8).toFixed(1)}px)` : undefined,
              animationDuration: `${duration.toFixed(1)}s`,
              animationDelay: `${(-rnd(i, 4) * duration).toFixed(1)}s`,
              ["--sway" as string]: `${Math.round(rnd(i, 5) * 120 - 60)}px`,
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
