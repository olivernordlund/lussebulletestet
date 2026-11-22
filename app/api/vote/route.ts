import { NextRequest, NextResponse } from "next/server";
import { getConfig, getVoter, saveVoter } from "@/lib/store";
import { BunVote, MAX_SCORE, MIN_SCORE, NUM_BUNS, Voter } from "@/lib/types";

export const dynamic = "force-dynamic";

const validId = (id: unknown): id is string => typeof id === "string" && /^[a-zA-Z0-9-]{8,64}$/.test(id);

const score = (x: unknown): number | null => {
  if (x == null) return null;
  const n = Number(x);
  return Number.isInteger(n) && n >= MIN_SCORE && n <= MAX_SCORE ? n : null;
};

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("voterId");
  if (!validId(id)) return NextResponse.json({ error: "Ogiltigt id" }, { status: 400 });
  const voter = await getVoter(id);
  return NextResponse.json(voter ?? null, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || !validId(body.voterId)) {
    return NextResponse.json({ error: "Ogiltig förfrågan" }, { status: 400 });
  }

  const config = await getConfig();
  if (config.revealed) {
    return NextResponse.json({ error: "Röstningen är stängd – resultatet är avslöjat!" }, { status: 403 });
  }

  const name = String(body.name ?? "").trim().slice(0, 40);
  if (!name) return NextResponse.json({ error: "Skriv ditt namn" }, { status: 400 });

  // Name-only update (when someone changes their name)
  if (body.bun == null) {
    const existing = await getVoter(body.voterId);
    if (!existing) return NextResponse.json(null);
    const updated = { ...existing, name, updatedAt: Date.now() };
    await saveVoter(updated);
    return NextResponse.json(updated);
  }

  const bun = Number(body.bun);
  if (!Number.isInteger(bun) || bun < 1 || bun > NUM_BUNS) {
    return NextResponse.json({ error: "Ogiltig bulle" }, { status: 400 });
  }

  const g = body.guess == null || body.guess === "" ? null : Number(body.guess);
  const guess = g != null && Number.isInteger(g) && g >= 0 && g < config.candidates.length ? g : null;

  const vote: BunVote = {
    look: score(body.look),
    taste: score(body.taste),
    texture: score(body.texture),
    guess,
  };

  const existing = await getVoter(body.voterId);
  const voter: Voter = {
    id: body.voterId,
    name,
    buns: { ...(existing?.buns ?? {}), [String(bun)]: vote },
    updatedAt: Date.now(),
  };
  await saveVoter(voter);

  return NextResponse.json(voter);
}
