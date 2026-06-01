// Orchestra AI — Main Tauri Entry Point

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use orchestra_ai_lib::commands;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::check_ollama,
            commands::list_models,
            commands::generate_completion,
            commands::analyze_image,
            commands::route_query,
            commands::get_system_metrics,
            commands::store_memory,
            commands::get_memories,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Orchestra AI");
}
