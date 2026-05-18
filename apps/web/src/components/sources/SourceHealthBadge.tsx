import { cn } from "@/lib/utils/cn";

type Props = {
  lastFetchedAt: Date | string | null;
  status: "ACTIVE" | "PAUSED" | "ERROR";
};

function getHealth(lastFetchedAt: Date | string | null, status: "ACTIVE" | "PAUSED" | "ERROR") {
  if (status === "PAUSED") return { label: "Paused", color: "text-[#f59e0b]", dot: "bg-[#f59e0b]" };
  if (status === "ERROR")  return { label: "Error",  color: "text-[#ef4444]", dot: "bg-[#ef4444]" };
  if (!lastFetchedAt)     return { label: "Never fetched", color: "text-[#6b6988]", dot: "bg-[#6b6988]" };

  const ageMs = Date.now() - new Date(lastFetchedAt).getTime();
  const ageH = ageMs / (1000 * 60 * 60);

  if (ageH < 1)  return { label: "Healthy",  color: "text-[#22c55e]", dot: "bg-[#22c55e]" };
  if (ageH < 6)  return { label: "Stale",    color: "text-[#f59e0b]", dot: "bg-[#f59e0b]" };
  return               { label: "Outdated",  color: "text-[#ef4444]", dot: "bg-[#ef4444]" };
}

export function SourceHealthBadge({ lastFetchedAt, status }: Props) {
  const health = getHealth(lastFetchedAt, status);

  return (
    <span className={cn("flex items-center gap-1.5 text-xs font-medium", health.color)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", health.dot)} />
      {health.label}
    </span>
  );
}
