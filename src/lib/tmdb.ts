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
  vote_average?: number;
  vote_count?: number;
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

/** TMDB scores shows with very few votes are noisy — not worth surfacing. */
const MIN_VOTE_COUNT_FOR_RATING = 20;

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
    voteAverage:
      result.vote_average && (result.vote_count ?? 0) >= MIN_VOTE_COUNT_FOR_RATING
        ? result.vote_average
        : null,
  }));
}

export interface TMDBMatch {
  id: number;
  posterPath: string | null;
  overview: string | null;
  voteAverage: number | null;
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

function levenshteinDistance(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

/** 1 = identical strings, 0 = nothing in common. */
function titleSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(a, b) / maxLen;
}

/**
 * Below this, a non-exact top search result is more likely an unrelated show
 * than a fuzzy variant of the query (typo, punctuation, subtitle) — reject it
 * rather than silently rendering the wrong show's poster/synopsis/rating.
 */
const FUZZY_MATCH_MIN_SIMILARITY = 0.5;

function isConfidentFuzzyMatch(query: string, candidate: string): boolean {
  return candidate.includes(query) || query.includes(candidate) || titleSimilarity(query, candidate) >= FUZZY_MATCH_MIN_SIMILARITY;
}

/**
 * Finds the closest TMDB match for a Claude-recommended title.
 *
 * `year`, if given, is Claude's own stated release year for the recommendation
 * (not parsed from the title string) — used only to disambiguate between
 * multiple exact title matches (remakes, same-named shows).
 */
export async function findBestTVMatch(title: string, year?: string): Promise<TMDBMatch | null> {
  const results = await searchTVShows(title);
  if (results.length === 0) {
    console.warn(`tmdb: no search results at all for "${title}"`);
    return null;
  }

  const normalizedQuery = title.trim().toLowerCase();
  const normalizedYear = year && /^(19|20)\d{2}$/.test(year) ? year : undefined;

  const exactMatches = results.filter((r) => r.title.toLowerCase() === normalizedQuery);

  let best: ShowSummary;
  if (exactMatches.length > 0) {
    const yearFiltered = normalizedYear ? exactMatches.find((r) => r.year === normalizedYear) : undefined;
    best = yearFiltered ?? exactMatches[0];
    if (exactMatches.length > 1 && !yearFiltered) {
      console.warn(
        `tmdb: ${exactMatches.length} exact title matches for "${title}"${
          normalizedYear ? ` (none matched year ${normalizedYear})` : " (no year given to disambiguate)"
        } — used id ${best.id}`,
      );
    }
  } else {
    const candidate = results[0];
    if (!isConfidentFuzzyMatch(normalizedQuery, candidate.title.toLowerCase())) {
      console.warn(
        `tmdb: rejected low-confidence match for "${title}" — closest result was "${candidate.title}" (id ${candidate.id})`,
      );
      return null;
    }
    best = candidate;
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

  return { id: best.id, posterPath, overview: best.overview || null, voteAverage: best.voteAverage };
}

interface TMDBWatchProviderEntry {
  provider_name: string;
  logo_path: string | null;
}

interface TMDBWatchProvidersResponse {
  results?: Record<
    string,
    {
      link?: string;
      flatrate?: TMDBWatchProviderEntry[];
      rent?: TMDBWatchProviderEntry[];
      buy?: TMDBWatchProviderEntry[];
    }
  >;
}

export interface WatchProvidersResult {
  providers: WatchProvider[];
  /**
   * TMDB only supplies one aggregate watch-page link per show/region (not a
   * distinct deep link per provider) — this is that link, used for every
   * provider pill's click-through.
   */
  link: string | null;
}

/** US watch providers for a TMDB TV id, subscription (flatrate) options first. */
export async function getWatchProviders(tmdbId: number): Promise<WatchProvidersResult> {
  const apiKey = requireApiKey();
  const url = `${TMDB_BASE_URL}/tv/${tmdbId}/watch/providers?api_key=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) return { providers: [], link: null };

  const data = (await res.json()) as TMDBWatchProvidersResponse;
  const us = data.results?.US;
  if (!us) return { providers: [], link: null };

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
  return { providers: ordered, link: us.link ?? null };
}
