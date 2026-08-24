import { ShowSummary, WatchProvider } from "./types";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
export const TMDB_POSTER_BASE = "https://image.tmdb.org/t/p/w92";
export const TMDB_POSTER_BASE_LARGE = "https://image.tmdb.org/t/p/w342";

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

/** Finds the closest TMDB match for a Claude-recommended title (exact title match preferred). */
export async function findBestTVMatch(title: string): Promise<TMDBMatch | null> {
  const results = await searchTVShows(title);
  if (results.length === 0) return null;

  const exact = results.find((r) => r.title.toLowerCase() === title.toLowerCase());
  const best = exact ?? results[0];

  return { id: best.id, posterPath: best.posterPath, overview: best.overview || null };
}

interface TMDBWatchProvidersResponse {
  results?: Record<
    string,
    {
      flatrate?: { provider_name: string }[];
      rent?: { provider_name: string }[];
      buy?: { provider_name: string }[];
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

  const flatrate: WatchProvider[] = (us.flatrate ?? []).map((p) => ({
    name: p.provider_name,
    type: "flatrate",
  }));
  const rent: WatchProvider[] = (us.rent ?? []).map((p) => ({ name: p.provider_name, type: "rent" }));
  const buy: WatchProvider[] = (us.buy ?? []).map((p) => ({ name: p.provider_name, type: "buy" }));

  const seen = new Set<string>();
  const ordered: WatchProvider[] = [];
  for (const provider of [...flatrate, ...rent, ...buy]) {
    if (seen.has(provider.name)) continue;
    seen.add(provider.name);
    ordered.push(provider);
  }
  return ordered;
}
