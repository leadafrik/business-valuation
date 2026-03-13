"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Building2, Eye, EyeOff, Home, Loader2, User } from "lucide-react";

const roleMeta = {
  LANDLORD: {
    title: "Landlord / Owner",
    subtitle: "Create and control the portfolio workspace.",
    icon: Building2,
  },
  PROPERTY_ADMIN: {
    title: "Property Admin",
    subtitle: "Operate properties on behalf of a landlord.",
    icon: User,
  },
  TENANT: {
    title: "Tenant",
    subtitle: "Join now and ask your landlord to attach you later.",
    icon: Home,
  },
} as const;

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("token");
  const defaultRole = inviteToken ? "TENANT" : "LANDLORD";

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: defaultRole,
  });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [alreadyExists, setAlreadyExists] = useState(false);
  const [loading, setLoading] = useState(false);

  const selectedRole = roleMeta[form.role as keyof typeof roleMeta];

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setAlreadyExists(false);

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email || undefined,
          phone: form.phone || undefined,
          password: form.password,
          role: form.role,
          inviteToken: inviteToken ?? undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) setAlreadyExists(true);
        setError(data.error ?? "Registration failed.");
        return;
      }

      router.push("/auth/signin?registered=1");
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="mb-4 inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 font-bold text-white">
              RF
            </div>
            <span className="text-2xl font-bold text-slate-900">RentiFlow</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">
            {inviteToken ? "Accept your invitation" : "Create your account"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {inviteToken
              ? "Set up your tenant account to get started"
              : form.role === "TENANT"
              ? "Join the app first, then ask your landlord to attach you to your property."
              : "Start managing your properties today"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <p>{error}</p>
              {alreadyExists && (
                <p className="mt-1 font-medium">
                  <Link href="/auth/signin" className="underline hover:text-red-900">
                    Sign in to your existing account
                  </Link>
                </p>
              )}
            </div>
          )}

          {!inviteToken && (
            <div className="mb-5">
              <div className="grid gap-3 sm:grid-cols-3">
                {(["LANDLORD", "PROPERTY_ADMIN", "TENANT"] as const).map((role) => {
                  const meta = roleMeta[role];
                  const Icon = meta.icon;

                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setForm({ ...form, role })}
                      className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 text-sm font-medium transition-colors ${
                        form.role === role
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {meta.title}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 rounded-xl border border-[rgba(46,125,50,0.14)] bg-[rgba(46,125,50,0.05)] px-4 py-3 text-sm text-slate-600">
                <p className="font-semibold text-slate-800">{selectedRole.title}</p>
                <p className="mt-1 leading-6">{selectedRole.subtitle}</p>
                {form.role === "TENANT" && (
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Register with the same phone number or email you will share with your landlord, so they can find and add you later.
                  </p>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Full name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={set("name")}
                placeholder="John Kamau"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Phone
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={set("phone")}
                  placeholder="0712345678"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  placeholder="john@email.com"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <p className="-mt-2 text-xs text-slate-400">
              At least one of phone or email is required.
            </p>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={set("password")}
                  placeholder="Min 8 characters"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 pr-10 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Confirm password
              </label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={set("confirmPassword")}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:bg-green-400"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading
                ? "Creating account..."
                : form.role === "TENANT"
                ? "Join the app"
                : "Create account"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/auth/signin" className="font-medium text-green-600 hover:text-green-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  );
}
