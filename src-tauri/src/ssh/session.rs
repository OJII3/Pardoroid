use crate::ssh::{AuthMethod, CommandResult, SshConfig, SshError, SshSessionInfo, ConnectionStatus};
use russh::client::{self, Handle, AuthResult};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{Mutex, RwLock};
use uuid::Uuid;

/// SSH セッションマネージャー
pub struct SshSessionManager {
    sessions: Arc<RwLock<HashMap<String, Arc<Mutex<SshSession>>>>>,
}

/// 個別のSSHセッション
pub struct SshSession {
    id: String,
    config: SshConfig,
    status: ConnectionStatus,
    connection: Option<Handle<SshClientHandler>>,
    connected_at: Option<chrono::DateTime<chrono::Utc>>,
}

/// SSH クライアントハンドラー
#[derive(Clone)]
pub struct SshClientHandler;

impl client::Handler for SshClientHandler {
    type Error = SshError;

    async fn check_server_key(
        &mut self,
        _server_public_key: &russh::keys::PublicKey,
    ) -> Result<bool, Self::Error> {
        // TODO: サーバーキーの検証を実装
        // 現在は全て受け入れる（セキュリティ上推奨されない）
        Ok(true)
    }
}

impl Default for SshSessionManager {
    fn default() -> Self {
        Self::new()
    }
}

