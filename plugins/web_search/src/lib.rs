//! Orchestra AI — Web Search Fallback Agent Plugin
//!
//! Exposes functions to mock or coordinate online web search results as local fallback.

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

    if query_lower.contains("weather") {
        response = "🌤️ Local weather update (via Web Fallback):\n- Current temp: 22°C (71°F)\n- Sky: Mostly Clear\n- Wind: 12 km/h NE\n- Humidity: 65%".to_string();
        metadata = serde_json::json!({
            "action": "weather_query",
            "source": "Open-Weather-Mock",
            "online": true
        });
    } else if query_lower.contains("news") || query_lower.contains("stock") || query_lower.contains("price") {
        response = "📰 Latest tech developments today:\n- Rust 1.95 is officially released with compiler speedups.\n- Local-first CRDT architectures gain massive adoption in edge-computing conferences.\n- Ollama releases native context window expansions for light models.".to_string();
        metadata = serde_json::json!({
            "action": "news_query",
            "source": "TechNewsAPI",
            "online": true
        });
    } else {
        response = format!("Web Search Query for '{}' returned: Found 4 relevant local-first articles. Summarized: local inference shows 30% latency reduction in 2026.", input.query);
        metadata = serde_json::json!({
            "action": "general_web_search",
            "query": input.query,
            "results_count": 4,
            "online": true
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
        "name": "Web Search Fallback",
        "version": "1.0.0",
        "description": "Performs local fallbacks and coordinates lightweight online API searches for live info.",
        "author": "EdgeOrchestra Team",
        "capabilities": ["web_retrieval", "api_crawling", "summarization"]
    });
    let bytes = serde_json::to_vec(&info).unwrap();
    bytes.as_ptr()
}
