/* ──────────────────────────────────────────────────────────
   Sidebar Navigation Component
   ────────────────────────────────────────────────────────── */

import { motion, AnimatePresence } from "framer-motion";
import { useOrchestraStore } from "@/store/orchestra";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MessageSquare,
  Bot,
  Brain,
  Settings,
  ChevronLeft,
  ChevronRight,
  Wifi,
  WifiOff,
  Cpu,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "dashboard" as const, icon: LayoutDashboard, label: "Dashboard" },
  { id: "chat" as const, icon: MessageSquare, label: "Chat" },
  { id: "agents" as const, icon: Bot, label: "Agents" },
  { id: "memory" as const, icon: Brain, label: "Memory" },
  { id: "settings" as const, icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const {
    sidebarOpen,
    toggleSidebar,
    activeView,
    setActiveView,
    ollamaConnected,
    ollamaModels,
    activeModel,
  } = useOrchestraStore();

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarOpen ? 240 : 68 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="relative flex flex-col h-full glass-strong z-20"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orchestra-400 to-orchestra-600 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-lg shadow-orchestra-500/20">
          O
        </div>
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              <h1 className="text-sm font-bold gradient-text whitespace-nowrap">
                Orchestra AI
              </h1>
              <p className="text-[10px] text-white/30 font-mono">
                Edge Agent Platform
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => setActiveView(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-orchestra-500/15 text-orchestra-300 shadow-sm shadow-orchestra-500/10"
                  : "text-white/40 hover:text-white/70 hover:bg-white/5"
              )}
            >
              <item.icon
                size={20}
                className={cn(
                  "shrink-0 transition-colors",
                  isActive ? "text-orchestra-400" : ""
                )}
              />
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute left-0 w-[3px] h-6 bg-orchestra-400 rounded-r-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Status Footer */}
      <div className="p-3 border-t border-white/5 space-y-2">
        {/* Ollama Status */}
        <div
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs",
            ollamaConnected
              ? "text-accent-emerald/80"
              : "text-accent-rose/80"
          )}
        >
          {ollamaConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="whitespace-nowrap"
              >
                {ollamaConnected
                  ? `Ollama · ${ollamaModels.length} models`
                  : "Ollama offline"}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Active Model */}
        {sidebarOpen && ollamaConnected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 px-2 py-1.5 text-xs text-white/30"
          >
            <Cpu size={12} />
            <span className="truncate font-mono">{activeModel}</span>
          </motion.div>
        )}

        {/* Toggle */}
        <button
          id="sidebar-toggle"
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center py-2 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors"
        >
          {sidebarOpen ? (
            <ChevronLeft size={16} />
          ) : (
            <ChevronRight size={16} />
          )}
        </button>
      </div>
    </motion.aside>
  );
}
