// SSH関連の型定義

export interface SshConfig {
	host: string;
	port: number;
	username: string;
	auth_method: AuthMethod;
	timeout?: number;
}

export type AuthMethod =
	| { Password: string }
	| { PublicKey: { private_key_path: string; passphrase?: string } }
	| "Agent";

export type ConnectionStatus =
	| "Disconnected"
	| "Connecting"
	| "Connected"
	| { Failed: string };

export interface SshSessionInfo {
	id: string;
	config: SshConfig;
	status: ConnectionStatus;
	connected_at?: string; // ISO 8601 datetime string
}

export interface CommandResult {
	exit_code: number;
	stdout: string;
	stderr: string;
}

export interface TerminalSession {
	id: string;
	ssh_session_id: string;
	created_at: string;
	is_active: boolean;
}

export interface TerminalData {
	session_id: string;
	data: string;
	timestamp: string;
}

export interface TransferProgress {
	transferred: number;
	total: number;
	rate: number; // bytes per second
}

// Tauri API関数の型定義
export interface SshApi {
	createConnection(config: SshConfig): Promise<string>;
	connect(sessionId: string): Promise<void>;
	disconnect(sessionId: string): Promise<void>;
	executeCommand(sessionId: string, command: string): Promise<CommandResult>;
	getSessionInfo(sessionId: string): Promise<SshSessionInfo>;
	listSessions(): Promise<SshSessionInfo[]>;
	removeSession(sessionId: string): Promise<void>;
}
