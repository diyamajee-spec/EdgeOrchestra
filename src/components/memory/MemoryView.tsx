/* Memory View — CRDT-synced memory visualization */
import { motion, AnimatePresence } from "framer-motion";
import { useOrchestraStore } from "@/store/orchestra";
import { AGENT_COLORS, timeAgo } from "@/lib/utils";
import { Brain, Trash2, Plus, Link, Tag } from "lucide-react";

const TYPE_COLORS: Record<string,string> = { fact:"#06b6d4", task:"#10b981", observation:"#f59e0b", preference:"#8b5cf6", context:"#6366f1" };

export function MemoryView() {
  const { memories, removeMemory } = useOrchestraStore();

  return (
    <div className="h-full overflow-y-auto p-6 grid-bg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Brain size={20} className="text-accent-violet"/>
          <div>
            <h2 className="text-lg font-bold text-white/85">Agent Memory</h2>
            <p className="text-xs text-white/30">CRDT-synced persistent memory across sessions & devices</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/30">
          <div className="w-2 h-2 rounded-full bg-accent-emerald animate-pulse"/>
          <span>{memories.length} entries synced</span>
        </div>
      </div>

      {/* Type Legend */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(TYPE_COLORS).map(([type,color])=>(
          <span key={type} className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{background:`${color}15`,color}}>
            <span className="w-1.5 h-1.5 rounded-full" style={{background:color}}/>{type}
          </span>
        ))}
      </div>

      {/* Memory Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence>
          {memories.map(mem=>(
            <motion.div key={mem.id} layout initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.9}} className="glass rounded-2xl p-4 group">
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase" style={{background:`${TYPE_COLORS[mem.type]||'#666'}20`,color:TYPE_COLORS[mem.type]||'#999'}}>{mem.type}</span>
                <button onClick={()=>removeMemory(mem.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-accent-rose/10 text-white/20 hover:text-accent-rose transition-all"><Trash2 size={12}/></button>
              </div>
              {/* Content */}
              <p className="text-sm text-white/70 mb-3">{mem.content}</p>
              {/* Tags */}
              {mem.tags.length>0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {mem.tags.map(t=><span key={t} className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-white/5 text-white/30"><Tag size={8}/>{t}</span>)}
                </div>
              )}
              {/* Footer */}
              <div className="flex items-center justify-between text-[10px] text-white/20">
                <span className="flex items-center gap-1" style={{color:AGENT_COLORS[mem.source]||'#666'}}>via {mem.source}</span>
                <span>{timeAgo(mem.createdAt)}</span>
              </div>
              {/* Importance */}
              <div className="mt-2 h-1 rounded-full bg-surface-3 overflow-hidden">
                <div className="h-full rounded-full bg-accent-violet/50" style={{width:`${mem.importance*100}%`}}/>
              </div>
              {/* Connections */}
              {mem.connections.length>0 && (
                <div className="flex items-center gap-1 mt-2 text-[10px] text-white/15"><Link size={10}/>{mem.connections.length} connections</div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
