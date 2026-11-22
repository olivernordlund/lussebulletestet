import { NextResponse } from "next/server";
import { getConfig } from "@/lib/store";
import { NUM_BUNS, PublicState } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = await getConfig();
  const body: PublicState = {
    candidates: config.candidates,
    revealed: config.revealed,
    numBuns: NUM_BUNS,
  };
  return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });
}