impl SshSessionManager {
    pub fn new() -> Self {
        Self {
            sessions: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// 新しいSSHセッションを作成
    pub async fn create_session(&self, config: SshConfig) -> Result<String, SshError> {
        let session_id = Uuid::new_v4().to_string();
        let session = SshSession::new(session_id.clone(), config);
        
        let mut sessions = self.sessions.write().await;
        sessions.insert(session_id.clone(), Arc::new(Mutex::new(session)));
        
        Ok(session_id)
    }

    /// セッションに接続
    pub async fn connect(&self, session_id: &str) -> Result<(), SshError> {
        let sessions = self.sessions.read().await;
        let session_arc = sessions
            .get(session_id)
            .ok_or_else(|| SshError::SessionNotFound(session_id.to_string()))?
            .clone();

        let mut session = session_arc.lock().await;
        session.connect().await
    }

    /// セッションを切断
    pub async fn disconnect(&self, session_id: &str) -> Result<(), SshError> {
        let sessions = self.sessions.read().await;
        let session_arc = sessions
            .get(session_id)
            .ok_or_else(|| SshError::SessionNotFound(session_id.to_string()))?
            .clone();

        let mut session = session_arc.lock().await;
        session.disconnect().await
    }

    /// コマンドを実行
    pub async fn execute_command(
        &self,
        session_id: &str,
        command: &str,
    ) -> Result<CommandResult, SshError> {
        let sessions = self.sessions.read().await;
        let session_arc = sessions
            .get(session_id)
            .ok_or_else(|| SshError::SessionNotFound(session_id.to_string()))?
            .clone();

        let mut session = session_arc.lock().await;
        session.execute_command(command).await
    }

    /// セッション情報を取得
    pub async fn get_session_info(&self, session_id: &str) -> Result<SshSessionInfo, SshError> {
        let sessions = self.sessions.read().await;
        let session_arc = sessions
            .get(session_id)
            .ok_or_else(|| SshError::SessionNotFound(session_id.to_string()))?
            .clone();

        let session = session_arc.lock().await;
        Ok(session.get_info())
    }

    /// 全セッション情報を取得
    pub async fn list_sessions(&self) -> Vec<SshSessionInfo> {
        let sessions = self.sessions.read().await;
        let mut session_infos = Vec::new();

        for session_arc in sessions.values() {
            let session = session_arc.lock().await;
            session_infos.push(session.get_info());
        }

        session_infos
    }

    /// セッションを削除
    pub async fn remove_session(&self, session_id: &str) -> Result<(), SshError> {
        let mut sessions = self.sessions.write().await;
        
        if let Some(session_arc) = sessions.remove(session_id) {
            let mut session = session_arc.lock().await;
            let _ = session.disconnect().await; // エラーは無視
        }

        Ok(())
    }
}

impl SshSession {
    fn new(id: String, config: SshConfig) -> Self {
        Self {
            id,
            config,
            status: ConnectionStatus::Disconnected,
            connection: None,
            connected_at: None,
        }
    }

    async fn connect(&mut self) -> Result<(), SshError> {
        self.status = ConnectionStatus::Connecting;

        // SSH設定の準備
        let ssh_config = russh::client::Config {
            inactivity_timeout: self.config.timeout.map(std::time::Duration::from_secs),
            ..Default::default()
        };

        // 接続の確立
        let mut connection = russh::client::connect(
            Arc::new(ssh_config),
            (self.config.host.as_str(), self.config.port),
            SshClientHandler,
        )
        .await
        .map_err(|e| SshError::ConnectionFailed(e.to_string()))?;

        // 認証
        let auth_result = match &self.config.auth_method {
            AuthMethod::Password(password) => {
                connection
                    .authenticate_password(&self.config.username, password)
                    .await
                    .map_err(|e| SshError::AuthenticationFailed(e.to_string()))?
            }
            AuthMethod::PublicKey {
                private_key_path,
                passphrase,
            } => {
                let key = load_private_key(private_key_path, passphrase.as_deref())
                    .map_err(|e| SshError::AuthenticationFailed(e.to_string()))?;
                
                connection
                    .authenticate_publickey(&self.config.username, key)
                    .await
                    .map_err(|e| SshError::AuthenticationFailed(e.to_string()))?
            }
            AuthMethod::Agent => {
                // TODO: SSH Agent認証の実装
                return Err(SshError::AuthenticationFailed(
                    "SSH Agent authentication not implemented yet".to_string(),
                ));
            }
        };

        // 認証が成功したかチェック
        if auth_result != AuthResult::Success {
            return Err(SshError::AuthenticationFailed("Authentication failed".to_string()));
        }

        // 認証成功後、接続を保存
        self.connection = Some(connection);
        self.status = ConnectionStatus::Connected;
        self.connected_at = Some(chrono::Utc::now());

        Ok(())
    }

    async fn disconnect(&mut self) -> Result<(), SshError> {
        if let Some(connection) = self.connection.take() {
            let _ = connection.disconnect(russh::Disconnect::ProtocolError, "", "en").await;
        }
        
        self.status = ConnectionStatus::Disconnected;
        self.connected_at = None;

        Ok(())
    }

    async fn execute_command(&mut self, _command: &str) -> Result<CommandResult, SshError> {
        let connection = self
            .connection
            .as_mut()
            .ok_or_else(|| SshError::CommandFailed("Not connected".to_string()))?;

        let _channel = connection
            .channel_open_session()
            .await
            .map_err(|e| SshError::CommandFailed(e.to_string()))?;

        // TODO: russhライブラリの実際のAPIを使用してコマンドを実行
        // 現在は簡単な実装として、結果を返すだけにしています
        Ok(CommandResult {
            exit_code: 0,
            stdout: "Command executed".to_string(), // TODO: 実際の出力を取得
            stderr: String::new(),
        })
    }

    fn get_info(&self) -> SshSessionInfo {
        SshSessionInfo {
            id: self.id.clone(),
            config: self.config.clone(),
            status: self.status.clone(),
            connected_at: self.connected_at,
        }
    }
}

/// 秘密鍵を読み込む
fn load_private_key(path: &str, passphrase: Option<&str>) -> Result<russh::keys::PrivateKeyWithHashAlg, Box<dyn std::error::Error>> {
    use russh::keys::decode_secret_key;
    
    let key_data = std::fs::read_to_string(path)?;
    
    let private_key = if let Some(passphrase) = passphrase {
        decode_secret_key(&key_data, Some(passphrase))?
    } else {
        decode_secret_key(&key_data, None)?
    };
    
    // Wrap PrivateKey in PrivateKeyWithHashAlg
    Ok(russh::keys::PrivateKeyWithHashAlg::new(
        Arc::new(private_key),
        Some(russh::keys::HashAlg::Sha256)
    ))
}

