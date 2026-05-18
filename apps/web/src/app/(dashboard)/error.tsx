"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
      <AlertTriangle size={40} className="text-red-400" />
      <div>
        <h2 className="text-lg font-semibold text-[#f1f0ff]">Something went wrong</h2>
        <p className="mt-1 text-sm text-[#6b6988]">{error.message || "An unexpected error occurred."}</p>
        {error.digest && (
          <p className="mt-1 text-xs text-[#3e3e5e]">Error ID: {error.digest}</p>
        )}
      </div>
      <button
        onClick={reset}
        className="flex items-center gap-2 rounded-md bg-[#6d28d9] px-4 py-2 text-sm font-medium text-white hover:bg-[#7c3aed] transition-colors"
      >
        <RefreshCw size={14} /> Try again
      </button>
    </div>
  );
}
