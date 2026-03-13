"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import TopBar from "@/components/TopBar";
import { OccupancyStatusBadge, PaymentStatusBadge } from "@/components/StatusBadge";
import {
  ArrowLeft,
  Building2,
  Plus,
  Users,
  MapPin,
  Phone,
  Megaphone,
} from "lucide-react";
import type { OccupancyStatus, PaymentStatus } from "@/types";

interface UnitData {
  id: string;
  unitNumber: string;
  floor?: string;
  block?: string;
  type?: string;
  rentAmount: number;
  status: OccupancyStatus;
  currentTenancy?: {
    tenant: {
      user: { name: string; email?: string; phone?: string };
    };
    payments: { status: PaymentStatus; amountPaid: number; amountDue: number }[];
  };
}

interface PropertyData {
  id: string;
  name: string;
  address: string;
  city?: string;
  county?: string;
  type: string;
  description?: string;
  amenities?: string;
  isActive: boolean;
  totalUnits: number;
  units: UnitData[];
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

const fmt = (n: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(n);

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddUnit, setShowAddUnit] = useState(false);

  useEffect(() => {
    fetch(`/api/properties/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) router.push("/properties");
        else setProperty(d);
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  const occupiedUnits = property?.units.filter((u) => u.status === "OCCUPIED").length ?? 0;
  const vacantUnits = (property?.units.length ?? 0) - occupiedUnits;

  if (loading) {
    return (
      <AppShell>
        <div className="p-6 text-slate-400 text-sm">Loading…</div>
      </AppShell>
    );
  }

  if (!property) return null;

  return (
    <AppShell>
      <TopBar
        title={property.name}
        actions={
          <button
            onClick={() => setShowAddUnit(true)}
            className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Unit
          </button>
        }
      />

      <div className="p-6 space-y-6">
        <Link
          href="/properties"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Properties
        </Link>

        {/* Property card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h2 className="text-xl font-bold text-slate-900">{property.name}</h2>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${property.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                  {property.isActive ? "Active" : "Inactive"}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {typeLabels[property.type] ?? property.type}
                </span>
              </div>
              <div className="flex items-center gap-1 text-slate-500 text-sm">
                <MapPin className="w-3.5 h-3.5" />
                {property.address}{property.city ? `, ${property.city}` : ""}{property.county ? `, ${property.county}` : ""}
              </div>
              {property.description && (
                <p className="text-slate-500 text-sm mt-2">{property.description}</p>
              )}
              {property.amenities && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {property.amenities.split(",").map((a) => (
                    <span key={a} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      {a.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-slate-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{property.units.length}</p>
              <p className="text-xs text-slate-500 mt-0.5">Total Units</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{occupiedUnits}</p>
              <p className="text-xs text-slate-500 mt-0.5">Occupied</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-500">{vacantUnits}</p>
              <p className="text-xs text-slate-500 mt-0.5">Vacant</p>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/announcements?propertyId=${id}`}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Megaphone className="w-4 h-4" /> Announcements
          </Link>
          <Link
            href={`/payments?propertyId=${id}`}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Users className="w-4 h-4" /> View Payments
          </Link>
          <Link
            href={`/tickets?propertyId=${id}`}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Users className="w-4 h-4" /> Maintenance Tickets
          </Link>
        </div>

        {/* Units grid */}
        <div>
          <h3 className="text-base font-semibold text-slate-900 mb-3">
            Units ({property.units.length})
          </h3>

          {property.units.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
              <p className="text-slate-400 text-sm mb-3">No units yet. Add the first unit.</p>
              <button
                onClick={() => setShowAddUnit(true)}
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Unit
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {property.units.map((unit) => {
                const tenancy = unit.currentTenancy;
                const payment = tenancy?.payments?.[0];

                return (
                  <div
                    key={unit.id}
                    className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-900 text-sm">
                        Unit {unit.unitNumber}
                      </span>
                      <OccupancyStatusBadge status={unit.status} />
                    </div>

                    <div className="text-xs text-slate-400 mb-2">
                      {[unit.block && `Block ${unit.block}`, unit.floor && `Floor ${unit.floor}`, unit.type].filter(Boolean).join(" · ")}
                    </div>

                    <p className="text-lg font-bold text-green-600 mb-3">
                      {fmt(unit.rentAmount)}
                      <span className="text-xs text-slate-400 font-normal">/mo</span>
                    </p>

                    {tenancy && (
                      <div className="border-t border-slate-100 pt-3 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          {tenancy.tenant.user.name}
                        </div>
                        {tenancy.tenant.user.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Phone className="w-3 h-3" />
                            {tenancy.tenant.user.phone}
                          </div>
                        )}
                        {payment && (
                          <div className="flex items-center justify-between mt-1">
                            <PaymentStatusBadge status={payment.status} />
                            <span className="text-xs text-slate-500">
                              {fmt(payment.amountPaid)} paid
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Unit Modal */}
      {showAddUnit && (
        <AddUnitModal
          propertyId={id}
          onClose={() => setShowAddUnit(false)}
          onAdded={(unit) => {
            setProperty((prev) =>
              prev ? { ...prev, units: [...prev.units, unit] } : prev
            );
            setShowAddUnit(false);
          }}
        />
      )}
    </AppShell>
  );
}

// ─── Inline Add Unit Modal ────────────────────────────────────────────────────

function AddUnitModal({
  propertyId,
  onClose,
  onAdded,
}: {
  propertyId: string;
  onClose: () => void;
  onAdded: (unit: UnitData) => void;
}) {
  const [form, setForm] = useState({
    unitNumber: "",
    floor: "",
    block: "",
    type: "",
    bedrooms: "",
    bathrooms: "",
    rentAmount: "",
    depositAmount: "",
    meterNumber: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const setF = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}/units`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to add unit.");
        return;
      }
      onAdded(data);
    } catch {
      setError("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-5">Add Unit</h3>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Unit number *</label>
                <input type="text" value={form.unitNumber} onChange={setF("unitNumber")} placeholder="A1, 101, etc." className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Monthly rent (KSh) *</label>
                <input type="number" value={form.rentAmount} onChange={setF("rentAmount")} placeholder="15000" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Block / Section</label>
                <input type="text" value={form.block} onChange={setF("block")} placeholder="Block A" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Floor</label>
                <input type="text" value={form.floor} onChange={setF("floor")} placeholder="Ground, 1st, etc." className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Unit type</label>
                <input type="text" value={form.type} onChange={setF("type")} placeholder="1BR, Studio, etc." className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Deposit (KSh)</label>
                <input type="number" value={form.depositAmount} onChange={setF("depositAmount")} placeholder="30000" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
              >
                {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {loading ? "Adding…" : "Add Unit"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
