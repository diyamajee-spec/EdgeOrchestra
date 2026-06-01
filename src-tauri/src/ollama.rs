// Orchestra AI — Ollama HTTP Client (Rust)

use reqwest::Client;
use serde::{Deserialize, Serialize};

const DEFAULT_OLLAMA_URL: &str = "http://localhost:11434";

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OllamaModel {
    pub name: String,
    pub size: u64,
    pub digest: String,
    #[serde(rename = "modified_at")]
    pub modified_at: String,
    pub details: Option<ModelDetails>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ModelDetails {
    pub format: Option<String>,
    pub family: Option<String>,
    #[serde(rename = "parameter_size")]
    pub parameter_size: Option<String>,
    #[serde(rename = "quantization_level")]
    pub quantization_level: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct GenerateRequest {
    pub model: String,
    pub prompt: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub system: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub images: Option<Vec<String>>,
    pub stream: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub options: Option<GenerateOptions>,
}

#[derive(Debug, Serialize)]
pub struct GenerateOptions {
    pub temperature: f32,
    pub num_predict: u32,
}

#[derive(Debug, Deserialize)]
pub struct GenerateResponse {
    pub model: String,
    pub response: String,
    pub done: bool,
    pub total_duration: Option<u64>,
    pub eval_count: Option<u32>,
    pub eval_duration: Option<u64>,
}

#[derive(Debug, Deserialize)]
struct TagsResponse {
    models: Vec<OllamaModel>,
}

pub struct OllamaClient {
    client: Client,
    base_url: String,
}

impl OllamaClient {
    pub fn new() -> Self {
        Self {
            client: Client::new(),
            base_url: DEFAULT_OLLAMA_URL.to_string(),
        }
    }

    pub async fn ping(&self) -> bool {
        self.client
            .get(format!("{}/api/version", self.base_url))
            .timeout(std::time::Duration::from_secs(3))
            .send()
            .await
            .map(|r| r.status().is_success())
            .unwrap_or(false)
    }

    pub async fn list_models(&self) -> Result<Vec<OllamaModel>, String> {
        let resp = self.client
            .get(format!("{}/api/tags", self.base_url))
            .send()
            .await
            .map_err(|e| format!("Failed to connect: {}", e))?;

        let tags: TagsResponse = resp
            .json()
            .await
            .map_err(|e| format!("Failed to parse: {}", e))?;

        Ok(tags.models)
    }

    pub async fn generate(&self, req: GenerateRequest) -> Result<GenerateResponse, String> {
        let resp = self.client
            .post(format!("{}/api/generate", self.base_url))
            .json(&req)
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !resp.status().is_success() {
            let status = resp.status();
            let text = resp.text().await.unwrap_or_default();
            return Err(format!("Ollama error ({}): {}", status, text));
        }

        resp.json()
            .await
            .map_err(|e| format!("Parse error: {}", e))
    }
}

impl Default for OllamaClient {
    fn default() -> Self {
        Self::new()
    }
}
