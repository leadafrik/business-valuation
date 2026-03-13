"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import TopBar from "@/components/TopBar";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface AnalyticsData {
  monthly: { month: string; expected: number; collected: number }[];
  occupancy: { name: string; value: number; color: string }[];
  arrears: { month: string; amount: number }[];
  delinquent: { tenant: string; unit: string; property: string; balance: number }[];
  leaseExpiries: {
    tenant: string;
    unit: string;
    property: string;
    endDate: string;
    daysLeft: number;
  }[];
  documentExpiries: {
    id: string;
    name: string;
    type: string;
    property: string | null;
    tenant: string | null;
    expiresAt: string;
    daysLeft: number;
  }[];
  operations: {
    urgentTickets: number;
    unresolvedTickets: number;
    expiringLeases: number;
    expiringDocuments: number;
  };
  totals: {
    totalExpected: number;
    totalCollected: number;
    rate: number;
    vacantUnits: number;
    occupiedUnits: number;
  };
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(n);

const fmtShort = (value: number) => `${(value / 1000).toFixed(0)}K`;
const fmtDays = (days: number) => (days === 0 ? "Today" : `${days} day${days === 1 ? "" : "s"}`);

export default function AnalyticsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    fetch("/api/analytics")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [status]);

  return (
    <AppShell>
      <TopBar title="Analytics" />
      <div className="space-y-6 p-4 sm:p-6">
        {loading || !data ? (
          <p className="text-sm text-slate-400">Loading analytics...</p>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {[
                {
                  label: "Total Expected (YTD)",
                  value: fmt(data.totals.totalExpected),
                  border: "border-slate-300",
                },
                {
                  label: "Total Collected (YTD)",
                  value: fmt(data.totals.totalCollected),
                  border: "border-green-500",
                },
                {
                  label: "Collection Rate (avg)",
                  value: `${data.totals.rate}%`,
                  border:
                    data.totals.rate >= 90
                      ? "border-green-500"
                      : data.totals.rate >= 70
                      ? "border-amber-400"
                      : "border-red-400",
                },
                {
                  label: "Occupied Units",
                  value: String(data.totals.occupiedUnits),
                  border: "border-blue-400",
                },
                {
                  label: "Vacant Units",
                  value: String(data.totals.vacantUnits),
                  border: "border-amber-400",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`rounded-2xl border-l-4 ${item.border} bg-white p-4 shadow-sm`}
                >
                  <p className="mb-1 text-xs text-slate-500">{item.label}</p>
                  <p className="text-xl font-bold text-slate-900">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Urgent tickets", value: data.operations.urgentTickets, border: "border-red-400" },
                { label: "Unresolved tickets", value: data.operations.unresolvedTickets, border: "border-amber-400" },
                { label: "Leases expiring", value: data.operations.expiringLeases, border: "border-blue-400" },
                { label: "Documents expiring", value: data.operations.expiringDocuments, border: "border-slate-300" },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`rounded-2xl border-l-4 ${item.border} bg-white p-4 shadow-sm`}
                >
                  <p className="mb-1 text-xs text-slate-500">{item.label}</p>
                  <p className="text-xl font-bold text-slate-900">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-semibold text-slate-800">
                Monthly Collection - Last 12 months
              </h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.monthly} barGap={4}>
                  <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={fmtShort} />
                  <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={((value: number) => [fmt(value), ""]) as any}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #e2e8f0",
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="expected" name="Expected" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="collected" name="Collected" fill="#16a34a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <h2 className="mb-4 font-semibold text-slate-800">Occupancy Breakdown</h2>
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie
                        data={data.occupancy}
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={72}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {data.occupancy.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        formatter={((value: number) => [`${value} units`, ""]) as any}
                        contentStyle={{ borderRadius: 8, fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {data.occupancy.map((item) => (
                      <div key={item.name} className="flex items-center gap-2 text-sm">
                        <div
                          className="h-3 w-3 flex-shrink-0 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-slate-600">{item.name}</span>
                        <span className="ml-auto pl-4 font-semibold text-slate-800">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <h2 className="mb-4 font-semibold text-slate-800">Arrears Trend</h2>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={data.arrears}>
                    <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={fmtShort} />
                    <Tooltip
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={((value: number) => [fmt(value), ""]) as any}
                      contentStyle={{ borderRadius: 8, fontSize: 12 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      name="Arrears"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="font-semibold text-slate-800">Lease Expiries</h2>
                  <span className="text-xs text-slate-400">Next 90 days</span>
                </div>
                {data.leaseExpiries.length === 0 ? (
                  <p className="text-sm text-slate-400">No active leases are nearing expiry.</p>
                ) : (
                  <div className="space-y-3">
                    {data.leaseExpiries.map((item) => (
                      <div
                        key={`${item.property}-${item.unit}-${item.endDate}`}
                        className="rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{item.tenant}</p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {item.property} - Unit {item.unit}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-semibold text-amber-600">
                              {fmtDays(item.daysLeft)}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-400">
                              {new Date(item.endDate).toLocaleDateString("en-KE")}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="font-semibold text-slate-800">Document Expiries</h2>
                  <span className="text-xs text-slate-400">Next 60 days</span>
                </div>
                {data.documentExpiries.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    No tracked documents are nearing expiry.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {data.documentExpiries.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {[item.property, item.tenant].filter(Boolean).join(" - ") ||
                                "General record"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-semibold text-red-600">
                              {fmtDays(item.daysLeft)}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-400">
                              {new Date(item.expiresAt).toLocaleDateString("en-KE")}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {data.delinquent.length > 0 && (
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <h2 className="mb-4 font-semibold text-slate-800">Top Delinquent Units</h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs text-slate-500">
                      <th className="pb-2 text-left font-semibold">Tenant</th>
                      <th className="pb-2 text-left font-semibold">Unit</th>
                      <th className="pb-2 text-left font-semibold">Property</th>
                      <th className="pb-2 text-right font-semibold">Balance Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.delinquent.map((item, index) => (
                      <tr
                        key={index}
                        className="border-b border-slate-50 transition-colors hover:bg-slate-50"
                      >
                        <td className="py-2.5 font-medium text-slate-800">{item.tenant}</td>
                        <td className="py-2.5 text-slate-600">Unit {item.unit}</td>
                        <td className="py-2.5 text-slate-500">{item.property}</td>
                        <td className="py-2.5 text-right font-bold text-red-600">
                          {fmt(item.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
