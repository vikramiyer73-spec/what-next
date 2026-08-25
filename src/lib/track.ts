import posthog from "posthog-js";

export type TrackEvent =
  | "landed"
  | "started_typing"
  | "submitted_show"
  | "saw_results"
  | "dismissed_recommendation"
  | "expanded_description"
  | "saw_light_profile"
  | "clicked_expand_profile"
  | "submitted_favorites"
  | "saw_full_profile"
  | "clicked_recent_search"
  | "expanded_providers"
  | "clicked_provider_link";

export function track(event: TrackEvent, payload?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  console.log(`[track] ${event}`, payload ?? {});
  posthog.capture(event, payload);
}
