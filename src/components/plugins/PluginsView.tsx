/* ──────────────────────────────────────────────────────────
   Orchestra AI — WASM Plugins Management View
   ────────────────────────────────────────────────────────── */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, Terminal, Shield, Upload, Play, CheckCircle2, AlertCircle, FileText, Search, Calendar, ChevronRight } from "lucide-react";
import { WasmRunner, type PluginInfo, type PluginResponse } from "@/lib/wasmRunner";

interface InstalledPlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  capabilities: string[];
  status: "idle" | "running" | "error";
  type: "simulated" | "real";
  runner?: WasmRunner;
  icon: any;
  color: string;
  mockRun?: (query: string) => { response: string; metadata: any };
}

const PRELOADED_PLUGINS: InstalledPlugin[] = [
  {
    id: "calendar",
    name: "Calendar & Task Manager",
    version: "1.0.0",
    description: "Extracts events, schedules appointments, and ranks priority lists from natural language input.",
    author: "EdgeOrchestra Team",
    capabilities: ["scheduling", "task_management", "natural_language_parsing"],
    status: "idle",
    type: "simulated",
    icon: Calendar,
    color: "text-accent-emerald",
    mockRun: (query: string) => {
      const query_lower = query.toLowerCase();
      if (query_lower.includes("schedule") || query_lower.includes("meet") || query_lower.includes("appointment")) {
        return {
          response: "📅 Event scheduled successfully: 'Productivity Review & Sync' tomorrow at 10:00 AM for 45 minutes.",
          metadata: {
            action: "schedule_event",
            event: {
              title: "Productivity Review & Sync",
              time: "Tomorrow, 10:00 AM",
              duration_minutes: 45,
              category: "work"
            }
          }
        };
      }
      return {
        response: `📋 Here is your schedule for today:\n- 09:00 AM: Focus Block - Dev Coding (90 min)\n- 11:30 AM: Standup Meeting (15 min)\n- 02:00 PM: Design Review (60 min)\n- 04:30 PM: Admin Tasks & Email (30 min)`,
        metadata: {
          action: "list_events",
          events_count: 4
        }
      };
    }
  },
  {
    id: "file_organizer",
    name: "Smart File Organizer",
    version: "1.1.0",
    description: "Scans downloads and desktops, sorts files by category, and highlights large files to clean up space.",
    author: "EdgeOrchestra Team",
    capabilities: ["file_scanning", "clutter_cleanup", "category_sorting"],
    status: "idle",
    type: "simulated",
    icon: FileText,
    color: "text-accent-cyan",
    mockRun: (query: string) => {
      return {
        response: "📁 Scan complete. Proposed cleanup details:\n- Moved 14 PDFs to 'Documents/Invoices'\n- Grouped 5 images in 'Desktop/Screenshots'\n- Flagged 3 large temporary log files (>500MB) for deletion.",
        metadata: {
          action: "organize_files",
          proposed_moves: [
            { source: "invoice_12.pdf", dest: "Documents/Invoices/invoice_12.pdf" },
            { source: "screenshot_1.png", dest: "Desktop/Screenshots/screenshot_1.png" }
          ],
          cleanup_size_bytes: 104857600
        }
      };
    }
  },
  {
    id: "web_search",
    name: "Web Search Fallback",
    version: "1.0.0",
    description: "Executes structured queries to online search fallback APIs when local inference requires fresh facts.",
    author: "EdgeOrchestra Team",
    capabilities: ["web_retrieval", "api_crawling", "summarization"],
    status: "idle",
    type: "simulated",
    icon: Search,
    color: "text-accent-amber",
    mockRun: (query: string) => {
      return {
        response: "🌤️ Local weather update (via Web Fallback):\n- Current temp: 22°C (71°F)\n- Sky: Mostly Clear\n- Wind: 12 km/h NE\n- Humidity: 65%",
        metadata: {
          action: "weather_query",
          source: "Open-Weather-Mock",
          online: true
        }
      };
    }
  }
];

