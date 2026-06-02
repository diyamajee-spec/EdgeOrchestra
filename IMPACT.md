# 🌍 EdgeOrchestra Impact & Philosophy

EdgeOrchestra is built to solve one of the biggest challenges in modern AI: **the loss of data privacy, dependency on cloud services, and skyrocketing subscription fees.**

---

## 🔒 1. Absolute Privacy by Design

Most multi-agent systems coordinate workflows by sharing user files, keystrokes, and photos with cloud APIs. EdgeOrchestra runs **100% on-device**:
- **Zero Remote Payloads**: Chats, vision data (like webcam snaps), and system parameters never leave the machine.
- **Local CRDT Storage**: Session data is structured via Loro CRDTs, stored in local folders.
- **Offline Reliability**: Even during total network blackouts, EdgeOrchestra performs routing, vision processing, scheduling, and plugins securely.

---

## ⚡ 2. Resource & Cost Efficiency

Running agent orchestras on cloud frameworks incurs persistent token costs and subscription fees:
- **No API Fees**: Using Ollama local inference (`phi4-mini`, `qwen2.5-vl`) ensures that queries are free.
- **Downscaling Ready**: Future roadmaps support downscaling models to lighter variants when the device reports low battery or high thermal throttle, ensuring sustainable mobile workloads.

---

## 🧩 3. Sandboxed Safety & Trust

Adding third-party plugins to a personal agent is a security hazard if the plugins have raw filesystem and network access.
- **WASM Isolation**: EdgeOrchestra executes plugins within a WebAssembly virtual machine.
- **Strict Boundaries**: WebAssembly modules do not have OS access. Filesystem boundaries are restricted to read-only directories, and network sockets are blocked by default.
- **Auditable Payloads**: Users can inspect the input and output JSON structures passed to the plugin sandbox directly from the Console UI.
