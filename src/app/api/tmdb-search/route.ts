import { NextRequest, NextResponse } from "next/server";
import { searchTVShows } from "@/lib/tmdb";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim();
  if (!query) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchTVShows(query);
    return NextResponse.json({ results });
  } catch (err) {
    console.error("tmdb-search error", err);
    return NextResponse.json(
      { error: "Failed to search TMDB" },
      { status: 500 },
    );
  }
}
