"use client";

import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { ShellContext } from "./ShellContext";

interface AppShellProps {
  children: React.ReactNode;
}

const DESKTOP_NAV_STORAGE_KEY = "rf.desktop-nav-collapsed";

export default function AppShell({ children }: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [desktopNavCollapsed, setDesktopNavCollapsed] = useState(false);

  useEffect(() => {
    const storedPreference = window.localStorage.getItem(DESKTOP_NAV_STORAGE_KEY);

    if (storedPreference === "true") {
      setDesktopNavCollapsed(true);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      DESKTOP_NAV_STORAGE_KEY,
      desktopNavCollapsed ? "true" : "false"
    );
  }, [desktopNavCollapsed]);

  return (
    <ShellContext.Provider
      value={{
        mobileNavOpen,
        openMobileNav: () => setMobileNavOpen(true),
        closeMobileNav: () => setMobileNavOpen(false),
        toggleMobileNav: () => setMobileNavOpen((open) => !open),
        desktopNavCollapsed,
        openDesktopNav: () => setDesktopNavCollapsed(false),
        closeDesktopNav: () => setDesktopNavCollapsed(true),
        toggleDesktopNav: () => setDesktopNavCollapsed((collapsed) => !collapsed),
      }}
    >
      <div className="relative flex min-h-screen bg-transparent">
        <Sidebar />
        <main
          className={`relative flex-1 transition-[padding] duration-300 ${
            desktopNavCollapsed ? "lg:pl-[7.25rem]" : "lg:pl-[19rem]"
          }`}
        >
          <div className="min-h-screen px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-6">
            <div className="panel-grid min-h-[calc(100vh-1.5rem)] overflow-hidden rounded-[2.35rem] border border-[rgba(255,255,255,0.74)] bg-[rgba(255,255,255,0.72)] shadow-[0_28px_72px_-56px_rgba(10,35,66,0.14)] backdrop-blur-xl lg:min-h-[calc(100vh-3rem)]">
              {children}
            </div>
          </div>
        </main>
      </div>
    </ShellContext.Provider>
  );
}
