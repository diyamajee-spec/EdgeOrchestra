//! Orchestra AI — Calendar & Task Manager Agent Plugin
//!
//! Exposes functions to parse, organize, and structure calendar events and tasks.

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

    if query_lower.contains("schedule") || query_lower.contains("meet") || query_lower.contains("appointment") {
        // Mock schedule extraction logic
        response = "📅 Event scheduled successfully: 'Productivity Review & Sync' tomorrow at 10:00 AM for 45 minutes.".to_string();
        metadata = serde_json::json!({
            "action": "schedule_event",
            "event": {
                "title": "Productivity Review & Sync",
                "time": "Tomorrow, 10:00 AM",
                "duration_minutes": 45,
                "category": "work"
            }
        });
    } else if query_lower.contains("list") || query_lower.contains("calendar") || query_lower.contains("today") {
        response = "📋 Here is your schedule for today:\n- 09:00 AM: Focus Block - Dev Coding (90 min)\n- 11:30 AM: Standup Meeting (15 min)\n- 02:00 PM: Design Review (60 min)\n- 04:30 PM: Admin Tasks & Email (30 min)".to_string();
        metadata = serde_json::json!({
            "action": "list_events",
            "events_count": 4
        });
    } else {
        response = format!("Task added: '{}'. Automatically sorted under general items.", input.query);
        metadata = serde_json::json!({
            "action": "add_task",
            "task": {
                "title": input.query,
                "priority": "medium",
                "category": "inbox"
            }
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
        "name": "Calendar & Task Manager",
        "version": "1.0.0",
        "description": "Manages local schedules, schedules tasks, and organizes meetings.",
        "author": "EdgeOrchestra Team",
        "capabilities": ["scheduling", "task_management", "natural_language_parsing"]
    });
    let bytes = serde_json::to_vec(&info).unwrap();
    bytes.as_ptr()
}
