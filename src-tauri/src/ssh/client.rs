use crate::ssh::{SshSessionManager, SshConfig, SshSessionInfo, CommandResult, SshError, TerminalManager, TerminalSession, TerminalData};
use std::sync::Arc;

/// SSHクライアントファサード
pub struct SshClient {
    session_manager: Arc<SshSessionManager>,
    terminal_manager: Arc<TerminalManager>,
}

impl SshClient {
    pub fn new() -> Self {
        Self {
            session_manager: Arc::new(SshSessionManager::new()),
            terminal_manager: Arc::new(TerminalManager::new()),
        }
    }

    /// セッションマネージャーの参照を取得
    pub fn session_manager(&self) -> Arc<SshSessionManager> {
        self.session_manager.clone()
    }

    /// 新しいSSH接続を作成
    pub async fn create_connection(&self, config: SshConfig) -> Result<String, SshError> {
        self.session_manager.create_session(config).await
    }

    /// SSH接続を確立
    pub async fn connect(&self, session_id: &str) -> Result<(), SshError> {
        self.session_manager.connect(session_id).await
    }

    /// SSH接続を切断
    pub async fn disconnect(&self, session_id: &str) -> Result<(), SshError> {
        self.session_manager.disconnect(session_id).await
    }

    /// コマンドを実行
    pub async fn execute_command(
        &self,
        session_id: &str,
        command: &str,
    ) -> Result<CommandResult, SshError> {
        self.session_manager.execute_command(session_id, command).await
    }

    /// セッション情報を取得
    pub async fn get_session_info(&self, session_id: &str) -> Result<SshSessionInfo, SshError> {
        self.session_manager.get_session_info(session_id).await
    }

    /// 全セッション一覧を取得
    pub async fn list_sessions(&self) -> Vec<SshSessionInfo> {
        self.session_manager.list_sessions().await
    }

    /// セッションを削除
    pub async fn remove_session(&self, session_id: &str) -> Result<(), SshError> {
        self.session_manager.remove_session(session_id).await
    }

    /// ターミナルセッションを作成
    pub async fn create_terminal_session(&self, ssh_session_id: String) -> Result<String, SshError> {
        // SSH接続が存在することを確認
        let _session_info = self.session_manager.get_session_info(&ssh_session_id).await?;
        
        // 疑似ターミナルセッションを作成（実際のSSH接続は使用しない）
        self.terminal_manager.create_terminal_session(ssh_session_id).await
    }

    /// ターミナルセッションに入力を送信
    pub async fn send_terminal_input(&self, terminal_id: &str, input: String) -> Result<(), SshError> {
        self.terminal_manager.send_input(terminal_id, input).await
    }

    /// ターミナルセッションからの出力を受信
    pub async fn receive_terminal_output(&self, terminal_id: &str) -> Result<Option<TerminalData>, SshError> {
        self.terminal_manager.receive_output(terminal_id).await
    }

    /// ターミナルセッションを終了
    pub async fn close_terminal_session(&self, terminal_id: &str) -> Result<(), SshError> {
        self.terminal_manager.close_terminal_session(terminal_id).await
    }

    /// ターミナルセッション情報を取得
    pub async fn get_terminal_session(&self, terminal_id: &str) -> Result<TerminalSession, SshError> {
        self.terminal_manager.get_terminal_session(terminal_id).await
    }

    /// 全ターミナルセッション一覧を取得
    pub async fn list_terminal_sessions(&self) -> Vec<TerminalSession> {
        self.terminal_manager.list_terminal_sessions().await
    }

    /// ターミナルセッションのサイズを変更
    pub async fn resize_terminal(&self, terminal_id: &str, width: u32, height: u32) -> Result<(), SshError> {
        self.terminal_manager.resize_terminal(terminal_id, width, height).await
    }
}

impl Default for SshClient {
    fn default() -> Self {
        Self::new()
    }
}

