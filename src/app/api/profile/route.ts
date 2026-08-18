import { NextRequest, NextResponse } from "next/server";
import { askClaudeForJSON, parseJSONResponse } from "@/lib/anthropic";
import { PROFILE_SYSTEM_PROMPT } from "@/lib/prompts";
import { ViewerProfile } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const shows: string[] = Array.isArray(body?.shows)
    ? body.shows.filter((s: unknown) => typeof s === "string" && s.trim())
    : [];

  if (shows.length === 0) {
    return NextResponse.json({ error: "Missing favorite shows" }, { status: 400 });
  }

  try {
    const raw = await askClaudeForJSON(
      PROFILE_SYSTEM_PROMPT,
      `My all-time favorite shows are: ${shows.map((s) => `"${s}"`).join(", ")}`,
    );
    const parsed = parseJSONResponse<ViewerProfile>(raw);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("profile error", err);
    return NextResponse.json(
      { error: "Failed to generate profile" },
      { status: 500 },
    );
  }
}
