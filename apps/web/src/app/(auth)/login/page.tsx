import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { LoginForm } from "@/components/auth/LoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sign In" };

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/");

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-base px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            <span className="text-brand-300">GamePulse</span>{" "}
            <span className="text-[#f1f0ff]">Hub</span>
          </h1>
          <p className="mt-1 text-sm text-[#a09ec0]">Admin Dashboard</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
