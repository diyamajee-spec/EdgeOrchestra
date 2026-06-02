# 🗺️ EdgeOrchestra Roadmap

This document outlines the milestones, completed milestones, and future development phases for the EdgeOrchestra project.

---

## 🚀 Completed Milestones

### **Phase 1: Local Foundations**
- [x] Integrate Tauri 2 + React 19 codebase.
- [x] Configure standard Ollama API connectors supporting streaming responses.
- [x] Setup visual React Flow graph to showcase the router-spoke coordinating agent pipeline.

### **Phase 2: Multimodal Sensors & Persistent Memory**
- [x] Implement local webcam frame capture in the chat console.
- [x] Standardize image analysis using multimodal `qwen2.5-vl`.
- [x] Integrated **Loro CRDT** to build local conflict-free session databases.
- [x] Integrate speech recognition (STT) and text-to-speech (TTS) readouts.

### **Phase 3: Sandboxed Extensibility**
- [x] Establish the WASM-based Agent Plugin runner in the frontend.
- [x] Develop 3 core template plugins (`calendar`, `file_organizer`, `web_search`) compiling to `wasm32-unknown-unknown`.
- [x] Create the Sandbox console in the UI to monitor memory allocations and latency.

---

## 🔮 Active & Future Phases

### **Phase 4: Advanced Peer-to-Peer Syncing (Next Up)**
- [ ] Implement serverless P2P syncing of Loro memory states over local Wi-Fi.
- [ ] Connect Tauri endpoints with BLE/mDNS discovery to automatically pair companion devices.
- [ ] Standardize local-first conflict resolution logs.

### **Phase 5: Energy-Aware Model Orchestration**
- [ ] Read system battery and thermal limits to dynamically switch primary routers (e.g. downscale to `deepseek-r1:1.5b` or upscale to `llama3.1` when charging).
- [ ] Custom system notification triggers when hardware resources are fully saturated.

### **Phase 6: Native Piper TTS Engine**
- [ ] Integrate local **Piper TTS** library into Tauri's Rust layer.
- [ ] Enable completely offline high-quality speech generation bypassing Web Speech APIs.
