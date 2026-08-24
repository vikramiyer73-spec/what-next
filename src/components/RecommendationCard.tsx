"use client";

import { useState } from "react";
import { EnrichedRecommendation } from "@/lib/types";
import { TMDB_POSTER_BASE_LARGE } from "@/lib/tmdb";
import { track } from "@/lib/track";
import ProviderBadges from "./ProviderBadges";

interface RecommendationCardProps {
  rec: EnrichedRecommendation;
  onDismiss: () => void;
  dismissing: boolean;
}

export default function RecommendationCard({ rec, onDismiss, dismissing }: RecommendationCardProps) {
  const [expanded, setExpanded] = useState(false);

  function handleExpand() {
    const next = !expanded;
    setExpanded(next);
    if (next) {
      track("expanded_description", { show: rec.title });
    }
  }

  return (
    <div className="animate-fade-up-in grid grid-cols-[140px_1fr_240px] gap-8 border-b border-white/10 py-10 max-md:grid-cols-1 max-md:gap-4">
      <p
        className="font-barlow font-medium uppercase tracking-[0.08em] text-[16px] md:text-[24px]"
        style={{ color: "#958FB5" }}
      >
        If what you miss is
      </p>

      <div className="min-w-0">
        <p className="font-garamond italic font-medium leading-snug text-white text-[24px] md:text-[38px]">
          {rec.angle}
        </p>

        <h3
          className="font-barlow font-medium uppercase tracking-[0.08em] mt-3 text-[32px] md:text-[56px] leading-none"
          style={{ color: "#E8E4FF" }}
        >
          {rec.title}
        </h3>

        {rec.providers.length > 0 && (
          <div className="mt-3">
            <ProviderBadges providers={rec.providers} showTitle={rec.title} />
          </div>
        )}

        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={onDismiss}
            disabled={dismissing}
            className="font-barlow rounded-full border border-white/25 px-3 py-1 text-xs text-white/70 hover:bg-white/10 disabled:opacity-40"
          >
            {dismissing ? "Finding another…" : "Already Watched?"}
          </button>
          <span className="font-barlow text-xs text-white/35">We&apos;ll give you a new suggestion</span>
        </div>

        <p className="font-alegreya font-medium tracking-normal mt-4 text-[18px] leading-relaxed text-white/70">
          {rec.reason}
          {rec.overview && (
            <>
              {" "}
              <button
                type="button"
                onClick={handleExpand}
                className="font-barlow text-white/50 underline decoration-white/30 hover:text-white/80"
              >
                {expanded ? "Hide description" : "See full description"}
              </button>
            </>
          )}
        </p>

        {expanded && rec.overview && (
          <div className="font-alegreya font-medium tracking-normal mt-3 rounded-xl bg-white/5 p-4 text-[18px] leading-relaxed text-white/60">
            {rec.overview}
          </div>
        )}
      </div>

      <div className="max-md:hidden">
        {rec.posterPath ? (
          <img
            src={`${TMDB_POSTER_BASE_LARGE}${rec.posterPath}`}
            alt={rec.title}
            className="w-full rounded-lg border border-white/10 object-cover"
          />
        ) : (
          <div className="aspect-2/3 w-full rounded-lg bg-white/5" />
        )}
      </div>
    </div>
  );
}
