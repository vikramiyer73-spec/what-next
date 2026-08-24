"use client";

import { useEffect, useRef, useState } from "react";
import { ShowSummary } from "@/lib/types";
import { TMDB_POSTER_BASE } from "@/lib/tmdb";

interface ShowAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (show: ShowSummary) => void;
  placeholder?: string;
  onFirstType?: () => void;
  disabled?: boolean;
}

export default function ShowAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  onFirstType,
  disabled,
}: ShowAutocompleteProps) {
  const [results, setResults] = useState<ShowSummary[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const hasTypedRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!value.trim()) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/tmdb-search?q=${encodeURIComponent(value)}`);
        const data = await res.json();
        setResults(data.results ?? []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => {
          if (!hasTypedRef.current) {
            hasTypedRef.current = true;
            onFirstType?.();
          }
          onChange(e.target.value);
        }}
        onFocus={() => {
          if (results.length > 0) setOpen(true);
        }}
        onBlur={() => {
          setTimeout(() => setOpen(false), 150);
        }}
        className="w-full rounded-full border border-white/15 bg-white/5 px-5 py-3 text-base text-white placeholder:text-white/35 focus:border-white/30 focus:outline-none disabled:cursor-not-allowed disabled:border-white/5 disabled:bg-white/[0.03] disabled:text-white/50 disabled:placeholder:text-white/30"
      />
      {loading && (
        <span className="absolute right-5 top-3.5 text-xs text-white/40">…</span>
      )}
      {open && value.trim() && results.length > 0 && (
        <ul className="absolute z-10 mt-2 w-full max-h-72 overflow-y-auto rounded-2xl border border-white/10 bg-[#241f30] shadow-xl">
          {results.map((show) => {
            const isAmbiguous = results.some(
              (other) =>
                other.id !== show.id &&
                other.title.toLowerCase() === show.title.toLowerCase() &&
                other.year === show.year,
            );
            return (
              <li key={show.id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onSelect(show);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-white/90 hover:bg-white/10"
                >
                  {show.posterPath ? (
                    <img
                      src={`${TMDB_POSTER_BASE}${show.posterPath}`}
                      alt=""
                      className="h-10 w-7 flex-shrink-0 rounded object-cover"
                    />
                  ) : (
                    <span className="h-10 w-7 flex-shrink-0 rounded bg-white/10" />
                  )}
                  <span className="text-[15px]">
                    {show.title}
                    {show.year ? ` (${show.year})` : ""}
                    {isAmbiguous && show.originCountry ? (
                      <span className="text-white/40"> · {show.originCountry}</span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
