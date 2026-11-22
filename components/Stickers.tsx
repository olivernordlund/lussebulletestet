import Bun from "./Bun";

type Pos = { x: string; y: string; r: string };
const style = (p: Pos) => ({ ["--x" as string]: p.x, ["--y" as string]: p.y, ["--r" as string]: p.r });

/** Playful, tilted UI "stickers" around a big bun (decorative only). */
export default function Stickers({ variant = "phone" }: { variant?: "phone" | "screen" }) {
  const phone = variant === "phone";
  return (
    <div className={`stickers stickers--${variant}`} aria-hidden>
      {phone && (
        <span className="sticker sticker--bun" style={style({ x: "50%", y: "0%", r: "-8deg" })}>
          <Bun size={230} />
        </span>
      )}
      {!phone && (
        <span className="sticker sticker--bun sticker--bigbun" style={style({ x: "88%", y: "27%", r: "-174deg" })}>
          <Bun size={260} />
        </span>
      )}
      <span className={`sticker ${phone ? "sticker--yellow" : "sticker--white"}`} style={style({ x: "4%", y: "26%", r: "-6deg" })}>
        👀 Utseende
      </span>
      <span className="sticker sticker--dark" style={style({ x: "70%", y: "16%", r: "5deg" })}>
        {phone ? "Smak" : "Smak 9"}
      </span>
      <span className="sticker sticker--saffron" style={style({ x: "66%", y: "60%", r: "-4deg" })}>
        ★ 27/30
      </span>
      <span className="sticker sticker--card" style={style({ x: "2%", y: "56%", r: "3deg" })}>
        <span className="sticker__row">
          Pågen <i>✓</i>
        </span>
        <span className="sticker__row sticker__row--muted">Hemmabakad</span>
      </span>
      {!phone && (
        <span className="sticker sticker--white" style={style({ x: "86%", y: "26%", r: "7deg" })}>
          🤏 Konsistens
        </span>
      )}
    </div>
  );
}
