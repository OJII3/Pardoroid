import { invoke } from "@tauri-apps/api/core";
import type { CommandResult, SshConfig, SshSessionInfo } from "../types/ssh";

/**
 * 新しいSSH接続を作成
 */
export async function createConnection(config: SshConfig): Promise<string> {
	return await invoke("ssh_create_connection", { config });
}

/**
 * SSH接続を確立
 */
export async function connect(sessionId: string): Promise<void> {
	return await invoke("ssh_connect", { sessionId });
}

/**
 * SSH接続を切断
 */
export async function disconnect(sessionId: string): Promise<void> {
	return await invoke("ssh_disconnect", { sessionId });
}

/**
 * コマンドを実行
 */
export async function executeCommand(
	sessionId: string,
	command: string,
): Promise<CommandResult> {
	return await invoke("ssh_execute_command", { sessionId, command });
}

/**
 * セッション情報を取得
 */
export async function getSessionInfo(
	sessionId: string,
): Promise<SshSessionInfo> {
	return await invoke("ssh_get_session_info", { sessionId });
}

/**
 * 全セッション一覧を取得
 */
export async function listSessions(): Promise<SshSessionInfo[]> {
	return await invoke("ssh_list_sessions");
}

/**
 * セッションを削除
 */
export async function removeSession(sessionId: string): Promise<void> {
	return await invoke("ssh_remove_session", { sessionId });
}
