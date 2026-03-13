"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowLeft, ArrowRight, Building2, Eye, Loader2, Store } from "lucide-react";

interface ListingCard {
  id: string;
  title: string;
  slug: string;
  summary: string;
  monthlyRent: number;
  depositAmount: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  property: {
    name: string;
    city: string | null;
  };
  unit: {
    unitNumber: string;
  } | null;
}

interface MarketplacePayload {
  enabled: boolean;
  userCount: number;
  threshold: number;
  listings: ListingCard[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function RentalsPage() {
  const { data: session } = useSession();
  const [payload, setPayload] = useState<MarketplacePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    fetch("/api/marketplace/listings")
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(data?.error ?? "Unable to load rentals.");
        }

        return data;
      })
      .then((data: MarketplacePayload) => {
        if (active) {
          setPayload(data);
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load rentals.");
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
  }, []);

  const progress = payload
    ? Math.min(100, Math.round((payload.userCount / payload.threshold) * 100))
    : 0;

  return (
    <div className="min-h-screen text-[var(--rf-navy)]">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <nav className="app-panel flex items-center justify-between rounded-[1.95rem] px-5 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--rf-slate)] transition hover:text-[var(--rf-navy)]">
            <ArrowLeft className="h-4 w-4" />
            Back to Rentflow
          </Link>

          <div className="flex items-center gap-3">
            {session?.user?.id && (
              <Link
                href="/rentals/inquiries"
                className="inline-flex items-center gap-2 rounded-2xl border border-[rgba(10,35,66,0.12)] bg-white/90 px-4 py-2.5 text-sm font-semibold text-[var(--rf-navy)] transition hover:bg-white"
              >
                <Eye className="h-4 w-4" />
                Inquiry inbox
              </Link>
            )}
            <Link
              href={session?.user?.id ? "/dashboard" : "/auth/signin"}
              className="inline-flex items-center gap-2 rounded-2xl bg-[var(--rf-navy)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--rf-navy-strong)]"
            >
              {session?.user?.id ? "Open workspace" : "Sign in"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </nav>

        <section className="grid gap-6 py-6 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(10,35,66,0.08)] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--rf-slate)]">
              Secondary marketplace surface
            </div>
            <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-[0.98] text-[var(--rf-navy)] sm:text-6xl">
              Rentals discovered through the same platform that runs the portfolio.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--rf-slate)]">
              Listings stay secondary to the landlord operating system, but they are ready
              to convert interest into structured inquiry and in-app follow-up.
            </p>
          </div>

          <div className="app-panel rounded-[2rem] p-6">
            {loading ? (
              <div className="flex items-center gap-3 text-sm text-[var(--rf-slate)]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading marketplace posture...
              </div>
            ) : payload?.enabled ? (
              <>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--rf-slate)]">
                  Marketplace live
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-[var(--rf-navy)]">
                  Discovery is open
                </h2>
                <p className="mt-3 text-sm leading-7 text-[var(--rf-slate)]">
                  Browse published listings, send structured inquiries, and continue the
                  thread inside the app after sign-in.
                </p>
              </>
            ) : (
              <>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--rf-slate)]">
                  Launch gate
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-[var(--rf-navy)]">
                  The marketplace is still queued
                </h2>
                <p className="mt-3 text-sm leading-7 text-[var(--rf-slate)]">
                  Listings go public automatically at {payload?.threshold ?? 10000} users.
                </p>
                <div className="mt-4 h-3 rounded-full bg-[var(--rf-slate-soft)]">
                  <div
                    className="h-full rounded-full bg-[var(--rf-gold)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-3 text-sm text-[var(--rf-slate)]">
                  {payload?.userCount ?? 0} active users
                </p>
              </>
            )}
          </div>
        </section>

        {error && (
          <div className="rounded-[1.5rem] border border-[rgba(211,47,47,0.2)] bg-[var(--rf-red-soft)] px-5 py-4 text-sm text-[var(--rf-red)]">
            {error}
          </div>
        )}

        {loading ? null : !payload?.enabled ? (
          <section className="app-panel rounded-[2rem] px-6 py-16 text-center">
            <Store className="mx-auto h-10 w-10 text-[var(--rf-slate)]/45" />
            <p className="mt-4 text-lg font-semibold text-[var(--rf-navy)]">
              Public rentals are not live yet
            </p>
          </section>
        ) : payload.listings.length === 0 ? (
          <section className="app-panel rounded-[2rem] px-6 py-16 text-center">
            <Building2 className="mx-auto h-10 w-10 text-[var(--rf-slate)]/45" />
            <p className="mt-4 text-lg font-semibold text-[var(--rf-navy)]">
              No published listings yet
            </p>
          </section>
        ) : (
          <section className="grid gap-4 py-4 md:grid-cols-2 xl:grid-cols-3">
            {payload.listings.map((listing) => (
              <article
                key={listing.id}
                className="card-hover rounded-[1.9rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,247,249,0.92))] p-5 shadow-[0_18px_38px_-32px_rgba(10,35,66,0.1)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xl font-semibold text-[var(--rf-navy)]">
                      {listing.title}
                    </p>
                    <p className="mt-1 text-sm text-[var(--rf-slate)]">
                      {listing.property.name}
                      {listing.unit ? ` - Unit ${listing.unit.unitNumber}` : ""}
                      {listing.property.city ? `, ${listing.property.city}` : ""}
                    </p>
                  </div>
                  <div className="rounded-[1.2rem] bg-[rgba(10,35,66,0.06)] px-3 py-2 text-right">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--rf-slate)]">
                      Rent
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[var(--rf-navy)]">
                      {formatCurrency(listing.monthlyRent)}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-7 text-[var(--rf-slate)]">
                  {listing.summary}
                </p>

                <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--rf-slate)]">
                  {listing.bedrooms !== null && (
                    <span className="rounded-full bg-[rgba(10,35,66,0.06)] px-2.5 py-1">
                      {listing.bedrooms} bedrooms
                    </span>
                  )}
                  {listing.bathrooms !== null && (
                    <span className="rounded-full bg-[rgba(10,35,66,0.06)] px-2.5 py-1">
                      {listing.bathrooms} bathrooms
                    </span>
                  )}
                  {listing.depositAmount !== null && (
                    <span className="rounded-full bg-[rgba(46,125,50,0.08)] px-2.5 py-1 text-[var(--rf-green)]">
                      Deposit {formatCurrency(listing.depositAmount)}
                    </span>
                  )}
                </div>

                <Link
                  href={`/rentals/${listing.slug}`}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--rf-green)] transition hover:text-[#266a2a]"
                >
                  View listing
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
