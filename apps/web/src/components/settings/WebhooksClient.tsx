"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, RotateCcw, ChevronDown, ChevronUp, CheckCircle2, XCircle, Circle } from "lucide-react";

const ALL_EVENTS = [
  "article.ingested",
  "article.published",
  "post.published",
  "post.failed",
  "token.expired",
];

type Webhook = {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
  failCount: number;
  createdAt: string;
};

type Delivery = {
  id: string;
  event: string;
  status: string;
  statusCode: number | null;
  attempts: number;
  createdAt: string;
};

export function WebhooksClient() {
  const [hooks, setHooks] = useState<Webhook[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<Record<string, Delivery[]>>({});
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", url: "", events: [] as string[] });
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/v1/webhooks");
    if (res.ok) setHooks(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function loadDeliveries(id: string) {
    if (deliveries[id]) return;
    const res = await fetch(`/api/v1/webhooks/${id}/deliveries`);
    if (res.ok) setDeliveries((d) => ({ ...d, [id]: (res as unknown as { json: () => Promise<Delivery[]> }).json() as unknown as Delivery[] }));
    if (res.ok) {
      const data: Delivery[] = await res.json();
      setDeliveries((d) => ({ ...d, [id]: data }));
    }
  }

  async function toggle(id: string, isActive: boolean) {
    await fetch(`/api/v1/webhooks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !isActive }) });
    load();
  }

  async function rotate(id: string) {
    const res = await fetch(`/api/v1/webhooks/${id}/rotate-secret`, { method: "POST" });
    if (res.ok) {
      const updated = await res.json();
      setHooks((h) => h.map((w) => (w.id === id ? updated : w)));
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this webhook?")) return;
    await fetch(`/api/v1/webhooks/${id}`, { method: "DELETE" });
    setHooks((h) => h.filter((w) => w.id !== id));
  }

  async function create() {
    if (!form.name || !form.url || form.events.length === 0) return;
    setSaving(true);
    const res = await fetch("/api/v1/webhooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      await load();
      setShowForm(false);
      setForm({ name: "", url: "", events: [] });
    }
    setSaving(false);
  }

  function toggleEvent(ev: string) {
    setForm((f) => ({
      ...f,
      events: f.events.includes(ev) ? f.events.filter((e) => e !== ev) : [...f.events, ev],
    }));
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 rounded-md bg-[#6366f1] px-3 py-2 text-sm font-medium text-white hover:bg-[#4f46e5]"
        >
          <Plus size={16} /> New Webhook
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-[#2e2e3e] bg-[#18181f] p-4 space-y-3">
          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full rounded-md border border-[#2e2e3e] bg-[#222230] px-3 py-2 text-sm text-[#f1f0ff] placeholder-[#6b6b8a] outline-none focus:border-[#6366f1]"
          />
          <input
            placeholder="https://your-server.com/webhook"
            value={form.url}
            onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            className="w-full rounded-md border border-[#2e2e3e] bg-[#222230] px-3 py-2 text-sm text-[#f1f0ff] placeholder-[#6b6b8a] outline-none focus:border-[#6366f1]"
          />
          <div>
            <p className="mb-2 text-xs font-medium text-[#a09ec0]">Events to subscribe</p>
            <div className="flex flex-wrap gap-2">
              {ALL_EVENTS.map((ev) => (
                <button
                  key={ev}
                  onClick={() => toggleEvent(ev)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${form.events.includes(ev) ? "bg-[#6366f1] text-white" : "bg-[#222230] text-[#a09ec0] hover:bg-[#2e2e3e]"}`}
                >
                  {ev}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={create}
              disabled={saving}
              className="rounded-md bg-[#6366f1] px-3 py-2 text-sm font-medium text-white hover:bg-[#4f46e5] disabled:opacity-50"
            >
              {saving ? "Saving…" : "Create"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-md px-3 py-2 text-sm text-[#a09ec0] hover:text-[#f1f0ff]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {hooks.length === 0 && !showForm && (
        <div className="rounded-lg border border-[#2e2e3e] bg-[#18181f] px-6 py-12 text-center text-sm text-[#a09ec0]">
          No webhooks yet. Add one to start receiving events.
        </div>
      )}

      {hooks.map((hook) => (
        <div key={hook.id} className="rounded-lg border border-[#2e2e3e] bg-[#18181f]">
          <div className="flex items-center gap-3 p-4">
            <span className={`h-2 w-2 rounded-full shrink-0 ${hook.isActive ? "bg-emerald-400" : "bg-[#6b6b8a]"}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#f1f0ff] truncate">{hook.name}</p>
              <p className="text-xs text-[#6b6b8a] truncate">{hook.url}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {hook.failCount >= 5 && (
                <span className="rounded-full bg-[#ef444420] px-2 py-0.5 text-[10px] text-[#ef4444]">{hook.failCount} fails</span>
              )}
              <button
                onClick={() => { setExpanded(expanded === hook.id ? null : hook.id); loadDeliveries(hook.id); }}
                className="rounded-md p-1.5 text-[#a09ec0] hover:bg-[#222230] hover:text-[#f1f0ff]"
              >
                {expanded === hook.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>
              <button onClick={() => rotate(hook.id)} title="Rotate secret" className="rounded-md p-1.5 text-[#a09ec0] hover:bg-[#222230] hover:text-[#f1f0ff]">
                <RotateCcw size={15} />
              </button>
              <button onClick={() => toggle(hook.id, hook.isActive)} className="rounded-md p-1.5 text-[#a09ec0] hover:bg-[#222230] hover:text-[#f1f0ff]">
                {hook.isActive ? <CheckCircle2 size={15} className="text-emerald-400" /> : <Circle size={15} />}
              </button>
              <button onClick={() => remove(hook.id)} className="rounded-md p-1.5 text-[#a09ec0] hover:bg-[#222230] hover:text-[#ef4444]">
                <Trash2 size={15} />
              </button>
            </div>
          </div>

          {expanded === hook.id && (
            <div className="border-t border-[#2e2e3e] px-4 py-3 space-y-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6b6b8a] mb-1">Signing Secret</p>
                <code className="block rounded bg-[#222230] px-3 py-2 text-xs text-[#a09ec0] break-all">{hook.secret}</code>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6b6b8a] mb-1">Subscribed Events</p>
                <div className="flex flex-wrap gap-1">
                  {hook.events.map((ev) => (
                    <span key={ev} className="rounded-full bg-[#6366f120] px-2 py-0.5 text-[10px] text-[#6366f1]">{ev}</span>
                  ))}
                </div>
              </div>
              {deliveries[hook.id] && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6b6b8a] mb-2">Recent Deliveries</p>
                  <div className="space-y-1">
                    {deliveries[hook.id]!.length === 0 && <p className="text-xs text-[#6b6b8a]">No deliveries yet.</p>}
                    {deliveries[hook.id]!.map((d) => (
                      <div key={d.id} className="flex items-center gap-2 text-xs">
                        {d.status === "SUCCESS" ? <CheckCircle2 size={12} className="text-emerald-400 shrink-0" /> : <XCircle size={12} className="text-[#ef4444] shrink-0" />}
                        <span className="text-[#a09ec0]">{d.event}</span>
                        {d.statusCode && <span className="text-[#6b6b8a]">{d.statusCode}</span>}
                        <span className="ml-auto text-[#6b6b8a]">{new Date(d.createdAt).toLocaleTimeString("en-GB", { timeZone: "UTC", hour12: false })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
