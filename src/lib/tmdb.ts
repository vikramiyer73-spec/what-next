import { ShowSummary } from "./types";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
export const TMDB_POSTER_BASE = "https://image.tmdb.org/t/p/w92";

interface TMDBTVSearchResult {
  id: number;
  name: string;
  first_air_date?: string;
  poster_path: string | null;
  overview: string;
}

interface TMDBTVSearchResponse {
  results: TMDBTVSearchResult[];
}

export async function searchTVShows(query: string): Promise<ShowSummary[]> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error("TMDB_API_KEY is not set");
  }

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
  }));
}
