import Bun from "./Bun";

/** Playful, tilted UI "stickers" scattered around a hero (decorative only). */
export default function Stickers({ variant = "phone" }: { variant?: "phone" | "screen" }) {
  return (
    <div className={`stickers stickers--${variant}`} aria-hidden>
      <span className="sticker sticker--pill" style={{ ["--r" as string]: "-6deg", ["--x" as string]: "4%", ["--y" as string]: "8%" }}>
        👀 Utseende
      </span>
      <span className="sticker sticker--dark" style={{ ["--r" as string]: "5deg", ["--x" as string]: "62%", ["--y" as string]: "4%" }}>
        Smak <b>9</b>
      </span>
      <span className="sticker sticker--saffron" style={{ ["--r" as string]: "-4deg", ["--x" as string]: "68%", ["--y" as string]: "52%" }}>
        ★ 27/30
      </span>
      <span className="sticker sticker--card" style={{ ["--r" as string]: "3deg", ["--x" as string]: "2%", ["--y" as string]: "50%" }}>
        <span className="sticker__row">
          Pågen <i>✓</i>
        </span>
        <span className="sticker__row sticker__row--muted">Hemmabakad</span>
      </span>
      <span className="sticker sticker--bun" style={{ ["--r" as string]: "-8deg", ["--x" as string]: "38%", ["--y" as string]: "22%" }}>
        <Bun size={variant === "screen" ? 120 : 84} />
      </span>
      {variant === "screen" && (
        <span className="sticker sticker--pill" style={{ ["--r" as string]: "7deg", ["--x" as string]: "86%", ["--y" as string]: "26%" }}>
          🤏 Konsistens
        </span>
      )}
    </div>
  );
}
