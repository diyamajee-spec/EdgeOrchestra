/* ──────────────────────────────────────────────────────────
   Orchestra AI — Core Type Definitions
   ────────────────────────────────────────────────────────── */

/** Agent identifiers */
export type AgentId =
  | "router"
  | "vision"
  | "planner"
  | "memory"
  | "research"
  | "action"
  | "creative";

/** Agent runtime status */
export type AgentStatus = "idle" | "active" | "thinking" | "error" | "disabled";

/** A single agent definition */
export interface AgentInfo {
  id: AgentId;
  name: string;
  description: string;
  icon: string;
  model: string;
  status: AgentStatus;
  color: string;
  capabilities: string[];
}

/** Supported modalities for input */
export type InputModality = "text" | "image" | "voice" | "file" | "screenshot";

/** A message in the conversation */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system" | "agent";
  content: string;
  agentId?: AgentId;
  timestamp: number;
  modality: InputModality;
  attachments?: Attachment[];
  metadata?: Record<string, unknown>;
}

/** File or media attachment */
export interface Attachment {
  id: string;
  type: "image" | "file" | "audio";
  name: string;
  url: string;
  mimeType: string;
  size: number;
}

/** An orchestration plan produced by the Router agent */
export interface OrchestrationPlan {
  id: string;
  query: string;
  steps: OrchestrationStep[];
  status: "pending" | "running" | "completed" | "failed";
  createdAt: number;
  completedAt?: number;
}

/** A single step in an orchestration plan */
export interface OrchestrationStep {
  id: string;
  agentId: AgentId;
  action: string;
  input: Record<string, unknown>;
  output?: string;
  status: AgentStatus;
  duration?: number;
  order: number;
}

/** Memory entry stored in CRDT */
export interface MemoryEntry {
  id: string;
  content: string;
  type: "fact" | "task" | "observation" | "preference" | "context";
  tags: string[];
  source: AgentId;
  embedding?: number[];
  createdAt: number;
  updatedAt: number;
  importance: number; // 0-1
  connections: string[]; // IDs of related memories
}

/** Model info from Ollama */
export interface OllamaModel {
  name: string;
  size: number;
  digest: string;
  modifiedAt: string;
  details: {
    format: string;
    family: string;
    parameterSize: string;
    quantizationLevel: string;
  };
}

/** System metrics for energy-aware selection */
export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  gpuUsage?: number;
  batteryLevel?: number;
  isCharging?: boolean;
  temperature?: number;
  totalTokens?: number;
  inferenceTimeMs?: number;
  handoffs?: number;
}

/** Agent graph node for React Flow */
export interface AgentNode {
  id: string;
  type: "agent";
  position: { x: number; y: number };
  data: AgentInfo & { messageCount: number };
}

/** Agent graph edge for React Flow */
export interface AgentEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
  style?: Record<string, unknown>;
}

/** CRDT sync state */
export interface SyncState {
  peerId: string;
  connected: boolean;
  lastSync: number;
  documentVersion: number;
  peers: string[];
}

/** Ollama connection status */
export interface OllamaStatus {
  connected: boolean;
  baseUrl: string;
  models: OllamaModel[];
  activeModel?: string;
}
