import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0f0f13] text-[#f1f0ff]">
      <p className="text-7xl font-bold text-[#2e2e3e]">404</p>
      <h1 className="mt-4 text-xl font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-[#6b6988]">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-md bg-[#6d28d9] px-5 py-2 text-sm font-medium text-white hover:bg-[#7c3aed] transition-colors"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
