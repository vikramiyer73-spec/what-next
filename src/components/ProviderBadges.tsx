"use client";

import { useState } from "react";
import { WatchProvider } from "@/lib/types";
import { pillColorForProvider } from "@/lib/providerColors";
import { TMDB_LOGO_BASE } from "@/lib/tmdb";
import { track } from "@/lib/track";

const VISIBLE_COUNT = 2;

function ProviderPill({ provider }: { provider: WatchProvider }) {
  const color = pillColorForProvider(provider.name);
  const quiet = provider.type !== "flatrate";

  return (
    <span
      title={provider.type === "flatrate" ? provider.name : `${provider.name} (${provider.type})`}
      style={{ borderColor: color, backgroundColor: `${color}1f` }}
      className={`inline-flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 ${quiet ? "opacity-70" : ""}`}
    >
      {provider.logoPath ? (
        <img
          src={`${TMDB_LOGO_BASE}${provider.logoPath}`}
          alt={provider.name}
          className="h-9 w-9 rounded-full object-cover"
        />
      ) : (
        <span className="font-barlow px-1 text-[13px] font-medium text-white/80">{provider.name}</span>
      )}
      {quiet && (
        <span className="font-barlow text-[10px] font-medium uppercase tracking-wide text-white/50">
          {provider.type}
        </span>
      )}
    </span>
  );
}

interface ProviderBadgesProps {
  providers: WatchProvider[];
  showTitle: string;
}

export default function ProviderBadges({ providers, showTitle }: ProviderBadgesProps) {
  const [expanded, setExpanded] = useState(false);

  if (providers.length === 0) return null;

  const visible = providers.slice(0, VISIBLE_COUNT);
  const rest = providers.slice(VISIBLE_COUNT);
  const restGrouped = [...rest].sort((a, b) => {
    const rank = (type: WatchProvider["type"]) => (type === "flatrate" ? 0 : 1);
    return rank(a.type) - rank(b.type);
  });

  function handleToggle() {
    const next = !expanded;
    setExpanded(next);
    if (next) {
      track("expanded_providers", { show: showTitle });
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {visible.map((provider) => (
        <ProviderPill key={provider.name} provider={provider} />
      ))}

      {rest.length > 0 && (
        <button
          type="button"
          onClick={handleToggle}
          className="font-barlow flex h-11 items-center justify-center rounded-full border border-white/25 px-4 text-[13px] text-white/60 hover:bg-white/10"
        >
          {expanded ? "Show less" : `+${rest.length}`}
        </button>
      )}

      {rest.length > 0 && (
        <div
          className="grid basis-full transition-[grid-template-rows] duration-300 ease-out"
          style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
        >
          <div className="overflow-hidden">
            <div className="mt-2 flex flex-wrap gap-2">
              {restGrouped.map((provider) => (
                <ProviderPill key={provider.name} provider={provider} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
