import { WatchProvider } from "@/lib/types";
import { colorForProvider } from "@/lib/providerColors";

interface ProviderBadgesProps {
  providers: WatchProvider[];
  overflow: number;
}

export default function ProviderBadges({ providers, overflow }: ProviderBadgesProps) {
  if (providers.length === 0 && overflow === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {providers.map((provider) => {
        const color = colorForProvider(provider.name);
        const quiet = provider.type !== "flatrate";
        return (
          <span
            key={provider.name}
            style={{ borderColor: color, color }}
            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${
              quiet ? "opacity-45" : ""
            }`}
          >
            {provider.name}
          </span>
        );
      })}
      {overflow > 0 && (
        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white/25 text-[10px] text-white/60">
          +{overflow}
        </span>
      )}
    </div>
  );
}
