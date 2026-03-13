"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import TopBar from "@/components/TopBar";
import { CheckCircle, AlertTriangle, Clock, Smartphone, ArrowLeft } from "lucide-react";

type ParseResult =
  | { state: "idle" }
  | { state: "auto_approved"; txnId: string; amount: number; name: string; date: string }
  | { state: "pending_review"; txnId?: string; amount?: number; confidence: number }
  | { state: "mismatch"; reasons: string[] }
  | { state: "error"; message: string };

const fmt = (n: number) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n);

export default function TenantPayPage() {
  const { status } = useSession();
  const router = useRouter();
  const [smsText, setSmsText] = useState("");
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [result, setResult] = useState<ParseResult>({ state: "idle" });
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (status === "unauthenticated") router.push("/auth/signin"); }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    // Get tenancy's current payment ID
    fetch("/api/tenant/dashboard")
      .then((r) => r.json())
      .then((data) => {
        if (data?.tenancy?.thisMonthPayment?.id) {
          setPaymentId(data.tenancy.thisMonthPayment.id);
        }
      });
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsText.trim()) return;
    setLoading(true);
    setResult({ state: "idle" });
    try {
      const res = await fetch("/api/payments/parse-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: smsText, paymentId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setResult({ state: "error", message: data.error ?? "Something went wrong." });
        return;
      }

      if (data.autoApproved) {
        setResult({
          state: "auto_approved",
          txnId: data.parsed.transactionId ?? "",
          amount: data.parsed.amount ?? 0,
          name: data.parsed.senderName ?? "",
          date: data.parsed.date ?? "",
        });
      } else if (data.matchResult?.flags?.length) {
        setResult({ state: "mismatch", reasons: data.matchResult.flags });
      } else {
        setResult({ state: "pending_review", txnId: data.parsed?.transactionId, amount: data.parsed?.amount, confidence: Math.round((data.parsed?.confidence ?? 0) * 100) });
      }
    } catch {
      setResult({ state: "error", message: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <TopBar title="Submit Rent Payment" />
      <div className="p-6 max-w-xl mx-auto space-y-5">
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Hero CTA */}
        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 text-white text-center space-y-2">
          <Smartphone className="w-10 h-10 mx-auto text-green-200" />
          <h2 className="text-xl font-bold">I Have Paid My Rent</h2>
          <p className="text-green-100 text-sm">Paste your M-Pesa confirmation SMS below. We&apos;ll verify it instantly.</p>
        </div>

        {/* Result states */}
        {result.state === "auto_approved" && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center space-y-3">
            <CheckCircle className="w-10 h-10 text-green-600 mx-auto" />
            <h3 className="font-bold text-green-800 text-lg">Payment Verified! ✓</h3>
            <p className="text-green-700 text-sm">Your rent payment has been automatically matched and recorded.</p>
            <div className="bg-white rounded-xl p-4 text-left space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Transaction ID</span><span className="font-mono font-semibold">{result.txnId}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Amount</span><span className="font-semibold text-green-700">{fmt(result.amount)}</span></div>
              {result.name && <div className="flex justify-between"><span className="text-slate-500">Sender</span><span className="font-semibold">{result.name}</span></div>}
              {result.date && <div className="flex justify-between"><span className="text-slate-500">Date</span><span className="font-semibold">{result.date}</span></div>}
            </div>
            <button onClick={() => { setSmsText(""); setResult({ state: "idle" }); }} className="text-sm text-green-700 underline">Submit another</button>
          </div>
        )}

        {result.state === "pending_review" && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center space-y-3">
            <Clock className="w-10 h-10 text-amber-500 mx-auto" />
            <h3 className="font-bold text-amber-800 text-lg">Sent for Review</h3>
            <p className="text-amber-700 text-sm">Your payment has been submitted to your landlord for manual verification. You&apos;ll be notified once it&apos;s confirmed.</p>
            {result.txnId && <p className="text-xs text-amber-600 font-mono">Txn: {result.txnId} · {result.amount ? fmt(result.amount) : ""} · Confidence: {result.confidence}%</p>}
          </div>
        )}

        {result.state === "mismatch" && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center space-y-3">
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
            <h3 className="font-bold text-red-800 text-lg">Receipt Issue</h3>
            <p className="text-red-700 text-sm">We found a potential issue with this receipt:</p>
            <ul className="text-sm text-red-600 space-y-1">
              {result.reasons.map((r) => <li key={r} className="flex items-center gap-2 justify-center"><span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />{r.replace(/_/g, " ")}</li>)}
            </ul>
            <p className="text-xs text-red-500">Please contact your landlord or try again with the correct SMS.</p>
          </div>
        )}

        {result.state === "error" && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
            {result.message}
          </div>
        )}

        {/* Input form */}
        {result.state !== "auto_approved" && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Paste M-Pesa SMS *</label>
              <p className="text-xs text-slate-400 mb-2">Copy the full message you received from MPESA after paying.</p>
              <textarea
                value={smsText}
                onChange={(e) => setSmsText(e.target.value)}
                rows={6}
                placeholder={"QH7F3X9JKL Confirmed. Ksh15,000 sent to JOHN DOE 0712345678 on 5/7/25 at 10:32 AM. New M-PESA balance is Ksh125.00. Transaction cost, Ksh0.00."}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none font-mono leading-relaxed"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !smsText.trim()}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-bold py-3.5 rounded-xl text-base transition-colors"
            >
              {loading && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading ? "Verifying…" : "Submit Payment Proof"}
            </button>
          </form>
        )}

        <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-400 space-y-1">
          <p className="font-semibold text-slate-500">How it works</p>
          <p>1. Pay rent via M-Pesa to your landlord&apos;s Paybill / Till</p>
          <p>2. Open the confirmation SMS from MPESA</p>
          <p>3. Copy the full text and paste it above</p>
          <p>4. We extract and verify the transaction automatically</p>
        </div>
      </div>
    </AppShell>
  );
}
