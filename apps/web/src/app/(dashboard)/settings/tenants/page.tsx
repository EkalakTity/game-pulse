import { TenantsClient } from "@/components/settings/TenantsClient";

export default function TenantsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#f1f0ff]">White-label Tenants</h1>
        <p className="mt-1 text-sm text-[#a09ec0]">
          Manage branded instances. Each tenant can have a custom domain, logo, and colour scheme.
          Resolve via subdomain (e.g. <code className="text-[#6366f1]">acme.gamepulse.app</code>) or a custom domain.
        </p>
      </div>
      <TenantsClient />
    </div>
  );
}
