/* ──────────────────────────────────────────────────────────
   Orchestra AI — Main Application Store (Zustand)
   ────────────────────────────────────────────────────────── */

import { create } from "zustand";
import type {
  AgentId,
  AgentStatus,
  ChatMessage,
  MemoryEntry,
  OllamaModel,
  OrchestrationPlan,
  OrchestrationStep,
  SystemMetrics,
} from "@/types";
import { AGENT_CONFIGS, type AgentConfig } from "@/agents/config";
import { ollama } from "@/lib/ollama";
import { uid, sleep } from "@/lib/utils";

export interface OrchestraStore {
  // ── Agent State ──
  agents: Record<AgentId, AgentConfig>;
  setAgentStatus: (id: AgentId, status: AgentStatus) => void;

  // ── Conversation ──
  messages: ChatMessage[];
  isProcessing: boolean;
  addMessage: (msg: Omit<ChatMessage, "id" | "timestamp">) => void;
  sendMessage: (content: string, modality?: "text" | "image", imageBase64?: string) => Promise<void>;
  clearMessages: () => void;

  // ── Orchestration ──
  currentPlan: OrchestrationPlan | null;
  planHistory: OrchestrationPlan[];
  executePlan: (plan: OrchestrationPlan) => Promise<void>;

  // ── Memory ──
  memories: MemoryEntry[];
  addMemory: (entry: Omit<MemoryEntry, "id" | "createdAt" | "updatedAt">) => void;
  removeMemory: (id: string) => void;

  // ── Ollama ──
  ollamaConnected: boolean;
  ollamaModels: OllamaModel[];
  activeModel: string;
  checkOllama: () => Promise<void>;
  setActiveModel: (model: string) => void;

  // ── System ──
  metrics: SystemMetrics;
  sidebarOpen: boolean;
  activeView: "dashboard" | "chat" | "agents" | "memory" | "settings";
  toggleSidebar: () => void;
  setActiveView: (view: OrchestraStore["activeView"]) => void;
}

