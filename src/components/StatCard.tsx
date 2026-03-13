import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

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

const highlights: Record<string, string> = {
  green: "border-l-4 border-l-green-500",
  red: "border-l-4 border-l-red-500",
  amber: "border-l-4 border-l-amber-500",
  blue: "border-l-4 border-l-blue-500",
  default: "",
};

export default function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  iconColor = "text-slate-500",
  trend,
  trendLabel,
  highlight = "default",
}: StatCardProps) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm p-5 flex flex-col gap-2 card-hover ${highlights[highlight]}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500 font-medium">{label}</span>
        {Icon && <Icon className={`w-5 h-5 ${iconColor}`} />}
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {(sub || trend) && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          {trend === "up" && <TrendingUp className="w-3.5 h-3.5 text-green-500" />}
          {trend === "down" && <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
          {trend === "neutral" && <Minus className="w-3.5 h-3.5 text-slate-400" />}
          {trendLabel && <span>{trendLabel}</span>}
          {sub && !trendLabel && <span>{sub}</span>}
        </div>
      )}
    </div>
  );
}
