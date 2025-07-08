use crate::ssh::{SshError, TerminalSession, TerminalData};
use russh::client::Handle;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{Mutex, RwLock, mpsc};
use uuid::Uuid;

/// PTYターミナルセッションを管理する
pub struct TerminalManager {
    sessions: Arc<RwLock<HashMap<String, Arc<Mutex<TerminalSessionData>>>>>,
}

/// 個別のターミナルセッションデータ
pub struct TerminalSessionData {
    pub info: TerminalSession,
    pub connection: Option<Handle<crate::ssh::SshClientHandler>>,
    #[allow(dead_code)]
    pub input_sender: Option<mpsc::UnboundedSender<String>>,
    pub output_receiver: Option<Arc<Mutex<mpsc::UnboundedReceiver<TerminalData>>>>,
}

impl TerminalManager {
    pub fn new() -> Self {
        Self {
            sessions: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// 新しいターミナルセッションを作成（簡易版）
    pub async fn create_terminal_session(
        &self,
        ssh_session_id: String,
    ) -> Result<String, SshError> {
        let terminal_id = Uuid::new_v4().to_string();
        
        // 入力/出力チャネルを設定
        let (input_sender, _input_receiver) = mpsc::unbounded_channel::<String>();
        let (output_sender, output_receiver) = mpsc::unbounded_channel::<TerminalData>();

        // ターミナルセッション情報を作成
        let session_info = TerminalSession {
            id: terminal_id.clone(),
            ssh_session_id,
            created_at: chrono::Utc::now(),
            is_active: true,
        };

        // セッションデータを作成
        let session_data = TerminalSessionData {
            info: session_info,
            connection: None, // 疑似ターミナルなので接続は不要
            input_sender: Some(input_sender),
            output_receiver: Some(Arc::new(Mutex::new(output_receiver))),
        };

        // セッションを保存
        let mut sessions = self.sessions.write().await;
        sessions.insert(terminal_id.clone(), Arc::new(Mutex::new(session_data)));

        // 初期データを送信（接続成功のメッセージ）
        let initial_data = TerminalData {
            session_id: terminal_id.clone(),
            data: format!("Terminal session {} created successfully.\r\n$ ", terminal_id),
            timestamp: chrono::Utc::now(),
        };

        if let Err(_) = output_sender.send(initial_data) {
            return Err(SshError::CommandFailed("Failed to send initial terminal data".to_string()));
        }

        Ok(terminal_id)
    }

    /// ターミナルセッションに入力を送信（簡易版）
    pub async fn send_input(&self, terminal_id: &str, _input: String) -> Result<(), SshError> {
        let sessions = self.sessions.read().await;
        let session_arc = sessions
            .get(terminal_id)
            .ok_or_else(|| SshError::SessionNotFound(terminal_id.to_string()))?;

        let _session = session_arc.lock().await;
        
        // 簡易的なエコーバック（実際のSSHコマンド実行の代わり）
        // 現在は何も実行しない（フロントエンドでエコーを処理）

        Ok(())
    }

    /// ターミナルセッションからの出力を受信
    pub async fn receive_output(&self, terminal_id: &str) -> Result<Option<TerminalData>, SshError> {
        let sessions = self.sessions.read().await;
        let session_arc = sessions
            .get(terminal_id)
            .ok_or_else(|| SshError::SessionNotFound(terminal_id.to_string()))?;

        let session = session_arc.lock().await;
        if let Some(ref receiver) = session.output_receiver {
            let mut receiver = receiver.lock().await;
            Ok(receiver.recv().await)
        } else {
            Ok(None)
        }
    }

    /// ターミナルセッションを終了
    pub async fn close_terminal_session(&self, terminal_id: &str) -> Result<(), SshError> {
        let mut sessions = self.sessions.write().await;
        
        if let Some(session_arc) = sessions.remove(terminal_id) {
            let mut session = session_arc.lock().await;
            session.info.is_active = false;
            session.connection = None;
        }

        Ok(())
    }

    /// ターミナルセッション情報を取得
    pub async fn get_terminal_session(&self, terminal_id: &str) -> Result<TerminalSession, SshError> {
        let sessions = self.sessions.read().await;
        let session_arc = sessions
            .get(terminal_id)
            .ok_or_else(|| SshError::SessionNotFound(terminal_id.to_string()))?;

        let session = session_arc.lock().await;
        Ok(session.info.clone())
    }

    /// 全ターミナルセッション一覧を取得
    pub async fn list_terminal_sessions(&self) -> Vec<TerminalSession> {
        let sessions = self.sessions.read().await;
        let mut terminal_sessions = Vec::new();

        for session_arc in sessions.values() {
            let session = session_arc.lock().await;
            terminal_sessions.push(session.info.clone());
        }

        terminal_sessions
    }

    /// ターミナルセッションのサイズを変更
    pub async fn resize_terminal(
        &self,
        terminal_id: &str,
        _width: u32,
        _height: u32,
    ) -> Result<(), SshError> {
        let sessions = self.sessions.read().await;
        let _session_arc = sessions
            .get(terminal_id)
            .ok_or_else(|| SshError::SessionNotFound(terminal_id.to_string()))?;

        // 今回は簡易的に成功を返す
        Ok(())
    }
}

impl Default for TerminalManager {
    fn default() -> Self {
        Self::new()
    }
}