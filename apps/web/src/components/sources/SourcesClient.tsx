"use client";

import { useState, useCallback } from "react";
import { Plus, Search } from "lucide-react";
import { SourceCard } from "./SourceCard";
import { SourceForm } from "./SourceForm";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { apiClient } from "@/lib/api/client";
import type { FeedSource } from "@gamepulse/database";

type Props = { initialSources: FeedSource[] };

export function SourcesClient({ initialSources }: Props) {
  const [sources, setSources] = useState(initialSources);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FeedSource | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const filtered = sources.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.url.toLowerCase().includes(search.toLowerCase()),
  );

  const handleRefresh = useCallback(async (id: string) => {
    await apiClient.post(`/feeds/${id}/refresh`, {});
  }, []);

  const handleTogglePause = useCallback(async (source: FeedSource) => {
    const nextStatus = source.status === "PAUSED" ? "ACTIVE" : "PAUSED";
    const updated = await apiClient.patch<FeedSource>(`/feeds/${source.id}`, {
      status: nextStatus,
    });
    setSources((prev) => prev.map((s) => (s.id === source.id ? updated : s)));
  }, []);

  const handleCreate = useCallback(
    async (values: { name: string; url: string; description: string; fetchIntervalMin: number }) => {
      const created = await apiClient.post<FeedSource>("/feeds", values);
      setSources((prev) => [created, ...prev]);
      setFormOpen(false);
    },
    [],
  );

  const handleUpdate = useCallback(
    async (values: { name: string; url: string; description: string; fetchIntervalMin: number }) => {
      if (!editing) return;
      const updated = await apiClient.patch<FeedSource>(`/feeds/${editing.id}`, values);
      setSources((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setEditing(null);
    },
    [editing],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    await apiClient.delete(`/feeds/${deleteTarget}`);
    setSources((prev) => prev.filter((s) => s.id !== deleteTarget));
    setDeleteTarget(null);
  }, [deleteTarget]);

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6988]" />
          <input
            type="search"
            placeholder="Search sources…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-surface-border bg-surface-overlay py-2 pl-8 pr-3 text-sm text-[#f1f0ff] placeholder-[#6b6988] focus:border-brand-400 focus:outline-none"
          />
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-400 transition-colors"
        >
          <Plus size={16} /> Add source
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-surface-border py-16 text-center">
          <p className="text-sm text-[#6b6988]">
            {search ? "No sources match your search." : "No feed sources yet. Add your first one."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((source) => (
            <SourceCard
              key={source.id}
              source={source}
              onEdit={setEditing}
              onRefresh={handleRefresh}
              onTogglePause={handleTogglePause}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {(formOpen || editing) && (
        <SourceForm
          initial={editing ?? undefined}
          onSubmit={editing ? handleUpdate : handleCreate}
          onClose={() => { setFormOpen(false); setEditing(null); }}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete feed source"
          description="This will pause the source and stop future ingestion. Existing articles are kept."
          confirmLabel="Delete"
          danger
          onConfirm={() => { void handleDelete(); }}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
