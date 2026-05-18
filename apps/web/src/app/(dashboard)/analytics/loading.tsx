export default function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 rounded-md bg-[#2e2e3e] animate-pulse" />
        <div className="h-9 w-28 rounded-md bg-[#2e2e3e] animate-pulse" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-[#2e2e3e] animate-pulse" />
        ))}
      </div>
      <div className="h-12 rounded-lg bg-[#2e2e3e] animate-pulse" />
      <div className="h-52 rounded-lg bg-[#2e2e3e] animate-pulse" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-52 rounded-lg bg-[#2e2e3e] animate-pulse" />
        <div className="h-52 rounded-lg bg-[#2e2e3e] animate-pulse" />
      </div>
    </div>
  );
}
