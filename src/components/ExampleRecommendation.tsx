import { TMDB_POSTER_BASE_LARGE } from "@/lib/tmdb";

const EXAMPLE = {
  angle: "the way grief was allowed to be funny",
  title: "Rectify",
  reason:
    "A man's return home after 19 years on death row becomes an unexpectedly tender, darkly funny meditation on grief and reentry.",
  posterPath: "/tm9nQe9165cyjnTz8NB50izwcpJ.jpg",
};

export default function ExampleRecommendation() {
  return (
    <div className="mt-10 rounded-2xl border border-dashed border-white/20 bg-white/[0.03] p-5">
      <span className="font-barlow inline-block rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#B3ACD6]">
        Example — not a real result
      </span>

      <div className="mt-4 grid grid-cols-[100px_1fr_140px] gap-6 opacity-70 max-lg:grid-cols-1 max-lg:gap-3">
        <p
          className="font-barlow font-medium uppercase tracking-[0.08em] text-[13px] lg:text-[16px]"
          style={{ color: "#B3ACD6" }}
        >
          If what you miss is
        </p>

        <div className="min-w-0">
          <p className="font-alegreya font-medium leading-snug text-[#EDEBF4] text-[16px] lg:text-[20px]">
            {EXAMPLE.angle}
          </p>
          <h3 className="font-barlow font-medium uppercase tracking-[0.08em] mt-2 text-[22px] leading-none text-white/70 lg:text-[32px]">
            {EXAMPLE.title}
          </h3>
          <p className="font-alegreya font-medium mt-2 text-[14px] leading-relaxed text-[#C7C3DA]">
            {EXAMPLE.reason}
          </p>
        </div>

        <div className="max-lg:hidden">
          <img
            src={`${TMDB_POSTER_BASE_LARGE}${EXAMPLE.posterPath}`}
            alt=""
            className="w-full rounded-lg border border-white/10 object-cover"
          />
        </div>
      </div>
    </div>
  );
}
