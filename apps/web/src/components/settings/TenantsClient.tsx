"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, X, Check, Globe, ToggleLeft, ToggleRight } from "lucide-react";

type Tenant = {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  isActive: boolean;
  createdAt: string;
};

const DEFAULT_FORM = {
  name: "",
  slug: "",
  domain: "",
  primaryColor: "#6366f1",
  accentColor: "#8b5cf6",
};

export function TenantsClient() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...DEFAULT_FORM });
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/v1/tenants");
    if (res.ok) setTenants(await res.json());
  }

  useEffect(() => { load(); }, []);

  function startEdit(t: Tenant) {
    setEditId(t.id);
    setForm({
      name: t.name,
      slug: t.slug,
      domain: t.domain ?? "",
      primaryColor: t.primaryColor,
      accentColor: t.accentColor,
    });
    setShowForm(false);
  }

  function cancelEdit() {
    setEditId(null);
    setForm({ ...DEFAULT_FORM });
  }

  async function save() {
    setSaving(true);
    const payload = {
      ...form,
      domain: form.domain || undefined,
    };
    const [url, method] = editId
      ? [`/api/v1/tenants/${editId}`, "PATCH"]
      : ["/api/v1/tenants", "POST"];

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      await load();
      setShowForm(false);
      setEditId(null);
      setForm({ ...DEFAULT_FORM });
    }
    setSaving(false);
  }

  async function toggle(id: string, isActive: boolean) {
    await fetch(`/api/v1/tenants/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this tenant? This cannot be undone.")) return;
    await fetch(`/api/v1/tenants/${id}`, { method: "DELETE" });
    setTenants((t) => t.filter((x) => x.id !== id));
  }

  const isEditing = (id: string) => editId === id;

  function field(key: keyof typeof form, placeholder: string, extra?: { disabled?: boolean }) {
    return (
      <input
        placeholder={placeholder}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        disabled={extra?.disabled}
        className="rounded-md border border-[#2e2e3e] bg-[#222230] px-3 py-2 text-sm text-[#f1f0ff] placeholder-[#6b6b8a] outline-none focus:border-[#6366f1] disabled:opacity-40 w-full"
      />
    );
  }

  const formPanel = (
    <div className="rounded-lg border border-[#2e2e3e] bg-[#18181f] p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {field("name", "Display name")}
        {field("slug", "slug (e.g. acme)", { disabled: !!editId })}
      </div>
      {field("domain", "Custom domain (optional, e.g. news.acme.com)")}
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className="text-xs text-[#6b6b8a]">Primary colour</span>
          <div className="flex items-center gap-2">
            <input type="color" value={form.primaryColor} onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))} className="h-8 w-8 rounded cursor-pointer bg-transparent border-0" />
            <span className="text-xs text-[#a09ec0]">{form.primaryColor}</span>
          </div>
        </label>
        <label className="space-y-1">
          <span className="text-xs text-[#6b6b8a]">Accent colour</span>
          <div className="flex items-center gap-2">
            <input type="color" value={form.accentColor} onChange={(e) => setForm((f) => ({ ...f, accentColor: e.target.value }))} className="h-8 w-8 rounded cursor-pointer bg-transparent border-0" />
            <span className="text-xs text-[#a09ec0]">{form.accentColor}</span>
          </div>
        </label>
      </div>
      <div className="flex gap-2">
        <button onClick={save} disabled={saving || !form.name || !form.slug} className="rounded-md bg-[#6366f1] px-3 py-2 text-sm font-medium text-white hover:bg-[#4f46e5] disabled:opacity-50">
          {saving ? "Saving…" : editId ? "Update" : "Create"}
        </button>
        <button onClick={() => { setShowForm(false); cancelEdit(); }} className="rounded-md px-3 py-2 text-sm text-[#a09ec0] hover:text-[#f1f0ff]">
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => { setShowForm((v) => !v); cancelEdit(); }}
          className="flex items-center gap-2 rounded-md bg-[#6366f1] px-3 py-2 text-sm font-medium text-white hover:bg-[#4f46e5]"
        >
          <Plus size={16} /> New Tenant
        </button>
      </div>

      {showForm && !editId && formPanel}

      {tenants.length === 0 && !showForm && (
        <div className="rounded-lg border border-[#2e2e3e] bg-[#18181f] px-6 py-12 text-center text-sm text-[#a09ec0]">
          No tenants yet. Create one to enable white-label mode.
        </div>
      )}

      {tenants.map((t) => (
        <div key={t.id} className="rounded-lg border border-[#2e2e3e] bg-[#18181f]">
          <div className="flex items-center gap-3 p-4">
            {/* Colour preview */}
            <div className="h-8 w-8 shrink-0 rounded-full" style={{ background: `linear-gradient(135deg, ${t.primaryColor}, ${t.accentColor})` }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#f1f0ff]">{t.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <code className="text-[10px] text-[#6b6b8a]">{t.slug}</code>
                {t.domain && (
                  <>
                    <span className="text-[#2e2e3e]">·</span>
                    <Globe size={11} className="text-[#6b6b8a]" />
                    <code className="text-[10px] text-[#6b6b8a]">{t.domain}</code>
                  </>
                )}
              </div>
            </div>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${t.isActive ? "bg-emerald-400/10 text-emerald-400" : "bg-[#6b6b8a20] text-[#6b6b8a]"}`}>
              {t.isActive ? "Active" : "Inactive"}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => { startEdit(t); }} className="rounded-md p-1.5 text-[#a09ec0] hover:bg-[#222230] hover:text-[#f1f0ff]">
                <Pencil size={14} />
              </button>
              <button onClick={() => toggle(t.id, t.isActive)} className="rounded-md p-1.5 text-[#a09ec0] hover:bg-[#222230] hover:text-[#f1f0ff]">
                {t.isActive ? <ToggleRight size={16} className="text-emerald-400" /> : <ToggleLeft size={16} />}
              </button>
              <button onClick={() => remove(t.id)} className="rounded-md p-1.5 text-[#a09ec0] hover:bg-[#222230] hover:text-[#ef4444]">
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {isEditing(t.id) && (
            <div className="border-t border-[#2e2e3e] p-4">
              {formPanel}
            </div>
          )}
        </div>
      ))}

      <div className="rounded-lg border border-[#2e2e3e] bg-[#18181f] p-4 text-sm">
        <p className="font-medium text-[#f1f0ff] mb-2">Tenant Resolution</p>
        <div className="space-y-1 text-xs text-[#a09ec0]">
          <p>• <strong className="text-[#f1f0ff]">Subdomain</strong> — <code className="text-[#6366f1]">{"{slug}.gamepulse.app"}</code> resolves to the matching tenant automatically</p>
          <p>• <strong className="text-[#f1f0ff]">Custom domain</strong> — Point DNS to your server; set the domain above to match</p>
          <p>• <strong className="text-[#f1f0ff]">Header</strong> — Pass <code className="text-[#6366f1]">X-Tenant-Slug</code> for internal proxy routing</p>
        </div>
      </div>
    </div>
  );
}
