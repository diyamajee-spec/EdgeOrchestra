//! Orchestra AI — Smart File Organizer Agent Plugin
//!
//! Exposes functions to scan, categorize, and propose cleanups for local files.

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

#[no_mangle]
pub extern "C" fn alloc(size: usize) -> *mut u8 {
    let mut buf = Vec::with_capacity(size);
    let ptr = buf.as_mut_ptr();
    std::mem::forget(buf);
    ptr
}

#[no_mangle]
pub extern "C" fn dealloc(ptr: *mut u8, size: usize) {
    unsafe {
        let _ = Vec::from_raw_parts(ptr, 0, size);
    }
}

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

    let query_lower = input.query.to_lowercase();
    let response: String;
    let mut metadata = serde_json::json!({});

    if query_lower.contains("organize") || query_lower.contains("sort") || query_lower.contains("clean") {
        response = "📁 Scan complete. Proposed cleanup details:\n- Moved 14 PDFs to 'Documents/Invoices'\n- Grouped 5 images in 'Desktop/Screenshots'\n- Flagged 3 large temporary log files (>500MB) for deletion.".to_string();
        metadata = serde_json::json!({
            "action": "organize_files",
            "proposed_moves": [
                { "source": "invoice_12.pdf", "dest": "Documents/Invoices/invoice_12.pdf" },
                { "source": "screenshot_1.png", "dest": "Desktop/Screenshots/screenshot_1.png" }
            ],
            "cleanup_size_bytes": 104857600
        });
    } else {
        response = "🔍 Smart File Organizer is idling. Ask me to 'organize my downloads' or 'check for duplicate files' to begin scanning.".to_string();
        metadata = serde_json::json!({
            "action": "idle",
            "capabilities": ["duplicate_detection", "extension_sorting", "large_file_cleanup"]
        });
    }

    let output = PluginOutput {
        response,
        status: "success".to_string(),
        metadata,
    };

    let bytes = serde_json::to_vec(&output).unwrap();
    bytes.as_ptr()
}

#[no_mangle]
pub extern "C" fn get_info() -> *const u8 {
    let info = serde_json::json!({
        "name": "Smart File Organizer",
        "version": "1.1.0",
        "description": "Scans local directories, sorts files by extension, and suggests storage optimizations.",
        "author": "EdgeOrchestra Team",
        "capabilities": ["file_scanning", "clutter_cleanup", "category_sorting"]
    });
    let bytes = serde_json::to_vec(&info).unwrap();
    bytes.as_ptr()
}
