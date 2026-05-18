export default function CategoriesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-7 w-32 rounded-md bg-[#2e2e3e]" />
      <div className="flex gap-3">
        <div className="h-9 flex-1 max-w-sm rounded-md bg-[#2e2e3e]" />
        <div className="h-9 w-32 rounded-md bg-[#2e2e3e]" />
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-8 w-28 rounded-full bg-[#2e2e3e]" />
        ))}
      </div>
    </div>
  );
}
