"use client";

import AppShell from "@/components/AppShell";
import TopBar from "@/components/TopBar";
import ConversationWorkspace from "@/components/communication/ConversationWorkspace";

export default function TenantMessagesPage() {
  return (
    <AppShell>
      <TopBar title="Messages" />
      <div className="p-4 sm:p-6">
        <ConversationWorkspace mode="tenant" />
      </div>
    </AppShell>
  );
}
