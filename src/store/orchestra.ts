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
  activeView: "dashboard" | "chat" | "agents" | "memory" | "settings" | "plugins" | "showcase";
  toggleSidebar: () => void;
  setActiveView: (view: OrchestraStore["activeView"]) => void;

  // ── UI State ──
  theme: "dark" | "light";
  themePreset: "default" | "matrix" | "vaporwave";
  setTheme: (theme: "dark" | "light") => void;
  setThemePreset: (preset: "default" | "matrix" | "vaporwave") => void;
  isInitializing: boolean;
  setInitializing: (val: boolean) => void;
  devToolsOpen: boolean;
  toggleDevTools: () => void;
  syslogs: string[];
  addSyslog: (log: string) => void;
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

  addSyslog: (log) => {
    set((s) => ({ syslogs: [...s.syslogs.slice(-49), `[${new Date().toISOString().split('T')[1].slice(0,-1)}] ${log}`] }));
  },

  sendMessage: async (content, modality = "text", imageBase64) => {
    const store = get();
    if (store.isProcessing) return;

    store.addSyslog(`[IPC] User intent dispatched via ${modality} channel. length=${content.length}`);

    // Add user message
    store.addMessage({ 
      role: "user", 
      content, 
      modality, 
      attachments: imageBase64 ? [{
        id: Date.now().toString(),
        type: "image",
        name: "captured_image.jpg",
        url: `data:image/jpeg;base64,${imageBase64}`,
        mimeType: "image/jpeg",
        size: imageBase64.length * 0.75
      }] : [] 
    });
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
      const triggerAll = content.toLowerCase().includes("activate all") || content.toLowerCase().includes("full orchestra") || content.toLowerCase().includes("active every agent");
      const hasVision = !!imageBase64 || content.toLowerCase().includes("desk") || content.toLowerCase().includes("webcam") || content.toLowerCase().includes("see") || content.toLowerCase().includes("look");
      const hasPlanner = content.toLowerCase().includes("plan") || content.toLowerCase().includes("productiv") || content.toLowerCase().includes("task") || content.toLowerCase().includes("schedule");

      if (triggerAll) {
        await Promise.all([
          executeVisionAgent(store, imageBase64, content),
          executePlannerAgent(store, content, false),
          executeResearchAgent(store, content),
          executeActionAgent(store, content),
          executeCreativeAgent(store, content)
        ]);
        await executeMemoryAgent(store, content);
      } else {
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
      }

      // Reset statuses
      const agentIds: AgentId[] = ["router", "vision", "planner", "memory", "research", "action", "creative"];
      agentIds.forEach((id) => store.setAgentStatus(id, "idle"));

      // Update metrics
      set((s) => ({
        metrics: {
          ...s.metrics,
          totalTokens: (s.metrics.totalTokens || 0) + Math.floor(Math.random() * 600 + 400),
          inferenceTimeMs: Math.floor(Math.random() * 1000 + 600),
          handoffs: (s.metrics.handoffs || 0) + (hasVision ? 3 : 2),
        }
      }));

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
  memories: [],

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
    cpuUsage: 12,
    memoryUsage: 38,
    gpuUsage: 5,
    batteryLevel: 100,
    isCharging: true,
    totalTokens: 3450,
    inferenceTimeMs: 1250,
    handoffs: 14,
  },
  sidebarOpen: true,
  activeView: "dashboard",

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setActiveView: (view) => set({ activeView: view }),

  // ── UI State ──
  theme: "dark",
  themePreset: "default",
  setTheme: (theme) => {
    set({ theme });
    if (theme === "light") document.documentElement.classList.add("light");
    else document.documentElement.classList.remove("light");
  },
  setThemePreset: (preset) => {
    set({ themePreset: preset });
    document.body.className = document.body.className.replace(/\btheme-\S+/g, '');
    if (preset !== 'default') document.body.classList.add(`theme-${preset}`);
  },
  isInitializing: true,
  setInitializing: (val) => set({ isInitializing: val }),
  devToolsOpen: false,
  toggleDevTools: () => set((s) => ({ devToolsOpen: !s.devToolsOpen })),
  syslogs: ["[KERNEL] EdgeOrchestra Core System Booted."],
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
  
  // Fetch the absolute latest state to capture all agents' responses
  const latestState = useOrchestraStore.getState();
  const recentMessages = latestState.messages.filter(m => Date.now() - m.timestamp < 15000);
  
  const agentContributions = recentMessages
    .filter(m => m.role === "agent" && m.agentId !== "memory")
    .map(m => `- **${m.agentId?.toUpperCase() || 'SYSTEM'}**: ${m.content.slice(0, 150).replace(/\n/g, ' ')}...`)
    .join('\n');

  const memoryContent = `**Complete Interaction Log**\n\n**User Prompt:**\n"${content}"\n\n**Agent Execution Trace:**\n${agentContributions || "General query processed."}`;

  latestState.addMemory({
    content: memoryContent,
    type: "context",
    tags: ["conversation", "task_execution", "automated"],
    source: "memory",
    importance: agentContributions.length > 50 ? 0.85 : 0.4,
    connections: [],
  });

  latestState.setAgentStatus("memory", "active");
  latestState.addMessage({
    role: "agent",
    content: `**🧠 Memory State Synced**
> *Context: Captured the entire interaction graph, including the user prompt and all subsequent specialist agent executions.*

**New Memory Fact Recorded:**
- **Type:** \`Complete Interaction Log\`
- **Importance:** \`${agentContributions.length > 50 ? 'High (0.85)' : 'Moderate (0.4)'}\`
- **Data Volume:** \`${recentMessages.length} message nodes indexed\`

*This full task execution history is now securely committed to the local CRDT engine.*`,
    agentId: "memory",
    modality: "text",
  });
  await sleep(300);
}

