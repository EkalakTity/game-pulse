export default function SocialLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-7 w-32 rounded-md bg-[#2e2e3e]" />
      <div className="flex items-center justify-between">
        <div className="h-9 w-48 rounded-lg bg-[#2e2e3e]" />
        <div className="h-9 w-36 rounded-md bg-[#2e2e3e]" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl border border-[#2e2e3e] bg-[#18181f]" />
        ))}
      </div>
    </div>
  );
}
