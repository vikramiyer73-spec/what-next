import { ViewerProfile } from "@/lib/types";

interface LightProfileProps {
  profile: ViewerProfile;
}

export default function LightProfile({ profile }: LightProfileProps) {
  return (
    <div className="border-t border-white/10 pt-8">
      <p className="font-barlow text-xs font-medium uppercase tracking-[0.15em] text-white/40">
        A quick first read
      </p>
      <h3 className="font-barlow mt-2 text-[32px] leading-tight font-medium text-white">
        {profile.archetype}
      </h3>
      <p className="font-alegreya font-medium mt-2 text-base leading-relaxed text-white/70">
        {profile.description}
      </p>
    </div>
  );
}
