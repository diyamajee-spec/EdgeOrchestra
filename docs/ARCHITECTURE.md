# System Architecture

EdgeOrchestra AI is built on a robust, multi-layered architecture designed to maximize privacy, performance, and offline capabilities. The core stack relies on **Tauri 2**, **React 19**, **Loro CRDTs**, and a sandboxed **WebAssembly (Wasm)** plugin system.

## 1. Tauri 2 & React 19 Frontend
- **Tauri 2** forms the lightweight desktop shell. It handles OS-level APIs, file system access, and spawns the Rust backend.
- **React 19** powers the user interface, managing state and providing a reactive, component-based dashboard. We use `React Flow` to visualize the agent collaboration graph dynamically.

## 2. IPC (Inter-Process Communication)
Tauri enables secure communication between the React frontend and the Rust backend. When a user requests an action (e.g., loading a plugin, querying Ollama), the frontend sends a command via Tauri IPC. The Rust backend processes this securely and returns the result, ensuring that heavy computations don't block the UI thread.

## 3. Sandboxed Wasm Plugins
To allow extensibility without compromising security, EdgeOrchestra uses a WebAssembly sandbox for plugins.
- Plugins are written in Rust and compiled to the `wasm32-unknown-unknown` target.
- The Tauri Rust backend loads `.wasm` files securely into an isolated runtime (e.g., Wasmtime or Wasmer).
- Plugins are restricted to interacting only through memory-safe export functions (`alloc`, `dealloc`, `process`, `get_info`), preventing unauthorized file system or network access.

## 4. State Management with Loro CRDTs
EdgeOrchestra AI needs to maintain complex local state (agent memory, chat history, system config) and eventually sync it across devices without relying on a central database.
- **Loro CRDTs** (Conflict-free Replicated Data Types) are used to manage this state.
- Every state change is recorded as a deterministic operation.
- Devices can synchronize by exporting delta byte arrays, merging state effortlessly and resolving conflicts mathematically without data loss.

## 5. Local Inference Engine (Ollama)
At the heart of the AI orchestration is **Ollama**, running 100% locally.
- **phi4-mini**: Acts as the intelligent "Router Agent", parsing intents and delegating tasks to other agents.
- **qwen2.5-vl**: Used as the "Vision Agent" for spatial awareness and multimodal context directly from the user's desktop or webcam.

This architectural synergy ensures an incredibly fast, private, and highly capable desktop AI assistant.
