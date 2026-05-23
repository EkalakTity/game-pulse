"use client";

import { RefreshCw, XCircle, MessageSquare, CheckCircle2, XCircle as XCircleIcon, Clock } from "lucide-react";
import type { SocialPostWithRelations } from "@/server/repositories/SocialPostRepository";
import { PLATFORM_META } from "@/lib/platforms";

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-[#2e2e3e] text-[#a09ec0]",
  SCHEDULED: "bg-blue-900/30 text-blue-400",
  QUEUED: "bg-yellow-900/30 text-yellow-400",
  PUBLISHED: "bg-green-900/30 text-green-400",
  FAILED: "bg-red-900/30 text-red-400",
  CANCELLED: "bg-[#2e2e3e] text-[#6b6988]",
};

type Props = {
  posts: SocialPostWithRelations[];
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
  onPostComment: (id: string) => void;
};

export function SocialPostsTable({ posts, onCancel, onRetry, onPostComment }: Props) {
  if (posts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#2e2e3e] py-16 text-center">
        <p className="text-sm text-[#6b6988]">No posts yet. Compose your first post.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#2e2e3e]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#2e2e3e] bg-[#111118]">
            <th className="px-4 py-3 text-left text-xs font-medium text-[#6b6988]">Article</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[#6b6988]">Account</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[#6b6988]">Caption</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[#6b6988]">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[#6b6988]">Scheduled</th>
            <th className="hidden px-4 py-3 text-left text-xs font-medium text-[#6b6988] sm:table-cell">Comment</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-[#2e2e3e]">
          {posts.map((post) => {
            const meta = PLATFORM_META[post.account.platform];
            const cancellable = ["SCHEDULED", "QUEUED", "DRAFT"].includes(post.status);
            return (
              <tr key={post.id} className="bg-[#18181f] hover:bg-[#1c1c27] transition-colors">
                <td className="max-w-[180px] truncate px-4 py-3 text-[#a09ec0]">
                  {post.article?.title ?? <span className="text-[#6b6988]">—</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: meta.color }}
                    />
                    <span className="text-[#f1f0ff]">{post.account.accountName}</span>
                  </div>
                </td>
                <td className="max-w-[200px] truncate px-4 py-3 text-[#a09ec0]">
                  {post.caption ?? (
                    <span className="text-[#6b6988]">
                      {post.hashtags.map((h) => `#${h}`).join(" ") || "—"}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[post.status] ?? STATUS_STYLES.DRAFT}`}
                  >
                    {post.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-[#6b6988]">
                  {post.scheduledAt
                    ? new Date(post.scheduledAt).toLocaleString("en-GB", { timeZone: "UTC", hour12: false })
                    : <span>—</span>}
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  {post.status === "PUBLISHED" ? (
                    post.adCommentStatus === "POSTED" ? (
                      <span className="flex items-center gap-1 text-xs text-green-400" title="Ad comment posted">
                        <CheckCircle2 size={13} />
                        Posted
                      </span>
                    ) : post.adCommentStatus === "PENDING" ? (
                      <span className="flex items-center gap-1 text-xs text-yellow-400" title="Ad comment queuing">
                        <Clock size={13} className="animate-spin" />
                        Queuing…
                      </span>
                    ) : post.adCommentStatus === "FAILED" ? (
                      <button
                        onClick={() => onPostComment(post.id)}
                        title="Ad comment failed — click to retry"
                        className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-red-400 hover:bg-[#2e2e3e] transition-colors"
                      >
                        <XCircleIcon size={13} />
                        Failed
                      </button>
                    ) : post.adComment ? (
                      <span className="flex items-center gap-1 text-xs text-amber-400" title="Ad comment set but not yet queued">
                        <Clock size={13} />
                        Pending
                      </span>
                    ) : (
                      <button
                        onClick={() => onPostComment(post.id)}
                        title="Post ad comment"
                        className="rounded p-1 text-[#6b6988] hover:bg-[#2e2e3e] hover:text-[#a09ec0] transition-colors"
                      >
                        <MessageSquare size={13} />
                      </button>
                    )
                  ) : (
                    <span className="text-xs text-[#6b6988]">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {post.status === "FAILED" && (
                      <button
                        onClick={() => onRetry(post.id)}
                        title="Retry"
                        className="rounded p-1.5 text-[#6b6988] hover:bg-[#2e2e3e] hover:text-yellow-400 transition-colors"
                      >
                        <RefreshCw size={13} />
                      </button>
                    )}
                    {cancellable && (
                      <button
                        onClick={() => onCancel(post.id)}
                        title="Cancel"
                        className="rounded p-1.5 text-[#6b6988] hover:bg-[#2e2e3e] hover:text-red-400 transition-colors"
                      >
                        <XCircle size={13} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
