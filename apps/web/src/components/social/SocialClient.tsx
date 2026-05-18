"use client";

import { useState, useCallback } from "react";
import { Plus, PenLine } from "lucide-react";
import { SocialAccountCard } from "./SocialAccountCard";
import { SocialAccountForm } from "./SocialAccountForm";
import { SocialPostsTable } from "./SocialPostsTable";
import { PostComposer } from "./PostComposer";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { socialAccountsApi, type SafeSocialAccount, type CreateAccountPayload } from "@/lib/api/socialAccounts";
import { socialPostsApi } from "@/lib/api/socialPosts";
import type { SocialPostWithRelations } from "@/server/repositories/SocialPostRepository";

type ArticleOption = { id: string; title: string; thumbnailUrl: string | null };

type Props = {
  initialAccounts: SafeSocialAccount[];
  initialPosts: SocialPostWithRelations[];
  articles: ArticleOption[];
};

type Tab = "accounts" | "posts";

export function SocialClient({ initialAccounts, initialPosts, articles }: Props) {
  const [tab, setTab] = useState<Tab>("accounts");
  const [accounts, setAccounts] = useState(initialAccounts);
  const [posts, setPosts] = useState(initialPosts);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SafeSocialAccount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);

  const activeAccounts = accounts.filter((a) => a.isActive);

  const handleCreate = useCallback(async (values: CreateAccountPayload) => {
    const created = await socialAccountsApi.create(values);
    setAccounts((prev) => [created, ...prev]);
    setFormOpen(false);
  }, []);

  const handleUpdate = useCallback(
    async (values: CreateAccountPayload) => {
      if (!editing) return;
      const updated = await socialAccountsApi.update(editing.id, values);
      setAccounts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setEditing(null);
    },
    [editing],
  );

  const handleToggle = useCallback(async (account: SafeSocialAccount) => {
    const updated = await socialAccountsApi.update(account.id, { isActive: !account.isActive });
    setAccounts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    await socialAccountsApi.remove(deleteTarget);
    setAccounts((prev) => prev.filter((a) => a.id !== deleteTarget));
    setDeleteTarget(null);
  }, [deleteTarget]);

  const handlePostCreated = useCallback((post: SocialPostWithRelations) => {
    setPosts((prev) => [post, ...prev]);
    setComposerOpen(false);
    setTab("posts");
  }, []);

  const handleCancel = useCallback(async (id: string) => {
    const updated = await socialPostsApi.cancel(id);
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }, []);

  const handleRetry = useCallback(async (id: string) => {
    const updated = await socialPostsApi.retry(id);
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }, []);

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-lg border border-[#2e2e3e] bg-[#111118] p-1">
          {(["accounts", "posts"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                tab === t
                  ? "bg-[#6d28d9] text-white"
                  : "text-[#a09ec0] hover:text-[#f1f0ff]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {tab === "accounts" ? (
            <button
              onClick={() => setFormOpen(true)}
              className="flex items-center gap-2 rounded-md bg-[#6d28d9] px-4 py-2 text-sm font-medium text-white hover:bg-[#7c3aed] transition-colors"
            >
              <Plus size={15} /> Connect account
            </button>
          ) : (
            <button
              onClick={() => setComposerOpen(true)}
              disabled={activeAccounts.length === 0}
              className="flex items-center gap-2 rounded-md bg-[#6d28d9] px-4 py-2 text-sm font-medium text-white hover:bg-[#7c3aed] disabled:opacity-50 transition-colors"
              title={activeAccounts.length === 0 ? "Connect an account first" : undefined}
            >
              <PenLine size={15} /> Compose
            </button>
          )}
        </div>
      </div>

      {tab === "accounts" ? (
        accounts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#2e2e3e] py-16 text-center">
            <p className="text-sm text-[#6b6988]">
              No social accounts connected yet. Add your first one.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {accounts.map((account) => (
              <SocialAccountCard
                key={account.id}
                account={account}
                onEdit={setEditing}
                onToggle={handleToggle}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )
      ) : (
        <SocialPostsTable posts={posts} onCancel={handleCancel} onRetry={handleRetry} />
      )}

      {(formOpen || editing) && (
        <SocialAccountForm
          initial={editing ?? undefined}
          onSubmit={editing ? handleUpdate : handleCreate}
          onClose={() => { setFormOpen(false); setEditing(null); }}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Disconnect account"
          description="This will remove the account and all associated tokens. Scheduled posts for this account will be cancelled."
          confirmLabel="Disconnect"
          danger
          onConfirm={() => { void handleDelete(); }}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {composerOpen && (
        <PostComposer
          accounts={activeAccounts}
          articles={articles}
          onCreated={handlePostCreated}
          onClose={() => setComposerOpen(false)}
        />
      )}
    </>
  );
}
