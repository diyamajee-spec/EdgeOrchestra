# Contributing to EdgeOrchestra 🎻

Thank you for your interest in contributing to EdgeOrchestra! Follow this guide to set up your local development workspace and build plugins.

## Development Setup

### Prerequisites
- Node.js 18+ (Node.js 22 recommended)
- Rust 1.75+ (wasm32-unknown-unknown target required for plugins)
- Ollama installed and running local inference
- npm (default package manager)

### Getting Started

You can set up everything instantly using our installers:
- **macOS/Linux**: `curl -fsSL https://raw.githubusercontent.com/diyamajee-spec/EdgeOrchestra/main/setup.sh | bash`
- **Windows**: `Set-ExecutionPolicy Bypass -Scope Process -Force; iex ((New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/diyamajee-spec/EdgeOrchestra/main/install.ps1'))`

Or setup manually:
```bash
# Clone the repository
git clone https://github.com/diyamajee-spec/EdgeOrchestra.git
cd EdgeOrchestra

# Install packages
npm install

# Verify Ollama has the models
ollama pull phi4-mini
ollama pull qwen2.5-vl

# Run the Tauri application
npm run tauri dev
```

---

## WASM Plugin Development

EdgeOrchestra supports custom plugins compiled to WebAssembly. The template is located in `plugins/template/`.

To create a new plugin:
1. Copy the `plugins/template/` folder: `cp -r plugins/template/ plugins/my-new-plugin/`
2. Implement your logic in Rust inside `plugins/my-new-plugin/src/lib.rs`.
3. Add memory-safe export functions:
   - `alloc` and `dealloc` (for passing queries from JS/Tauri securely).
   - `process` (accepts pointer + size, returns output pointer).
   - `get_info` (returns descriptive plugin metadata JSON).
4. Compile the plugin:
   ```bash
   cd plugins/my-new-plugin
   cargo build --target wasm32-unknown-unknown --release
   ```
5. Upload the resulting `.wasm` file via the app's **Plugin Manager** to test execution in the sandbox!

---

## Coding Standards

- **TypeScript / React 19**: Strictly typed components, utilizing global states in `src/store/orchestra.ts`.
- **Rust / Tauri 2**: Clean code adhering to `cargo clippy` and `cargo fmt`.
- **CSS / Styling**: Tailwind CSS v4 layout styling with modern glassmorphism components defined in `src/index.css`.

---

## Troubleshooting & Common Pitfalls

### What to do if Ollama fails to pull the model?
If `ollama pull phi4-mini` hangs or fails:
- Check your internet connection.
- Ensure the Ollama background service is running (`systemctl status ollama` on Linux, or check the taskbar on Windows/macOS).
- Try restarting the Ollama service and re-running the pull command.

### How to fix Rust `wasm32-unknown-unknown` target errors?
If you see errors compiling Wasm plugins:
- Make sure you added the target: `rustup target add wasm32-unknown-unknown`
- Ensure your Rust toolchain is up to date: `rustup update`

### Tests failing or not running?
Make sure you have run `npm install` to get `vitest` and testing libraries. Run tests using `npm run test`.
