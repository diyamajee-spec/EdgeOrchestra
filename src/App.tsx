/* ──────────────────────────────────────────────────────────
   Orchestra AI — Root Application Component
   ────────────────────────────────────────────────────────── */

import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { ChatView } from "@/components/chat/ChatView";
import { AgentsView } from "@/components/agents/AgentsView";
import { MemoryView } from "@/components/memory/MemoryView";
import { SettingsView } from "@/components/settings/SettingsView";
import { useOrchestraStore, type OrchestraStore } from "@/store/orchestra";
import { AnimatePresence, motion } from "framer-motion";

const VIEWS = {
  dashboard: DashboardView,
  chat: ChatView,
  agents: AgentsView,
  memory: MemoryView,
  settings: SettingsView,
};

export default function App() {
  const activeView = useOrchestraStore((s: OrchestraStore) => s.activeView);
  const ActiveComponent = VIEWS[activeView];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface-0">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="h-full"
            >
              <ActiveComponent />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
