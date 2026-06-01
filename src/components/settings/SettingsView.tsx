/* Settings View */
import { useState } from "react";
import { motion } from "framer-motion";
import { useOrchestraStore } from "@/store/orchestra";
import { Settings, Server, Cpu, Palette, Info } from "lucide-react";

export function SettingsView() {
  const { ollamaConnected, activeModel, setActiveModel, ollamaModels, checkOllama } = useOrchestraStore();
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");

  return (
    <div className="h-full overflow-y-auto p-6 grid-bg space-y-6">
      <div className="flex items-center gap-3">
        <Settings size={20} className="text-white/50"/>
        <div><h2 className="text-lg font-bold text-white/85">Settings</h2><p className="text-xs text-white/30">Configure Orchestra AI</p></div>
      </div>

      {/* Ollama */}
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="glass rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2"><Server size={16} className="text-accent-cyan"/><h3 className="text-sm font-semibold text-white/70">Ollama Connection</h3></div>
        <div className="flex gap-3">
          <input value={ollamaUrl} onChange={e=>setOllamaUrl(e.target.value)} className="flex-1 px-4 py-2 rounded-xl bg-surface-2 border border-white/5 text-sm text-white/70 outline-none focus:border-orchestra-500/30" placeholder="http://localhost:11434"/>
          <button onClick={()=>checkOllama()} className="px-4 py-2 rounded-xl bg-orchestra-500/20 text-orchestra-300 text-sm font-medium hover:bg-orchestra-500/30 transition-colors">Test</button>
        </div>
        <div className="flex items-center gap-2 text-xs"><div className={`w-2 h-2 rounded-full ${ollamaConnected?"bg-accent-emerald":"bg-accent-rose"}`}/><span className="text-white/40">{ollamaConnected?"Connected":"Not connected"}</span></div>
      </motion.div>

      {/* Model Selection */}
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.1}} className="glass rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2"><Cpu size={16} className="text-accent-amber"/><h3 className="text-sm font-semibold text-white/70">Default Model</h3></div>
        <select value={activeModel} onChange={e=>setActiveModel(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-surface-2 border border-white/5 text-sm text-white/70 outline-none">
          <option value="phi4-mini:latest">phi4-mini:latest</option>
          <option value="qwen2.5:3b">qwen2.5:3b</option>
          <option value="qwen2.5-vl:7b">qwen2.5-vl:7b</option>
          <option value="moondream:latest">moondream:latest</option>
          {ollamaModels.map(m=><option key={m.name} value={m.name}>{m.name}</option>)}
        </select>
      </motion.div>

      {/* About */}
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.2}} className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3"><Info size={16} className="text-orchestra-400"/><h3 className="text-sm font-semibold text-white/70">About Orchestra AI</h3></div>
        <p className="text-xs text-white/30 leading-relaxed">Orchestra AI is a local-first, privacy-preserving multimodal AI agent platform. All processing happens on your device — no data leaves your machine. Built with Tauri, React, and Ollama.</p>
        <div className="mt-3 text-[10px] text-white/15 font-mono">v0.1.0 · MIT License · Made with ❤️</div>
      </motion.div>
    </div>
  );
}
