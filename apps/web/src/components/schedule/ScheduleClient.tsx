"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { SocialPostWithRelations } from "@/server/repositories/SocialPostRepository";
import { PLATFORM_META } from "@/lib/platforms";
import { socialPostsApi } from "@/lib/api/socialPosts";

type Props = { initialPosts: SocialPostWithRelations[] };

function getMonthDays(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days: Date[] = [];
  // pad start
  for (let i = 0; i < first.getDay(); i++) days.push(new Date(year, month, -i));
  days.splice(0, first.getDay()); // remove padding — use CSS grid col-start instead
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
  return days;
}

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function ScheduleClient({ initialPosts }: Props) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [posts, setPosts] = useState(initialPosts);

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  }

  const days = getMonthDays(year, month);
  const firstDow = new Date(year, month, 1).getDay();

  const postsByDay = new Map<string, SocialPostWithRelations[]>();
  for (const post of posts) {
    if (!post.scheduledAt) continue;
    const d = new Date(post.scheduledAt);
    if (d.getFullYear() !== year || d.getMonth() !== month) continue;
    const key = d.getDate().toString();
    const list = postsByDay.get(key) ?? [];
    list.push(post);
    postsByDay.set(key, list);
  }

  async function handleCancel(postId: string) {
    const updated = await socialPostsApi.cancel(postId);
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }

  return (
    <div className="rounded-xl border border-[#2e2e3e] bg-[#18181f] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#2e2e3e] px-5 py-4">
        <h3 className="text-sm font-semibold text-[#f1f0ff]">
          {new Date(year, month).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </h3>
        <div className="flex gap-1">
          <button
            onClick={prevMonth}
            className="rounded-md p-1.5 text-[#6b6988] hover:bg-[#2e2e3e] hover:text-[#f1f0ff] transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); }}
            className="rounded-md px-2 py-1 text-xs text-[#a09ec0] hover:bg-[#2e2e3e] hover:text-[#f1f0ff] transition-colors"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="rounded-md p-1.5 text-[#6b6988] hover:bg-[#2e2e3e] hover:text-[#f1f0ff] transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 border-b border-[#2e2e3e]">
        {DOW.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-xs font-medium text-[#6b6988]"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {/* Offset first day */}
        {Array.from({ length: firstDow }).map((_, i) => (
          <div key={`pad-${i}`} className="min-h-[100px] border-b border-r border-[#2e2e3e] bg-[#111118]" />
        ))}

        {days.map((day) => {
          const dayKey = day.getDate().toString();
          const dayPosts = postsByDay.get(dayKey) ?? [];
          const isToday =
            day.getDate() === now.getDate() &&
            day.getMonth() === now.getMonth() &&
            day.getFullYear() === now.getFullYear();

          return (
            <div
              key={dayKey}
              className="min-h-[100px] border-b border-r border-[#2e2e3e] p-2"
            >
              <div
                className={`mb-1.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                  isToday
                    ? "bg-[#6d28d9] text-white"
                    : "text-[#a09ec0]"
                }`}
              >
                {day.getDate()}
              </div>

              <div className="space-y-1">
                {dayPosts.slice(0, 3).map((post) => {
                  const meta = PLATFORM_META[post.account.platform];
                  const cancellable = ["SCHEDULED", "QUEUED"].includes(post.status);
                  return (
                    <div
                      key={post.id}
                      className="group flex items-center gap-1.5 rounded px-1.5 py-1 text-xs"
                      style={{ backgroundColor: meta.bg }}
                    >
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: meta.color }}
                      />
                      <span
                        className="flex-1 truncate font-medium"
                        style={{ color: meta.color }}
                      >
                        {new Date(post.scheduledAt!).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        {post.account.accountName}
                      </span>
                      {cancellable && (
                        <button
                          onClick={() => void handleCancel(post.id)}
                          className="hidden text-[#6b6988] hover:text-red-400 group-hover:block"
                          title="Cancel"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  );
                })}
                {dayPosts.length > 3 && (
                  <p className="pl-1 text-xs text-[#6b6988]">+{dayPosts.length - 3} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
