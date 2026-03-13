"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import TopBar from "@/components/TopBar";
import { Building2, Plus, Search, MapPin } from "lucide-react";

interface Property {
  id: string;
  name: string;
  address: string;
  city?: string;
  type: string;
  totalUnits: number;
  isActive: boolean;
  units: { status: string }[];
}

const typeLabels: Record<string, string> = {
  APARTMENT_COMPLEX: "Apartment Complex",
  BEDSITTERS: "Bedsitters",
  SINGLE_ROOMS: "Single Rooms",
  COMMERCIAL: "Commercial",
  MIXED_USE: "Mixed Use",
  GATED_COMMUNITY: "Gated Community",
  OTHER: "Other",
};

export default function PropertiesPage() {
  const { status } = useSession();
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const q = search ? `?q=${encodeURIComponent(search)}` : "";
    fetch(`/api/properties${q}`)
      .then((r) => r.json())
      .then(setProperties)
      .finally(() => setLoading(false));
  }, [status, search]);

  function occupancy(property: Property) {
    const occupied = property.units.filter((u) => u.status === "OCCUPIED").length;
    return { occupied, total: property.units.length };
  }

  return (
    <AppShell>
      <TopBar
        title="Properties"
        actions={
          <Link
            href="/properties/new"
            className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Property
          </Link>
        }
      />

      <div className="p-6 space-y-5">
        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search properties…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {loading ? (
          <div className="text-slate-400 text-sm">Loading…</div>
        ) : properties.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-700 mb-1">No properties yet</h3>
            <p className="text-slate-400 text-sm mb-5">Add your first property to get started.</p>
            <Link
              href="/properties/new"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Property
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties.map((p) => {
              const { occupied, total } = occupancy(p);
              const vacantCount = total - occupied;
              const rate = total > 0 ? Math.round((occupied / total) * 100) : 0;

              return (
                <Link
                  key={p.id}
                  href={`/properties/${p.id}`}
                  className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow border border-slate-100"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-green-600" />
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        p.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {p.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1">{p.name}</h3>
                  <div className="flex items-center gap-1 text-slate-400 text-xs mb-3">
                    <MapPin className="w-3 h-3" />
                    {p.address}{p.city ? `, ${p.city}` : ""}
                  </div>
                  <div className="text-xs text-slate-500 mb-3">
                    {typeLabels[p.type] ?? p.type}
                  </div>

                  {/* Occupancy bar */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>{occupied}/{total} units occupied</span>
                      <span>{rate}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                    {vacantCount > 0 && (
                      <p className="text-xs text-amber-600 mt-1">
                        {vacantCount} vacant {vacantCount === 1 ? "unit" : "units"}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
