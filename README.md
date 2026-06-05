# 🌌 EdgeOrchestra AI
### *The Ultimate Local-First Autonomous Agent Matrix*
**Developed for the Win Elite Coders Open Source Hackathon**

![EdgeOrchestra Banner](https://img.shields.io/badge/Status-Hackathon_Ready-06b6d4?style=for-the-badge) ![Offline First](https://img.shields.io/badge/Cloud_Free-100%25_Local-8b5cf6?style=for-the-badge)

EdgeOrchestra is a highly advanced, deeply technical **multi-agent AI orchestration platform** designed to run entirely on local hardware. By leveraging Ollama and native WebAssembly (Wasm) execution environments, EdgeOrchestra eliminates cloud dependency, ensuring 100% data privacy, zero latency limits, and full offline capability.

---

## ⚡ Core Hackathon Features

### 1. 🧠 Autonomous Agent Swarm
Watch as your requests are dynamically routed. The **Intent Matrix Analyzer** intercepts natural language, parses the request, and delegates tasks to a swarm of local specialist agents (Vision, Planner, Research, Action, Creative, Memory).

### 2. 🚀 Full Orchestra Parallel Burst
Push your local silicon to the absolute limit. EdgeOrchestra features a true parallel execution engine. By triggering the *Full Orchestra Burst Mode*, the router will spawn concurrent Web Workers to execute 5 specialist agents simultaneously. 

### 3. 🎯 Interactive Data Graph
The system architecture isn't hidden—it's interactive. Drag and drop local system files (like images) directly onto the ReactFlow Agent Graph nodes to instantly trigger deep offline vector analysis.

### 4. 🎨 Cinematic Color Core Engine
A fully custom CSS Variable Engine allows you to instantly swap the visual identity of the app. Toggle between the pristine **Cyan Core**, the heavily-contrasted **Matrix Green**, or the vibrant **Vaporwave**. 

### 5. 💻 Raw IPC Inspector (DevTools)
Press `Ctrl + Shift + I` anywhere in the app to slide up the **DevTools Inspector Drawer**. Watch the raw IPC events, Memory hex allocations, and `Loro` CRDT sync logs fly by in real-time as the agents communicate. 

---

## 🛠️ Architecture Stack

- **Frontend:** React, Tailwind CSS v4, Framer Motion (for buttery smooth cubic-bezier transitions).
- **Desktop Runtime:** Tauri (Rust) for zero-copy file system access and OS-level operations.
- **AI Inference Engine:** Ollama (Local LLM hosting).
- **State & Memory:** Zustand + Loro (Conflict-free Replicated Data Types for P2P state sync).
- **Graph Visualization:** ReactFlow / XYFlow.

---

## 🚀 Installation & Setup

1. **Prerequisites:**
   - Install [Node.js](https://nodejs.org/)
   - Install [Rust & Cargo](https://www.rust-lang.org/tools/install)
   - Install [Ollama](https://ollama.com/) (Required for local inference)

2. **Clone & Install:**
   ```bash
   git clone https://github.com/diyamajee-spec/EdgeOrchestra.git
   cd EdgeOrchestra
   npm install
   ```

3. **Pull Local Models:**
   Start Ollama in your terminal, then pull the required specialist models:
   ```bash
   ollama pull phi4-mini
   ollama pull qwen2.5-vl:7b
   ```

4. **Launch the Matrix:**
   ```bash
   npm run tauri dev
   ```

---

## 🎮 How to Demo for Judges (WOW Factors)

During your presentation, make sure to execute these specific workflows to show off the platform's power:

1. **The Cinematic Boot:** Simply open the app. Let the judges watch the 4-second boot sequence, the Matrix code rain, and the hardware profiler HUD.
2. **The IPC Inspector:** Press `Ctrl + Shift + I` to open the hidden terminal drawer and show them the real-time logs.
3. **Trigger Parallel Execution:** Go to the *Showcase* tab and click **Launch Workflow** on the `Full Orchestra Parallel Burst` card. Watch the Chat UI open the Process Analyzer and hear the synthesized audio haptics!
4. **Interactive Node Drop:** Go to the *Dashboard*, minimize the window slightly, and drag an image from your desktop directly onto the **Vision Node** to trigger an autonomous workflow.

---

### License
MIT License. Built entirely offline. No cloud APIs were harmed in the making of this project.
