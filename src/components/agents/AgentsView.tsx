/* Agents Grid View */
import { motion } from "framer-motion";
import { useOrchestraStore } from "@/store/orchestra";
import { AgentCard } from "@/components/agents/AgentCard";
import { AgentGraph } from "@/components/agents/AgentGraph";
import { Bot } from "lucide-react";
import type { AgentId } from "@/types";

export function AgentsView() {
  const { agents } = useOrchestraStore();
  return (
    <div className="h-full overflow-y-auto p-6 grid-bg space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Bot size={20} className="text-orchestra-400"/>
        <div>
          <h2 className="text-lg font-bold text-white/85">Agent Orchestra</h2>
          <p className="text-xs text-white/30">7 specialized agents working in harmony</p>
        </div>
      </div>
      <div className="glass rounded-2xl p-4"><div className="h-[350px]"><AgentGraph/></div></div>
      
      {Object.keys(agents).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-white/10 rounded-2xl bg-white/5">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-accent-cyan/20 blur-xl rounded-full" />
            <Bot size={48} className="text-accent-cyan/50 relative animate-pulse" />
          </div>
          <h3 className="text-xl font-bold text-white/90 mb-2">No Agents Available</h3>
          <p className="text-white/40 max-w-sm mb-6">Add an agent to begin the symphony and enable AI orchestration.</p>
          <button className="px-6 py-2.5 rounded-full bg-accent-cyan/20 text-accent-cyan font-semibold hover:bg-accent-cyan/30 transition-colors shadow-lg shadow-accent-cyan/10">
            + Create Agent
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(Object.keys(agents) as AgentId[]).map(id=>(
            <motion.div key={id} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
              <AgentCard agent={agents[id]}/>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
