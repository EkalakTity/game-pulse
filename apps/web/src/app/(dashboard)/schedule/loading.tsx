export default function ScheduleLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-7 w-28 rounded-md bg-[#2e2e3e]" />
      <div className="overflow-hidden rounded-xl border border-[#2e2e3e] bg-[#18181f]">
        <div className="flex items-center justify-between border-b border-[#2e2e3e] px-5 py-4">
          <div className="h-5 w-36 rounded bg-[#2e2e3e]" />
          <div className="h-8 w-24 rounded-md bg-[#2e2e3e]" />
        </div>
        <div className="grid grid-cols-7 border-b border-[#2e2e3e]">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="py-2 text-center">
              <div className="mx-auto h-4 w-8 rounded bg-[#2e2e3e]" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="min-h-[100px] border-b border-r border-[#2e2e3e] p-2">
              <div className="h-4 w-4 rounded-full bg-[#2e2e3e]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
