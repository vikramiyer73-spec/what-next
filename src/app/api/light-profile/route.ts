import { NextRequest, NextResponse } from "next/server";
import { askClaudeForJSON, parseJSONResponse } from "@/lib/anthropic";
import { LIGHT_PROFILE_SYSTEM_PROMPT } from "@/lib/prompts";
import { ViewerProfile } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const show = typeof body?.show === "string" ? body.show.trim() : "";
  const overview = typeof body?.overview === "string" ? body.overview.trim() : "";
  const year = typeof body?.year === "string" ? body.year.trim() : "";

  if (!show) {
    return NextResponse.json({ error: "Missing show" }, { status: 400 });
  }

  let userMessage = `The show I just finished is: "${show}"`;
  if (overview) userMessage += `\nSynopsis: ${overview}`;
  if (year) userMessage += `\nRelease year: ${year}`;

  try {
    const raw = await askClaudeForJSON(LIGHT_PROFILE_SYSTEM_PROMPT, userMessage);
    const parsed = parseJSONResponse<ViewerProfile>(raw);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("light-profile error", err);
    return NextResponse.json({ error: "Failed to generate light profile" }, { status: 500 });
  }
}
