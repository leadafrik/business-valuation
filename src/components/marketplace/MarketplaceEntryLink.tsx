"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface MarketplaceEntryLinkProps {
  href?: string;
  label?: string;
  className?: string;
}

export default function MarketplaceEntryLink({
  href = "/rentals",
  label = "Explore rentals",
  className,
}: MarketplaceEntryLinkProps) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let active = true;

    fetch("/api/marketplace/status")
      .then((response) => response.json())
      .then((payload: { enabled?: boolean }) => {
        if (active) {
          setEnabled(Boolean(payload.enabled));
        }
      })
      .catch(() => {
        if (active) {
          setEnabled(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (!enabled) {
    return null;
  }

  return (
    <Link
      href={href}
      className={
        className ??
        "inline-flex items-center justify-center gap-2 rounded-2xl border border-[rgba(10,35,66,0.1)] bg-white px-5 py-3 text-sm font-semibold text-[var(--rf-navy)] shadow-sm transition hover:-translate-y-0.5 hover:border-[rgba(10,35,66,0.16)]"
      }
    >
      {label}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}
