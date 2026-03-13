"use client";

import Link from "next/link";
import {
  Building2,
  CreditCard,
  Wrench,
  Bell,
  BarChart3,
  Shield,
  ArrowRight,
  CheckCircle2,
  Smartphone,
} from "lucide-react";

const features = [
  {
    icon: Building2,
    title: "Portfolio Management",
    desc: "Manage unlimited properties, blocks, and units from one central command center.",
    color: "bg-green-50 text-green-600",
  },
  {
    icon: CreditCard,
    title: "M-Pesa Receipt Parsing",
    desc: "Tenants paste or upload their M-Pesa SMS — the system verifies and logs it automatically.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Bell,
    title: "Smart Reminders",
    desc: "Automated rent reminders via SMS & WhatsApp, 3 days before due and escalating after.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: Wrench,
    title: "Maintenance Tickets",
    desc: "Tenants submit photo tickets. Track status from Open → Assigned → Resolved.",
    color: "bg-red-50 text-red-600",
  },
  {
    icon: BarChart3,
    title: "Live Analytics",
    desc: "Know your collection rate, arrears, occupancy, and yield at a glance.",
    color: "bg-purple-50 text-purple-600",
  },
  {
    icon: Smartphone,
    title: "Mobile-First",
    desc: "Tenant portal is optimised for low-bandwidth mobile. Works great on any Android device.",
    color: "bg-teal-50 text-teal-600",
  },
];

const tiers = [
  {
    name: "Starter",
    price: "KSh 1,500",
    period: "/mo",
    units: "Up to 20 units",
    features: [
      "Property & unit management",
      "Manual payment recording",
      "Basic tenant portal",
      "Email notifications",
    ],
    cta: "Get started free",
    highlight: false,
  },
  {
    name: "Growth",
    price: "KSh 3,500",
    period: "/mo",
    units: "Up to 100 units",
    features: [
      "Everything in Starter",
      "M-Pesa receipt parsing",
      "SMS reminders (AfricasTalking)",
      "Maintenance ticketing",
      "Revenue dashboard",
    ],
    cta: "Start free trial",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    units: "Unlimited units",
    features: [
      "Everything in Growth",
      "WhatsApp automation",
      "Predictive analytics",
      "API access",
      "Dedicated support",
    ],
    cta: "Contact us",
    highlight: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center text-white font-bold text-sm">
            RF
          </div>
          <span className="font-bold text-xl text-slate-900">RentiFlow</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/auth/signin"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Get started <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-green-900 text-white px-6 py-24 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block bg-green-600/20 border border-green-500/30 text-green-400 text-xs font-semibold px-3 py-1 rounded-full mb-6 uppercase tracking-widest">
            Built for Kenya
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6">
            The landlord platform that{" "}
            <span className="text-green-400">never sleeps</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Track rent, parse M-Pesa receipts automatically, handle maintenance
            tickets, and communicate with tenants — all from one dashboard.
            <strong className="text-white"> Zero calls. Zero confusion.</strong>
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-white font-semibold px-8 py-3.5 rounded-xl text-lg transition-colors shadow-lg shadow-green-500/20"
            >
              Start free trial <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/auth/signin"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-3.5 rounded-xl text-lg transition-colors border border-white/20"
            >
              Sign in to your account
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="bg-green-600 text-white px-6 py-8">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { v: "Zero", l: "\"Where's my rent?\" calls" },
            { v: "< 30s", l: "Receipt verification" },
            { v: "100%", l: "Mobile optimised" },
            { v: "1 tap", l: "Tenant payment upload" },
          ].map((s) => (
            <div key={s.l}>
              <p className="text-3xl font-extrabold">{s.v}</p>
              <p className="text-green-100 text-sm mt-1">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="px-6 py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold">Everything you need to run your portfolio</h2>
            <p className="text-slate-500 mt-3 text-lg">
              From single bedsitters to 1,000-unit complexes — one tool handles it all.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold">How the M-Pesa magic works</h2>
            <p className="text-slate-500 mt-3">
              Our receipt parser turns a messy SMS into a verified financial record in seconds.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6 text-center">
            {[
              { n: "1", t: "Tenant pays via M-Pesa" },
              { n: "2", t: "Tenant pastes SMS or uploads screenshot" },
              { n: "3", t: "System extracts code, amount & name" },
              { n: "4", t: "Status auto-updates to Paid ✓" },
            ].map((step) => (
              <div key={step.n} className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-lg">
                  {step.n}
                </div>
                <p className="text-sm font-medium text-slate-700">{step.t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="px-6 py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold">Simple, transparent pricing</h2>
            <p className="text-slate-500 mt-3">Start free, upgrade as you grow.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-2xl p-7 ${
                  tier.highlight
                    ? "bg-green-600 text-white shadow-xl shadow-green-500/20 scale-105"
                    : "bg-white shadow-sm"
                }`}
              >
                <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${tier.highlight ? "text-green-200" : "text-slate-400"}`}>
                  {tier.name}
                </p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-3xl font-extrabold">{tier.price}</span>
                  <span className={`text-sm mb-1 ${tier.highlight ? "text-green-200" : "text-slate-400"}`}>{tier.period}</span>
                </div>
                <p className={`text-sm mb-5 ${tier.highlight ? "text-green-100" : "text-slate-500"}`}>{tier.units}</p>
                <ul className="space-y-2 mb-7">
                  {tier.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${tier.highlight ? "text-green-200" : "text-green-500"}`} />
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/signup"
                  className={`block text-center py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                    tier.highlight
                      ? "bg-white text-green-700 hover:bg-green-50"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 py-20 bg-slate-900 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">
            Ready to end the "Did you get my money?" era?
          </h2>
          <p className="text-slate-400 mb-8">
            Join landlords across Kenya who have automated their rent collection
            and reclaimed their time.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
          >
            Create your account free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-950 text-slate-400 px-6 py-8 text-center text-sm">
        <p>© {new Date().getFullYear()} RentiFlow. Built for Kenya. <Shield className="w-3.5 h-3.5 inline mb-0.5 ml-1 text-green-500" /></p>
      </footer>
    </div>
  );
}

