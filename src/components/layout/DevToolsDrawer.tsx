import { motion, AnimatePresence } from "framer-motion";
import { useOrchestraStore } from "@/store/orchestra";
import { Terminal, X, Zap } from "lucide-react";
import { useEffect, useRef } from "react";

export function DevToolsDrawer() {
  const { devToolsOpen, toggleDevTools, syslogs } = useOrchestraStore();
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (devToolsOpen && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [syslogs, devToolsOpen]);

  return (
    <AnimatePresence>
      {devToolsOpen && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 h-64 bg-[#020205]/95 backdrop-blur-xl border-t border-cyan-500/30 z-[900] flex flex-col font-mono text-xs text-cyan-400/80 shadow-[0_-20px_40px_-10px_rgba(6,182,212,0.15)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-cyan-500/20 bg-cyan-500/5">
            <div className="flex items-center gap-2 font-bold tracking-widest text-cyan-400">
              <Terminal size={14} />
              RAW IPC & LORO SYNC INSPECTOR
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-2" />
            </div>
            <button 
              onClick={toggleDevTools}
              className="p-1 hover:bg-cyan-500/20 rounded transition-colors text-cyan-400/60 hover:text-cyan-400"
            >
              <X size={16} />
            </button>
          </div>

          {/* Logs Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {syslogs.map((log, i) => (
              <div key={i} className="flex gap-4 hover:bg-cyan-500/10 px-2 py-0.5 rounded group">
                <span className="text-cyan-500/40 shrink-0 select-none">
                  {i.toString().padStart(4, '0')}
                </span>
                <span className={log.includes("[IPC]") ? "text-indigo-400" : log.includes("ERROR") ? "text-rose-400" : "text-cyan-400/80"}>
                  {log}
                </span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
