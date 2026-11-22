import { NextRequest, NextResponse } from "next/server";
import { clearVotes, deleteVoter, getAllVoters, getConfig, setConfig, storageKind } from "@/lib/store";
import { isAdmin } from "@/lib/auth";
import { Config, NUM_BUNS } from "@/lib/types";

export const dynamic = "force-dynamic";

const unauthorized = () => NextResponse.json({ error: "Fel lösenord" }, { status: 401 });

async function snapshot() {
  const [config, voters] = await Promise.all([getConfig(), getAllVoters()]);
  return {
    config,
    storage: storageKind,
    defaultPassword: !process.env.ADMIN_PASSWORD,
    voters: voters
      .map((v) => ({
        id: v.id,
        name: v.name,
        bunsVoted: Object.keys(v.buns ?? {}).length,
        updatedAt: v.updatedAt,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "sv")),
  };
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();
  return NextResponse.json(await snapshot(), { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.action) return NextResponse.json({ error: "Saknar action" }, { status: 400 });

  const config = await getConfig();

  switch (body.action) {
    case "saveConfig": {
      const candidates: string[] = Array.isArray(body.candidates)
        ? body.candidates.map((c: unknown) => String(c ?? "").trim().slice(0, 50)).filter(Boolean).slice(0, 20)
        : config.candidates;
      if (candidates.length < 1) return NextResponse.json({ error: "Minst ett alternativ krävs" }, { status: 400 });

      const answers: Config["answers"] = {};
      for (let n = 1; n <= NUM_BUNS; n++) {
        const a = body.answers?.[String(n)];
        const idx = a == null || a === "" ? null : Number(a);
        answers[String(n)] = idx != null && Number.isInteger(idx) && idx >= 0 && idx < candidates.length ? idx : null;
      }
      await setConfig({ ...config, candidates, answers });
      break;
    }
    case "reveal":
      await setConfig({ ...config, revealed: true });
      break;
    case "hide":
      await setConfig({ ...config, revealed: false });
      break;
    case "deleteVoter":
      if (typeof body.voterId === "string") await deleteVoter(body.voterId);
      break;
    case "clearVotes":
      await clearVotes();
      await setConfig({ ...config, revealed: false });
      break;
    default:
      return NextResponse.json({ error: "Okänd action" }, { status: 400 });
  }

  return NextResponse.json(await snapshot());
}
