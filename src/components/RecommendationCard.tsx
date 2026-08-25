"use client";

import { useState } from "react";
import { EnrichedRecommendation } from "@/lib/types";
import { TMDB_POSTER_BASE_LARGE } from "@/lib/tmdb";
import { track } from "@/lib/track";
import { accentColorForRow } from "@/lib/rowAccents";
import ProviderBadges from "./ProviderBadges";

interface RecommendationCardProps {
  rec: EnrichedRecommendation;
  index: number;
  onDismiss: () => void;
  dismissing: boolean;
}

/**
 * Long titles ("LAST CHANCE U: BASKETBALL") need a lower ceiling than short
 * ones ("THE WIRE") so they don't force as much wrapping at the same
 * viewport width — clamp() alone can't be content-length-aware.
 */
function titleFontSize(title: string): string {
  return title.length > 20 ? "clamp(24px, 3.2vw, 42px)" : "clamp(32px, 4vw, 56px)";
}

export default function RecommendationCard({ rec, index, onDismiss, dismissing }: RecommendationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const accent = accentColorForRow(index);

  function handleExpand() {
    const next = !expanded;
    setExpanded(next);
    if (next) {
      track("expanded_description", { show: rec.title });
    }
  }

  return (
    <div
      className="animate-fade-up-in grid grid-cols-[140px_minmax(360px,1fr)_280px] gap-12 border-b border-white/10 py-7 pl-5 max-lg:grid-cols-1 max-lg:gap-3 max-lg:pl-4"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <p
        className="font-barlow font-medium uppercase tracking-[0.08em] text-[16px] lg:text-[24px]"
        style={{ color: "#B3ACD6" }}
      >
        If what you miss is
      </p>

      <div className="min-w-0">
        <p className="font-alegreya font-medium leading-snug text-[#EDEBF4] max-w-[65ch] text-[20px] lg:text-[27px]">
          {rec.angle}
        </p>

        <h3
          className="font-barlow font-medium uppercase tracking-[0.08em] mt-2 leading-[1.05]"
          style={{ color: accent, fontSize: titleFontSize(rec.title), wordBreak: "normal", overflowWrap: "break-word" }}
        >
          {rec.title}
        </h3>

        {rec.voteAverage !== null && (
          <p className="font-barlow mt-1 text-[13px] text-[#9791B8]">
            <span aria-hidden="true">★</span> {rec.voteAverage.toFixed(1)}
          </p>
        )}

        {rec.providers.length > 0 && (
          <div className="mt-2">
            <ProviderBadges providers={rec.providers} showTitle={rec.title} watchLink={rec.watchLink} />
          </div>
        )}

        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={onDismiss}
            disabled={dismissing}
            className="font-barlow rounded-full border border-white/25 px-3 py-1 text-xs text-white/70 hover:bg-white/10 disabled:opacity-40"
          >
            {dismissing ? "Finding another…" : "Already Watched?"}
          </button>
          <span className="font-barlow text-xs text-white/60">We&apos;ll give you a new suggestion</span>
        </div>

        <p className="font-alegreya font-medium tracking-normal mt-3 max-w-[65ch] text-[16px] leading-relaxed text-[#D8D5E6]">
          {rec.reason}
          {rec.overview && (
            <>
              {" "}
              <button
                type="button"
                onClick={handleExpand}
                className="font-barlow text-white/60 underline decoration-white/30 hover:text-white/85"
              >
                {expanded ? "Hide description" : "See full description"}
              </button>
            </>
          )}
        </p>

        {expanded && rec.overview && (
          <div className="font-alegreya font-medium tracking-normal mt-2 max-w-[65ch] rounded-xl bg-white/5 p-3 text-[16px] leading-relaxed text-[#C7C3DA]">
            {rec.overview}
          </div>
        )}
      </div>

      <div className="mt-4 lg:mt-0">
        {rec.posterPath ? (
          <img
            src={`${TMDB_POSTER_BASE_LARGE}${rec.posterPath}`}
            alt={rec.title}
            className="w-full max-w-[260px] rounded-lg border border-white/10 object-cover lg:max-w-none"
          />
        ) : (
          <div className="aspect-2/3 w-full max-w-[260px] rounded-lg bg-white/5 lg:max-w-none" />
        )}
      </div>
    </div>
  );
}
