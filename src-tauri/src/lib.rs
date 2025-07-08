use std::sync::Arc;

mod ssh;
use ssh::{SshClient, SshConfig, SshSessionInfo, CommandResult, TerminalSession, TerminalData};

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

/// ターミナルセッションを作成
#[tauri::command]
async fn terminal_create_session(
    state: tauri::State<'_, AppState>,
    ssh_session_id: String,
) -> Result<String, String> {
    state
        .ssh_client
        .create_terminal_session(ssh_session_id)
        .await
        .map_err(|e| e.to_string())
}

/// ターミナルセッションに入力を送信
#[tauri::command]
async fn terminal_send_input(
    state: tauri::State<'_, AppState>,
    terminal_id: String,
    input: String,
) -> Result<(), String> {
    state
        .ssh_client
        .send_terminal_input(&terminal_id, input)
        .await
        .map_err(|e| e.to_string())
}

/// ターミナルセッションからの出力を受信
#[tauri::command]
async fn terminal_receive_output(
    state: tauri::State<'_, AppState>,
    terminal_id: String,
) -> Result<Option<TerminalData>, String> {
    state
        .ssh_client
        .receive_terminal_output(&terminal_id)
        .await
        .map_err(|e| e.to_string())
}

/// ターミナルセッションを終了
#[tauri::command]
async fn terminal_close_session(
    state: tauri::State<'_, AppState>,
    terminal_id: String,
) -> Result<(), String> {
    state
        .ssh_client
        .close_terminal_session(&terminal_id)
        .await
        .map_err(|e| e.to_string())
}

/// ターミナルセッション情報を取得
#[tauri::command]
async fn terminal_get_session(
    state: tauri::State<'_, AppState>,
    terminal_id: String,
) -> Result<TerminalSession, String> {
    state
        .ssh_client
        .get_terminal_session(&terminal_id)
        .await
        .map_err(|e| e.to_string())
}

/// 全ターミナルセッション一覧を取得
#[tauri::command]
async fn terminal_list_sessions(
    state: tauri::State<'_, AppState>,
) -> Result<Vec<TerminalSession>, String> {
    Ok(state.ssh_client.list_terminal_sessions().await)
}

/// ターミナルセッションのサイズを変更
#[tauri::command]
async fn terminal_resize(
    state: tauri::State<'_, AppState>,
    terminal_id: String,
    width: u32,
    height: u32,
) -> Result<(), String> {
    state
        .ssh_client
        .resize_terminal(&terminal_id, width, height)
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
            ssh_remove_session,
            terminal_create_session,
            terminal_send_input,
            terminal_receive_output,
            terminal_close_session,
            terminal_get_session,
            terminal_list_sessions,
            terminal_resize
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
