"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import TopBar from "@/components/TopBar";
import { Eye, Loader2, Plus, Rocket, Store } from "lucide-react";

interface MarketplaceStatus {
  enabled: boolean;
  userCount: number;
  threshold: number;
}

interface UnitOption {
  id: string;
  unitNumber: string;
  status: string;
  rentAmount: number;
}

interface PropertyOption {
  id: string;
  name: string;
  city: string | null;
  units: UnitOption[];
}

interface ListingItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  monthlyRent: number;
  updatedAt: string;
  property: {
    name: string;
    city: string | null;
  };
  unit: {
    unitNumber: string;
  } | null;
  _count: {
    inquiries: number;
  };
}

const fieldClass =
  "w-full rounded-2xl border border-[rgba(93,112,127,0.16)] bg-white/90 px-4 py-3 text-sm text-[var(--rf-navy)] outline-none transition placeholder:text-[var(--rf-slate)]/70 focus:border-[var(--rf-gold)]";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function MarketplacePage() {
  const [status, setStatus] = useState<MarketplaceStatus | null>(null);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [form, setForm] = useState({
    propertyId: "",
    unitId: "",
    title: "",
    summary: "",
    description: "",
    monthlyRent: "",
    status: "DRAFT",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const selectedProperty =
    properties.find((property) => property.id === form.propertyId) ?? null;

  async function loadPage() {
    setLoading(true);
    setError("");

    try {
      const [statusResponse, listingsResponse, optionsResponse] = await Promise.all([
        fetch("/api/marketplace/status"),
        fetch("/api/listings"),
        fetch("/api/listings/options"),
      ]);

      const [statusPayload, listingsPayload, optionsPayload] = await Promise.all([
        statusResponse.json().catch(() => null),
        listingsResponse.json().catch(() => null),
        optionsResponse.json().catch(() => null),
      ]);

      if (!statusResponse.ok || !listingsResponse.ok || !optionsResponse.ok) {
        throw new Error(
          listingsPayload?.error ??
            optionsPayload?.error ??
            "Unable to load marketplace controls."
        );
      }

      setStatus(statusPayload);
      setListings(listingsPayload.listings ?? []);
      setProperties(optionsPayload.properties ?? []);
    } catch (loadError: unknown) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load marketplace controls."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPage();
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/listings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          propertyId: form.propertyId,
          unitId: form.unitId || null,
          title: form.title,
          summary: form.summary,
          description: form.description,
          monthlyRent: Number(form.monthlyRent),
          status: form.status,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to create listing.");
      }

      setForm({
        propertyId: "",
        unitId: "",
        title: "",
        summary: "",
        description: "",
        monthlyRent: "",
        status: "DRAFT",
      });
      setNotice(
        form.status === "PUBLISHED"
          ? "Listing prepared and marked ready for launch."
          : "Listing saved as draft."
      );
      await loadPage();
    } catch (createError: unknown) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Unable to create listing."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(listing: ListingItem) {
    setError("");
    setNotice("");

    try {
      const response = await fetch(`/api/listings/${listing.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: listing.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED",
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to update listing status.");
      }

      setNotice("Listing posture updated.");
      await loadPage();
    } catch (toggleError: unknown) {
      setError(
        toggleError instanceof Error
          ? toggleError.message
          : "Unable to update listing status."
      );
    }
  }

  const progress = status
    ? Math.min(100, Math.round((status.userCount / status.threshold) * 100))
    : 0;

  return (
    <AppShell>
      <TopBar
        title="Listings & Leads"
        actions={
          status?.enabled ? (
            <Link
              href="/rentals"
              className="inline-flex items-center gap-2 rounded-2xl border border-[rgba(10,35,66,0.12)] bg-white/90 px-4 py-2.5 text-sm font-semibold text-[var(--rf-navy)] transition hover:bg-white"
            >
              <Eye className="h-4 w-4" />
              Open rentals
            </Link>
          ) : undefined
        }
      />

      <div className="space-y-6 p-4 sm:p-6">
        {error && (
          <div className="rounded-[1.5rem] border border-[rgba(211,47,47,0.2)] bg-[var(--rf-red-soft)] px-5 py-4 text-sm text-[var(--rf-red)]">
            {error}
          </div>
        )}

        {notice && (
          <div className="rounded-[1.5rem] border border-[rgba(46,125,50,0.16)] bg-[var(--rf-green-soft)] px-5 py-4 text-sm text-[var(--rf-green)]">
            {notice}
          </div>
        )}

        <section className="grid gap-5 xl:grid-cols-[1.02fr_0.98fr]">
          <div className="relative overflow-hidden rounded-[2.15rem] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(10,35,66,0.98),rgba(10,35,66,0.9))] px-6 py-7 text-white shadow-[0_28px_80px_-54px_rgba(10,35,66,0.32)] sm:px-7">
            <div className="absolute -right-10 top-0 h-36 w-36 rounded-full bg-[rgba(249,168,38,0.14)] blur-3xl" />
            <div className="absolute bottom-0 left-0 h-28 w-40 rounded-full bg-[rgba(46,125,50,0.12)] blur-3xl" />
            <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--rf-gold)]">
              <Store className="h-3.5 w-3.5" />
              Secondary marketplace surface
            </div>
            <h2 className="mt-5 text-4xl font-semibold text-white sm:text-5xl">
              Prepare demand without crowding the operating system.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-white/72">
              Listings can be prepared now. Public discovery only opens when the platform
              reaches the launch threshold, so the OS stays primary.
            </p>
          </div>

          <div className="app-panel rounded-[2rem] p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--rf-slate)]">
              Launch threshold
            </p>
            <h3 className="mt-2 text-3xl font-semibold text-[var(--rf-navy)]">
              Marketplace posture
            </h3>

            {loading ? (
              <div className="mt-6 flex items-center gap-3 text-sm text-[var(--rf-slate)]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading launch posture...
              </div>
            ) : (
              <>
                <div className="mt-6 rounded-[1.7rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,249,250,0.9))] p-5 shadow-[0_16px_30px_-26px_rgba(10,35,66,0.08)]">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[var(--rf-slate)]">Active users</p>
                      <p className="mt-1 text-3xl font-semibold text-[var(--rf-navy)]">
                        {status?.userCount ?? 0}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[var(--rf-slate)]">Target</p>
                      <p className="mt-1 text-lg font-semibold text-[var(--rf-navy)]">
                        {status?.threshold ?? 10000}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 h-3 rounded-full bg-[var(--rf-slate-soft)]">
                    <div
                      className="h-full rounded-full bg-[var(--rf-gold)]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-5 rounded-[1.55rem] bg-[rgba(10,35,66,0.04)] px-4 py-4 text-sm leading-6 text-[var(--rf-slate)]">
                  {status?.enabled
                    ? "The marketplace is live. Published listings are visible to prospects and signed-in tenants."
                    : "Published listings stay queued until the user threshold is reached. That keeps the public layer secondary while the demand engine is prepared."}
                </div>
              </>
            )}
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.94fr_1.06fr]">
          <form onSubmit={handleCreate} className="app-panel rounded-[2rem] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--rf-slate)]">
                  New listing
                </p>
                <h3 className="mt-2 text-3xl font-semibold text-[var(--rf-navy)]">
                  Prepare a rental asset
                </h3>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(10,35,66,0.08)] text-[var(--rf-navy)]">
                <Plus className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <select
                value={form.propertyId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    propertyId: event.target.value,
                    unitId: "",
                  }))
                }
                className={fieldClass}
                required
              >
                <option value="">Select property</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                    {property.city ? ` - ${property.city}` : ""}
                  </option>
                ))}
              </select>

              <select
                value={form.unitId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, unitId: event.target.value }))
                }
                className={fieldClass}
                disabled={!selectedProperty}
              >
                <option value="">Optional unit</option>
                {selectedProperty?.units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    Unit {unit.unitNumber} - {unit.status}
                  </option>
                ))}
              </select>
            </div>

            <input
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
              className={`${fieldClass} mt-3`}
              placeholder="Listing title"
              required
            />

            <input
              value={form.summary}
              onChange={(event) =>
                setForm((current) => ({ ...current, summary: event.target.value }))
              }
              className={`${fieldClass} mt-3`}
              placeholder="Short summary"
              required
            />

            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              className={`${fieldClass} mt-3 min-h-28`}
              placeholder="Describe the space clearly and professionally."
              required
            />

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <input
                value={form.monthlyRent}
                onChange={(event) =>
                  setForm((current) => ({ ...current, monthlyRent: event.target.value }))
                }
                className={fieldClass}
                placeholder="Monthly rent"
                type="number"
                min="0"
                required
              />

              <select
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({ ...current, status: event.target.value }))
                }
                className={fieldClass}
              >
                <option value="DRAFT">Save as draft</option>
                <option value="PUBLISHED">Mark ready for launch</option>
              </select>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-2xl bg-[var(--rf-green)] px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#266a2a] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                {saving ? "Saving..." : "Create listing"}
              </button>
            </div>
          </form>

          <div className="space-y-3">
            <div className="app-panel rounded-[1.85rem] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--rf-slate)]">
                Listing pipeline
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-[var(--rf-navy)]">
                Prepared assets
              </h3>
            </div>

            {loading ? (
              <div className="app-panel rounded-[1.85rem] px-5 py-10 text-sm text-[var(--rf-slate)]">
                <div className="inline-flex items-center gap-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading listings...
                </div>
              </div>
            ) : listings.length === 0 ? (
              <div className="app-panel rounded-[1.85rem] px-5 py-12 text-center">
                <Store className="mx-auto h-10 w-10 text-[var(--rf-slate)]/45" />
                <p className="mt-4 text-lg font-semibold text-[var(--rf-navy)]">
                  No listings yet
                </p>
              </div>
            ) : (
              listings.map((listing) => (
                <article
                  key={listing.id}
                  className="app-panel rounded-[1.85rem] p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-semibold text-[var(--rf-navy)]">
                          {listing.title}
                        </p>
                        <span className="rounded-full bg-[rgba(10,35,66,0.06)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--rf-slate)]">
                          {listing.status === "PUBLISHED"
                            ? status?.enabled
                              ? "Live"
                              : "Ready"
                            : "Draft"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-[var(--rf-slate)]">
                        {listing.property.name}
                        {listing.unit ? ` - Unit ${listing.unit.unitNumber}` : ""}
                        {listing.property.city ? `, ${listing.property.city}` : ""}
                      </p>
                      <p className="mt-3 text-sm leading-6 text-[var(--rf-slate)]">
                        {listing.summary}
                      </p>
                    </div>
                    <div className="rounded-[1.25rem] border border-white/70 bg-white/84 px-4 py-3 text-right">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--rf-slate)]">
                        Rent
                      </p>
                      <p className="mt-1 text-lg font-semibold text-[var(--rf-navy)]">
                        {formatCurrency(listing.monthlyRent)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => void handleToggle(listing)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-[rgba(10,35,66,0.12)] bg-white/90 px-4 py-2.5 text-sm font-semibold text-[var(--rf-navy)] transition hover:bg-white"
                    >
                      <Rocket className="h-4 w-4" />
                      {listing.status === "PUBLISHED" ? "Move to draft" : "Mark ready"}
                    </button>

                    <div className="text-sm text-[var(--rf-slate)]">
                      {listing._count.inquiries} inquiries
                    </div>

                    {status?.enabled && listing.status === "PUBLISHED" && (
                      <Link
                        href={`/rentals/${listing.slug}`}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--rf-green)] transition hover:text-[#266a2a]"
                      >
                        <Eye className="h-4 w-4" />
                        Open public listing
                      </Link>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
