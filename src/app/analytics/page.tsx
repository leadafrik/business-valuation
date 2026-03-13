"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import TopBar from "@/components/TopBar";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from "recharts";

interface AnalyticsData {
  monthly: { month: string; expected: number; collected: number }[];
  occupancy: { name: string; value: number; color: string }[];
  arrears: { month: string; amount: number }[];
  delinquent: { tenant: string; unit: string; property: string; balance: number }[];
  totals: { totalExpected: number; totalCollected: number; rate: number; vacantUnits: number; occupiedUnits: number };
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n);

const fmt2 = (v: number) => `${(v / 1000).toFixed(0)}K`;

export default function AnalyticsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (status === "unauthenticated") router.push("/auth/signin"); }, [status, router]);

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
      <div className="p-6 space-y-6">
        {loading || !data ? (
          <p className="text-slate-400 text-sm">Loading analytics…</p>
        ) : (
          <>
            {/* KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: "Total Expected (YTD)", value: fmt(data.totals.totalExpected), border: "border-slate-300" },
                { label: "Total Collected (YTD)", value: fmt(data.totals.totalCollected), border: "border-green-500" },
                { label: "Collection Rate (avg)", value: `${data.totals.rate}%`, border: data.totals.rate >= 90 ? "border-green-500" : data.totals.rate >= 70 ? "border-amber-400" : "border-red-400" },
                { label: "Occupied Units", value: String(data.totals.occupiedUnits), border: "border-blue-400" },
                { label: "Vacant Units", value: String(data.totals.vacantUnits), border: "border-amber-400" },
              ].map((k) => (
                <div key={k.label} className={`bg-white rounded-xl border-l-4 ${k.border} shadow-sm p-4`}>
                  <p className="text-xs text-slate-500 mb-1">{k.label}</p>
                  <p className="text-xl font-bold text-slate-900">{k.value}</p>
                </div>
              ))}
            </div>

            {/* Monthly collection bar chart */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="font-semibold text-slate-800 mb-4">Monthly Collection — Last 12 months</h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.monthly} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis tickFormatter={fmt2} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={((v: number) => [fmt(v), '']) as any}
                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="expected" name="Expected" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="collected" name="Collected" fill="#16a34a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Occupancy pie */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h2 className="font-semibold text-slate-800 mb-4">Occupancy Breakdown</h2>
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie data={data.occupancy} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value">
                        {data.occupancy.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={((v: number) => [v + ' units', '']) as any} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {data.occupancy.map((o) => (
                      <div key={o.name} className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: o.color }} />
                        <span className="text-slate-600">{o.name}</span>
                        <span className="font-semibold text-slate-800 ml-auto pl-4">{o.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Arrears trend */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h2 className="font-semibold text-slate-800 mb-4">Arrears Trend</h2>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={data.arrears}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <YAxis tickFormatter={fmt2} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <Tooltip formatter={((v: number) => [fmt(v), '']) as any} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Line type="monotone" dataKey="amount" name="Arrears" stroke="#ef4444" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top delinquent units */}
            {data.delinquent.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h2 className="font-semibold text-slate-800 mb-4">Top Delinquent Units</h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-500 border-b border-slate-100">
                      <th className="text-left pb-2 font-semibold">Tenant</th>
                      <th className="text-left pb-2 font-semibold">Unit</th>
                      <th className="text-left pb-2 font-semibold">Property</th>
                      <th className="text-right pb-2 font-semibold">Balance Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.delinquent.map((d, i) => (
                      <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 font-medium text-slate-800">{d.tenant}</td>
                        <td className="py-2.5 text-slate-600">Unit {d.unit}</td>
                        <td className="py-2.5 text-slate-500">{d.property}</td>
                        <td className="py-2.5 text-right font-bold text-red-600">{fmt(d.balance)}</td>
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
