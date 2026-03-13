"use client";

import { createContext, useContext } from "react";

interface ShellContextValue {
  mobileNavOpen: boolean;
  openMobileNav: () => void;
  closeMobileNav: () => void;
  toggleMobileNav: () => void;
  desktopNavCollapsed: boolean;
  openDesktopNav: () => void;
  closeDesktopNav: () => void;
  toggleDesktopNav: () => void;
}

export const ShellContext = createContext<ShellContextValue | null>(null);

export function useShell() {
  const context = useContext(ShellContext);

  if (!context) {
    throw new Error("useShell must be used within AppShell.");
  }

  return context;
}
