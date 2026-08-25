export interface ShowSummary {
  id: number;
  title: string;
  year: string | null;
  posterPath: string | null;
  overview: string;
  originCountry: string | null;
  voteAverage: number | null;
}

export type ProviderType = "flatrate" | "rent" | "buy";

export interface WatchProvider {
  name: string;
  type: ProviderType;
  logoPath: string | null;
}

export interface Recommendation {
  angle: string;
  title: string;
  reason: string;
}

export interface EnrichedRecommendation extends Recommendation {
  tmdbId: number | null;
  posterPath: string | null;
  overview: string | null;
  providers: WatchProvider[];
  voteAverage: number | null;
  watchLink: string | null;
}

export interface ViewerProfile {
  archetype: string;
  description: string;
}

export interface FavoriteSlot {
  id: number;
  query: string;
  selected: ShowSummary | null;
}
