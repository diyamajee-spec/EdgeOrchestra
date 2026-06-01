/* ──────────────────────────────────────────────────────────
   Agent Card Component
   Shows an individual agent's status and capabilities
   ────────────────────────────────────────────────────────── */

import { motion } from "framer-motion";
import type { AgentConfig } from "@/agents/config";
import { cn } from "@/lib/utils";

interface AgentCardProps {
  agent: AgentConfig;
  onClick?: () => void;
  compact?: boolean;
}

const STATUS_COLORS = {
  idle: "bg-surface-3 border-surface-4",
  active: "bg-accent-emerald/10 border-accent-emerald/30",
  thinking: "bg-accent-amber/10 border-accent-amber/30",
  error: "bg-accent-rose/10 border-accent-rose/30",
  disabled: "bg-surface-3/50 border-surface-4/50 opacity-50",
};

const STATUS_DOT = {
  idle: "bg-white/20",
  active: "bg-accent-emerald",
  thinking: "bg-accent-amber animate-pulse",
  error: "bg-accent-rose",
  disabled: "bg-white/10",
};

export function AgentCard({ agent, onClick, compact }: AgentCardProps) {
  return (
    <motion.div
      layout
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative rounded-2xl border cursor-pointer transition-all duration-300",
        STATUS_COLORS[agent.status],
        compact ? "p-3" : "p-4"
      )}
      style={{
        boxShadow:
          agent.status === "active"
            ? `0 0 30px -10px ${agent.color}40`
            : agent.status === "thinking"
            ? `0 0 20px -10px #f59e0b40`
            : "none",
      }}
    >
      {/* Thinking shimmer overlay */}
      {agent.status === "thinking" && (
        <div className="absolute inset-0 rounded-2xl shimmer pointer-events-none" />
      )}

      <div className="flex items-start gap-3">
        {/* Agent Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
          style={{ backgroundColor: `${agent.color}15` }}
        >
          {agent.icon}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white/90">
              {agent.name}
            </h3>
            <div
              className={cn(
                "w-2 h-2 rounded-full shrink-0",
                STATUS_DOT[agent.status]
              )}
            />
          </div>

          {!compact && (
            <>
              {/* Description */}
              <p className="text-xs text-white/40 mt-1 line-clamp-2">
                {agent.description}
              </p>

              {/* Capabilities */}
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {agent.capabilities.slice(0, 3).map((cap) => (
                  <span
                    key={cap}
                    className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/5 text-white/35"
                  >
                    {cap.replace(/_/g, " ")}
                  </span>
                ))}
                {agent.capabilities.length > 3 && (
                  <span className="px-2 py-0.5 text-[10px] text-white/25">
                    +{agent.capabilities.length - 3}
                  </span>
                )}
              </div>

              {/* Model */}
              <div className="flex items-center gap-1.5 mt-2 text-[10px] text-white/25 font-mono">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: agent.color }}
                />
                {agent.model}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Status Label */}
      {agent.status !== "idle" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider",
            agent.status === "active" && "bg-accent-emerald/20 text-accent-emerald",
            agent.status === "thinking" && "bg-accent-amber/20 text-accent-amber",
            agent.status === "error" && "bg-accent-rose/20 text-accent-rose"
          )}
        >
          {agent.status}
        </motion.div>
      )}
    </motion.div>
  );
}
