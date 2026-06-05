/* ──────────────────────────────────────────────────────────
   Orchestra AI — Root Application Component
   ────────────────────────────────────────────────────────── */

import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { ChatView } from "@/components/chat/ChatView";
import { AgentsView } from "@/components/agents/AgentsView";
import { MemoryView } from "@/components/memory/MemoryView";
import { SettingsView } from "@/components/settings/SettingsView";
import { PluginsView } from "@/components/plugins/PluginsView";
import { ShowcaseView } from "@/components/showcase/ShowcaseView";
import { useOrchestraStore, type OrchestraStore } from "@/store/orchestra";
import { AnimatePresence, motion } from "framer-motion";
import { Joyride, Step } from "react-joyride";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { IntroSequence } from "@/components/layout/IntroSequence";
import { DevToolsDrawer } from "@/components/layout/DevToolsDrawer";
import { useEffect } from "react";

const VIEWS = {
  dashboard: DashboardView,
  chat: ChatView,
  agents: AgentsView,
  memory: MemoryView,
  settings: SettingsView,
  plugins: PluginsView,
  showcase: ShowcaseView,
};

export default function App() {
  const { activeView, isInitializing, setInitializing } = useOrchestraStore();
  const ActiveComponent = VIEWS[activeView];

  useEffect(() => {
    // Extended timer to allow the cinematic boot sequence to play
    const timer = setTimeout(() => setInitializing(false), 3800);
    return () => clearTimeout(timer);
  }, [setInitializing]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        useOrchestraStore.getState().toggleDevTools();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const tourSteps: Step[] = [
    {
      target: "body",
      content: "Welcome to EdgeOrchestra AI! Let's take a quick tour of your local-first agent workspace.",
      placement: "center",
    },
    {
      target: "#nav-dashboard",
      content: "This is your dashboard where you can see the agent graph and execution flows.",
      placement: "right",
    },
    {
      target: "#nav-chat",
      content: "Start a new multimodal chat here! The Router agent will figure out which specialized agents to use.",
      placement: "right",
    },
    {
      target: "body",
      content: "Pro Tip: Press Cmd+K (or Ctrl+K) anywhere to open the Global Command Palette!",
      placement: "center",
    }
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface-0">
      <AnimatePresence>
        {isInitializing && <IntroSequence key="intro" />}
      </AnimatePresence>
      
      {!isInitializing && (
        <Joyride 
          steps={tourSteps} 
          continuous 
          options={{
            showProgress: true,
            primaryColor: '#8b5cf6',
            backgroundColor: '#12121a',
            textColor: '#e2e8f0',
            arrowColor: '#12121a',
          }} 
        />
      )}
      <CommandPalette />
      <DevToolsDrawer />
      
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-hidden relative">
          {!isInitializing && (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 15, scale: 0.98, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -15, scale: 0.98, filter: "blur(4px)" }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="h-full w-full absolute inset-0 overflow-y-auto"
              >
                <ActiveComponent />
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>
    </div>
  );
}
