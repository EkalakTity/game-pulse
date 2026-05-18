import { cn } from "@/lib/utils/cn";

type Props = {
  name: string;
  color: string;
  className?: string;
};

export function CategoryPill({ name, color, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        className,
      )}
      style={{
        backgroundColor: `${color}1a`,
        color,
        borderColor: `${color}33`,
        border: "1px solid",
      }}
    >
      {name}
    </span>
  );
}
