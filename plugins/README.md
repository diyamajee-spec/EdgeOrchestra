# WASM Agent Plugin Template

This directory contains the template for creating custom Orchestra AI agents as WebAssembly plugins.

## Structure

```
plugins/
├── README.md          # This file
├── template/
│   ├── Cargo.toml     # Rust WASM project config
│   └── src/
│       └── lib.rs     # Plugin entry point
```

## Creating a Plugin

1. Copy the `template/` directory
2. Rename and modify the agent logic
3. Build with `cargo build --target wasm32-unknown-unknown --release`
4. Load the `.wasm` file through Orchestra's plugin manager

## Plugin Interface

Your plugin must implement the `AgentPlugin` trait:

```rust
#[no_mangle]
pub extern "C" fn process(input_ptr: *const u8, input_len: usize) -> *const u8 {
    // Parse input JSON
    // Process with your agent logic
    // Return output JSON
}
```

## Example Use Cases

- **Email Agent**: Summarize and draft responses
- **Calendar Agent**: Schedule management
- **Code Agent**: Code review and generation
- **Translation Agent**: Multi-language translation
