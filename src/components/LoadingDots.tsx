export default function LoadingDots() {
  return (
    <span className="inline-flex items-center gap-1" aria-hidden="true">
      <span className="loading-dot h-1.5 w-1.5 rounded-full bg-current" style={{ animationDelay: "0ms" }} />
      <span className="loading-dot h-1.5 w-1.5 rounded-full bg-current" style={{ animationDelay: "150ms" }} />
      <span className="loading-dot h-1.5 w-1.5 rounded-full bg-current" style={{ animationDelay: "300ms" }} />
    </span>
  );
}