export const useOrchestraStore = create<OrchestraStore>()((set, get) => ({
  // ── Agent State ──
  agents: { ...AGENT_CONFIGS },

  setAgentStatus: (id, status) =>
    set((state) => ({
      agents: {
        ...state.agents,
        [id]: { ...state.agents[id], status },
      },
    })),

  // ── Conversation ──
  messages: [],
  isProcessing: false,

  addMessage: (msg) =>
    set((state) => ({
      messages: [
        ...state.messages,
        { ...msg, id: uid(), timestamp: Date.now() },
      ],
    })),

  sendMessage: async (content, modality = "text", imageBase64) => {
    const store = get();
    if (store.isProcessing) return;

    // Add user message
    store.addMessage({ role: "user", content, modality, attachments: [] });
    set({ isProcessing: true });

    try {
      // Step 1: Router agent classifies intent and creates plan
      set((s) => ({
        agents: { ...s.agents, router: { ...s.agents.router, status: "thinking" as AgentStatus } },
      }));

      const routerPrompt = imageBase64
        ? `User sent an image with message: "${content}". Analyze the intent and create a plan. The image has been captured and is available for the Vision agent.`
        : `User says: "${content}". Analyze the intent and create a plan.`;

      let routerResponse: string;
      
      if (store.ollamaConnected) {
        try {
          const result = await ollama.generate({
            model: store.agents.router.model,
            prompt: routerPrompt,
            system: store.agents.router.systemPrompt,
            options: {
              temperature: store.agents.router.temperature,
              num_predict: store.agents.router.maxTokens,
            },
          });
          routerResponse = result.response;
        } catch {
          routerResponse = generateMockRouterResponse(content, !!imageBase64);
        }
      } else {
        // Mock response for demo
        routerResponse = generateMockRouterResponse(content, !!imageBase64);
      }

      set((s) => ({
        agents: { ...s.agents, router: { ...s.agents.router, status: "active" as AgentStatus } },
      }));

      // Add router response
      store.addMessage({
        role: "agent",
        content: `**🎯 Router Analysis:**\n${routerResponse}`,
        agentId: "router",
        modality: "text",
      });

      // Step 2: Execute specialist agents based on the plan
      const hasVision = !!imageBase64 || content.toLowerCase().includes("desk") || content.toLowerCase().includes("webcam") || content.toLowerCase().includes("see") || content.toLowerCase().includes("look");
      const hasPlanner = content.toLowerCase().includes("plan") || content.toLowerCase().includes("productiv") || content.toLowerCase().includes("task") || content.toLowerCase().includes("schedule");

      if (hasVision) {
        await executeVisionAgent(store, imageBase64, content);
      }

      if (hasPlanner || hasVision) {
        await executePlannerAgent(store, content, hasVision);
      }

      // If no specialist matched, use a general response
      if (!hasVision && !hasPlanner) {
        await executeGeneralResponse(store, content);
      }

      // Step 3: Memory agent stores important context
      await executeMemoryAgent(store, content);

      // Reset statuses
      const agentIds: AgentId[] = ["router", "vision", "planner", "memory", "research", "action", "creative"];
      agentIds.forEach((id) => store.setAgentStatus(id, "idle"));

    } catch (error) {
      console.error("[Orchestra] Error processing message:", error);
      store.addMessage({
        role: "system",
        content: `⚠️ Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`,
        modality: "text",
      });
    } finally {
      set({ isProcessing: false });
    }
  },

  clearMessages: () => set({ messages: [] }),

  // ── Orchestration ──
  currentPlan: null,
  planHistory: [],

  executePlan: async (plan) => {
    set({ currentPlan: { ...plan, status: "running" } });
    for (const step of plan.steps) {
      get().setAgentStatus(step.agentId, "active");
      await sleep(1000 + Math.random() * 2000);
      get().setAgentStatus(step.agentId, "idle");
    }
    set((s) => ({
      currentPlan: s.currentPlan ? { ...s.currentPlan, status: "completed", completedAt: Date.now() } : null,
      planHistory: s.currentPlan ? [...s.planHistory, { ...s.currentPlan, status: "completed", completedAt: Date.now() }] : s.planHistory,
    }));
  },

  // ── Memory ──
  memories: [
    {
      id: "mem-1",
      content: "User prefers dark mode interfaces",
      type: "preference",
      tags: ["ui", "preference"],
      source: "memory",
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now() - 86400000,
      importance: 0.7,
      connections: [],
    },
    {
      id: "mem-2",
      content: "Workspace has dual monitors with a MacBook Pro",
      type: "observation",
      tags: ["workspace", "hardware"],
      source: "vision",
      createdAt: Date.now() - 43200000,
      updatedAt: Date.now() - 43200000,
      importance: 0.5,
      connections: ["mem-1"],
    },
    {
      id: "mem-3",
      content: "User is working on an AI agent project using TypeScript",
      type: "fact",
      tags: ["project", "tech"],
      source: "memory",
      createdAt: Date.now() - 7200000,
      updatedAt: Date.now() - 7200000,
      importance: 0.9,
      connections: ["mem-2"],
    },
  ],

  addMemory: (entry) =>
    set((state) => ({
      memories: [
        ...state.memories,
        { ...entry, id: uid(), createdAt: Date.now(), updatedAt: Date.now() },
      ],
    })),

  removeMemory: (id) =>
    set((state) => ({
      memories: state.memories.filter((m) => m.id !== id),
    })),

  // ── Ollama ──
  ollamaConnected: false,
  ollamaModels: [],
  activeModel: "phi4-mini:latest",

  checkOllama: async () => {
    const connected = await ollama.ping();
    const models = connected ? await ollama.listModels() : [];
    set({ ollamaConnected: connected, ollamaModels: models });
  },

  setActiveModel: (model) => set({ activeModel: model }),

  // ── System ──
  metrics: {
    cpuUsage: 0,
    memoryUsage: 0,
    gpuUsage: 0,
    batteryLevel: 100,
    isCharging: true,
  },
  sidebarOpen: true,
  activeView: "dashboard",

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setActiveView: (view) => set({ activeView: view }),
}));

// ── Helper Functions for Agent Execution ──

function generateMockRouterResponse(content: string, hasImage: boolean): string {
  if (hasImage || content.toLowerCase().includes("desk") || content.toLowerCase().includes("webcam")) {
    return JSON.stringify(
      {
        intent: "workspace_analysis_and_planning",
        steps: [
          { agent: "VISION", action: "Analyze workspace image", input: { type: "webcam_capture" }, depends_on: [] },
          { agent: "PLANNER", action: "Create productivity plan from analysis", input: { context: "vision_output" }, depends_on: ["VISION"] },
          { agent: "MEMORY", action: "Store workspace analysis", input: { type: "observation" }, depends_on: ["PLANNER"] },
        ],
        reasoning: "User wants workspace analysis. Vision first to understand the scene, then Planner to create actionable tasks, and Memory to persist the context.",
      },
      null,
      2
    );
  }

  return JSON.stringify(
    {
      intent: "general_assistance",
      steps: [
        { agent: "PLANNER", action: "Process user request", input: { query: content }, depends_on: [] },
        { agent: "MEMORY", action: "Store interaction context", input: { type: "context" }, depends_on: ["PLANNER"] },
      ],
      reasoning: "General request routed to Planner for structured response.",
    },
    null,
    2
  );
}

async function executeVisionAgent(store: ReturnType<typeof useOrchestraStore.getState>, imageBase64: string | undefined, content: string) {
  store.setAgentStatus("vision", "thinking");
  await sleep(1500);

  let visionResult: string;
  
  if (imageBase64 && store.ollamaConnected) {
    try {
      visionResult = await ollama.analyzeImage(
        store.agents.vision.model,
        content || "Analyze this image in detail. Describe what you see, identify items, and note any text visible.",
        imageBase64,
        store.agents.vision.systemPrompt
      );
    } catch {
      visionResult = getMockVisionResponse();
    }
  } else {
    visionResult = getMockVisionResponse();
  }

  store.setAgentStatus("vision", "active");
  store.addMessage({
    role: "agent",
    content: `**👁️ Vision Analysis:**\n${visionResult}`,
    agentId: "vision",
    modality: "text",
  });
  await sleep(500);
}

