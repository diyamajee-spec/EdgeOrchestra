# Contributing to Orchestra AI

Thank you for your interest in contributing! 🎵

## Development Setup

### Prerequisites
- Node.js 20+
- Rust 1.75+
- Ollama installed and running
- pnpm (recommended) or npm

### Getting Started

```bash
# Clone the repo
git clone https://github.com/your-org/orchestra-ai.git
cd orchestra-ai

# Install dependencies
npm install

# Start Ollama (in a separate terminal)
ollama serve

# Pull recommended models
ollama pull phi4-mini
ollama pull moondream

# Run development server (frontend only)
npm run dev

# Run full Tauri app
npm run tauri dev
```

## Project Structure

```
orchestra-ai/
├── src/                    # React frontend
│   ├── agents/            # Agent configurations
│   ├── components/        # UI components
│   ├── lib/              # Utilities & clients
│   ├── store/            # Zustand state management
│   └── types/            # TypeScript types
├── src-tauri/             # Rust backend
│   └── src/
│       ├── agents.rs     # Agent router logic
│       ├── commands.rs   # Tauri command handlers
│       ├── memory.rs     # Memory management
│       └── ollama.rs     # Ollama HTTP client
├── plugins/              # WASM plugin templates
└── docs/                 # Documentation
```

## Code Style

- **TypeScript**: Strict mode, functional components, hooks
- **Rust**: Standard formatting (`cargo fmt`), clippy clean
- **CSS**: Tailwind v4 utility classes + custom design tokens

## Pull Request Process

1. Fork the repo and create a feature branch
2. Write clean, documented code
3. Test your changes locally
4. Submit a PR with a clear description

## Good First Issues

Check the [good-first-issues](https://github.com/your-org/orchestra-ai/labels/good%20first%20issue) label for beginner-friendly tasks.
