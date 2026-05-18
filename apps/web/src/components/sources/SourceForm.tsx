"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { FeedSource } from "@gamepulse/database";

type FormValues = {
  name: string;
  url: string;
  description: string;
  fetchIntervalMin: number;
};

type Props = {
  initial?: FeedSource;
  onSubmit: (values: FormValues) => Promise<void>;
  onClose: () => void;
};

const INTERVALS = [
  { label: "5 minutes", value: 5 },
  { label: "15 minutes", value: 15 },
  { label: "30 minutes", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "6 hours", value: 360 },
  { label: "24 hours", value: 1440 },
];

export function SourceForm({ initial, onSubmit, onClose }: Props) {
  const [values, setValues] = useState<FormValues>({
    name: initial?.name ?? "",
    url: initial?.url ?? "",
    description: initial?.description ?? "",
    fetchIntervalMin: initial?.fetchIntervalMin ?? 15,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-surface-border bg-surface-raised shadow-2xl">
        <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
          <h2 className="font-semibold">
            {initial ? "Edit Feed Source" : "Add Feed Source"}
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-[#6b6988] hover:bg-surface-overlay hover:text-[#f1f0ff]"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <Field label="Name" required>
            <input
              type="text"
              required
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="IGN"
              className={inputClass}
            />
          </Field>

          <Field label="RSS Feed URL" required>
            <input
              type="url"
              required
              value={values.url}
              onChange={(e) => set("url", e.target.value)}
              placeholder="https://feeds.ign.com/ign/all"
              className={inputClass}
            />
          </Field>

          <Field label="Description">
            <textarea
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Brief description of this feed source"
              rows={2}
              className={cn(inputClass, "resize-none")}
            />
          </Field>

          <Field label="Fetch Interval">
            <select
              value={values.fetchIntervalMin}
              onChange={(e) => set("fetchIntervalMin", Number(e.target.value))}
              className={inputClass}
            >
              {INTERVALS.map((i) => (
                <option key={i.value} value={i.value}>
                  {i.label}
                </option>
              ))}
            </select>
          </Field>

          {error && (
            <p role="alert" className="text-xs text-[#ef4444]">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm text-[#a09ec0] hover:bg-surface-overlay"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-400 disabled:opacity-60"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {initial ? "Save changes" : "Add source"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-md border border-surface-border bg-surface-overlay px-3 py-2 text-sm text-[#f1f0ff] placeholder-[#6b6988] focus:border-brand-400 focus:outline-none transition-colors";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-[#a09ec0]">
        {label} {required && <span className="text-[#ef4444]">*</span>}
      </label>
      {children}
    </div>
  );
}