async function executePlannerAgent(store: ReturnType<typeof useOrchestraStore.getState>, content: string, fromVision: boolean) {
  store.setAgentStatus("planner", "thinking");
  await sleep(2000);

  let plannerResult: string;

  if (store.ollamaConnected) {
    try {
      const result = await ollama.generate({
        model: store.agents.planner.model,
        prompt: fromVision
          ? `Based on a workspace analysis, create a detailed productivity plan. The user asked: "${content}"`
          : `Create a plan for: "${content}"`,
        system: store.agents.planner.systemPrompt,
        options: { temperature: 0.5, num_predict: 2048 },
      });
      plannerResult = result.response;
    } catch {
      plannerResult = getMockPlannerResponse();
    }
  } else {
    plannerResult = getMockPlannerResponse();
  }

  store.setAgentStatus("planner", "active");
  store.addMessage({
    role: "agent",
    content: `**📋 Productivity Plan:**\n${plannerResult}`,
    agentId: "planner",
    modality: "text",
  });
  await sleep(500);
}

async function executeGeneralResponse(store: ReturnType<typeof useOrchestraStore.getState>, content: string) {
  store.setAgentStatus("planner", "thinking");
  await sleep(1000);

  let response: string;

  if (store.ollamaConnected) {
    try {
      const result = await ollama.generate({
        model: store.activeModel,
        prompt: content,
        system: "You are Orchestra AI, a helpful multi-agent assistant running locally. Be concise and helpful.",
        options: { temperature: 0.6, num_predict: 1024 },
      });
      response = result.response;
    } catch {
      response = "I'm running in demo mode. Connect Ollama to get real AI responses! Try asking me to 'analyze my desk and create a productivity plan' for a full multi-agent demo.";
    }
  } else {
    response = "I'm running in demo mode. Connect Ollama to get real AI responses!\n\n**Try these demo commands:**\n- \"Analyze my desk via webcam and create a productivity plan\"\n- \"Help me plan my day\"\n- \"What can you do?\"\n\n*Start Ollama with `ollama serve` to enable real AI capabilities.*";
  }

  store.setAgentStatus("planner", "active");
  store.addMessage({
    role: "agent",
    content: response,
    agentId: "planner",
    modality: "text",
  });
}

async function executeMemoryAgent(store: ReturnType<typeof useOrchestraStore.getState>, content: string) {
  store.setAgentStatus("memory", "thinking");
  await sleep(800);
  
  store.addMemory({
    content: `User interaction: ${content.slice(0, 100)}`,
    type: "context",
    tags: ["conversation"],
    source: "memory",
    importance: 0.4,
    connections: [],
  });

  store.setAgentStatus("memory", "active");
  await sleep(300);
}

// ── Mock Responses ──

function getMockVisionResponse(): string {
  return `**Workspace Analysis Complete** 📸

I can see a typical developer workspace:

| Item | Location | Notes |
|------|----------|-------|
| Laptop (open) | Center | Active code editor visible |
| External Monitor | Right side | Showing documentation |
| Coffee mug | Left side | Appears half-full ☕ |
| Notebook | Near laptop | Has handwritten notes |
| Phone | Far right | Screen off |
| Headphones | Left of laptop | Over-ear style |

**Text Detected:** Code editor showing TypeScript/React code

**Observations:**
- 🟢 Workspace is moderately organized
- 📝 Notebook suggests active brainstorming
- 💡 Good dual-screen setup for productivity
- ⚠️ Consider clearing desk clutter for better focus

**Organization Score:** 7/10`;
}

function getMockPlannerResponse(): string {
  return `## 🎯 Productivity Plan

Based on the workspace analysis, here's your optimized plan:

### High Priority 🔴
1. **Complete current coding task** (45 min)
   - Focus on the TypeScript code visible on screen
   - Use Pomodoro technique: 25 min focus + 5 min break

2. **Review notebook notes** (15 min)
   - Digitize key insights
   - Create action items from handwritten notes

### Medium Priority 🟡
3. **Organize workspace** (10 min)
   - Clear desk clutter
   - Organize cables
   - Refill coffee ☕

4. **Documentation review** (30 min)
   - The docs on your second monitor — take structured notes

### Low Priority 🟢
5. **Break & recharge** (15 min)
   - Step away from screens
   - Light stretching

### ⏱️ Suggested Schedule
\`\`\`
09:00 - 09:45  → Coding sprint
09:45 - 09:50  → Quick break
09:50 - 10:05  → Review notebook
10:05 - 10:15  → Organize desk
10:15 - 10:45  → Documentation
10:45 - 11:00  → Break & recharge
\`\`\`

### 💡 Tips
- Your dual-monitor setup is great — keep code on primary, docs on secondary
- The notebook habit is excellent for capturing ideas before they slip away
- Consider using a task manager to track these items digitally`;
}
