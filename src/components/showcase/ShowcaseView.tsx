/* ──────────────────────────────────────────────────────────
   Orchestra AI — Showcase & Workflows Gallery View
   ────────────────────────────────────────────────────────── */

import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Play, Eye, Brain, Terminal, Shield, RefreshCw } from "lucide-react";
import { useOrchestraStore } from "@/store/orchestra";

interface ShowcaseWorkflow {
  id: string;
  title: string;
  tagline: string;
  description: string;
  prompt: string;
  agents: { name: string; icon: string; role: string; color: string }[];
  steps: string[];
  performanceMetric: string;
}

const HACKATHON_WORKFLOWS: ShowcaseWorkflow[] = [
  {
    id: "webcam_workspace",
    title: "📷 Multimodal Workspace Audit & Schedule",
    tagline: "Vision + Planner + Memory collaboration",
    description: "Orchestra captures a live webcam feed of your desk, identifies physical objects, rates organization, and designs a customized calendar time-block schedule tailored to your environment.",
    prompt: "Analyze my desk via webcam, list the items you see, and create a productivity plan based on the setup.",
    agents: [
      { name: "Router", icon: "🎯", role: "Classifies intent", color: "border-indigo-500/30 text-indigo-400 bg-indigo-500/5" },
      { name: "Vision", icon: "👁️", role: "OCR & spatial detection", color: "border-cyan-500/30 text-cyan-400 bg-cyan-500/5" },
      { name: "Planner", icon: "📋", role: "Time-blocking & scheduling", color: "border-emerald-500/30 text-emerald-400 bg-emerald-500/5" },
      { name: "Memory", icon: "🧠", role: "Syncs preference facts", color: "border-violet-500/30 text-violet-400 bg-violet-500/5" },
    ],
    steps: [
      "Router parses prompt and creates a 4-agent parallel/sequential plan.",
      "Vision agent queries camera frame, identifying screens, notebook and mug.",
      "Planner parses the vision output, allocating coding sprints and stretches.",
      "Memory agent stores the new workspace facts inside the local Loro CRDT."
    ],
    performanceMetric: "Inference Time: ~3.8s · Offline model: phi4-mini & qwen2.5-vl"
  },
  {
    id: "smart_cleanup",
    title: "⚡ Smart File Organizer & Local Actions",
    tagline: "Action + Research + Memory collaboration",
    description: "Scan your temporary folders, automatically categorize files by type, isolate invoices/receipts, draft a clean organization proposal, and trigger a secure desktop notification.",
    prompt: "Scan my temporary development directories, sort invoices by month, clean up cached logs, and notify me when complete.",
    agents: [
      { name: "Router", icon: "🎯", role: "Intent & safety parsing", color: "border-indigo-500/30 text-indigo-400 bg-indigo-500/5" },
      { name: "Action", icon: "⚡", role: "File operations & notifications", color: "border-rose-500/30 text-rose-400 bg-rose-500/5" },
      { name: "Research", icon: "🔬", role: "File contents extraction", color: "border-amber-500/30 text-amber-400 bg-amber-500/5" },
      { name: "Memory", icon: "🧠", role: "Records file layout state", color: "border-violet-500/30 text-violet-400 bg-violet-500/5" }
    ],
    steps: [
      "Router classifies file system query and triggers safe execution parameters.",
      "Research agent scans file extensions and checks headers to verify content type.",
      "Action agent executes moves, sorts files into subdirectories, and sends system popups.",
      "Memory logs operations to local database."
    ],
    performanceMetric: "Inference Time: ~2.1s · Zero network payload (100% Private)"
  },
  {
    id: "multi_device_crdt",
    title: "🧠 Local CRDT Device Synchronization",
    tagline: "Memory + Loro CRDT integration",
    description: "Merge workspace settings, developer profiles, and agent interaction history between macOS and Windows devices completely serverless and peer-to-peer using Loro CRDT engine.",
    prompt: "Synchronize developer preferences across my local devices, resolve merge conflicts in background, and update system state.",
    agents: [
      { name: "Router", icon: "🎯", role: "Merges state prompts", color: "border-indigo-500/30 text-indigo-400 bg-indigo-500/5" },
      { name: "Memory", icon: "🧠", role: "Loro engine conflict resolver", color: "border-violet-500/30 text-violet-400 bg-violet-500/5" }
    ],
    steps: [
      "Memory agent formats localized changes into a Loro document updates package.",
      "Loro engine generates conflict-free merge states across peers.",
      "Active state stores refresh globally with zero data loss."
    ],
    performanceMetric: "Sync Latency: <15ms · 100% Offline-capable P2P sync"
  },
  {
    id: "deep_research",
    title: "📚 Autonomous Deep Research",
    tagline: "Research + Planner + Creative collaboration",
    description: "Orchestra queries offline knowledge bases, synthesizes complex topics, plans a curriculum structure, and generates beautifully formatted study guides without any internet access.",
    prompt: "Research local AI architectures, plan a structured guide, and write a creative summary.",
    agents: [
      { name: "Router", icon: "🎯", role: "Query parser", color: "border-indigo-500/30 text-indigo-400 bg-indigo-500/5" },
      { name: "Research", icon: "🔬", role: "Local vector search", color: "border-amber-500/30 text-amber-400 bg-amber-500/5" },
      { name: "Planner", icon: "📋", role: "Curriculum structurer", color: "border-emerald-500/30 text-emerald-400 bg-emerald-500/5" },
      { name: "Creative", icon: "🎨", role: "Markdown drafting", color: "border-pink-500/30 text-pink-400 bg-pink-500/5" }
    ],
    steps: [
      "Router categorizes the research query and delegates to Research agent.",
      "Research agent pulls facts from local indexed RAG databases.",
      "Planner outlines the study guide and logical flow.",
      "Creative agent drafts the final beautifully formatted markdown document."
    ],
    performanceMetric: "Inference Time: ~4.2s · High Token Output"
  },
  {
    id: "full_burst",
    title: "🚀 Full Orchestra Parallel Burst",
    tagline: "All 7 Agents Collaborative Execution",
    description: "Stress-test the system by activating all specialized agents concurrently. The Router delegates a massive unified prompt across the entire graph, demonstrating the system's true parallel async processing capabilities.",
    prompt: "Trigger full orchestra",
    agents: [
      { name: "Router", icon: "🎯", role: "Parallel dispatcher", color: "border-indigo-500/30 text-indigo-400 bg-indigo-500/5" },
      { name: "Action", icon: "⚡", role: "System execution", color: "border-rose-500/30 text-rose-400 bg-rose-500/5" },
      { name: "Creative", icon: "🎨", role: "Content generation", color: "border-pink-500/30 text-pink-400 bg-pink-500/5" },
      { name: "Memory", icon: "🧠", role: "Global state logger", color: "border-violet-500/30 text-violet-400 bg-violet-500/5" }
    ],
    steps: [
      "Router intercepts the 'burst' command and unlocks parallel constraints.",
      "Dispatches concurrent execution to Vision, Planner, Research, Action, and Creative agents.",
      "Agent graph lights up as nodes process simultaneously via Web Workers.",
      "Memory agent collects the massive payload and persists to disk."
    ],
    performanceMetric: "CPU Load: High · True Parallel Concurrent Execution"
  },
  {
    id: "wasm_generator",
    title: "💻 Wasm Plugin Auto-Generator",
    tagline: "Planner + Action + Creative collaboration",
    description: "Orchestra automatically scaffolds a new WebAssembly (Rust) plugin tailored to your prompt, writes the core logic, and registers the IPC hooks without needing a cloud compiler.",
    prompt: "Generate a Wasm plugin to parse local log files and extract IP addresses.",
    agents: [
      { name: "Planner", icon: "📋", role: "Architecture design", color: "border-emerald-500/30 text-emerald-400 bg-emerald-500/5" },
      { name: "Creative", icon: "🎨", role: "Rust code generation", color: "border-pink-500/30 text-pink-400 bg-pink-500/5" },
      { name: "Action", icon: "⚡", role: "File scaffolding", color: "border-rose-500/30 text-rose-400 bg-rose-500/5" }
    ],
    steps: [
      "Planner designs the Wasm module interface and Rust structs.",
      "Creative generates the highly optimized Rust code using the local phi4-mini model.",
      "Action writes the generated code to the src-tauri/plugins directory.",
      "System alerts the user to run cargo build."
    ],
    performanceMetric: "Output: Rust/Wasm · Zero-dependency local generation"
  },
  {
    id: "local_code_review",
    title: "🔍 Privacy-First Code Reviewer",
    tagline: "Research + Action + Memory collaboration",
    description: "Safely perform deep architectural code reviews on your proprietary local repository without leaking any code to third-party cloud APIs.",
    prompt: "Scan my current repository, identify any security vulnerabilities, and summarize the architecture.",
    agents: [
      { name: "Action", icon: "⚡", role: "Directory traversal", color: "border-rose-500/30 text-rose-400 bg-rose-500/5" },
      { name: "Research", icon: "🔬", role: "Vulnerability analysis", color: "border-amber-500/30 text-amber-400 bg-amber-500/5" },
      { name: "Memory", icon: "🧠", role: "Architecture mapping", color: "border-violet-500/30 text-violet-400 bg-violet-500/5" }
    ],
    steps: [
      "Action agent recursively scans the target codebase via Tauri IPC.",
      "Research agent analyzes the AST and flags potential unhandled promises or memory leaks.",
      "Memory agent builds a graph of the repository structure for future queries."
    ],
    performanceMetric: "Scan Speed: ~300 files/sec · 100% Proprietary Code Safe"
  }
];

