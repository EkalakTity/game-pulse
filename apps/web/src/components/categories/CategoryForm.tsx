"use client";

import { useState } from "react";
import { X, Loader2, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Category } from "@gamepulse/database";

type FormValues = {
  name: string;
  slug: string;
  description: string;
  color: string;
  keywords: string[];
};

type Props = {
  initial?: Category;
  onSubmit: (values: FormValues) => Promise<void>;
  onClose: () => void;
};

const PRESET_COLORS = [
  "#6d28d9", "#3b82f6", "#22c55e", "#ef4444",
  "#f59e0b", "#ec4899", "#14b8a6", "#a09ec0",
];

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function CategoryForm({ initial, onSubmit, onClose }: Props) {
  const [values, setValues] = useState<FormValues>({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
    color: initial?.color ?? "#6d28d9",
    keywords: initial?.keywords ?? [],
  });
  const [newKeyword, setNewKeyword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function handleNameChange(name: string) {
    setValues((v) => ({
      ...v,
      name,
      slug: initial ? v.slug : toSlug(name),
    }));
  }

  function addKeyword() {
    const kw = newKeyword.trim();
    if (!kw || values.keywords.includes(kw)) return;
    set("keywords", [...values.keywords, kw]);
    setNewKeyword("");
  }

  function removeKeyword(kw: string) {
    set("keywords", values.keywords.filter((k) => k !== kw));
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
            {initial ? "Edit Category" : "New Category"}
          </h2>
          <button onClick={onClose} className="rounded p-1 text-[#6b6988] hover:bg-surface-overlay hover:text-[#f1f0ff]">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#a09ec0]">Name <span className="text-[#ef4444]">*</span></label>
              <input
                required
                value={values.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="PC Gaming"
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#a09ec0]">Slug <span className="text-[#ef4444]">*</span></label>
              <input
                required
                value={values.slug}
                onChange={(e) => set("slug", e.target.value)}
                placeholder="pc-gaming"
                className={inputClass}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[#a09ec0]">Description</label>
            <input
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Short description"
              className={inputClass}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-[#a09ec0]">Color</label>
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set("color", c)}
                  className={cn(
                    "h-6 w-6 rounded-full transition-transform hover:scale-110",
                    values.color === c && "ring-2 ring-white ring-offset-2 ring-offset-surface-raised",
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={values.color}
                onChange={(e) => set("color", e.target.value)}
                className="h-6 w-6 cursor-pointer rounded-full border-0 bg-transparent p-0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-[#a09ec0]">Keywords for auto-categorization</label>
            <div className="flex gap-2">
              <input
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
                placeholder="e.g. Steam, GPU"
                className={cn(inputClass, "flex-1")}
              />
              <button
                type="button"
                onClick={addKeyword}
                className="rounded-md border border-surface-border px-3 text-[#a09ec0] hover:bg-surface-overlay"
              >
                <Plus size={16} />
              </button>
            </div>
            {values.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {values.keywords.map((kw) => (
                  <span
                    key={kw}
                    className="flex items-center gap-1 rounded-full border border-surface-border bg-surface-overlay px-2.5 py-0.5 text-xs text-[#a09ec0]"
                  >
                    {kw}
                    <button
                      type="button"
                      onClick={() => removeKeyword(kw)}
                      className="text-[#6b6988] hover:text-[#ef4444]"
                    >
                      <Trash2 size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {error && <p role="alert" className="text-xs text-[#ef4444]">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm text-[#a09ec0] hover:bg-surface-overlay">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-400 disabled:opacity-60"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {initial ? "Save changes" : "Create category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-md border border-surface-border bg-surface-overlay px-3 py-2 text-sm text-[#f1f0ff] placeholder-[#6b6988] focus:border-brand-400 focus:outline-none transition-colors";
