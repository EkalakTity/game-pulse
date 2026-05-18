export default function ArticlesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-7 w-32 rounded-md bg-[#2e2e3e]" />
        <div className="h-9 w-28 rounded-md bg-[#2e2e3e]" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-24 rounded-md bg-[#2e2e3e]" />
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border border-[#2e2e3e]">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-4 border-b border-[#2e2e3e] px-4 py-3">
            <div className="h-4 w-4 rounded bg-[#2e2e3e]" />
            <div className="h-4 flex-1 rounded bg-[#2e2e3e]" />
            <div className="h-4 w-20 rounded bg-[#2e2e3e]" />
            <div className="h-4 w-16 rounded bg-[#2e2e3e]" />
          </div>
        ))}
      </div>
    </div>
  );
}
