/* Memory View — CRDT-synced memory visualization */
import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOrchestraStore } from "@/store/orchestra";
import { AGENT_COLORS, cn, timeAgo } from "@/lib/utils";
import { Brain, Trash2, Plus, Link, Tag, Network, Grid } from "lucide-react";
import { playClickSound } from "@/lib/audio";

const TYPE_COLORS: Record<string, string> = {
  fact: "#06b6d4",
  task: "#10b981",
  observation: "#f59e0b",
  preference: "#8b5cf6",
  context: "#6366f1",
};

interface GraphNode {
  id: string;
  type: string;
  content: string;
  source: string;
  createdAt: number;
  importance: number;
  tags: string[];
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface GraphLink {
  source: string;
  target: string;
}

export function MemoryView() {
  const { memories, removeMemory } = useOrchestraStore();
  const [viewMode, setViewMode] = useState<"grid" | "graph">("grid");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Interactive nodes state for physics
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const dragNodeRef = useRef<string | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  // Initialize node physics states when memories change or viewMode shifts
  useEffect(() => {
    if (viewMode !== "graph" || memories.length === 0) return;

    const canvas = canvasRef.current;
    const width = canvas ? canvas.clientWidth : 800;
    const height = canvas ? canvas.clientHeight : 500;

    // Preserve positions of existing nodes if possible, or initialize new ones
    setNodes((prevNodes) => {
      return memories.map((mem) => {
        const existing = prevNodes.find((n) => n.id === mem.id);
        const radius = 8 + mem.importance * 14; // Importance determines size
        
        return {
          id: mem.id,
          type: mem.type,
          content: mem.content,
          source: mem.source,
          createdAt: mem.createdAt,
          importance: mem.importance,
          tags: mem.tags,
          x: existing ? existing.x : width / 2 + (Math.random() - 0.5) * 200,
          y: existing ? existing.y : height / 2 + (Math.random() - 0.5) * 200,
          vx: existing ? existing.vx : 0,
          vy: existing ? existing.vy : 0,
          radius,
        };
      });
    });
  }, [memories, viewMode]);

  // Derive links based on connections in memories
  const links = useMemo<GraphLink[]>(() => {
    const list: GraphLink[] = [];
    const memoryIds = new Set(memories.map((m) => m.id));

    memories.forEach((mem) => {
      mem.connections.forEach((connId) => {
        // Ensure connection target exists and we avoid duplicate lines
        if (memoryIds.has(connId)) {
          const exists = list.some(
            (l) =>
              (l.source === mem.id && l.target === connId) ||
              (l.source === connId && l.target === mem.id)
          );
          if (!exists) {
            list.push({ source: mem.id, target: connId });
          }
        }
      });
    });
    return list;
  }, [memories]);

  // Simulation physics and canvas rendering loop
  useEffect(() => {
    if (viewMode !== "graph" || nodes.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrameId: number;

    const tick = () => {
      const width = canvas.width = canvas.clientWidth;
      const height = canvas.height = canvas.clientHeight;
      const centerX = width / 2;
      const centerY = height / 2;

      // 1. Reset/apply central forces & friction
      nodes.forEach((n) => {
        n.vx *= 0.82; // Friction
        n.vy *= 0.82;

        // Gravity pull to center
        const dx = centerX - n.x;
        const dy = centerY - n.y;
        n.vx += dx * 0.004;
        n.vy += dy * 0.004;
      });

      // 2. Nodes Repulsion (all-pairs)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const minDist = n1.radius + n2.radius + 60; // Separation padding

          if (dist < minDist) {
            const force = (minDist - dist) * 0.04;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            n1.vx -= fx;
            n1.vy -= fy;
            n2.vx += fx;
            n2.vy += fy;
          }
        }
      }

      // 3. Springs Attraction (along links)
      links.forEach((l) => {
        const s = nodes.find((n) => n.id === l.source);
        const t = nodes.find((n) => n.id === l.target);
        if (s && t) {
          const dx = t.x - s.x;
          const dy = t.y - s.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const targetDist = 120; // Preferred edge length
          const force = (dist - targetDist) * 0.015;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          s.vx += fx;
          s.vy += fy;
          t.vx -= fx;
          t.vy -= fy;
        }
      });

      // 4. Update Node Positions & clamp to borders
      nodes.forEach((n) => {
        if (n.id === dragNodeRef.current) {
          n.x = mouseRef.current.x;
          n.y = mouseRef.current.y;
          n.vx = 0;
          n.vy = 0;
        } else {
          n.x += n.vx;
          n.y += n.vy;
        }

        n.x = Math.max(n.radius + 10, Math.min(width - n.radius - 10, n.x));
        n.y = Math.max(n.radius + 10, Math.min(height - n.radius - 10, n.y));
      });

      // 5. Draw Frame
      ctx.clearRect(0, 0, width, height);

      // A. Draw Links
      ctx.lineWidth = 1.5;
      links.forEach((l) => {
        const s = nodes.find((n) => n.id === l.source);
        const t = nodes.find((n) => n.id === l.target);
        if (s && t) {
          const isHighlighted =
            (hoveredNode && (hoveredNode.id === s.id || hoveredNode.id === t.id));

          ctx.strokeStyle = isHighlighted ? "rgba(139, 92, 246, 0.4)" : "rgba(255, 255, 255, 0.05)";
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(t.x, t.y);
          ctx.stroke();
        }
      });

      // B. Draw Nodes
      nodes.forEach((n) => {
        const color = TYPE_COLORS[n.type] || "#a5b4fc";
        const isHovered = hoveredNode?.id === n.id;

        ctx.save();
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, 2 * Math.PI);
        
        // Glow effect
        ctx.shadowColor = color;
        ctx.shadowBlur = isHovered ? 20 : 8;
        ctx.fillStyle = color;
        ctx.fill();

        // Inner core
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius * 0.4, 0, 2 * Math.PI);
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.restore();

        // Node Label (Shortened fact content)
        ctx.fillStyle = isHovered ? "#ffffff" : "rgba(255, 255, 255, 0.45)";
        ctx.font = isHovered ? "bold 10px monospace" : "10px monospace";
        ctx.textAlign = "center";
        
        // Truncate text for display
        let displayLabel = n.content;
        if (displayLabel.length > 15) {
          displayLabel = displayLabel.substring(0, 12) + "...";
        }
        ctx.fillText(displayLabel, n.x, n.y - n.radius - 6);
      });

      animFrameId = requestAnimationFrame(tick);
    };

