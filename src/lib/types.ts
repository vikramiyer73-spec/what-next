export interface ShowSummary {
  id: number;
  title: string;
  year: string | null;
  posterPath: string | null;
  overview: string;
}

export interface Recommendation {
  angle: string;
  title: string;
  reason: string;
}

export interface RecommendResponse {
  recommendations: Recommendation[];
}

export interface ViewerProfile {
  archetype: string;
  description: string;
}
