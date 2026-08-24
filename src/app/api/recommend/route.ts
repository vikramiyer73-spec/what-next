import { NextRequest } from "next/server";
import { streamClaudeJSONL, parseJSONLLine } from "@/lib/anthropic";
import { RECOMMEND_SYSTEM_PROMPT } from "@/lib/prompts";
import { findBestTVMatch, getWatchProviders } from "@/lib/tmdb";
import { EnrichedRecommendation, Recommendation } from "@/lib/types";

const MAX_PROVIDER_BADGES = 2;

async function enrichRecommendation(rec: Recommendation): Promise<EnrichedRecommendation> {
  try {
    const match = await findBestTVMatch(rec.title);
    if (!match) {
      return { ...rec, tmdbId: null, posterPath: null, overview: null, providers: [], providerOverflow: 0 };
    }

    const providers = await getWatchProviders(match.id);

    return {
      ...rec,
      tmdbId: match.id,
      posterPath: match.posterPath,
      overview: match.overview,
      providers: providers.slice(0, MAX_PROVIDER_BADGES),
      providerOverflow: Math.max(0, providers.length - MAX_PROVIDER_BADGES),
    };
  } catch (err) {
    console.error("recommend: enrichment error for", rec.title, err);
    return { ...rec, tmdbId: null, posterPath: null, overview: null, providers: [], providerOverflow: 0 };
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const show = typeof body?.show === "string" ? body.show.trim() : "";
  const overview = typeof body?.overview === "string" ? body.overview.trim() : "";
  const year = typeof body?.year === "string" ? body.year.trim() : "";
  const exclude: string[] = Array.isArray(body?.exclude)
    ? body.exclude.filter((s: unknown): s is string => typeof s === "string")
    : [];
  const single = body?.count === 1;

  if (!show) {
    return new Response(JSON.stringify({ error: "Missing show" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let userMessage = `The show I just finished is: "${show}"`;
  if (overview) userMessage += `\nSynopsis: ${overview}`;
  if (year) userMessage += `\nRelease year: ${year}`;
  if (exclude.length > 0) {
    userMessage += `\nDo not recommend any of these shows — they've already been shown: ${exclude.join(", ")}.`;
  }
  userMessage += single
    ? "\nGive me exactly 1 recommendation, as a single JSON line."
    : "\nGive me 3 to 4 recommendations.";

  const forbiddenTitles = new Set([show.toLowerCase(), ...exclude.map((t) => t.toLowerCase())]);

  const encoder = new TextEncoder();
  const requestStart = performance.now();

  const stream = new ReadableStream({
    async start(controller) {
      const pending: Promise<void>[] = [];
      let itemCount = 0;

      const onLine = (line: string) => {
        if (single && itemCount >= 1) {
          // Already have our one valid item — ignore anything after it.
          console.warn("recommend: ignored extra line in single-item mode:", line);
          return;
        }
        const rec = parseJSONLLine<Recommendation>(line);
        if (!rec || !rec.title || !rec.angle || !rec.reason) {
          console.warn("recommend: skipped malformed line:", line);
          return;
        }
        if (forbiddenTitles.has(rec.title.trim().toLowerCase())) {
          // Claude occasionally names the excluded/original show in "title" while
          // the "reason" text is actually about a different (correct) show. Reject
          // outright rather than show a self-contradicting card — a later line
          // (if any) gets a chance to be the valid one instead.
          console.warn("recommend: rejected forbidden title:", rec.title);
          return;
        }
        itemCount++;
        const enrichStart = performance.now();
        const task = enrichRecommendation(rec)
          .then((enriched) => {
            console.log(
              `recommend: enriched "${rec.title}" in ${Math.round(performance.now() - enrichStart)}ms`,
            );
            controller.enqueue(encoder.encode(JSON.stringify(enriched) + "\n"));
          })
          .catch((err) => {
            console.error("recommend: failed to enqueue enrichment for", rec.title, err);
          });
        pending.push(task);
      };

      try {
        const result = await streamClaudeJSONL(
          RECOMMEND_SYSTEM_PROMPT,
          userMessage,
          onLine,
          single ? 700 : 1500,
        );
        console.log(
          `recommend: claude firstTokenMs=${
            result.firstTokenMs !== null ? Math.round(result.firstTokenMs) : "n/a"
          } claudeTotalMs=${Math.round(result.totalMs)} items=${itemCount}`,
        );
        await Promise.all(pending);
      } catch (err) {
        console.error("recommend error", err);
      } finally {
        console.log(`recommend: full request time ${Math.round(performance.now() - requestStart)}ms`);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
