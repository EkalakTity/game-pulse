import { ApiKeysClient } from "@/components/settings/ApiKeysClient";

export default function ApiKeysPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#f1f0ff]">API Keys</h1>
        <p className="mt-1 text-sm text-[#a09ec0]">
          Create bearer tokens for accessing the public GamePulse API.
        </p>
      </div>
      <ApiKeysClient />
    </div>
  );
}
