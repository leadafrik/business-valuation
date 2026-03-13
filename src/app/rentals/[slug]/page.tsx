"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, ArrowRight, Loader2, MessageSquare, Store } from "lucide-react";

interface ListingDetail {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  monthlyRent: number;
  depositAmount: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  property: {
    id: string;
    name: string;
    address: string;
    city: string | null;
  };
  unit: {
    id: string;
    unitNumber: string;
  } | null;
}

interface ListingPayload {
  enabled: boolean;
  userCount: number;
  threshold: number;
  listing: ListingDetail;
}

function formatCurrency(value: number | null) {
  if (value === null) {
    return "Not set";
  }

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function RentalDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const { data: session } = useSession();
  const [payload, setPayload] = useState<ListingPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  useEffect(() => {
    if (!session?.user) {
      return;
    }

    setForm((current) => ({
      ...current,
      name: current.name || session.user.name || "",
      email: current.email || session.user.email || "",
      phone: current.phone || session.user.phone || "",
    }));
  }, [session?.user]);

  useEffect(() => {
    let active = true;

    fetch(`/api/marketplace/listings/${slug}`)
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(data?.error ?? "Unable to load listing.");
        }

        return data;
      })
      .then((data: ListingPayload) => {
        if (active) {
          setPayload(data);
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load listing.");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [slug]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(`/api/marketplace/listings/${slug}/inquiries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to send inquiry.");
      }

      setNotice(
        data?.conversationAvailable
          ? "Inquiry sent. You can continue the thread in your inquiry inbox."
          : "Inquiry sent. Sign in later to continue the conversation inside the app."
      );
      setForm((current) => ({ ...current, message: "" }));
    } catch (submitError: unknown) {
      setError(
        submitError instanceof Error ? submitError.message : "Unable to send inquiry."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const listing = payload?.listing;

  return (
    <div className="min-h-screen text-[var(--rf-navy)]">
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
        <nav className="app-panel flex items-center justify-between rounded-[1.95rem] px-5 py-4">
          <Link href="/rentals" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--rf-slate)] transition hover:text-[var(--rf-navy)]">
            <ArrowLeft className="h-4 w-4" />
            Back to rentals
          </Link>

          {session?.user?.id ? (
            <Link
              href="/rentals/inquiries"
              className="inline-flex items-center gap-2 rounded-2xl border border-[rgba(10,35,66,0.12)] bg-white/90 px-4 py-2.5 text-sm font-semibold text-[var(--rf-navy)] transition hover:bg-white"
            >
              <MessageSquare className="h-4 w-4" />
              Inquiry inbox
            </Link>
          ) : (
            <Link
              href="/auth/signin"
              className="inline-flex items-center gap-2 rounded-2xl bg-[var(--rf-navy)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--rf-navy-strong)]"
            >
              Sign in
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </nav>

        {loading ? (
          <section className="app-panel mt-6 rounded-[2rem] px-6 py-16 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[var(--rf-slate)]" />
          </section>
        ) : error || !listing ? (
          <section className="app-panel mt-6 rounded-[2rem] px-6 py-16 text-center">
            <Store className="mx-auto h-10 w-10 text-[var(--rf-slate)]/45" />
            <p className="mt-4 text-lg font-semibold text-[var(--rf-navy)]">
              {error || "Listing not found"}
            </p>
          </section>
        ) : (
          <section className="grid gap-6 py-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-5">
              <div className="relative overflow-hidden rounded-[2.15rem] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(10,35,66,0.98),rgba(10,35,66,0.9))] px-6 py-7 text-white shadow-[0_28px_80px_-54px_rgba(10,35,66,0.32)] sm:px-7">
                <div className="absolute -right-10 top-0 h-36 w-36 rounded-full bg-[rgba(249,168,38,0.14)] blur-3xl" />
                <div className="absolute bottom-0 left-0 h-28 w-40 rounded-full bg-[rgba(46,125,50,0.12)] blur-3xl" />
                <h1 className="text-4xl font-semibold text-white sm:text-5xl">{listing.title}</h1>
                <p className="mt-4 max-w-2xl text-base leading-8 text-white/72">
                  {listing.summary}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <div className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm text-white/80">
                    {listing.property.name}
                  </div>
                  {listing.unit && (
                    <div className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm text-white/80">
                      Unit {listing.unit.unitNumber}
                    </div>
                  )}
                  {listing.property.city && (
                    <div className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm text-white/80">
                      {listing.property.city}
                    </div>
                  )}
                </div>
              </div>

              <div className="app-panel rounded-[2rem] p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--rf-slate)]">
                  Listing details
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.45rem] border border-white/70 bg-white/84 px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--rf-slate)]">
                      Monthly rent
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[var(--rf-navy)]">
                      {formatCurrency(listing.monthlyRent)}
                    </p>
                  </div>
                  <div className="rounded-[1.45rem] border border-white/70 bg-white/84 px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--rf-slate)]">
                      Deposit
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[var(--rf-navy)]">
                      {formatCurrency(listing.depositAmount)}
                    </p>
                  </div>
                  <div className="rounded-[1.45rem] border border-white/70 bg-white/84 px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--rf-slate)]">
                      Bedrooms / Bathrooms
                    </p>
                    <p className="mt-2 text-lg font-semibold text-[var(--rf-navy)]">
                      {listing.bedrooms ?? "-"} / {listing.bathrooms ?? "-"}
                    </p>
                  </div>
                  <div className="rounded-[1.45rem] border border-white/70 bg-white/84 px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--rf-slate)]">
                      Space
                    </p>
                    <p className="mt-2 text-lg font-semibold text-[var(--rf-navy)]">
                      {listing.sqft ? `${listing.sqft} sqft` : "Not set"}
                    </p>
                  </div>
                </div>
                <p className="mt-5 text-sm leading-7 text-[var(--rf-slate)]">
                  {listing.description}
                </p>
                <p className="mt-4 text-sm leading-7 text-[var(--rf-slate)]/85">
                  {listing.property.address}
                </p>
              </div>
            </div>

            <div className="app-panel rounded-[2rem] p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--rf-slate)]">
                Inquiry
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-[var(--rf-navy)]">
                Ask about this rental
              </h2>
              <p className="mt-3 text-sm leading-7 text-[var(--rf-slate)]">
                Send a structured inquiry now. If you sign in, the conversation stays inside
                the platform.
              </p>

              {notice && (
                <div className="mt-5 rounded-[1.4rem] border border-[rgba(46,125,50,0.16)] bg-[var(--rf-green-soft)] px-4 py-3 text-sm text-[var(--rf-green)]">
                  {notice}
                </div>
              )}

              {error && !loading && (
                <div className="mt-5 rounded-[1.4rem] border border-[rgba(211,47,47,0.2)] bg-[var(--rf-red-soft)] px-4 py-3 text-sm text-[var(--rf-red)]">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-5 space-y-3">
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-[rgba(93,112,127,0.16)] bg-white/90 px-4 py-3 text-sm text-[var(--rf-navy)] outline-none transition placeholder:text-[var(--rf-slate)]/70 focus:border-[var(--rf-gold)]"
                  placeholder="Full name"
                  required
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    value={form.email}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, email: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-[rgba(93,112,127,0.16)] bg-white/90 px-4 py-3 text-sm text-[var(--rf-navy)] outline-none transition placeholder:text-[var(--rf-slate)]/70 focus:border-[var(--rf-gold)]"
                    placeholder="Email"
                    type="email"
                  />
                  <input
                    value={form.phone}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, phone: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-[rgba(93,112,127,0.16)] bg-white/90 px-4 py-3 text-sm text-[var(--rf-navy)] outline-none transition placeholder:text-[var(--rf-slate)]/70 focus:border-[var(--rf-gold)]"
                    placeholder="Phone"
                  />
                </div>
                <textarea
                  value={form.message}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, message: event.target.value }))
                  }
                  className="min-h-32 w-full rounded-2xl border border-[rgba(93,112,127,0.16)] bg-white/90 px-4 py-3 text-sm text-[var(--rf-navy)] outline-none transition placeholder:text-[var(--rf-slate)]/70 focus:border-[var(--rf-gold)]"
                  placeholder="Tell the landlord what you need to know."
                  required
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[var(--rf-green)] px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#266a2a] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                  Send inquiry
                </button>
              </form>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
