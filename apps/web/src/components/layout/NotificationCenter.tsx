"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Bell, CheckCheck, AlertCircle, Clock, Zap, Info, X } from "lucide-react";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

type ApiResponse = {
  notifications: Notification[];
  unreadCount: number;
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  JOB_FAILED: <AlertCircle size={14} className="text-[#ef4444]" />,
  TOKEN_EXPIRING: <Clock size={14} className="text-[#f59e0b]" />,
  TOKEN_EXPIRED: <AlertCircle size={14} className="text-[#ef4444]" />,
  SURGE_ALERT: <Zap size={14} className="text-[#7c3aed]" />,
  SYSTEM: <Info size={14} className="text-[#6366f1]" />,
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<ApiResponse>({ notifications: [], unreadCount: 0 });
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/notifications");
      if (res.ok) setData(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function markAllRead() {
    await fetch("/api/v1/notifications/read-all", { method: "PATCH" });
    setData((d) => ({
      ...d,
      unreadCount: 0,
      notifications: d.notifications.map((n) => ({ ...n, isRead: true })),
    }));
  }

  async function markRead(id: string) {
    await fetch(`/api/v1/notifications/${id}/read`, { method: "PATCH" });
    setData((d) => ({
      ...d,
      unreadCount: Math.max(0, d.unreadCount - 1),
      notifications: d.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    }));
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-md p-1.5 text-[#a09ec0] transition-colors hover:bg-[#222230] hover:text-[#f1f0ff]"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {data.unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#6366f1] px-1 text-[10px] font-bold text-white">
            {data.unreadCount > 99 ? "99+" : data.unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-80 rounded-lg border border-[#2e2e3e] bg-[#18181f] shadow-xl">
          <div className="flex items-center justify-between border-b border-[#2e2e3e] px-4 py-3">
            <span className="text-sm font-semibold text-[#f1f0ff]">Notifications</span>
            <div className="flex items-center gap-2">
              {data.unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-[#a09ec0] hover:text-[#6366f1]"
                >
                  <CheckCheck size={13} />
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-[#a09ec0] hover:text-[#f1f0ff]">
                <X size={14} />
              </button>
            </div>
          </div>

          <ul className="max-h-80 overflow-y-auto">
            {data.notifications.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-[#a09ec0]">No notifications</li>
            ) : (
              data.notifications.map((n) => (
                <li
                  key={n.id}
                  onClick={() => !n.isRead && markRead(n.id)}
                  className={`cursor-pointer border-b border-[#2e2e3e] px-4 py-3 transition-colors last:border-0 hover:bg-[#222230] ${
                    !n.isRead ? "bg-[#1e1e2e]" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0">
                      {TYPE_ICON[n.type] ?? <Info size={14} className="text-[#6366f1]" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`truncate text-xs font-medium ${!n.isRead ? "text-[#f1f0ff]" : "text-[#a09ec0]"}`}>
                          {n.title}
                        </p>
                        <span className="shrink-0 text-[10px] text-[#6b6b8a]">{timeAgo(n.createdAt)}</span>
                      </div>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-[#6b6b8a] line-clamp-2">{n.message}</p>
                    </div>
                    {!n.isRead && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#6366f1]" />}
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
