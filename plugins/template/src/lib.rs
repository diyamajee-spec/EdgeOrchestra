//! Orchestra AI — WASM Agent Plugin Template
//! 
//! This is a starter template for creating custom agent plugins.
//! Build with: cargo build --target wasm32-unknown-unknown --release

use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
struct PluginInput {
    query: String,
    context: Option<String>,
}

#[derive(Serialize)]
struct PluginOutput {
    response: String,
    status: String,
    metadata: serde_json::Value,
}

/// Main entry point for the plugin
/// Receives JSON input and returns JSON output
#[no_mangle]
pub extern "C" fn process(input_ptr: *const u8, input_len: usize) -> *const u8 {
    let input_bytes = unsafe { std::slice::from_raw_parts(input_ptr, input_len) };
    
    let input: PluginInput = match serde_json::from_slice(input_bytes) {
        Ok(v) => v,
        Err(e) => {
            let error = PluginOutput {
                response: format!("Failed to parse input: {}", e),
                status: "error".to_string(),
                metadata: serde_json::json!({}),
            };
            let bytes = serde_json::to_vec(&error).unwrap();
            return bytes.as_ptr();
        }
    };

    // ═══════════════════════════════════════
    //  YOUR AGENT LOGIC GOES HERE
    // ═══════════════════════════════════════
    let response = format!("Processed: {}", input.query);

    let output = PluginOutput {
        response,
        status: "success".to_string(),
        metadata: serde_json::json!({
            "plugin": "template",
            "version": "0.1.0"
        }),
    };

    let bytes = serde_json::to_vec(&output).unwrap();
    bytes.as_ptr()
}

/// Returns plugin metadata as JSON
#[no_mangle]
pub extern "C" fn get_info() -> *const u8 {
    let info = serde_json::json!({
        "name": "Template Plugin",
        "version": "0.1.0",
        "description": "A template for creating Orchestra AI agent plugins",
        "author": "Orchestra AI",
        "capabilities": ["text_processing"]
    });
    let bytes = serde_json::to_vec(&info).unwrap();
    bytes.as_ptr()
}
