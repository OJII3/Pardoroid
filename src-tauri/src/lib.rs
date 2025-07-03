use std::sync::Arc;

mod ssh;
use ssh::{SshClient, SshConfig, SshSessionInfo, CommandResult};

/// アプリケーション状態
pub struct AppState {
    pub ssh_client: Arc<SshClient>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            ssh_client: Arc::new(SshClient::new()),
        }
    }
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {name}! You've been greeted from Rust!")
}

/// SSH接続を作成
#[tauri::command]
async fn ssh_create_connection(
    state: tauri::State<'_, AppState>,
    config: SshConfig,
) -> Result<String, String> {
    state
        .ssh_client
        .create_connection(config)
        .await
        .map_err(|e| e.to_string())
}

/// SSH接続を確立
#[tauri::command]
async fn ssh_connect(
    state: tauri::State<'_, AppState>,
    session_id: String,
) -> Result<(), String> {
    state
        .ssh_client
        .connect(&session_id)
        .await
        .map_err(|e| e.to_string())
}

/// SSH接続を切断
#[tauri::command]
async fn ssh_disconnect(
    state: tauri::State<'_, AppState>,
    session_id: String,
) -> Result<(), String> {
    state
        .ssh_client
        .disconnect(&session_id)
        .await
        .map_err(|e| e.to_string())
}

/// コマンドを実行
#[tauri::command]
async fn ssh_execute_command(
    state: tauri::State<'_, AppState>,
    session_id: String,
    command: String,
) -> Result<CommandResult, String> {
    state
        .ssh_client
        .execute_command(&session_id, &command)
        .await
        .map_err(|e| e.to_string())
}

/// セッション情報を取得
#[tauri::command]
async fn ssh_get_session_info(
    state: tauri::State<'_, AppState>,
    session_id: String,
) -> Result<SshSessionInfo, String> {
    state
        .ssh_client
        .get_session_info(&session_id)
        .await
        .map_err(|e| e.to_string())
}

/// 全セッション一覧を取得
#[tauri::command]
async fn ssh_list_sessions(
    state: tauri::State<'_, AppState>,
) -> Result<Vec<SshSessionInfo>, String> {
    Ok(state.ssh_client.list_sessions().await)
}

/// セッションを削除
#[tauri::command]
async fn ssh_remove_session(
    state: tauri::State<'_, AppState>,
    session_id: String,
) -> Result<(), String> {
    state
        .ssh_client
        .remove_session(&session_id)
        .await
        .map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            greet,
            ssh_create_connection,
            ssh_connect,
            ssh_disconnect,
            ssh_execute_command,
            ssh_get_session_info,
            ssh_list_sessions,
            ssh_remove_session
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
