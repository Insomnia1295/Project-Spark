// NETRUN OS — Tauri 2 entry point.
// The desktop shell hosts the React/Vite frontend. All privileged/consequential
// operations (dice, DB writes) go through Supabase Edge Functions + RLS — never
// through elevated commands here.

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .run(tauri::generate_context!())
        .expect("error while running NETRUN OS");
}
