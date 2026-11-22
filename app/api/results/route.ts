import { NextRequest, NextResponse } from "next/server";
import { getAllVoters, getConfig, storageKind } from "@/lib/store";
import { computeGuessers, computeRanking, votesPerBun } from "@/lib/scoring";
import { Results } from "@/lib/types";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const [config, voters] = await Promise.all([getConfig(), getAllVoters()]);
  const counts = votesPerBun(voters);

  // Admin may preview results before the reveal
  const preview = req.nextUrl.searchParams.get("preview") === "1" && isAdmin(req);

  let body: Results;
  if (!config.revealed && !preview) {
    body = { revealed: false, screen: config.screen ?? "qr", voters: voters.length, votesPerBun: counts, storage: storageKind };
  } else {
    body = {
      revealed: true,
      voters: voters.length,
      votesPerBun: counts,
      storage: storageKind,
      ranking: computeRanking(voters, config),
      guessers: computeGuessers(voters, config),
      hasAnswers: Object.values(config.answers ?? {}).some((a) => a != null),
    };
  }
  return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });
}
