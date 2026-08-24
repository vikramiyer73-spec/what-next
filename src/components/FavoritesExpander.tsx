"use client";

import { FavoriteSlot } from "@/lib/types";
import ShowAutocomplete from "./ShowAutocomplete";

interface FavoritesExpanderProps {
  slots: FavoriteSlot[];
  onUpdateSlot: (id: number, patch: Partial<FavoriteSlot>) => void;
  onAddSlot: () => void;
  maxSlots: number;
}

export default function FavoritesExpander({
  slots,
  onUpdateSlot,
  onAddSlot,
  maxSlots,
}: FavoritesExpanderProps) {
  return (
    <div className="flex flex-col gap-2">
      {slots.map((slot, i) => (
        <ShowAutocomplete
          key={slot.id}
          value={slot.query}
          onChange={(v) => onUpdateSlot(slot.id, { query: v, selected: null })}
          onSelect={(show) => onUpdateSlot(slot.id, { selected: show, query: show.title })}
          placeholder={`Favorite show #${i + 1}`}
        />
      ))}
      {slots.length < maxSlots && (
        <button
          type="button"
          onClick={onAddSlot}
          className="font-archivo self-start text-sm text-white/50 underline decoration-white/30 hover:text-white/80"
        >
          + Add another
        </button>
      )}
    </div>
  );
}
