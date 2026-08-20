import posthog from "posthog-js";

export type TrackEvent =
  | "landed"
  | "started_typing"
  | "submitted_show"
  | "saw_results"
  | "clicked_favorites_prompt"
  | "submitted_favorites"
  | "saw_profile";

export function track(event: TrackEvent, payload?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  console.log(`[track] ${event}`, payload ?? {});
  posthog.capture(event, payload);
}
