// Orchestra AI — Tauri Command Handlers

use crate::ollama::{OllamaClient, GenerateRequest, GenerateOptions};
use crate::agents;
use crate::memory::{MemoryStore, MemoryEntry};
use serde::{Deserialize, Serialize};
use std::sync::OnceLock;

static OLLAMA: OnceLock<OllamaClient> = OnceLock::new();
static MEMORY: OnceLock<MemoryStore> = OnceLock::new();

fn get_ollama() -> &'static OllamaClient {
    OLLAMA.get_or_init(OllamaClient::new)
}

fn get_memory() -> &'static MemoryStore {
    MEMORY.get_or_init(MemoryStore::new)
}

#[tauri::command]
pub async fn check_ollama() -> Result<bool, String> {
    Ok(get_ollama().ping().await)
}

#[derive(Serialize)]
pub struct ModelInfo {
    pub name: String,
    pub size: u64,
    pub parameter_size: Option<String>,
}

#[tauri::command]
pub async fn list_models() -> Result<Vec<ModelInfo>, String> {
    let models = get_ollama().list_models().await?;
    Ok(models.into_iter().map(|m| ModelInfo {
        name: m.name,
        size: m.size,
        parameter_size: m.details.and_then(|d| d.parameter_size),
    }).collect())
}

#[tauri::command]
pub async fn generate_completion(
    model: String,
    prompt: String,
    system: Option<String>,
    temperature: Option<f32>,
    max_tokens: Option<u32>,
) -> Result<String, String> {
    let req = GenerateRequest {
        model,
        prompt,
        system,
        images: None,
        stream: false,
        options: Some(GenerateOptions {
            temperature: temperature.unwrap_or(0.5),
            num_predict: max_tokens.unwrap_or(1024),
        }),
    };
    let resp = get_ollama().generate(req).await?;
    Ok(resp.response)
}

#[tauri::command]
pub async fn analyze_image(
    model: String,
    prompt: String,
    image_base64: String,
    system: Option<String>,
) -> Result<String, String> {
    let req = GenerateRequest {
        model,
        prompt,
        system,
        images: Some(vec![image_base64]),
        stream: false,
        options: Some(GenerateOptions {
            temperature: 0.4,
            num_predict: 2048,
        }),
    };
    let resp = get_ollama().generate(req).await?;
    Ok(resp.response)
}

#[tauri::command]
pub async fn route_query(query: String) -> Result<String, String> {
    let plan = agents::classify_intent(&query);
    serde_json::to_string_pretty(&plan).map_err(|e| e.to_string())
}

#[derive(Serialize)]
pub struct SystemMetrics {
    pub cpu_usage: f32,
    pub memory_usage: f32,
    pub gpu_usage: f32,
}

#[tauri::command]
pub async fn get_system_metrics() -> Result<SystemMetrics, String> {
    // Basic implementation — in production, use sysinfo crate
    Ok(SystemMetrics {
        cpu_usage: 0.0,
        memory_usage: 0.0,
        gpu_usage: 0.0,
    })
}

#[tauri::command]
pub async fn store_memory(
    content: String,
    entry_type: String,
    tags: Vec<String>,
    source: String,
    importance: f32,
) -> Result<(), String> {
    let now = chrono::Utc::now().timestamp_millis();
    let entry = MemoryEntry {
        id: uuid::Uuid::new_v4().to_string(),
        content,
        entry_type,
        tags,
        source,
        importance,
        connections: vec![],
        created_at: now,
        updated_at: now,
    };
    get_memory().add(entry)
}

#[tauri::command]
pub async fn get_memories() -> Result<Vec<MemoryEntry>, String> {
    get_memory().get_all()
}
