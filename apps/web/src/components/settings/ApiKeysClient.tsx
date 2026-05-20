"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Copy, CheckCheck, Eye, EyeOff } from "lucide-react";

type ApiKey = {
  id: string;
  name: string;
  keyPrefix: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
};

export function ApiKeysClient() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<{ key: ApiKey; plaintext: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function load() {
    const res = await fetch("/api/v1/api-keys");
    if (res.ok) setKeys(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function create() {
    if (!name.trim()) return;
    setCreating(true);
    const res = await fetch("/api/v1/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      const result = await res.json();
      setNewKey(result);
      setName("");
      load();
    }
    setCreating(false);
  }

  async function revoke(id: string) {
    await fetch(`/api/v1/api-keys/${id}`, { method: "PATCH" });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this API key?")) return;
    await fetch(`/api/v1/api-keys/${id}`, { method: "DELETE" });
    setKeys((k) => k.filter((key) => key.id !== id));
  }

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      {/* Create form */}
      <div className="flex gap-2">
        <input
          placeholder="Key name (e.g. My App)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && create()}
          className="flex-1 rounded-md border border-[#2e2e3e] bg-[#222230] px-3 py-2 text-sm text-[#f1f0ff] placeholder-[#6b6b8a] outline-none focus:border-[#6366f1]"
        />
        <button
          onClick={create}
          disabled={creating || !name.trim()}
          className="flex items-center gap-2 rounded-md bg-[#6366f1] px-3 py-2 text-sm font-medium text-white hover:bg-[#4f46e5] disabled:opacity-50"
        >
          <Plus size={16} /> {creating ? "Creating…" : "Create Key"}
        </button>
      </div>

      {/* One-time display of new key */}
      {newKey && (
        <div className="rounded-lg border border-[#6366f140] bg-[#6366f110] p-4 space-y-2">
          <p className="text-xs font-semibold text-[#6366f1]">Key created — copy it now. It will not be shown again.</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 break-all rounded bg-[#222230] px-3 py-2 text-xs text-[#f1f0ff]">
              {newKey.plaintext}
            </code>
            <button
              onClick={() => copy(newKey.plaintext)}
              className="shrink-0 rounded-md p-2 text-[#a09ec0] hover:bg-[#222230] hover:text-[#f1f0ff]"
            >
              {copied ? <CheckCheck size={16} className="text-emerald-400" /> : <Copy size={16} />}
            </button>
          </div>
          <button onClick={() => setNewKey(null)} className="text-xs text-[#6b6b8a] hover:text-[#a09ec0]">
            I've saved this key — dismiss
          </button>
        </div>
      )}

      {/* Keys table */}
      {keys.length === 0 ? (
        <div className="rounded-lg border border-[#2e2e3e] bg-[#18181f] px-6 py-12 text-center text-sm text-[#a09ec0]">
          No API keys yet. Create one to access the public API.
        </div>
      ) : (
        <div className="rounded-lg border border-[#2e2e3e] bg-[#18181f] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2e2e3e]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b6b8a]">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b6b8a]">Prefix</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b6b8a]">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b6b8a]">Last used</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b6b8a]">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => (
                <tr key={key.id} className="border-b border-[#2e2e3e] last:border-0">
                  <td className="px-4 py-3 text-[#f1f0ff]">{key.name}</td>
                  <td className="px-4 py-3">
                    <code className="text-xs text-[#a09ec0]">{key.keyPrefix}…</code>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${key.isActive ? "bg-emerald-400/10 text-emerald-400" : "bg-[#6b6b8a20] text-[#6b6b8a]"}`}>
                      {key.isActive ? "Active" : "Revoked"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#6b6b8a] text-xs">
                    {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString("en-GB", { timeZone: "UTC" }) : "Never"}
                  </td>
                  <td className="px-4 py-3 text-[#6b6b8a] text-xs">
                    {new Date(key.createdAt).toLocaleDateString("en-GB", { timeZone: "UTC" })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      {key.isActive && (
                        <button
                          onClick={() => revoke(key.id)}
                          title="Revoke"
                          className="rounded-md p-1.5 text-[#a09ec0] hover:bg-[#222230] hover:text-[#f59e0b]"
                        >
                          <EyeOff size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => remove(key.id)}
                        className="rounded-md p-1.5 text-[#a09ec0] hover:bg-[#222230] hover:text-[#ef4444]"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-lg border border-[#2e2e3e] bg-[#18181f] p-4 text-sm text-[#a09ec0]">
        <p className="font-medium text-[#f1f0ff] mb-1">API Usage</p>
        <p className="text-xs mb-2">Add your key as a Bearer token in the Authorization header:</p>
        <code className="block rounded bg-[#222230] px-3 py-2 text-xs text-[#a09ec0]">
          Authorization: Bearer gpk_xxxxxxxxxxxx
        </code>
        <p className="mt-2 text-xs">
          Endpoints: <code className="text-[#6366f1]">GET /api/public/v1/articles</code> · <code className="text-[#6366f1]">GET /api/public/v1/articles/:id</code> · <code className="text-[#6366f1]">GET /api/public/v1/trending</code>
        </p>
      </div>
    </div>
  );
}
