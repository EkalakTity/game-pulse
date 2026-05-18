import { WebhooksClient } from "@/components/settings/WebhooksClient";

export default function WebhooksPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#f1f0ff]">Webhooks</h1>
        <p className="mt-1 text-sm text-[#a09ec0]">
          Receive real-time HTTP callbacks when articles are ingested or posts are published.
        </p>
      </div>
      <WebhooksClient />
    </div>
  );
}
