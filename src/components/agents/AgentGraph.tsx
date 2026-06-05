/* ──────────────────────────────────────────────────────────
   Agent Graph — React Flow visualization of agent relationships
   ────────────────────────────────────────────────────────── */

import { useCallback, useMemo, useEffect, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type NodeTypes,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { motion } from "framer-motion";
import { useOrchestraStore, type OrchestraStore } from "@/store/orchestra";
import type { AgentConfig } from "@/agents/config";
import { cn } from "@/lib/utils";

// ── Custom Agent Node ──
function AgentFlowNode({ data }: { data: AgentConfig & { messageCount: number } }) {
  const [isDragOver, setIsDragOver] = useState(false);
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          useOrchestraStore.getState().sendMessage(`[Dropped File Analysis] Analyze this image targeting the ${data.name} node.`, "image", base64);
        };
        reader.readAsDataURL(file);
      } else {
        useOrchestraStore.getState().sendMessage(`[Dropped File] User dropped ${file.name} onto the ${data.name} node. Please analyze.`, "text");
      }
      useOrchestraStore.getState().setActiveView("chat");
    }
  };

  const statusColor = {
    idle: "border-white/10",
    active: "border-accent-emerald/50",
    thinking: "border-accent-amber/50",
    error: "border-accent-rose/50",
    disabled: "border-white/5",
  };

  return (
    <motion.div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      animate={
        data.status === "thinking"
          ? { scale: [1, 1.05, 1], transition: { repeat: Infinity, duration: 1.5 } }
          : { scale: isDragOver ? 1.05 : 1 }
      }
      className={cn(
        "relative px-4 py-3 rounded-2xl border-2 glass min-w-[140px] transition-colors cursor-pointer",
        statusColor[data.status],
        isDragOver && "bg-cyan-500/20 border-cyan-400 border-dashed"
      )}
      style={{
        boxShadow:
          data.status === "active"
            ? `0 0 25px -5px ${data.color}50`
            : isDragOver ? "0 0 20px 0 rgba(6,182,212,0.4)" : "none",
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-orchestra-400 !border-0"
      />

      <div className="flex items-center gap-2 mb-1">
        <span className={cn(
          "text-lg relative flex items-center justify-center w-8 h-8 rounded-full text-current",
          data.status === "thinking" && "pulse-ring shimmer"
        )}>
          {data.icon}
        </span>
        <span className="text-xs font-bold text-white/80">{data.name}</span>
      </div>

      <div className="text-[10px] text-white/30 font-mono">{data.model}</div>

      {data.status !== "idle" && (
        <div
          className={cn(
            "mt-1.5 text-[9px] font-semibold uppercase tracking-wider",
            data.status === "active" && "text-accent-emerald",
            data.status === "thinking" && "text-accent-amber",
            data.status === "error" && "text-accent-rose"
          )}
        >
          ● {data.status}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-orchestra-400 !border-0"
      />
    </motion.div>
  );
}

const nodeTypes: NodeTypes = {
  agent: AgentFlowNode as unknown as NodeTypes["default"],
};

export function AgentGraph() {
  const agents = useOrchestraStore((s: OrchestraStore) => s.agents);

  const nodes: Node[] = useMemo(() => {
    const agentList = Object.values(agents) as AgentConfig[];
    const centerX = 300;
    const centerY = 200;
    const radius = 180;

    return agentList.map((agent, i) => {
      if (agent.id === "router") {
        return {
          id: agent.id,
          type: "agent",
          position: { x: centerX, y: centerY },
          data: { ...agent, messageCount: 0 },
        };
      }
      const angle = ((i - 1) / (agentList.length - 1)) * 2 * Math.PI - Math.PI / 2;
      return {
        id: agent.id,
        type: "agent",
        position: {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        },
        data: { ...agent, messageCount: 0 },
      };
    });
  }, [agents]);

  const edges: Edge[] = useMemo(() => {
    const agentList = (Object.values(agents) as AgentConfig[]).filter((a) => a.id !== "router");
    return agentList.map((agent) => ({
      id: `router-${agent.id}`,
      source: "router",
      target: agent.id,
      animated: agent.status === "active" || agent.status === "thinking",
      style: {
        stroke:
          agent.status === "active"
            ? agent.color
            : agent.status === "thinking"
            ? "#f59e0b"
            : "rgba(99, 102, 241, 0.15)",
        strokeWidth: agent.status !== "idle" ? 2 : 1,
      },
    }));
  }, [agents]);

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(nodes);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(edges);

  // Sync derived nodes/edges with React Flow state so dimensions can be captured
  useEffect(() => {
    setRfNodes(nodes);
    setRfEdges(edges);
  }, [nodes, edges, setRfNodes, setRfEdges]);

  const onInit = useCallback(() => {}, []);

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden border border-white/5">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onInit={onInit}
        fitView
        proOptions={{ hideAttribution: true }}
        className="!bg-surface-0"
      >
        <Background color="rgba(99, 102, 241, 0.04)" gap={24} size={1} />
        <Controls />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          maskColor="rgba(0, 0, 0, 0.4)"
          nodeColor={(n) => {
            const agent = agents[n.id as keyof typeof agents];
            return agent?.color || "#6366f1";
          }}
        />
      </ReactFlow>
    </div>
  );
}
