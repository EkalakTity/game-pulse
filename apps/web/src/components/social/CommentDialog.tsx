"use client";

import { useState } from "react";
import { X, Send } from "lucide-react";

type Props = {
  onSubmit: (text: string) => Promise<void>;
  onClose: () => void;
};

export function CommentDialog({ onSubmit, onClose }: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await onSubmit(text.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-[#2e2e3e] bg-[#18181f] shadow-xl">
        <div className="flex items-center justify-between border-b border-[#2e2e3e] px-5 py-4">
          <h2 className="text-sm font-semibold text-[#f1f0ff]">Post Ad Comment</h2>
          <button onClick={onClose} className="text-[#6b6988] hover:text-[#f1f0ff]">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-medium text-[#a09ec0]">Comment</label>
              <span className="text-xs text-[#6b6988]">{text.length} / 2000</span>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={2000}
              rows={4}
              placeholder="พิมพ์ข้อความโฆษณา เช่น 👉 ลิ้งสั่งซื้อ: https://..."
              autoFocus
              className="w-full resize-none rounded-md border border-[#2e2e3e] bg-[#111118] px-3 py-2 text-sm text-[#f1f0ff] placeholder-[#6b6988] focus:border-[#8b5cf6] focus:outline-none"
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm text-[#a09ec0] hover:text-[#f1f0ff] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !text.trim()}
              className="flex items-center gap-2 rounded-md bg-[#6d28d9] px-4 py-2 text-sm font-medium text-white hover:bg-[#7c3aed] disabled:opacity-50 transition-colors"
            >
              <Send size={13} />
              {loading ? "Posting…" : "Post Comment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
