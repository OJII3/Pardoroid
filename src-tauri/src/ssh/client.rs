use crate::ssh::{SshSessionManager, SshConfig, SshSessionInfo, CommandResult, SshError};
use std::sync::Arc;

/// SSHクライアントファサード
pub struct SshClient {
    session_manager: Arc<SshSessionManager>,
}

impl SshClient {
    pub fn new() -> Self {
        Self {
            session_manager: Arc::new(SshSessionManager::new()),
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
}

impl Default for SshClient {
    fn default() -> Self {
        Self::new()
    }
}

