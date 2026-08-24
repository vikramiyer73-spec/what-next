import { ProviderType, ShowSummary, WatchProvider } from "./types";
import { canonicalProviderBrand } from "./providerColors";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
export const TMDB_POSTER_BASE = "https://image.tmdb.org/t/p/w92";
export const TMDB_POSTER_BASE_LARGE = "https://image.tmdb.org/t/p/w342";
export const TMDB_LOGO_BASE = "https://image.tmdb.org/t/p/original";

interface TMDBTVSearchResult {
  id: number;
  name: string;
  first_air_date?: string;
  poster_path: string | null;
  overview: string;
  origin_country?: string[];
}

interface TMDBTVSearchResponse {
  results: TMDBTVSearchResult[];
}

function requireApiKey(): string {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error("TMDB_API_KEY is not set");
  }
  return apiKey;
}

export async function searchTVShows(query: string): Promise<ShowSummary[]> {
  const apiKey = requireApiKey();

  const url = new URL(`${TMDB_BASE_URL}/search/tv`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("query", query);
  url.searchParams.set("include_adult", "false");

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`TMDB search failed: ${res.status}`);
  }

  const data = (await res.json()) as TMDBTVSearchResponse;

  return data.results.slice(0, 8).map((result) => ({
    id: result.id,
    title: result.name,
    year: result.first_air_date ? result.first_air_date.slice(0, 4) : null,
    posterPath: result.poster_path,
    overview: result.overview,
    originCountry: result.origin_country?.[0] ?? null,
  }));
}

export interface TMDBMatch {
  id: number;
  posterPath: string | null;
  overview: string | null;
}

interface TMDBSeasonSummary {
  name: string;
  poster_path: string | null;
}

interface TMDBTVDetailsResponse {
  seasons?: TMDBSeasonSummary[];
}

/**
 * Some shows only exist on TMDB at the series level, with individually-named
 * seasons underneath (e.g. "Deutschland 83"/"86"/"89" are seasons of the show
 * "Deutschland") — the series-level poster can default to a different
 * season's art than the one actually being recommended. When the matched
 * show's own name isn't what we searched for, check whether a season name
 * matches instead and prefer that season's poster.
 */
async function findSeasonPoster(showId: number, normalizedQuery: string): Promise<string | null> {
  const apiKey = requireApiKey();
  const res = await fetch(`${TMDB_BASE_URL}/tv/${showId}?api_key=${apiKey}`);
  if (!res.ok) return null;

  const data = (await res.json()) as TMDBTVDetailsResponse;
  const season = data.seasons?.find((s) => s.name.trim().toLowerCase() === normalizedQuery);
  return season?.poster_path ?? null;
}

/** Finds the closest TMDB match for a Claude-recommended title. */
export async function findBestTVMatch(title: string): Promise<TMDBMatch | null> {
  const results = await searchTVShows(title);
  if (results.length === 0) return null;

  const normalizedQuery = title.trim().toLowerCase();
  const yearMatch = title.match(/\b(19|20)\d{2}\b/);
  const impliedYear = yearMatch ? yearMatch[0] : null;

  const exactMatches = results.filter((r) => r.title.toLowerCase() === normalizedQuery);

  let best: ShowSummary;
  if (exactMatches.length > 0) {
    const yearFiltered = impliedYear ? exactMatches.find((r) => r.year === impliedYear) : undefined;
    best = yearFiltered ?? exactMatches[0];
  } else {
    best = results[0];
    console.warn(
      `tmdb: fuzzy match for "${title}" -> "${best.title}" (id ${best.id}, no exact title match found)`,
    );
  }

  let posterPath = best.posterPath;

  if (best.title.toLowerCase() !== normalizedQuery) {
    const seasonPoster = await findSeasonPoster(best.id, normalizedQuery);
    if (seasonPoster) {
      console.log(`tmdb: used season-level poster for "${title}" under show "${best.title}"`);
      posterPath = seasonPoster;
    }
  }

  return { id: best.id, posterPath, overview: best.overview || null };
}

interface TMDBWatchProviderEntry {
  provider_name: string;
  logo_path: string | null;
}

interface TMDBWatchProvidersResponse {
  results?: Record<
    string,
    {
      flatrate?: TMDBWatchProviderEntry[];
      rent?: TMDBWatchProviderEntry[];
      buy?: TMDBWatchProviderEntry[];
    }
  >;
}

/** US watch providers for a TMDB TV id, subscription (flatrate) options first. */
export async function getWatchProviders(tmdbId: number): Promise<WatchProvider[]> {
  const apiKey = requireApiKey();
  const url = `${TMDB_BASE_URL}/tv/${tmdbId}/watch/providers?api_key=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) return [];

  const data = (await res.json()) as TMDBWatchProvidersResponse;
  const us = data.results?.US;
  if (!us) return [];

  const toProvider =
    (type: ProviderType) =>
    (p: TMDBWatchProviderEntry): WatchProvider => ({
      name: p.provider_name,
      type,
      logoPath: p.logo_path,
    });

  const flatrate: WatchProvider[] = (us.flatrate ?? []).map(toProvider("flatrate"));
  const rent: WatchProvider[] = (us.rent ?? []).map(toProvider("rent"));
  const buy: WatchProvider[] = (us.buy ?? []).map(toProvider("buy"));

  // Dedupe by (type, canonical brand) — e.g. "Netflix" and "Netflix Standard
  // with Ads" are both flatrate offers of the same service, so only the
  // first-seen variant survives. Scoping by type keeps a genuinely different
  // offer (e.g. a "buy" listing) from merging with a "flatrate" one that
  // happens to share a brand name.
  const seen = new Set<string>();
  const ordered: WatchProvider[] = [];
  for (const provider of [...flatrate, ...rent, ...buy]) {
    const key = `${provider.type}:${canonicalProviderBrand(provider.name)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    ordered.push(provider);
  }
  return ordered;
}
