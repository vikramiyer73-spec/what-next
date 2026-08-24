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
    <div className="relative mt-10 opacity-60">
      <span className="font-barlow absolute -top-4 left-0 text-[11px] font-medium uppercase tracking-[0.15em] text-white/40">
        Example
      </span>
      <div className="grid grid-cols-[100px_1fr_140px] gap-6 pt-4 max-md:grid-cols-1 max-md:gap-3">
        <p
          className="font-barlow font-medium uppercase tracking-[0.08em] text-[13px] md:text-[16px]"
          style={{ color: "#958FB5" }}
        >
          If what you miss is
        </p>

        <div className="min-w-0">
          <p className="font-garamond italic font-medium leading-snug text-white text-[18px] md:text-[26px]">
            {EXAMPLE.angle}
          </p>
          <h3
            className="font-barlow font-medium uppercase tracking-[0.08em] mt-2 text-[22px] md:text-[34px] leading-none"
            style={{ color: "#E8E4FF" }}
          >
            {EXAMPLE.title}
          </h3>
          <p className="font-alegreya font-medium mt-2 text-[15px] leading-relaxed text-white/60">
            {EXAMPLE.reason}
          </p>
        </div>

        <div className="max-md:hidden">
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
