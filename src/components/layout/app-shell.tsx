"use client";

import React, { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { QuickTransactionModal } from "../financial/quick-transaction-modal";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isQuickTxOpen, setIsQuickTxOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100">
      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Command Center"
          subtitle="Real-time financial positions, performance & attention indicators"
          onOpenQuickTx={() => setIsQuickTxOpen(true)}
        />

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>

      {/* Global Quick Transaction Modal */}
      <QuickTransactionModal
        isOpen={isQuickTxOpen}
        onClose={() => setIsQuickTxOpen(false)}
      />
    </div>
  );
}
