"use client";

import { useEffect, useState } from "react";
import ShowAutocomplete from "@/components/ShowAutocomplete";
import RecommendationCard from "@/components/RecommendationCard";
import LightProfile from "@/components/LightProfile";
import FavoritesExpander from "@/components/FavoritesExpander";
import ProfileCard from "@/components/ProfileCard";
import ExampleRecommendation from "@/components/ExampleRecommendation";
import RecentSearches from "@/components/RecentSearches";
import { track } from "@/lib/track";
import { consumeNDJSON } from "@/lib/ndjson";
import { pickRotatingRecentSearches } from "@/lib/recentSearches";
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
  const [recentSearches] = useState<string[]>(() => pickRotatingRecentSearches(5));

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

  async function runSearch(showInfo: SubmittedShowInfo) {
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
        let wasDuplicate = false;
        setRecommendations((prev) => {
          if (prev.some((r) => r.title.toLowerCase() === item.title.toLowerCase())) {
            wasDuplicate = true;
            return prev;
          }
          return [...prev, item];
        });
        if (wasDuplicate) return;
        receivedCount++;
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

  async function handleSubmitShow(e: React.FormEvent) {
    e.preventDefault();
    if (loadingRecs) return;
    const title = selectedShow?.title ?? query.trim();
    if (!title) return;

    const showInfo: SubmittedShowInfo = selectedShow
      ? { title: selectedShow.title, overview: selectedShow.overview, year: selectedShow.year ?? undefined }
      : { title };

    setQuery("");
    setSelectedShow(null);
    runSearch(showInfo);
  }

  function handleClickRecentSearch(show: string) {
    if (loadingRecs) return;
    track("clicked_recent_search", { show });
    setQuery("");
    setSelectedShow(null);
    runSearch({ title: show });
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
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-baseline justify-between">
          <p className="font-barlow text-sm font-medium uppercase tracking-[0.15em] text-white">
            What Next
          </p>
          {submittedShow && (
            <p className="font-barlow text-xs uppercase tracking-[0.15em] text-[#9791B8]">
              You just finished · {submittedShow.title}
            </p>
          )}
        </div>

        {!submittedShow && (
          <div className="mx-auto mt-6 max-w-xl text-center">
            <p className="font-alegreya font-medium text-[20px] leading-snug text-white/90">
              That emptiness you feel when you finish a great show, and you can&apos;t find anything
              to fill that gap.
            </p>
            <p className="font-alegreya font-medium mt-2 text-[16px] leading-snug text-white/50">
              We&apos;ll figure out what you missed about that show and what you should watch next
            </p>
          </div>
        )}

        <form onSubmit={handleSubmitShow} className="mt-6">
          <ShowAutocomplete
            value={query}
            disabled={loadingRecs}
            onChange={(v) => {
              setQuery(v);
              setSelectedShow(null);
            }}
            onSelect={(show) => {
              setSelectedShow(show);
              setQuery(show.title);
            }}
            onFirstType={() => track("started_typing")}
            placeholder={loadingRecs ? "Finding your next watch…" : "e.g. The Wire"}
          />
          <button
            type="submit"
            disabled={loadingRecs || !query.trim()}
            className="font-barlow mt-3 w-full rounded-full bg-white py-3 text-base font-semibold text-[#1a1626] disabled:opacity-40"
          >
            {loadingRecs ? "Finding your next watch…" : "Find my next watch"}
          </button>
        </form>

        {!submittedShow && (
          <>
            <ExampleRecommendation />
            <RecentSearches shows={recentSearches} onSelect={handleClickRecentSearch} />
          </>
        )}

        {recsError && <p className="font-barlow mt-4 text-sm text-red-400">{recsError}</p>}
      </div>

      {submittedShow && (recommendations.length > 0 || loadingRecs) && (
        <section className="mt-8">
          {recommendations.map((rec, index) => (
            <RecommendationCard
              key={rec.title}
              rec={rec}
              index={index}
              onDismiss={() => handleDismiss(rec)}
              dismissing={dismissingTitle === rec.title}
            />
          ))}

          {loadingRecs && (
            <p className="font-barlow animate-pulse py-6 text-sm text-[#9791B8]">
              {recommendations.length === 0 ? "Finding your next watch…" : "Finding more…"}
            </p>
          )}

          {lightProfile && (
            <div className="mx-auto mt-4 flex max-w-2xl flex-col gap-4">
              <LightProfile profile={lightProfile} />

              {!profileExpanded && !fullProfile && (
                <button
                  type="button"
                  onClick={handleClickExpandProfile}
                  className="font-barlow self-start rounded-full border border-white/25 px-4 py-2 text-sm text-white/70 hover:bg-white/10"
                >
                  Add more shows for a fuller read
                </button>
              )}

              {profileExpanded && !fullProfile && (
                <form
                  onSubmit={handleSubmitFullProfile}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5"
                >
                  <p className="font-barlow text-sm font-medium text-white/80">
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
                    className="font-barlow mt-4 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#1a1626] disabled:opacity-40"
                  >
                    See my fuller profile
                  </button>
                  {loadingFullProfile && (
                    <p className="font-barlow animate-pulse mt-3 text-sm text-[#9791B8]">
                      Building your fuller profile…
                    </p>
                  )}
                  {fullProfileError && (
                    <p className="font-barlow mt-2 text-sm text-red-400">{fullProfileError}</p>
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