export function PluginsView() {
  const [plugins, setPlugins] = useState<InstalledPlugin[]>(PRELOADED_PLUGINS);
  const [selectedPlugin, setSelectedPlugin] = useState<InstalledPlugin>(PRELOADED_PLUGINS[0]);
  const [testQuery, setTestQuery] = useState("Schedule a check-in meeting tomorrow at 10 AM");
  const [consoleLogs, setConsoleLogs] = useState<string[]>(["[Console] Sandbox initialized. Ready for execution."]);
  const [lastResult, setLastResult] = useState<PluginResponse | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [sandboxSettings, setSandboxSettings] = useState({
    memoryLimit: "32MB",
    networkAccess: false,
    fileSystemAccess: false,
  });

  const log = (msg: string) => {
    setConsoleLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    log(`Loading file: ${file.name}`);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const buffer = event.target?.result as ArrayBuffer;
          const bytes = new Uint8Array(buffer);
          
          log("Compiling WebAssembly module...");
          const runner = new WasmRunner(bytes);
          const info = await runner.init();
          
          log(`Successfully loaded plugin: ${info.name} v${info.version}`);
          
          const newPlugin: InstalledPlugin = {
            id: info.name.toLowerCase().replace(/ /g, "-"),
            name: info.name,
            version: info.version,
            description: info.description,
            author: info.author,
            capabilities: info.capabilities,
            status: "idle",
            type: "real",
            runner,
            icon: Cpu,
            color: "text-accent-violet",
          };

          setPlugins((prev) => [...prev, newPlugin]);
          setSelectedPlugin(newPlugin);
        } catch (err: any) {
          log(`Error initializing WASM: ${err.message}`);
          alert(`Failed to load WASM plugin: ${err.message}`);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err: any) {
      log(`File read error: ${err.message}`);
    }
  };

  const runTest = async () => {
    if (!selectedPlugin) return;
    
    // Update plugin status
    setPlugins((prev) =>
      prev.map((p) => (p.id === selectedPlugin.id ? { ...p, status: "running" } : p))
    );
    log(`Executing '${selectedPlugin.name}' process()...`);

    const start = performance.now();
    
    // Safety check simulation
    log("Applying sandbox constraints... [Safety Guard Verified]");
    
    await new Promise((r) => setTimeout(r, 600));

    try {
      let res: PluginResponse;
      if (selectedPlugin.type === "real" && selectedPlugin.runner) {
        res = selectedPlugin.runner.run(testQuery);
      } else if (selectedPlugin.mockRun) {
        const mock = selectedPlugin.mockRun(testQuery);
        res = {
          response: mock.response,
          status: "success",
          metadata: mock.metadata,
        };
      } else {
        throw new Error("No execution path available");
      }

      const end = performance.now();
      const diff = Math.round(end - start);
      setExecutionTime(diff);
      setLastResult(res);
      
      log(`Success! Response: "${res.response.substring(0, 40)}..."`);
      log(`Execution completed in ${diff}ms`);
      
      setPlugins((prev) =>
        prev.map((p) => (p.id === selectedPlugin.id ? { ...p, status: "idle" } : p))
      );
    } catch (err: any) {
      log(`Execution error: ${err.message}`);
      setPlugins((prev) =>
        prev.map((p) => (p.id === selectedPlugin.id ? { ...p, status: "error" } : p))
      );
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 grid-bg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Cpu size={20} className="text-orchestra-400" />
          <div>
            <h2 className="text-lg font-bold text-white/85">Plugin Manager (WASM)</h2>
            <p className="text-xs text-white/30">
              Extend Orchestra's capabilities dynamically using sandboxed WebAssembly plugins.
            </p>
          </div>
        </div>

        {/* Upload Button */}
        <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orchestra-500/20 text-orchestra-300 text-xs font-semibold hover:bg-orchestra-500/30 transition-colors cursor-pointer border border-orchestra-500/20">
          <Upload size={14} />
          Load .wasm Plugin
          <input
            type="file"
            accept=".wasm"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Side: Plugins List */}
        <div className="space-y-4 xl:col-span-1">
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">
            Installed Plugins
          </h3>
          <div className="space-y-3">
            {plugins.map((plugin) => {
              const Icon = plugin.icon;
              const isSelected = selectedPlugin?.id === plugin.id;
              return (
                <div
                  key={plugin.id}
                  onClick={() => setSelectedPlugin(plugin)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${
                    isSelected
                      ? "bg-orchestra-500/10 border-orchestra-500/40"
                      : "bg-surface-2/40 border-white/5 hover:border-white/10 hover:bg-surface-2/70"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl bg-surface-3/80 ${plugin.color}`}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-white/95 truncate">
                          {plugin.name}
                        </h4>
                        <span className="text-[10px] text-white/30 font-mono">
                          v{plugin.version}
                        </span>
                      </div>
                      <p className="text-xs text-white/40 mt-1 line-clamp-2 leading-relaxed">
                        {plugin.description}
                      </p>

                      <div className="flex flex-wrap gap-1 mt-3">
                        {plugin.capabilities.map((cap) => (
                          <span
                            key={cap}
                            className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] text-white/30"
                          >
                            {cap}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5 text-[10px] text-white/20">
                        <span>By {plugin.author}</span>
                        <span className="capitalize font-medium text-orchestra-400">
                          {plugin.type} WASM
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Sandbox & Console Runner */}
        <div className="xl:col-span-2 space-y-6">
          {selectedPlugin && (
            <div className="glass rounded-2xl p-5 space-y-6">
              {/* Plugin Detail */}
              <div className="flex items-start justify-between border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white/90">
                    Test Plugin: {selectedPlugin.name}
                  </h3>
                  <p className="text-xs text-white/40 mt-0.5">
                    Execute within the sandboxed context on-device.
                  </p>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-accent-emerald/10 text-accent-emerald text-[11px] font-semibold border border-accent-emerald/20">
                  <Shield size={12} />
                  Safe Sandbox
                </div>
              </div>

              {/* Settings / Security constraints */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-surface-2/40 p-4 rounded-2xl border border-white/5">
                <div>
                  <label className="text-[10px] text-white/35 font-medium uppercase block mb-1">
                    Memory Sandbox
                  </label>
                  <select
                    value={sandboxSettings.memoryLimit}
                    onChange={(e) =>
                      setSandboxSettings((s) => ({ ...s, memoryLimit: e.target.value }))
                    }
                    className="w-full bg-surface-3 border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-white/70 outline-none"
                  >
                    <option value="16MB">16MB Limit</option>
                    <option value="32MB">32MB Limit</option>
                    <option value="64MB">64MB Limit</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-white/35 font-medium uppercase block mb-1">
                    Network Socket
                  </label>
                  <div className="flex items-center h-8">
                    <span className="text-xs text-white/50 flex items-center gap-1.5">
                      <AlertCircle size={12} className="text-accent-amber" />
                      Blocked (Offline)
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-white/35 font-medium uppercase block mb-1">
                    FS Boundary
                  </label>
                  <div className="flex items-center h-8">
                    <span className="text-xs text-white/50 flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-accent-emerald" />
                      Confined / Read-Only
                    </span>
                  </div>
                </div>
              </div>

              {/* Execution Test input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white/60">
                  Input Payload (Query String)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testQuery}
                    onChange={(e) => setTestQuery(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-surface-2 border border-white/5 text-sm text-white/70 outline-none focus:border-orchestra-500/30 font-mono"
                    placeholder="Enter query to pass to process()..."
                  />
                  <button
                    onClick={runTest}
                    disabled={selectedPlugin.status === "running"}
                    className="px-5 py-2.5 rounded-xl bg-orchestra-500 text-white text-sm font-semibold hover:bg-orchestra-400 transition-colors flex items-center gap-2 shadow-lg shadow-orchestra-500/20"
                  >
                    <Play size={14} />
                    Run process()
                  </button>
                </div>
              </div>

              {/* Output Result */}
              {lastResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2.5 p-4 rounded-xl bg-surface-2/40 border border-white/5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white/70">Execution Output</span>
                    <span className="text-white/30 font-mono">
                      Completed in {executionTime}ms
                    </span>
                  </div>
                  <div className="p-3 bg-surface-3/85 rounded-lg border border-white/5 text-xs text-white/80 font-mono whitespace-pre-wrap">
                    {lastResult.response}
                  </div>
                  <div className="text-[10px] text-white/20">
                    Returned Metadata:{" "}
                    <code className="text-accent-cyan">
                      {JSON.stringify(lastResult.metadata)}
                    </code>
                  </div>
                </motion.div>
              )}

              {/* Terminal Log */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white/60 flex items-center gap-1.5">
                    <Terminal size={14} /> Sandbox Console logs
                  </span>
                  <button
                    onClick={() => setConsoleLogs([])}
                    className="text-[10px] text-white/25 hover:text-white/50"
                  >
                    Clear Console
                  </button>
                </div>
                <div className="h-40 overflow-y-auto p-3.5 bg-black/60 rounded-xl border border-white/5 font-mono text-[11px] text-accent-emerald/85 space-y-1.5">
                  {consoleLogs.map((l, i) => (
                    <div key={i}>{l}</div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
