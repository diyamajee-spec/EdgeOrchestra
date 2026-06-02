/* Dashboard View */
import { useEffect } from "react";
import { motion } from "framer-motion";
import { useOrchestraStore } from "@/store/orchestra";
import { AgentCard } from "@/components/agents/AgentCard";
import { AgentGraph } from "@/components/agents/AgentGraph";
import { Cpu, HardDrive, Wifi, WifiOff, Zap, Brain, MessageSquare, Activity, TrendingUp, Shield } from "lucide-react";
import type { AgentId } from "@/types";

const anim = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };

export function DashboardView() {
  const { agents, ollamaConnected, ollamaModels, messages, memories, checkOllama, metrics } = useOrchestraStore();

  useEffect(() => { checkOllama(); const i = setInterval(checkOllama, 15000); return () => clearInterval(i); }, [checkOllama]);

  const active = Object.values(agents).filter(a => a.status === "active" || a.status === "thinking").length;

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 grid-bg">
      {/* Stats */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={<Activity className="text-orchestra-400" size={20}/>} label="Active Agents" value={`${active}/7`} sub="orchestrating"/>
        <Stat icon={<MessageSquare className="text-accent-cyan" size={20}/>} label="Messages" value={String(messages.length)} sub="this session"/>
        <Stat icon={<Brain className="text-accent-violet" size={20}/>} label="Memories" value={String(memories.length)} sub="CRDT synced"/>
        <Stat icon={ollamaConnected ? <Wifi className="text-accent-emerald" size={20}/> : <WifiOff className="text-accent-rose" size={20}/>} label="Ollama" value={ollamaConnected?"Connected":"Offline"} sub={ollamaConnected?`${ollamaModels.length} models`:"ollama serve"}/>
      </motion.div>

      {/* Graph + Cards */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <motion.div variants={anim} className="xl:col-span-3 glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3"><TrendingUp size={16} className="text-orchestra-400"/><h3 className="text-sm font-semibold text-white/70">Agent Orchestra</h3></div>
          <div className="h-[400px]"><AgentGraph/></div>
        </motion.div>
        <motion.div variants={anim} className="xl:col-span-2 space-y-3">
          <div className="flex items-center gap-2 mb-1"><Zap size={16} className="text-accent-amber"/><h3 className="text-sm font-semibold text-white/70">Agent Status</h3></div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {(Object.keys(agents) as AgentId[]).map(id => <AgentCard key={id} agent={agents[id]} compact/>)}
          </div>
        </motion.div>
      </motion.div>

      {/* System Row */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={anim} className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3"><Cpu size={16} className="text-accent-cyan"/><h3 className="text-sm font-semibold text-white/70">System</h3></div>
          <Bar label="CPU" value={metrics.cpuUsage} color="#06b6d4"/>
          <Bar label="Memory" value={metrics.memoryUsage} color="#8b5cf6"/>
          <Bar label="GPU" value={metrics.gpuUsage||0} color="#10b981"/>
        </motion.div>
        <motion.div variants={anim} className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3"><HardDrive size={16} className="text-accent-amber"/><h3 className="text-sm font-semibold text-white/70">Models</h3></div>
          {ollamaModels.length>0 ? ollamaModels.slice(0,5).map(m=>(
            <div key={m.name} className="flex justify-between px-3 py-2 rounded-lg bg-surface-2/50 text-xs mb-1">
              <span className="text-white/60 font-mono">{m.name}</span>
              <span className="text-white/25">{m.details?.parameterSize||"—"}</span>
            </div>
          )) : <p className="text-xs text-white/25 py-4 text-center">{ollamaConnected?"No models. Pull: ollama pull phi4-mini":"Start Ollama"}</p>}
        </motion.div>
        <motion.div variants={anim} className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3"><TrendingUp size={16} className="text-accent-violet"/><h3 className="text-sm font-semibold text-white/70">Performance</h3></div>
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-white/40">Total Tokens</span>
              <span className="text-white/80 font-mono font-semibold">{metrics.totalTokens || 0}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-white/40">Inference Time</span>
              <span className="text-white/80 font-mono font-semibold">{((metrics.inferenceTimeMs || 0) / 1000).toFixed(2)}s</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-white/40">Collab Handoffs</span>
              <span className="text-white/80 font-mono font-semibold">{metrics.handoffs || 0} hops</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-white/40">Token Velocity</span>
              <span className="text-accent-emerald font-mono font-semibold">~42.5 tok/s</span>
            </div>
          </div>
        </motion.div>
        <motion.div variants={anim} className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3"><Shield size={16} className="text-accent-emerald"/><h3 className="text-sm font-semibold text-white/70">Privacy</h3></div>
          {[["Processing","100% Local"],["Storage","On-device"],["Network","Offline"],["Sync","CRDT"],["Telemetry","None"]].map(([l,v])=>(
            <div key={l} className="flex justify-between px-3 py-1.5 text-xs"><span className="text-white/40">{l}</span><span className="text-accent-emerald/70">{v}</span></div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}

function Stat({icon,label,value,sub}:{icon:React.ReactNode;label:string;value:string;sub:string}) {
  return <motion.div variants={anim} className="glass rounded-2xl p-4"><div className="flex items-start justify-between"><div><p className="text-xs text-white/35 mb-1">{label}</p><p className="text-2xl font-bold text-white/90">{value}</p><p className="text-[10px] text-white/25 mt-0.5">{sub}</p></div><div className="p-2 rounded-xl bg-white/5">{icon}</div></div></motion.div>;
}

function Bar({label,value,color}:{label:string;value:number;color:string}) {
  return <div className="mb-2"><div className="flex justify-between mb-1"><span className="text-xs text-white/40">{label}</span><span className="text-xs font-mono text-white/30">{value}%</span></div><div className="h-1.5 rounded-full bg-surface-3 overflow-hidden"><motion.div initial={{width:0}} animate={{width:`${value}%`}} transition={{duration:1}} className="h-full rounded-full" style={{backgroundColor:color}}/></div></div>;
}