    tick();
    return () => cancelAnimationFrame(animFrameId);
  }, [nodes, links, hoveredNode, viewMode]);

  // Mouse Handlers for Interactive Graph dragging and hovering
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    mouseRef.current = { x, y };

    if (dragNodeRef.current) return;

    // Check hit test for hover
    let found: GraphNode | null = null;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const dx = n.x - x;
      const dy = n.y - y;
      if (Math.sqrt(dx * dx + dy * dy) < n.radius + 6) {
        found = n;
        break;
      }
    }
    setHoveredNode(found);
  };

  const handleMouseDown = () => {
    if (hoveredNode) {
      dragNodeRef.current = hoveredNode.id;
    }
  };

  const handleMouseUp = () => {
    dragNodeRef.current = null;
  };

  return (
    <div className="h-full overflow-hidden flex flex-col p-6 grid-bg relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0 relative z-10">
        <div className="flex items-center gap-3">
          <Brain size={20} className="text-accent-violet" />
          <div>
            <h2 className="text-lg font-bold text-white/85">Agent Memory</h2>
            <p className="text-xs text-white/30 font-medium">CRDT-synced persistent memory across sessions & devices</p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-white/30 mr-2">
            <div className="w-2 h-2 rounded-full bg-accent-emerald animate-pulse" />
            <span>{memories.length} entries synced</span>
          </div>
          
          <div className="flex p-0.5 rounded-lg bg-surface-2 border border-white/5 shrink-0">
            <button
              onClick={() => { playClickSound(); setViewMode("grid"); }}
              className={cn(
                "p-1.5 rounded-md text-white/40 hover:text-white/80 transition-all",
                viewMode === "grid" && "bg-surface-3 text-white/95 shadow-sm"
              )}
              title="Grid View"
            >
              <Grid size={14} />
            </button>
            <button
              onClick={() => { playClickSound(); setViewMode("graph"); }}
              className={cn(
                "p-1.5 rounded-md text-white/40 hover:text-white/80 transition-all",
                viewMode === "graph" && "bg-surface-3 text-white/95 shadow-sm"
              )}
              title="Graph View"
            >
              <Network size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {viewMode === "grid" ? (
            <motion.div
              key="grid-mode"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="h-full overflow-y-auto pr-1"
            >
              {/* Type Legend */}
              <div className="flex flex-wrap gap-2 mb-6">
                {Object.entries(TYPE_COLORS).map(([type, color]) => (
                  <span
                    key={type}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ background: `${color}12`, color }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                    {type}
                  </span>
                ))}
              </div>

              {/* Memory Cards */}
              {memories.length === 0 ? (
                <EmptyMemoryState />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-6">
                  {memories.map((mem) => (
                    <motion.div
                      key={mem.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="glass rounded-2xl p-4 group hover:border-accent-violet/30 transition-all duration-300"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-2">
                        <span
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase"
                          style={{
                            background: `${TYPE_COLORS[mem.type] || "#666"}20`,
                            color: TYPE_COLORS[mem.type] || "#999",
                          }}
                        >
                          {mem.type}
                        </span>
                        <button
                          onClick={() => { playClickSound(); removeMemory(mem.id); }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-accent-rose/10 text-white/20 hover:text-accent-rose transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      
                      {/* Content */}
                      <p className="text-sm text-white/70 mb-3">{mem.content}</p>
                      
                      {/* Tags */}
                      {mem.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2.5">
                          {mem.tags.map((t) => (
                            <span
                              key={t}
                              className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-white/5 text-white/35"
                            >
                              <Tag size={8} />
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Footer */}
                      <div className="flex items-center justify-between text-[10px] text-white/25 border-t border-white/5 pt-2.5 mt-2">
                        <span
                          className="flex items-center gap-1"
                          style={{ color: AGENT_COLORS[mem.source] || "#666" }}
                        >
                          via {mem.source}
                        </span>
                        <span>{timeAgo(mem.createdAt)}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="graph-mode"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="h-full w-full relative"
            >
              {memories.length === 0 ? (
                <EmptyMemoryState />
              ) : (
                <div className="w-full h-full relative border border-white/5 rounded-2xl overflow-hidden glass bg-surface-0">
                  {/* Legend Overlay */}
                  <div className="absolute top-4 left-4 bg-surface-1/90 backdrop-blur-md p-3.5 rounded-xl border border-white/5 z-20 space-y-2 pointer-events-none">
                    <span className="text-[10px] font-bold tracking-wider text-white/30 uppercase block mb-1">Legend</span>
                    {Object.entries(TYPE_COLORS).map(([type, color]) => (
                      <div key={type} className="flex items-center gap-2 text-[10px] font-semibold text-white/60">
                        <span className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 5px ${color}` }} />
                        <span className="capitalize">{type}</span>
                      </div>
                    ))}
                  </div>

                  {/* Detail Panel Overlay for Hovered Node */}
                  <AnimatePresence>
                    {hoveredNode && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="absolute top-4 right-4 w-72 bg-surface-1/95 backdrop-blur-md p-4 rounded-xl border border-white/10 z-20 shadow-2xl flex flex-col gap-2 pointer-events-none"
                      >
                        <div className="flex justify-between items-center">
                          <span
                            className="px-2 py-0.5 rounded text-[9px] font-bold uppercase"
                            style={{
                              background: `${TYPE_COLORS[hoveredNode.type]}20`,
                              color: TYPE_COLORS[hoveredNode.type],
                            }}
                          >
                            {hoveredNode.type}
                          </span>
                          <span className="text-[9px] text-white/20 font-mono">
                            {timeAgo(hoveredNode.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-white/85 leading-relaxed font-mono">
                          {hoveredNode.content}
                        </p>
                        {hoveredNode.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {hoveredNode.tags.map((t) => (
                              <span key={t} className="text-[8px] bg-white/5 text-white/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <Tag size={6} />{t}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="text-[8px] text-white/30 border-t border-white/5 pt-1.5 flex justify-between font-bold">
                          <span style={{ color: AGENT_COLORS[hoveredNode.source as keyof typeof AGENT_COLORS] }}>VIA {hoveredNode.source.toUpperCase()}</span>
                          <span>IMPORTANCE: {Math.floor(hoveredNode.importance * 100)}%</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Physics Simulation Canvas */}
                  <canvas
                    ref={canvasRef}
                    onMouseMove={handleMouseMove}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    className="w-full h-full graph-canvas relative z-10"
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function EmptyMemoryState() {
  return (
    <div className="flex flex-col items-center justify-center h-[50vh] text-center">
      <div className="relative">
        <div className="absolute inset-0 bg-accent-violet/20 blur-xl rounded-full" />
        <Brain size={48} className="text-accent-violet/50 relative mb-4 animate-bounce" />
      </div>
      <h3 className="text-xl font-bold text-white/90 mb-2">Your Orchestra is quiet...</h3>
      <p className="text-white/40 max-w-sm mb-6">
        Start a conversation in the Chat to let the Memory agent capture context, facts, and your preferences via CRDT sync.
      </p>
      <button className="px-6 py-2.5 rounded-full bg-accent-violet/20 text-accent-violet font-semibold hover:bg-accent-violet/30 transition-colors shadow-lg shadow-accent-violet/10 flex items-center gap-2">
        <Plus size={18} /> New Memory
      </button>
    </div>
  );
}
