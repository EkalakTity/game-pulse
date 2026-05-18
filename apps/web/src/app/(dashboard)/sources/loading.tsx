export default function SourcesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-7 w-36 rounded-md bg-[#2e2e3e]" />
      <div className="flex gap-3">
        <div className="h-9 flex-1 max-w-sm rounded-md bg-[#2e2e3e]" />
        <div className="h-9 w-28 rounded-md bg-[#2e2e3e]" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-36 rounded-xl border border-[#2e2e3e] bg-[#18181f]" />
        ))}
      </div>
    </div>
  );
}
