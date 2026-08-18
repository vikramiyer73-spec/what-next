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
        className="w-full border border-gray-400 px-3 py-2 text-base disabled:bg-gray-100"
      />
      {loading && (
        <span className="absolute right-3 top-2.5 text-xs text-gray-500">…</span>
      )}
      {open && value.trim() && results.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full max-h-72 overflow-y-auto border border-gray-400 bg-white">
          {results.map((show) => (
            <li key={show.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelect(show);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-100"
              >
                {show.posterPath ? (
                  <img
                    src={`${TMDB_POSTER_BASE}${show.posterPath}`}
                    alt=""
                    className="h-10 w-7 flex-shrink-0 object-cover"
                  />
                ) : (
                  <span className="h-10 w-7 flex-shrink-0 bg-gray-200" />
                )}
                <span>
                  {show.title}
                  {show.year ? ` (${show.year})` : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
