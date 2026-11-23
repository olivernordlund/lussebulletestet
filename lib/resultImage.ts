import type { BunResult } from "@/lib/types";

const FONT = '"Diatype Rounded Web", "Nunito Variable", system-ui, sans-serif';
const C = {
  bg: "#fff3df",
  ink: "#161514",
  ink2: "#3d3b39",
  muted: "#71706f",
  yellow: "#ffcc00",
  white: "#ffffff",
  silver: "#f4f1ec",
  bronze: "#fbe9d7",
  green: "#3f9e4d",
};
const MEDALS = ["🥇", "🥈", "🥉"];

const fmt = (n: number | null) =>
  n == null ? "–" : n.toLocaleString("sv-SE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function loadImage(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + "…").width > maxW) t = t.slice(0, -1);
  return t + "…";
}

/** Draws the final ranking to a PNG and shares (mobile) or downloads (desktop) it. */
export async function saveResultImage(ranking: BunResult[]) {
  await Promise.all(
    ["400", "500", "700", "900"].map((w) => document.fonts?.load(`${w} 40px "Diatype Rounded Web"`).catch(() => null)),
  );
  const bun = await loadImage("/lussebulle.png");

  const W = 1080;
  const pad = 56;
  const rowH = 128;
  const winnerH = 168;
  const gap = 18;
  const top = 250;
  const H = top + winnerH + (ranking.length - 1) * (rowH + gap) + gap + 130;

  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);
  ctx.textBaseline = "alphabetic";

  // Background
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  // Title
  ctx.save();
  ctx.translate(W / 2, 150);
  ctx.rotate((-2 * Math.PI) / 180);
  ctx.fillStyle = C.ink;
  ctx.textAlign = "center";
  ctx.font = `900 66px ${FONT}`;
  ctx.fillText("Årets saffransbulle", 0, -30);
  ctx.fillText("är korad!", 0, 42);
  ctx.restore();
  if (bun) {
    ctx.save();
    ctx.translate(W - 120, 96);
    ctx.rotate((18 * Math.PI) / 180);
    ctx.drawImage(bun, -62, -62, 124, 124);
    ctx.restore();
    ctx.save();
    ctx.translate(112, 190);
    ctx.rotate((-24 * Math.PI) / 180);
    ctx.drawImage(bun, -44, -44, 88, 88);
    ctx.restore();
  }

  let y = top;
  ranking.forEach((r, i) => {
    const winner = i === 0;
    const h = winner ? winnerH : rowH;
    const x = pad;
    const w = W - pad * 2;

    // Card
    ctx.save();
    ctx.shadowColor = winner ? "rgba(180,120,0,0.45)" : "rgba(120,70,0,0.18)";
    ctx.shadowBlur = winner ? 40 : 18;
    ctx.shadowOffsetY = winner ? 16 : 8;
    ctx.fillStyle = winner ? C.yellow : i === 1 ? C.silver : i === 2 ? C.bronze : C.white;
    roundRect(ctx, x, y, w, h, 26);
    ctx.fill();
    ctx.restore();

    const cy = y + h / 2;

    // Place
    ctx.textAlign = "center";
    ctx.fillStyle = winner ? C.ink : "#a8a7a5";
    if (i < 3) {
      ctx.font = `${winner ? 52 : 44}px ${FONT}`;
      ctx.fillText(MEDALS[i], x + 54, cy + 16);
    } else {
      ctx.font = `800 38px ${FONT}`;
      ctx.fillText(String(i + 1), x + 54, cy + 13);
    }

    // Bun picture
    const bs = winner ? 92 : 66;
    if (bun) ctx.drawImage(bun, x + 104, cy - bs / 2, bs, bs);

    // Total sticker
    const totalText = fmt(r.total);
    ctx.font = `800 ${winner ? 54 : 40}px ${FONT}`;
    const tw = ctx.measureText(totalText).width;
    ctx.font = `500 ${winner ? 22 : 18}px ${FONT}`;
    const sw = ctx.measureText("/30").width;
    const sbW = tw + sw + 40;
    const sbH = winner ? 84 : 64;
    const sbX = x + w - sbW - 26;
    ctx.save();
    ctx.translate(sbX + sbW / 2, cy);
    ctx.rotate(((i % 2 === 0 ? -3 : 3) * Math.PI) / 180);
    ctx.fillStyle = winner ? C.white : C.yellow;
    roundRect(ctx, -sbW / 2, -sbH / 2, sbW, sbH, 16);
    ctx.fill();
    ctx.textAlign = "left";
    ctx.fillStyle = C.ink;
    ctx.font = `800 ${winner ? 54 : 40}px ${FONT}`;
    const base = winner ? 19 : 14;
    ctx.fillText(totalText, -sbW / 2 + 18, base);
    ctx.font = `500 ${winner ? 22 : 18}px ${FONT}`;
    ctx.fillStyle = C.ink2;
    ctx.fillText("/30", -sbW / 2 + 22 + tw, base);
    ctx.restore();

    // Winner tag
    if (winner) {
      ctx.save();
      ctx.translate(sbX + sbW - 10, y - 4);
      ctx.rotate((6 * Math.PI) / 180);
      ctx.font = `700 20px ${FONT}`;
      const lw = ctx.measureText("Vinnare!").width + 26;
      ctx.fillStyle = C.green;
      roundRect(ctx, -lw / 2, -18, lw, 36, 10);
      ctx.fill();
      ctx.fillStyle = C.white;
      ctx.textAlign = "center";
      ctx.fillText("Vinnare!", 0, 7);
      ctx.restore();
    }

    // Name + answer
    const tx = x + 104 + bs + 26;
    const maxW = sbX - tx - 24;
    ctx.textAlign = "left";
    ctx.fillStyle = C.ink;
    ctx.font = `900 ${winner ? 44 : 34}px ${FONT}`;
    ctx.fillText(fitText(ctx, r.answer || `Bulle ${r.bun}`, maxW), tx, cy - 4);
    // Detail
    ctx.fillStyle = winner ? C.ink2 : C.muted;
    ctx.font = `400 ${winner ? 24 : 21}px ${FONT}`;
    const detail = `Utseende ${fmt(r.look)} · Smak ${fmt(r.taste)} · Konsistens ${fmt(r.texture)}`;
    ctx.fillText(fitText(ctx, detail, maxW), tx, cy + (winner ? 38 : 32));

    y += h + gap;
  });

  // Footer
  ctx.textAlign = "center";
  ctx.fillStyle = C.muted;
  ctx.font = `500 24px ${FONT}`;
  const date = new Date().toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" });
  ctx.fillText(`Det stora saffransbulletestet · ${date}`, W / 2, H - 56);

  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
  if (!blob) return;
  const filename = "saffransbulletestet-resultat.png";
  const file = new File([blob], filename, { type: "image/png" });

  // On phones: open the share sheet so the image can be saved to Photos
  const touch = window.matchMedia?.("(pointer: coarse)").matches;
  if (touch && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "Årets saffransbulle" });
      return;
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
