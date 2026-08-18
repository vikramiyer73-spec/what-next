import { NextRequest, NextResponse } from "next/server";
import { askClaudeForJSON, parseJSONResponse } from "@/lib/anthropic";
import { RECOMMEND_SYSTEM_PROMPT } from "@/lib/prompts";
import { RecommendResponse } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const show = typeof body?.show === "string" ? body.show.trim() : "";

  if (!show) {
    return NextResponse.json({ error: "Missing show" }, { status: 400 });
  }

  try {
    const raw = await askClaudeForJSON(
      RECOMMEND_SYSTEM_PROMPT,
      `The show I just finished is: "${show}"`,
    );
    const parsed = parseJSONResponse<RecommendResponse>(raw);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("recommend error", err);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 },
    );
  }
}
