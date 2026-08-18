import { ViewerProfile } from "@/lib/types";

const PALETTES = [
  "from-indigo-600 to-fuchsia-600",
  "from-rose-500 to-orange-500",
  "from-emerald-600 to-teal-500",
  "from-blue-600 to-cyan-500",
  "from-amber-500 to-rose-500",
  "from-violet-600 to-pink-500",
];

function paletteFor(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return PALETTES[hash % PALETTES.length];
}

interface ProfileCardProps {
  profile: ViewerProfile;
  basedOn?: string[];
}

export default function ProfileCard({ profile, basedOn }: ProfileCardProps) {
  const palette = paletteFor(profile.archetype);

  return (
    <div
      className={`mx-auto mt-4 max-w-md rounded-2xl border-4 border-black bg-gradient-to-br ${palette} p-8 text-center text-white shadow-xl`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
        Your Viewer Profile
      </p>
      <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight">
        {profile.archetype}
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-white/90">
        {profile.description}
      </p>

      {basedOn && basedOn.length > 0 && (
        <div className="mt-6 flex flex-wrap justify-center gap-1.5">
          {basedOn.map((title) => (
            <span
              key={title}
              className="rounded-full bg-black/20 px-2.5 py-1 text-xs text-white/90"
            >
              {title}
            </span>
          ))}
        </div>
      )}

      <p className="mt-6 text-xs font-medium text-white/60">
        whatnext — find your next show
      </p>
    </div>
  );
}
