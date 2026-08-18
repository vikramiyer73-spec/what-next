"use client";

import { useEffect, useState } from "react";
import ShowAutocomplete from "@/components/ShowAutocomplete";
import ProfileCard from "@/components/ProfileCard";
import { track } from "@/lib/track";
import { Recommendation, ShowSummary, ViewerProfile } from "@/lib/types";

interface FavoriteSlot {
  id: number;
  query: string;
  selected: ShowSummary | null;
}

function newFavoriteSlots(): FavoriteSlot[] {
  return Array.from({ length: 5 }, (_, i) => ({ id: i, query: "", selected: null }));
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [selectedShow, setSelectedShow] = useState<ShowSummary | null>(null);
  const [submittedShow, setSubmittedShow] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [recsError, setRecsError] = useState<string | null>(null);

  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteSlot[]>(newFavoriteSlots());
  const [profile, setProfile] = useState<ViewerProfile | null>(null);
  const [profileTitles, setProfileTitles] = useState<string[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    track("landed");
  }, []);

  async function handleSubmitShow(e: React.FormEvent) {
    e.preventDefault();
    const show = selectedShow?.title ?? query.trim();
    if (!show) return;

    setSubmittedShow(show);
    setRecommendations(null);
    setRecsError(null);
    setLoadingRecs(true);
    track("submitted_show", { show });

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ show }),
      });
      if (!res.ok) throw new Error("request failed");
      const data = await res.json();
      setRecommendations(data.recommendations);
      track("saw_results", { show, count: data.recommendations?.length ?? 0 });
    } catch {
      setRecsError("Something went wrong generating recommendations. Try again.");
    } finally {
      setLoadingRecs(false);
    }
  }

  function handleClickFavoritesPrompt() {
    track("clicked_favorites_prompt");
    setFavoritesOpen(true);
  }

  function updateFavoriteSlot(id: number, patch: Partial<FavoriteSlot>) {
    setFavorites((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  async function handleSubmitFavorites(e: React.FormEvent) {
    e.preventDefault();
    const titles = favorites
      .map((f) => f.selected?.title ?? f.query.trim())
      .filter((t) => t.length > 0);
    if (titles.length === 0) return;

    setProfile(null);
    setProfileError(null);
    setLoadingProfile(true);
    track("submitted_favorites", { count: titles.length });

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shows: titles }),
      });
      if (!res.ok) throw new Error("request failed");
      const data = await res.json();
      setProfile(data);
      setProfileTitles(titles);
      track("saw_profile", { archetype: data.archetype });
    } catch {
      setProfileError("Something went wrong generating your profile. Try again.");
    } finally {
      setLoadingProfile(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-bold">What Next</h1>
      <p className="mt-1 text-sm text-gray-600">
        Tell us the show you just finished. We&apos;ll figure out what you&apos;ll miss about it.
      </p>

      <form onSubmit={handleSubmitShow} className="mt-6 flex gap-2">
        <div className="flex-1">
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
        </div>
        <button
          type="submit"
          disabled={loadingRecs || !query.trim()}
          className="border border-black bg-black px-4 py-2 text-white disabled:opacity-40"
        >
          {loadingRecs ? "Thinking…" : "Submit"}
        </button>
      </form>

      {recsError && <p className="mt-4 text-sm text-red-600">{recsError}</p>}

      {submittedShow && recommendations && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">
            Because you finished <em>{submittedShow}</em>
          </h2>
          <ul className="mt-4 flex flex-col gap-4">
            {recommendations.map((rec, i) => (
              <li key={i} className="border border-gray-300 p-4">
                <p className="text-sm text-gray-700">
                  {rec.angle}, try <strong>{rec.title}</strong>.
                </p>
                <p className="mt-1 text-sm text-gray-500">{rec.reason}</p>
              </li>
            ))}
          </ul>

          {!favoritesOpen && (
            <button
              type="button"
              onClick={handleClickFavoritesPrompt}
              className="mt-6 border border-gray-400 px-4 py-2 text-sm hover:bg-gray-50"
            >
              Add up to 5 all-time favorites to see your viewer profile
            </button>
          )}

          {favoritesOpen && !profile && (
            <form onSubmit={handleSubmitFavorites} className="mt-6 border border-gray-300 p-4">
              <p className="text-sm font-medium">Your all-time favorite shows</p>
              <div className="mt-3 flex flex-col gap-2">
                {favorites.map((slot) => (
                  <ShowAutocomplete
                    key={slot.id}
                    value={slot.query}
                    onChange={(v) => updateFavoriteSlot(slot.id, { query: v, selected: null })}
                    onSelect={(show) =>
                      updateFavoriteSlot(slot.id, { selected: show, query: show.title })
                    }
                    placeholder={`Favorite #${slot.id + 1} (optional)`}
                  />
                ))}
              </div>
              <button
                type="submit"
                disabled={loadingProfile || favorites.every((f) => !f.query.trim())}
                className="mt-4 border border-black bg-black px-4 py-2 text-sm text-white disabled:opacity-40"
              >
                {loadingProfile ? "Building your profile…" : "See my viewer profile"}
              </button>
              {profileError && <p className="mt-2 text-sm text-red-600">{profileError}</p>}
            </form>
          )}

          {profile && <ProfileCard profile={profile} basedOn={profileTitles} />}
        </section>
      )}
    </div>
  );
}