export function ShowcaseView() {
  const { setActiveView, sendMessage } = useOrchestraStore();

  const handleLaunch = async (workflow: ShowcaseWorkflow) => {
    // Switch to chat view
    setActiveView("chat");
    // Prepopulate and send
    await sendMessage(workflow.prompt);
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 grid-bg">
      {/* Hero Header */}
      <div className="flex items-center gap-3">
        <Sparkles size={20} className="text-orchestra-400" />
        <div>
          <h2 className="text-lg font-bold text-white/85">Showcase Gallery</h2>
          <p className="text-xs text-white/30">
            One-click interactive workflows showing the power of local multimodal agent collaboration.
          </p>
        </div>
      </div>

      {/* Grid of Workflows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {HACKATHON_WORKFLOWS.map((wf) => (
          <motion.div
            key={wf.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass premium-card rounded-2xl p-5 flex flex-col justify-between hover:border-white/10 transition-all duration-300 group"
          >
            {/* Title & Tagline */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-white/90 leading-tight">
                  {wf.title}
                </h3>
                <span className="text-[10px] text-orchestra-300 font-semibold bg-orchestra-500/10 px-2 py-0.5 rounded-full">
                  Featured
                </span>
              </div>
              <p className="text-[11px] text-white/40 font-medium mb-3">
                {wf.tagline}
              </p>
              <p className="text-xs text-white/50 leading-relaxed mb-5">
                {wf.description}
              </p>

              {/* Collaborative Agents list */}
              <div className="mb-5">
                <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider block mb-2.5">
                  Collaboration Pipeline
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {wf.agents.map((agent) => (
                    <div
                      key={agent.name}
                      className={`p-2.5 rounded-xl border flex items-center gap-2 ${agent.color}`}
                    >
                      <span className="text-sm">{agent.icon}</span>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold leading-none">{agent.name}</p>
                        <p className="text-[9px] text-white/30 truncate mt-0.5">{agent.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sequence Steps */}
              <div className="bg-surface-2/40 p-4 rounded-xl border border-white/5 mb-5 space-y-2">
                <span className="text-[10px] font-semibold text-white/35 uppercase tracking-wider block mb-1">
                  Execution Steps
                </span>
                {wf.steps.map((step, idx) => (
                  <div key={idx} className="flex gap-2.5 text-xs text-white/50 leading-relaxed">
                    <span className="text-orchestra-400 font-mono font-bold">{idx + 1}.</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Launch & Footer info */}
            <div className="pt-3 border-t border-white/5 flex items-center justify-between mt-auto">
              <span className="text-[10px] text-white/30 font-mono">
                {wf.performanceMetric}
              </span>
              <button
                onClick={() => handleLaunch(wf)}
                className="px-4 py-2 rounded-xl bg-orchestra-500 text-white text-xs font-semibold hover:bg-orchestra-400 transition-colors flex items-center gap-1.5 shadow-md shadow-orchestra-500/10 group-hover:scale-[1.02]"
              >
                Launch Workflow
                <Play size={12} fill="white" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
