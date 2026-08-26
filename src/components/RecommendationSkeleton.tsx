import { accentColorForRow } from "@/lib/rowAccents";

interface RecommendationSkeletonProps {
  index: number;
}

function Bar({ className = "" }: { className?: string }) {
  return <div className={`skeleton-bar rounded ${className}`} />;
}

export default function RecommendationSkeleton({ index }: RecommendationSkeletonProps) {
  const accent = accentColorForRow(index);

  return (
    <div
      className="animate-fade-up-in grid grid-cols-[140px_minmax(360px,1fr)_280px] gap-12 border-b border-white/10 py-7 pl-5 max-lg:grid-cols-1 max-lg:gap-3 max-lg:pl-4"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <Bar className="h-4 w-28" />

      <div className="flex min-w-0 flex-col gap-3">
        <Bar className="h-5 w-4/5" />
        <Bar className="h-9 w-1/2" />
        <Bar className="h-3 w-12" />
        <div className="mt-1 flex flex-col gap-2">
          <Bar className="h-4 w-full" />
          <Bar className="h-4 w-11/12" />
          <Bar className="h-4 w-2/3" />
        </div>
      </div>

      <div className="mt-4 lg:mt-0">
        <Bar className="aspect-2/3 w-full max-w-[260px] lg:max-w-none" />
      </div>
    </div>
  );
}
