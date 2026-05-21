"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Newspaper,
  Rss,
  Tag,
  CalendarDays,
  Share2,
  BarChart2,
  Activity,
  ExternalLink,
  Webhook,
  KeyRound,
  Building2,
  Gamepad2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/articles", label: "Articles", icon: Newspaper },
  { href: "/sources", label: "Feed Sources", icon: Rss },
  { href: "/games", label: "Game Feeds", icon: Gamepad2 },
  { href: "/categories", label: "Categories", icon: Tag },
  { href: "/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/social", label: "Social Posts", icon: Share2 },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/settings/webhooks", label: "Webhooks", icon: Webhook },
  { href: "/settings/api-keys", label: "API Keys", icon: KeyRound },
  { href: "/settings/tenants", label: "Tenants", icon: Building2 },
] as const;

const BULL_BOARD_URL = process.env["NEXT_PUBLIC_BULL_BOARD_URL"] ?? "http://localhost:3003";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 flex-col border-r border-[#2e2e3e] bg-[#18181f]">
      <div className="flex h-14 items-center border-b border-[#2e2e3e] px-4">
        <span className="text-lg font-bold text-[#8b5cf6]">GamePulse</span>
        <span className="ml-1 text-lg font-light text-[#f1f0ff]">Hub</span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#6d28d9]/20 text-[#8b5cf6]"
                  : "text-[#a09ec0] hover:bg-[#222230] hover:text-[#f1f0ff]",
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}

        <div className="pt-2 mt-2 border-t border-[#2e2e3e]">
          <a
            href={BULL_BOARD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-[#a09ec0] hover:bg-[#222230] hover:text-[#f1f0ff] transition-colors"
          >
            <Activity size={18} />
            Queue Monitor
            <ExternalLink size={11} className="ml-auto opacity-50" />
          </a>
        </div>
      </nav>
    </aside>
  );
}
