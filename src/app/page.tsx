import Link from "next/link";
import MarketplaceEntryLink from "@/components/marketplace/MarketplaceEntryLink";
import {
  ArrowRight,
  BellRing,
  Building2,
  CheckCircle2,
  CreditCard,
  FileText,
  ShieldCheck,
  Smartphone,
  Wrench,
} from "lucide-react";

const featureCards = [
  {
    icon: Building2,
    title: "Portfolio oversight",
    body: "See properties, units, occupancy, and risk from one disciplined operating view.",
    tone: "border-[rgba(10,35,66,0.08)] bg-white",
    iconTone: "bg-[rgba(10,35,66,0.08)] text-[var(--rf-navy)]",
  },
  {
    icon: CreditCard,
    title: "Payment confidence",
    body: "Move from M-Pesa receipt to verified rent record with less ambiguity and less rework.",
    tone: "border-[rgba(46,125,50,0.12)] bg-white",
    iconTone: "bg-[var(--rf-green-soft)] text-[var(--rf-green)]",
  },
  {
    icon: Wrench,
    title: "Maintenance control",
    body: "Track service issues through clear priorities and statuses instead of scattered calls.",
    tone: "border-[rgba(249,168,38,0.22)] bg-white",
    iconTone: "bg-[var(--rf-gold-soft)] text-[#9c660e]",
  },
  {
    icon: BellRing,
    title: "Tenant communication",
    body: "Handle notices, reminders, and updates from the same place you manage operations.",
    tone: "border-[rgba(93,112,127,0.16)] bg-white",
    iconTone: "bg-[var(--rf-slate-soft)] text-[var(--rf-slate)]",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen text-[var(--rf-navy)]">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <nav className="app-panel flex items-center justify-between rounded-[1.95rem] px-5 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--rf-navy)] text-sm font-black text-white shadow-[0_16px_32px_-18px_rgba(10,35,66,0.55)]">
              RF
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--rf-slate)]">
                Real estate operations
              </p>
              <p className="text-xl font-semibold tracking-tight text-[var(--rf-navy)]">
                RentiFlow
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/signin"
              className="hidden text-sm font-semibold text-[var(--rf-slate)] transition hover:text-[var(--rf-navy)] sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 rounded-2xl bg-[var(--rf-navy)] px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[var(--rf-navy-strong)]"
            >
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </nav>

        <section className="grid gap-6 py-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-10">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(10,35,66,0.08)] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--rf-slate)]">
              Professional landlord operating system
            </div>
            <div>
              <h1 className="max-w-3xl text-5xl font-semibold leading-[0.98] text-[var(--rf-navy)] sm:text-6xl">
                Trustworthy software for rent collection, service, and portfolio control.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--rf-slate)]">
                RentiFlow gives landlords and property teams a reliable system for payments, occupancy, maintenance, notices, and documents, built to feel stable, clear, and professional.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--rf-green)] px-6 py-3.5 text-base font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#266a2a]"
              >
                Open your workspace
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/auth/signin"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[rgba(10,35,66,0.1)] bg-white px-6 py-3.5 text-base font-semibold text-[var(--rf-navy)] shadow-sm transition hover:border-[rgba(10,35,66,0.16)]"
              >
                Sign in
              </Link>
              <MarketplaceEntryLink />
            </div>

            <p className="text-sm leading-6 text-[var(--rf-slate)]">
              Tenants can join too. Create an account first, then ask your landlord to add you using your registered phone number or email.
            </p>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { value: "<30s", label: "receipt review cycle" },
                { value: "1 desk", label: "for payments and maintenance" },
                { value: "24/7", label: "tenant self-service access" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.65rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,247,249,0.92))] px-4 py-4 shadow-[0_18px_34px_-30px_rgba(10,35,66,0.1)]"
                >
                  <p className="text-3xl font-semibold text-[var(--rf-navy)]">{item.value}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--rf-slate)]">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2.35rem] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(10,35,66,0.98),rgba(10,35,66,0.9))] p-5 text-white shadow-[0_30px_80px_-52px_rgba(10,35,66,0.36)]">
            <div className="absolute -right-10 -top-8 h-36 w-36 rounded-full bg-[rgba(249,168,38,0.16)] blur-3xl" />
            <div className="absolute bottom-0 left-0 h-28 w-40 rounded-full bg-[rgba(46,125,50,0.14)] blur-3xl" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">
                  Live posture
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-white">
                  Stable from the first glance
                </h2>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 text-right text-[var(--rf-navy)] shadow-sm">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--rf-slate)]">
                  Collected
                </p>
                <p className="mt-1 text-2xl font-semibold">KES 328K</p>
              </div>
            </div>

            <div className="relative mt-5 rounded-[1.75rem] bg-white/8 p-4 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Collection progress</p>
                  <p className="mt-1 text-sm text-white/62">Recorded against expected rent</p>
                </div>
                <span className="text-2xl font-semibold text-[var(--rf-gold)]">91%</span>
              </div>
              <div className="mt-4 h-2.5 rounded-full bg-white/10">
                <div className="h-full w-[91%] rounded-full bg-[var(--rf-green)]" />
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.65rem] bg-white/7 p-4 backdrop-blur">
                <p className="text-sm font-semibold text-white">Open tickets</p>
                <p className="mt-2 text-3xl font-semibold text-[var(--rf-gold)]">14</p>
                <p className="mt-2 text-sm leading-6 text-white/62">
                  Prioritized work orders, not scattered follow-up.
                </p>
              </div>
              <div className="rounded-[1.65rem] bg-white/7 p-4 backdrop-blur">
                <p className="text-sm font-semibold text-white">Vacant units</p>
                <p className="mt-2 text-3xl font-semibold text-[var(--rf-gold)]">08</p>
                <p className="mt-2 text-sm leading-6 text-white/62">
                  Clear visibility into occupancy exposure.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {featureCards.map((card) => {
              const Icon = card.icon;
              return (
                <article
                  key={card.title}
                  className={`card-hover rounded-[1.85rem] border border-white/70 p-5 shadow-[0_18px_38px_-32px_rgba(10,35,66,0.1)] ${card.tone}`}
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.iconTone}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-5 text-2xl font-semibold text-[var(--rf-navy)]">
                    {card.title}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-[var(--rf-slate)]">{card.body}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="grid gap-5 py-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="app-panel rounded-[1.95rem] p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--rf-slate)]">
              Why it works
            </p>
            <h2 className="mt-3 text-4xl font-semibold text-[var(--rf-navy)]">
              Designed for trust, not clutter.
            </h2>
            <p className="mt-4 text-sm leading-7 text-[var(--rf-slate)]">
              The goal is simple: help property teams make better decisions with clearer information, steadier workflows, and less operational noise.
            </p>

            <div className="mt-6 space-y-3">
              {[
                "Deep navy gives the product a stable and professional foundation.",
                "Green highlights financial success and positive progress.",
                "Gold draws attention without turning the interface into alarm.",
              ].map((point) => (
                <div
                  key={point}
                  className="flex items-start gap-3 rounded-[1.55rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,247,249,0.92))] px-4 py-3"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--rf-green)]" />
                  <p className="text-sm leading-6 text-[var(--rf-slate)]">{point}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            {[
              {
                icon: CreditCard,
                title: "From payment to proof",
                body: "Attach receipts, balances, and unit context to one dependable financial record.",
              },
              {
                icon: Smartphone,
                title: "Mobile-friendly by design",
                body: "Let tenants pay, submit issues, and read notices without friction on everyday devices.",
              },
              {
                icon: FileText,
                title: "Documents with context",
                body: "Keep operational records attached to the right property and tenancy.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="app-panel rounded-[1.75rem] p-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[var(--rf-navy)] text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-[var(--rf-navy)]">{item.title}</p>
                      <p className="mt-2 text-sm leading-7 text-[var(--rf-slate)]">{item.body}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="py-6">
          <div className="relative overflow-hidden rounded-[2.1rem] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(10,35,66,0.98),rgba(10,35,66,0.92))] px-6 py-8 text-white shadow-[0_28px_80px_-48px_rgba(10,35,66,0.34)] sm:px-8">
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[rgba(249,168,38,0.12)] blur-3xl" />
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/55">
                  Ready to start
                </p>
                <h2 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight text-white">
                  Bring payments, maintenance, and property oversight into one professional system.
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-8 text-white/72">
                  RentiFlow is built to help landlord teams appear organized because their operations actually are.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--rf-green)] px-6 py-3.5 text-base font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#266a2a]"
                >
                  Create workspace
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/auth/signin"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/16 bg-white/8 px-6 py-3.5 text-base font-semibold text-white transition hover:bg-white/12"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </section>

        <footer className="px-2 pb-8 pt-2 text-sm text-[var(--rf-slate)]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p>RentiFlow is designed for stable operations, clear decisions, and professional landlord workflows.</p>
            <div className="inline-flex items-center gap-2 text-[var(--rf-slate)]">
              <ShieldCheck className="h-4 w-4 text-[var(--rf-green)]" />
              Built for trust
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
