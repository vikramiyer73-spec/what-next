const OMDB_BASE_URL = "https://www.omdbapi.com/";

interface OMDBResponse {
  Response: "True" | "False";
  imdbRating?: string;
}

/**
 * IMDb rating (0-10) for a TV show title, or null if OMDb has no match, no
 * rating, or the key isn't configured. Never throws — this is a supplementary
 * data point, not core to the app working, so a failure here shouldn't break
 * enrichment (poster, providers, etc.).
 */
export async function getImdbRating(title: string): Promise<number | null> {
  const apiKey = process.env.OMDB_API_KEY;
  if (!apiKey) return null;

  try {
    const url = new URL(OMDB_BASE_URL);
    url.searchParams.set("apikey", apiKey);
    url.searchParams.set("t", title);
    url.searchParams.set("type", "series");

    const res = await fetch(url.toString());
    if (!res.ok) return null;

    const data = (await res.json()) as OMDBResponse;
    if (data.Response !== "True" || !data.imdbRating || data.imdbRating === "N/A") return null;

    const rating = Number(data.imdbRating);
    return Number.isFinite(rating) ? rating : null;
  } catch (err) {
    console.error("omdb: lookup failed for", title, err);
    return null;
  }
}
