/* ──────────────────────────────────────────────────────────
   Top Header Bar Component
   ────────────────────────────────────────────────────────── */

import { motion } from "framer-motion";
import { useOrchestraStore } from "@/store/orchestra";
import {
  Activity,
  Zap,
  Clock,
  Bell,
} from "lucide-react";

export function Header() {
  const { agents, ollamaConnected, metrics } = useOrchestraStore();

  const activeAgentCount = Object.values(agents).filter(
    (a) => a.status === "active" || a.status === "thinking"
  ).length;

  return (
    <header className="h-12 flex items-center justify-between px-6 border-b border-white/5 glass shrink-0">
      <div className="flex items-center gap-4">
        {/* Agent Activity */}
        <div className="flex items-center gap-2 text-xs text-white/40">
          <Activity size={14} className="text-accent-emerald" />
          <span>
            <strong className="text-white/70">{activeAgentCount}</strong> active
            agent{activeAgentCount !== 1 && "s"}
          </span>
        </div>

        {/* Separator */}
        <div className="w-px h-4 bg-white/10" />

        {/* Status */}
        <div className="flex items-center gap-2 text-xs text-white/40">
          <Zap
            size={14}
            className={
              ollamaConnected ? "text-accent-amber" : "text-white/20"
            }
          />
          <span>{ollamaConnected ? "AI Ready" : "Demo Mode"}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* System Stats */}
        <div className="flex items-center gap-3 text-[11px] font-mono text-white/30">
          <span>CPU {metrics.cpuUsage}%</span>
          <span>MEM {metrics.memoryUsage}%</span>
          {metrics.batteryLevel !== undefined && (
            <span>🔋 {metrics.batteryLevel}%</span>
          )}
        </div>

        {/* Time */}
        <div className="flex items-center gap-1.5 text-xs text-white/40">
          <Clock size={12} />
          <TimeDisplay />
        </div>

        {/* Notifications */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="relative p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/70 transition-colors"
        >
          <Bell size={16} />
          {activeAgentCount > 0 && (
            <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-accent-emerald rounded-full" />
          )}
        </motion.button>
      </div>
    </header>
  );
}

function TimeDisplay() {
  const now = new Date();
  return (
    <span className="font-mono text-[11px]">
      {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
    </span>
  );
}
