"use client";

interface RecentSearchesProps {
  shows: string[];
  onSelect: (show: string) => void;
}

export default function RecentSearches({ shows, onSelect }: RecentSearchesProps) {
  if (shows.length === 0) return null;

  return (
    <div className="mt-8">
      <p className="font-barlow text-xs font-medium uppercase tracking-[0.12em] text-[#9791B8]">
        Others just finished
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {shows.map((show) => (
          <button
            key={show}
            type="button"
            onClick={() => onSelect(show)}
            className="font-barlow rounded-full border border-white/15 px-3 py-1.5 text-sm text-white/70 hover:bg-white/10"
          >
            {show}
          </button>
        ))}
      </div>
    </div>
  );
}
