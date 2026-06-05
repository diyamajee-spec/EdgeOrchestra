import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useOrchestraStore } from "@/store/orchestra";
import { Bot, Settings, Terminal, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const { setActiveView, setActiveModel, toggleSidebar } = useOrchestraStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg overflow-hidden rounded-2xl bg-surface-1 border border-white/10 shadow-2xl"
        >
          <Command
            className="flex flex-col w-full h-full"
            loop
          >
            <div className="flex items-center px-4 border-b border-white/10">
              <Search className="w-5 h-5 text-white/40" />
              <Command.Input
                className="w-full p-4 bg-transparent outline-none text-white/90 placeholder:text-white/40"
                placeholder="Type a command or search..."
                autoFocus
              />
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/10 rounded-md text-white/40"><X size={16}/></button>
            </div>

            <Command.List className="p-2 max-h-[300px] overflow-y-auto">
              <Command.Empty className="py-6 text-center text-sm text-white/40">No results found.</Command.Empty>

              <Command.Group heading="Navigation" className="px-2 py-1 text-xs font-medium text-white/40">
                <Command.Item className="flex items-center gap-2 px-3 py-2 mt-1 rounded-lg hover:bg-orchestra-500/20 text-white/70 cursor-pointer" onSelect={() => { setActiveView("settings"); setOpen(false); }}>
                  <Settings className="w-4 h-4" /> Go to Settings
                </Command.Item>
                <Command.Item className="flex items-center gap-2 px-3 py-2 mt-1 rounded-lg hover:bg-orchestra-500/20 text-white/70 cursor-pointer" onSelect={() => { setActiveView("agents"); setOpen(false); }}>
                  <Bot className="w-4 h-4" /> View Agents
                </Command.Item>
              </Command.Group>

              <Command.Group heading="Actions" className="px-2 py-1 text-xs font-medium text-white/40 mt-2">
                <Command.Item className="flex items-center gap-2 px-3 py-2 mt-1 rounded-lg hover:bg-orchestra-500/20 text-white/70 cursor-pointer" onSelect={() => { setActiveModel("phi4-mini:latest"); setOpen(false); }}>
                  <Terminal className="w-4 h-4" /> Switch to phi4-mini
                </Command.Item>
                <Command.Item className="flex items-center gap-2 px-3 py-2 mt-1 rounded-lg hover:bg-orchestra-500/20 text-white/70 cursor-pointer" onSelect={() => { toggleSidebar(); setOpen(false); }}>
                  <Terminal className="w-4 h-4" /> Toggle Sidebar
                </Command.Item>
              </Command.Group>
            </Command.List>
          </Command>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
