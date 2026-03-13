import type { LucideIcon } from "lucide-react";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: LucideIcon;
  iconColor?: string;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  highlight?: "green" | "red" | "amber" | "blue" | "default";
}

const highlightStyles = {
  green: {
    card: "border-[rgba(46,125,50,0.1)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(244,250,245,0.92))]",
    rail: "bg-[var(--rf-green)]",
    icon: "bg-[var(--rf-green-soft)] text-[var(--rf-green)]",
  },
  red: {
    card: "border-[rgba(211,47,47,0.1)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(253,239,239,0.92))]",
    rail: "bg-[var(--rf-red)]",
    icon: "bg-[var(--rf-red-soft)] text-[var(--rf-red)]",
  },
  amber: {
    card: "border-[rgba(249,168,38,0.16)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,248,236,0.92))]",
    rail: "bg-[var(--rf-gold)]",
    icon: "bg-[var(--rf-gold-soft)] text-[#9c660e]",
  },
  blue: {
    card: "border-[rgba(10,35,66,0.1)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,248,251,0.92))]",
    rail: "bg-[var(--rf-navy)]",
    icon: "bg-[rgba(10,35,66,0.08)] text-[var(--rf-navy)]",
  },
  default: {
    card: "border-[rgba(93,112,127,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(246,248,250,0.92))]",
    rail: "bg-[var(--rf-slate)]",
    icon: "bg-[var(--rf-slate-soft)] text-[var(--rf-slate)]",
  },
} as const;

export default function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  iconColor = "",
  trend,
  trendLabel,
  highlight = "default",
}: StatCardProps) {
  const tone = highlightStyles[highlight];
  const detail = trendLabel ?? sub;

  return (
    <article
      className={`card-hover relative overflow-hidden rounded-[1.95rem] border p-5 shadow-[0_18px_36px_-30px_rgba(10,35,66,0.1)] ${tone.card}`}
    >
      <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-[0.08] blur-2xl ${tone.rail}`} />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--rf-slate)]">
            {label}
          </p>
          <p className="mt-3 truncate text-[1.9rem] font-semibold tracking-tight text-[var(--rf-navy)]">
            {value}
          </p>
        </div>
        {Icon && (
          <div
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[1.1rem] ${tone.icon}`}
          >
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
        )}
      </div>

      {detail && (
        <div className="mt-4 flex items-center gap-2 text-sm text-[var(--rf-slate)]">
          {trend === "up" && <TrendingUp className="h-4 w-4 text-[var(--rf-green)]" />}
          {trend === "down" && <TrendingDown className="h-4 w-4 text-[var(--rf-red)]" />}
          {trend === "neutral" && <Minus className="h-4 w-4 text-[var(--rf-slate)]" />}
          <span className="truncate">{detail}</span>
        </div>
      )}
    </article>
  );
}
