"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import TopBar from "@/components/TopBar";
import { TenantStatusBadge, PaymentStatusBadge } from "@/components/StatusBadge";
import { Users, Search, Plus, Phone, Building2 } from "lucide-react";
import type { TenantStatus, PaymentStatus } from "@/types";

interface TenancyItem {
  id: string;
  rentAmount: number;
  startDate: string;
  endDate?: string;
  tenant: {
    id: string;
    status: TenantStatus;
    user: { id: string; name: string; email?: string; phone?: string };
  };
  unit: {
    unitNumber: string;
    property: { id: string; name: string };
    payments: { status: PaymentStatus; amountPaid: number }[];
  };
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(n);

export default function TenantsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [tenancies, setTenancies] = useState<TenancyItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  const fetchTenants = () => {
    if (status !== "authenticated") return;
    const q = search ? `?q=${encodeURIComponent(search)}` : "";
    fetch(`/api/tenants${q}`)
      .then((r) => r.json())
      .then(setTenancies)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTenants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, search]);

  return (
    <AppShell>
      <TopBar
        title="Tenants"
        actions={
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Tenant
          </button>
        }
      />

      <div className="p-6 space-y-5">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, unit…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {loading ? (
          <p className="text-slate-400 text-sm">Loading…</p>
        ) : tenancies.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-700 mb-1">No tenants yet</h3>
            <p className="text-slate-400 text-sm mb-5">
              Add tenants to units to start tracking rent and communications.
            </p>
            <button
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Tenant
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Tenant</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Unit</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Rent</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">This Month</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {tenancies.map((t) => {
                  const payment = t.unit.payments?.[0];
                  return (
                    <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-700 flex-shrink-0">
                            {t.tenant.user.name[0]}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{t.tenant.user.name}</p>
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              {t.tenant.user.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />{t.tenant.user.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">Unit {t.unit.unitNumber}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />{t.unit.property.name}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">{fmt(t.rentAmount)}</td>
                      <td className="px-4 py-3">
                        {payment ? (
                          <div>
                            <PaymentStatusBadge status={payment.status} />
                            <p className="text-xs text-slate-400 mt-0.5">{fmt(payment.amountPaid)} paid</p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <TenantStatusBadge status={t.tenant.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAdd && (
        <AddTenantModal
          onClose={() => setShowAdd(false)}
          onAdded={() => {
            setShowAdd(false);
            fetchTenants();
          }}
        />
      )}
    </AppShell>
  );
}

// ─── Add Tenant Modal ─────────────────────────────────────────────────────────

function AddTenantModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    unitId: "",
    startDate: new Date().toISOString().split("T")[0],
    rentAmount: "",
    deposit: "",
    nationalId: "",
  });
  const [properties, setProperties] = useState<{ id: string; name: string; units: { id: string; unitNumber: string; status: string; rentAmount: number }[] }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inviteLink, setInviteLink] = useState("");

  useEffect(() => {
    fetch("/api/properties")
      .then((r) => r.json())
      .then((props) => {
        // Load units for each property
        Promise.all(
          props.map((p: { id: string; name: string }) =>
            fetch(`/api/properties/${p.id}/units`)
              .then((r) => r.json())
              .then((units) => ({ ...p, units: units.filter((u: { status: string }) => u.status === "VACANT") }))
          )
        ).then(setProperties);
      });
  }, []);

  const setF = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to add tenant.");
        return;
      }
      if (data.inviteToken) {
        setInviteLink(`${window.location.origin}/auth/signup?token=${data.inviteToken}`);
      } else {
        onAdded();
      }
    } catch {
      setError("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const vacantUnits = properties.flatMap((p) =>
    p.units.map((u) => ({ ...u, propertyName: p.name }))
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {inviteLink ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Users className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Tenant added!</h3>
              <p className="text-slate-500 text-sm">
                Share this invite link with the tenant so they can set up their account:
              </p>
              <div className="bg-slate-50 rounded-lg p-3 text-xs font-mono break-all text-slate-700 border border-slate-200">
                {inviteLink}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => navigator.clipboard.writeText(inviteLink)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
                >
                  Copy Link
                </button>
                <button
                  onClick={onAdded}
                  className="flex-1 border border-slate-300 text-slate-600 py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              <h3 className="text-lg font-bold text-slate-900 mb-5">Add Tenant</h3>

              {error && (
                <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Full name *</label>
                  <input type="text" value={form.name} onChange={setF("name")} placeholder="e.g., James Wanjiku" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" required />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Phone</label>
                    <input type="tel" value={form.phone} onChange={setF("phone")} placeholder="0712345678" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Email</label>
                    <input type="email" value={form.email} onChange={setF("email")} placeholder="james@email.com" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Assign to unit *</label>
                  <select
                    value={form.unitId}
                    onChange={(e) => {
                      const unit = vacantUnits.find((u) => u.id === e.target.value);
                      setForm({ ...form, unitId: e.target.value, rentAmount: unit ? String(unit.rentAmount) : form.rentAmount });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                    required
                  >
                    <option value="">Select a vacant unit…</option>
                    {vacantUnits.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.propertyName} – Unit {u.unitNumber} (KSh {u.rentAmount.toLocaleString()}/mo)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Rent amount</label>
                    <input type="number" value={form.rentAmount} onChange={setF("rentAmount")} placeholder="15000" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Deposit</label>
                    <input type="number" value={form.deposit} onChange={setF("deposit")} placeholder="30000" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Lease start date</label>
                  <input type="date" value={form.startDate} onChange={setF("startDate")} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
                  >
                    {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    {loading ? "Adding…" : "Add Tenant"}
                  </button>
                  <button type="button" onClick={onClose} className="px-5 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
