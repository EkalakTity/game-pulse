"use client";

import { useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Hash } from "lucide-react";
import { CategoryForm } from "./CategoryForm";
import { CategoryPill } from "./CategoryPill";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { apiClient } from "@/lib/api/client";
import type { Category } from "@gamepulse/database";

type Props = { initialCategories: Category[] };

export function CategoriesClient({ initialCategories }: Props) {
  const [categories, setCategories] = useState(initialCategories);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const handleCreate = useCallback(
    async (values: { name: string; slug: string; description: string; color: string; keywords: string[] }) => {
      const created = await apiClient.post<Category>("/categories", values);
      setCategories((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setFormOpen(false);
    },
    [],
  );

  const handleUpdate = useCallback(
    async (values: { name: string; slug: string; description: string; color: string; keywords: string[] }) => {
      if (!editing) return;
      const updated = await apiClient.patch<Category>(`/categories/${editing.id}`, values);
      setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setEditing(null);
    },
    [editing],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    await apiClient.delete(`/categories/${deleteTarget.id}`);
    setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    setDeleteTarget(null);
  }, [deleteTarget]);

  return (
    <>
      <div className="flex justify-end">
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-400 transition-colors"
        >
          <Plus size={16} /> New category
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="rounded-xl border border-dashed border-surface-border py-16 text-center">
          <p className="text-sm text-[#6b6988]">No categories yet. Create your first one.</p>
        </div>
      ) : (
        <div className="divide-y divide-surface-border rounded-xl border border-surface-border bg-surface-raised">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-surface-overlay">
              <div className="flex items-center gap-3 min-w-0">
                <CategoryPill name={cat.name} color={cat.color} />
                {cat.description && (
                  <span className="truncate text-sm text-[#6b6988]">{cat.description}</span>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-4">
                {cat.keywords.length > 0 && (
                  <div className="hidden items-center gap-1 sm:flex">
                    <Hash size={12} className="text-[#6b6988]" />
                    <span className="text-xs text-[#6b6988]">
                      {cat.keywords.slice(0, 3).join(", ")}
                      {cat.keywords.length > 3 && ` +${cat.keywords.length - 3}`}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditing(cat)}
                    className="rounded p-1.5 text-[#6b6988] hover:bg-surface-border hover:text-[#f1f0ff]"
                    aria-label="Edit"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(cat)}
                    className="rounded p-1.5 text-[#6b6988] hover:bg-surface-border hover:text-[#ef4444]"
                    aria-label="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(formOpen || editing) && (
        <CategoryForm
          initial={editing ?? undefined}
          onSubmit={editing ? handleUpdate : handleCreate}
          onClose={() => { setFormOpen(false); setEditing(null); }}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete category"
          description={`"${deleteTarget.name}" will be removed from all articles. This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={() => { void handleDelete(); }}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
