import { cn } from "@/lib/utils/cn";

type Status =
  | "DRAFT"
  | "PUBLISHED"
  | "ARCHIVED"
  | "DUPLICATE"
  | "SCHEDULED"
  | "QUEUED"
  | "FAILED"
  | "CANCELLED"
  | "ACTIVE"
  | "PAUSED"
  | "ERROR";

const STATUS_STYLES: Record<Status, string> = {
  DRAFT:      "bg-[#a09ec0]/10 text-[#a09ec0]",
  PUBLISHED:  "bg-[#22c55e]/10 text-[#22c55e]",
  ARCHIVED:   "bg-[#6b6988]/10 text-[#6b6988]",
  DUPLICATE:  "bg-[#f59e0b]/10 text-[#f59e0b]",
  SCHEDULED:  "bg-[#3b82f6]/10 text-[#3b82f6]",
  QUEUED:     "bg-[#8b5cf6]/10 text-[#8b5cf6]",
  FAILED:     "bg-[#ef4444]/10 text-[#ef4444]",
  CANCELLED:  "bg-[#6b6988]/10 text-[#6b6988]",
  ACTIVE:     "bg-[#22c55e]/10 text-[#22c55e]",
  PAUSED:     "bg-[#f59e0b]/10 text-[#f59e0b]",
  ERROR:      "bg-[#ef4444]/10 text-[#ef4444]",
};

type Props = {
  status: Status;
  className?: string;
};

export function StatusBadge({ status, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        STATUS_STYLES[status],
        className,
      )}
    >
      {status}
    </span>
  );
}
