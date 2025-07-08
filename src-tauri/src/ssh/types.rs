use serde::{Deserialize, Serialize};

/// SSH接続設定
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SshConfig {
    pub host: String,
    pub port: u16,
    pub username: String,
    pub auth_method: AuthMethod,
    pub timeout: Option<u64>,
}

/// 認証方法
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AuthMethod {
    /// パスワード認証
    Password(String),
    /// 公開鍵認証
    PublicKey {
        private_key_path: String,
        passphrase: Option<String>,
    },
    /// SSH Agent認証
    Agent,
}

/// SSH接続状態
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ConnectionStatus {
    Disconnected,
    Connecting,
    Connected,
    Failed(String),
}

/// SSH セッション情報
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SshSessionInfo {
    pub id: String,
    pub config: SshConfig,
    pub status: ConnectionStatus,
    pub connected_at: Option<chrono::DateTime<chrono::Utc>>,
}

/// コマンド実行結果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandResult {
    pub exit_code: u32,
    pub stdout: String,
    pub stderr: String,
}

/// ターミナルセッション情報
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TerminalSession {
    pub id: String,
    pub ssh_session_id: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub is_active: bool,
}

/// ターミナルデータ
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TerminalData {
    pub session_id: String,
    pub data: String,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

/// ファイル転送の進捗情報
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransferProgress {
    pub transferred: u64,
    pub total: u64,
    pub rate: f64, // bytes per second
}

/// エラー型
#[derive(Debug, thiserror::Error)]
pub enum SshError {
    #[error("Connection failed: {0}")]
    ConnectionFailed(String),
    #[error("Authentication failed: {0}")]
    AuthenticationFailed(String),
    #[error("Command execution failed: {0}")]
    CommandFailed(String),
    #[error("File transfer failed: {0}")]
    TransferFailed(String),
    #[error("Session not found: {0}")]
    SessionNotFound(String),
    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),
    #[error("SSH error: {0}")]
    RusshError(String),
}

impl From<russh::Error> for SshError {
    fn from(err: russh::Error) -> Self {
        SshError::RusshError(err.to_string())
    }
}