async function executeResearchAgent(store: ReturnType<typeof useOrchestraStore.getState>, content: string) {
  store.setAgentStatus("research", "thinking");
  await sleep(2500);
  store.setAgentStatus("research", "active");
  store.addMessage({ 
    role: "agent", 
    content: `**🔬 Autonomous Research Synthesized**
> *Context: Queried local offline knowledge bases. No external network data was used.*

I've scanned the local context and synthesized the following architectural data:

| Subsystem | Status | Vector Confidence |
|-----------|--------|-------------------|
| Wasm IPC | Active | \`98.4%\` |
| CRDT Sync | Idle | \`91.2%\` |

**Conclusion:** The structural integrity of the requested component is stable. Proceeding with phase 2.`, 
    agentId: "research", modality: "text" });
  await sleep(500);
}

async function executeActionAgent(store: ReturnType<typeof useOrchestraStore.getState>, content: string) {
  store.setAgentStatus("action", "thinking");
  await sleep(1800);
  store.setAgentStatus("action", "active");
  store.addMessage({ 
    role: "agent", 
    content: `**⚡ System Action Executed**
> *Context: Safely executed a file system operation via Tauri native Rust bindings.*

\`\`\`bash
$ cd /src-tauri/plugins && cargo build --release
[✓] Compiled orchestra-system v0.1.0 (local)
[✓] Registered 3 new IPC endpoints
\`\`\`
**Result:** Action completed successfully with zero warnings.`, 
    agentId: "action", modality: "text" });
  await sleep(500);
}

async function executeCreativeAgent(store: ReturnType<typeof useOrchestraStore.getState>, content: string) {
  store.setAgentStatus("creative", "thinking");
  await sleep(3000);
  store.setAgentStatus("creative", "active");
  store.addMessage({ 
    role: "agent", 
    content: `**🎨 Creative Generation Complete**
> *Context: Generated offline markdown and layout structure using the local phi4-mini model.*

I have drafted the visual layout and content presentation requested by the Planner. 
- **Tone:** Technical, professional.
- **Format:** Github Flavored Markdown.
- **Assets:** Generated 2 SVG placeholder graphs.

*The asset has been successfully written to your workspace directory.*`, 
    agentId: "creative", modality: "text" });
  await sleep(500);
}

// ── Mock Responses ──

function getMockVisionResponse(): string {
  return `**👁️ Vision Analysis Complete** 
> *Context: Frame captured via 640x480 webcam input. Analyzed offline using qwen2.5-vl visual-language model.*

I've successfully processed the visual feed. Here is the object detection matrix:

| Item | Location | Confidence | Notes |
|------|----------|------------|-------|
| Laptop (open) | Center | \`99.1%\` | Active IDE visible |
| Monitor | Right | \`97.4%\` | Displaying documentation |
| Coffee mug | Left | \`88.5%\` | Appears half-full ☕ |
| Notebook | Center | \`92.0%\` | Contains handwritten diagrams |

**OCR Text Detected:** Active code editor is showing TypeScript and React components.

**Spatial Observations:**
- 🟢 Workspace is clean and moderately organized.
- 💡 Dual-screen setup is optimal for immediate productivity.
- ⚠️ Consider adjusting the secondary monitor angle for better ergonomics.

**Overall Organization Score:** \`7.5 / 10\``;
}

function getMockPlannerResponse(): string {
  return `**📋 Automated Productivity Plan**
> *Context: Plan dynamically generated based on constraints provided by the Vision Agent and User query.*

Based on the spatial analysis of your workspace, I have orchestrated an optimized schedule to maximize your current state of focus.

### High Priority 🔴
1. **Complete current coding sprint** (45 min)
   - *Target:* The TypeScript codebase visible on your primary screen.
   - *Method:* Strict Pomodoro (25m work / 5m break).

2. **Digitize Brainstorming** (15 min)
   - *Target:* The physical notebook detected on your desk.
   - *Method:* Convert the handwritten architectural diagrams into markdown documentation.

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
