// Orchestra AI — Memory Management (Rust)

use serde::{Deserialize, Serialize};
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryEntry {
    pub id: String,
    pub content: String,
    #[serde(rename = "type")]
    pub entry_type: String,
    pub tags: Vec<String>,
    pub source: String,
    pub importance: f32,
    pub connections: Vec<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

pub struct MemoryStore {
    entries: Mutex<Vec<MemoryEntry>>,
}

impl MemoryStore {
    pub fn new() -> Self {
        Self {
            entries: Mutex::new(Vec::new()),
        }
    }

    pub fn add(&self, entry: MemoryEntry) -> Result<(), String> {
        let mut entries = self.entries.lock().map_err(|e| e.to_string())?;
        entries.push(entry);
        Ok(())
    }

    pub fn get_all(&self) -> Result<Vec<MemoryEntry>, String> {
        let entries = self.entries.lock().map_err(|e| e.to_string())?;
        Ok(entries.clone())
    }

    pub fn search(&self, query: &str) -> Result<Vec<MemoryEntry>, String> {
        let entries = self.entries.lock().map_err(|e| e.to_string())?;
        let lower_query = query.to_lowercase();
        Ok(entries
            .iter()
            .filter(|e| e.content.to_lowercase().contains(&lower_query)
                || e.tags.iter().any(|t| t.to_lowercase().contains(&lower_query)))
            .cloned()
            .collect())
    }

    pub fn remove(&self, id: &str) -> Result<(), String> {
        let mut entries = self.entries.lock().map_err(|e| e.to_string())?;
        entries.retain(|e| e.id != id);
        Ok(())
    }
}

impl Default for MemoryStore {
    fn default() -> Self {
        Self::new()
    }
}
