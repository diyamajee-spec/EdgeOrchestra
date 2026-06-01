// Orchestra AI — Agent Router Logic (Rust)

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AgentId {
    Router,
    Vision,
    Planner,
    Memory,
    Research,
    Action,
    Creative,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrchestrationPlan {
    pub intent: String,
    pub steps: Vec<PlanStep>,
    pub reasoning: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlanStep {
    pub agent: String,
    pub action: String,
    pub input: serde_json::Value,
    pub depends_on: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentResult {
    pub agent_id: String,
    pub status: String,
    pub output: String,
    pub duration_ms: u64,
}

/// Simple intent classifier that determines which agents to invoke
pub fn classify_intent(query: &str) -> OrchestrationPlan {
    let lower = query.to_lowercase();

    let has_vision = lower.contains("desk") || lower.contains("webcam")
        || lower.contains("see") || lower.contains("look")
        || lower.contains("image") || lower.contains("photo");

    let has_planning = lower.contains("plan") || lower.contains("productiv")
        || lower.contains("task") || lower.contains("schedule")
        || lower.contains("todo");

    let has_creative = lower.contains("write") || lower.contains("create")
        || lower.contains("brainstorm") || lower.contains("story");

    let has_research = lower.contains("research") || lower.contains("analyze")
        || lower.contains("compare") || lower.contains("explain");

    let mut steps = Vec::new();

    if has_vision {
        steps.push(PlanStep {
            agent: "vision".to_string(),
            action: "Analyze visual input".to_string(),
            input: serde_json::json!({"type": "capture"}),
            depends_on: vec![],
        });
    }

    if has_planning {
        steps.push(PlanStep {
            agent: "planner".to_string(),
            action: "Create structured plan".to_string(),
            input: serde_json::json!({"query": query}),
            depends_on: if has_vision { vec!["vision".to_string()] } else { vec![] },
        });
    }

    if has_creative {
        steps.push(PlanStep {
            agent: "creative".to_string(),
            action: "Generate creative content".to_string(),
            input: serde_json::json!({"query": query}),
            depends_on: vec![],
        });
    }

    if has_research {
        steps.push(PlanStep {
            agent: "research".to_string(),
            action: "Research and analyze".to_string(),
            input: serde_json::json!({"query": query}),
            depends_on: vec![],
        });
    }

    // Always store context
    steps.push(PlanStep {
        agent: "memory".to_string(),
        action: "Store interaction context".to_string(),
        input: serde_json::json!({"type": "context"}),
        depends_on: steps.iter().map(|s| s.agent.clone()).collect(),
    });

    if steps.len() == 1 {
        // Only memory — add planner as default
        steps.insert(0, PlanStep {
            agent: "planner".to_string(),
            action: "Process general query".to_string(),
            input: serde_json::json!({"query": query}),
            depends_on: vec![],
        });
    }

    let intent = if has_vision && has_planning {
        "workspace_analysis_and_planning"
    } else if has_vision {
        "visual_analysis"
    } else if has_planning {
        "task_planning"
    } else if has_creative {
        "creative_generation"
    } else if has_research {
        "research_analysis"
    } else {
        "general_assistance"
    };

    OrchestrationPlan {
        intent: intent.to_string(),
        steps,
        reasoning: format!("Classified query as '{}' based on keyword analysis", intent),
    }
}
