"use client";

import { useEffect, useState } from "react";
import ShowAutocomplete from "@/components/ShowAutocomplete";
import RecommendationCard from "@/components/RecommendationCard";
import LightProfile from "@/components/LightProfile";
import FavoritesExpander from "@/components/FavoritesExpander";
import ProfileCard from "@/components/ProfileCard";
import { track } from "@/lib/track";
import { consumeNDJSON } from "@/lib/ndjson";
import {
  EnrichedRecommendation,
  FavoriteSlot,
  ShowSummary,
  ViewerProfile,
} from "@/lib/types";

const MAX_ADDITIONAL_FAVORITES = 5;

interface SubmittedShowInfo {
  title: string;
  overview?: string;
  year?: string;
}

function newFavoriteSlot(id: number): FavoriteSlot {
  return { id, query: "", selected: null };
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [selectedShow, setSelectedShow] = useState<ShowSummary | null>(null);

  const [submittedShow, setSubmittedShow] = useState<SubmittedShowInfo | null>(null);
  const [recommendations, setRecommendations] = useState<EnrichedRecommendation[]>([]);
  const [excludedTitles, setExcludedTitles] = useState<string[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [recsError, setRecsError] = useState<string | null>(null);
  const [dismissingTitle, setDismissingTitle] = useState<string | null>(null);

  const [lightProfile, setLightProfile] = useState<ViewerProfile | null>(null);

  const [profileExpanded, setProfileExpanded] = useState(false);
  const [favoriteSlots, setFavoriteSlots] = useState<FavoriteSlot[]>([newFavoriteSlot(0)]);
  const [loadingFullProfile, setLoadingFullProfile] = useState(false);
  const [fullProfileError, setFullProfileError] = useState<string | null>(null);
  const [fullProfile, setFullProfile] = useState<ViewerProfile | null>(null);
  const [fullProfileTitles, setFullProfileTitles] = useState<string[]>([]);

  useEffect(() => {
    track("landed");
  }, []);

  async function fetchLightProfile(show: SubmittedShowInfo) {
    try {
      const res = await fetch("/api/light-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ show: show.title, overview: show.overview, year: show.year }),
      });
      if (!res.ok) throw new Error("request failed");
      const data = await res.json();
      setLightProfile(data);
      track("saw_light_profile", { show: show.title, archetype: data.archetype });
    } catch {
      // Light profile is a bonus, not core — fail silently.
    }
  }

  async function handleSubmitShow(e: React.FormEvent) {
    e.preventDefault();
    const title = selectedShow?.title ?? query.trim();
    if (!title) return;

    const showInfo: SubmittedShowInfo = selectedShow
      ? { title: selectedShow.title, overview: selectedShow.overview, year: selectedShow.year ?? undefined }
      : { title };

    setSubmittedShow(showInfo);
    setRecommendations([]);
    setExcludedTitles([]);
    setRecsError(null);
    setLoadingRecs(true);
    setLightProfile(null);
    setProfileExpanded(false);
    setFavoriteSlots([newFavoriteSlot(0)]);
    setFullProfile(null);
    setFullProfileError(null);
    setFullProfileTitles([]);

    track("submitted_show", { show: showInfo.title });

    // Light profile is independent of the recommend stream — fire in parallel.
    fetchLightProfile(showInfo);

    const startedAt = performance.now();
    let receivedCount = 0;

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ show: showInfo.title, overview: showInfo.overview, year: showInfo.year }),
      });
      if (!res.ok) throw new Error("request failed");

      await consumeNDJSON<EnrichedRecommendation>(res, (item) => {
        receivedCount++;
        setRecommendations((prev) => [...prev, item]);
        setExcludedTitles((prev) => [...prev, item.title]);
      });

      const latencyMs = Math.round(performance.now() - startedAt);
      if (receivedCount === 0) {
        setRecsError("Something went wrong generating recommendations. Try again.");
      } else {
        track("saw_results", { show: showInfo.title, count: receivedCount, latencyMs });
      }
    } catch {
      setRecsError("Something went wrong generating recommendations. Try again.");
    } finally {
      setLoadingRecs(false);
    }
  }

  async function handleDismiss(rec: EnrichedRecommendation) {
    if (!submittedShow) return;
    track("dismissed_recommendation", { show: rec.title });
    setDismissingTitle(rec.title);

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          show: submittedShow.title,
          overview: submittedShow.overview,
          year: submittedShow.year,
          exclude: excludedTitles,
          count: 1,
        }),
      });
      if (!res.ok) throw new Error("request failed");

      let replacement: EnrichedRecommendation | null = null;
      await consumeNDJSON<EnrichedRecommendation>(res, (item) => {
        replacement = item;
      });

      setRecommendations((prev) => {
        const index = prev.findIndex((r) => r.title === rec.title);
        if (index === -1) return prev;
        if (!replacement) {
          return prev.filter((_, i) => i !== index);
        }
        const next = [...prev];
        next[index] = replacement;
        return next;
      });
      if (replacement) {
        setExcludedTitles((prev) => [...prev, (replacement as EnrichedRecommendation).title]);
      }
    } catch {
      setRecommendations((prev) => prev.filter((r) => r.title !== rec.title));
    } finally {
      setDismissingTitle(null);
    }
  }

  function handleClickExpandProfile() {
    track("clicked_expand_profile");
    setProfileExpanded(true);
  }

  function updateFavoriteSlot(id: number, patch: Partial<FavoriteSlot>) {
    setFavoriteSlots((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  function addFavoriteSlot() {
    setFavoriteSlots((prev) =>
      prev.length >= MAX_ADDITIONAL_FAVORITES ? prev : [...prev, newFavoriteSlot(prev.length)],
    );
  }

  async function handleSubmitFullProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!submittedShow) return;

    const additional = favoriteSlots
      .map((f) => f.selected?.title ?? f.query.trim())
      .filter((t) => t.length > 0);
    if (additional.length === 0) return;

    const allTitles = [submittedShow.title, ...additional];

    setLoadingFullProfile(true);
    setFullProfileError(null);
    track("submitted_favorites", { count: additional.length });

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shows: allTitles }),
      });
      if (!res.ok) throw new Error("request failed");
      const data = await res.json();
      setFullProfile(data);
      setFullProfileTitles(allTitles);
      track("saw_full_profile", { archetype: data.archetype, count: allTitles.length });
    } catch {
      setFullProfileError("Something went wrong generating your fuller profile. Try again.");
    } finally {
      setLoadingFullProfile(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <div className="flex items-baseline justify-between">
        <p className="font-archivo text-sm font-bold uppercase tracking-[0.15em] text-white">
          What Next
        </p>
        {submittedShow && (
          <p className="font-archivo text-xs uppercase tracking-[0.15em] text-white/40">
            You just finished · {submittedShow.title}
          </p>
        )}
      </div>

      <p className="font-archivo mt-6 text-center text-lg text-white/70">
        We&apos;ll find you your next watch
      </p>

      <form onSubmit={handleSubmitShow} className="mt-6">
        <ShowAutocomplete
          value={query}
          onChange={(v) => {
            setQuery(v);
            setSelectedShow(null);
          }}
          onSelect={(show) => {
            setSelectedShow(show);
            setQuery(show.title);
          }}
          onFirstType={() => track("started_typing")}
          placeholder="e.g. The Wire"
        />
      </form>

      {recsError && <p className="font-archivo mt-4 text-sm text-red-400">{recsError}</p>}

      {submittedShow && (recommendations.length > 0 || loadingRecs) && (
        <section className="mt-8">
          {recommendations.map((rec) => (
            <RecommendationCard
              key={rec.title}
              rec={rec}
              onDismiss={() => handleDismiss(rec)}
              dismissing={dismissingTitle === rec.title}
            />
          ))}

          {loadingRecs && (
            <p className="font-archivo animate-pulse py-6 text-sm text-white/40">
              {recommendations.length === 0 ? "Finding your next watch…" : "Finding more…"}
            </p>
          )}

          {lightProfile && (
            <div className="mt-4 flex flex-col gap-4">
              <LightProfile profile={lightProfile} />

              {!profileExpanded && !fullProfile && (
                <button
                  type="button"
                  onClick={handleClickExpandProfile}
                  className="font-archivo self-start rounded-full border border-white/25 px-4 py-2 text-sm text-white/70 hover:bg-white/10"
                >
                  Add more shows for a fuller read
                </button>
              )}

              {profileExpanded && !fullProfile && (
                <form
                  onSubmit={handleSubmitFullProfile}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5"
                >
                  <p className="font-archivo text-sm font-medium text-white/80">
                    Add a few more favorites for a fuller read
                  </p>
                  <div className="mt-3">
                    <FavoritesExpander
                      slots={favoriteSlots}
                      onUpdateSlot={updateFavoriteSlot}
                      onAddSlot={addFavoriteSlot}
                      maxSlots={MAX_ADDITIONAL_FAVORITES}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loadingFullProfile || favoriteSlots.every((f) => !f.query.trim())}
                    className="font-archivo mt-4 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#1a1626] disabled:opacity-40"
                  >
                    {loadingFullProfile ? "Building your fuller profile…" : "See my fuller profile"}
                  </button>
                  {fullProfileError && (
                    <p className="font-archivo mt-2 text-sm text-red-400">{fullProfileError}</p>
                  )}
                </form>
              )}

              {fullProfile && <ProfileCard profile={fullProfile} basedOn={fullProfileTitles} />}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
