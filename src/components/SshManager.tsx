import { Loader2, Plus, Terminal, X } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import * as sshService from "../services/ssh";
import type { CommandResult, SshConfig, SshSessionInfo } from "../types/ssh";
import { Terminal as TerminalComponent } from "./Terminal";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";

interface SshManagerProps {
	onCreateSession: () => void;
	refreshTrigger: number;
}

export const SshManager: React.FC<SshManagerProps> = ({
	onCreateSession,
	refreshTrigger,
}) => {
	const [sessions, setSessions] = useState<SshSessionInfo[]>([]);
	const [selectedSession, setSelectedSession] = useState<string | null>(null);
	const [command, setCommand] = useState("");
	const [commandResult, setCommandResult] = useState<CommandResult | null>(
		null,
	);
	const [loading, setLoading] = useState(false);
	const [terminalSessions, setTerminalSessions] = useState<Map<string, string>>(
		new Map(),
	);

	// セッション一覧を取得
	const loadSessions = useCallback(async () => {
		try {
			const sessionList = await sshService.listSessions();
			setSessions(sessionList);
		} catch (error) {
			console.error("Failed to load sessions:", error);
			toast.error("Failed to load sessions");
		}
	}, []);

	useEffect(() => {
		loadSessions();
	}, [loadSessions]);

	// Refresh sessions when refreshTrigger changes
	useEffect(() => {
		if (refreshTrigger > 0) {
			loadSessions();
		}
	}, [refreshTrigger, loadSessions]);

	// 新しいセッションを作成
	const _createSession = async () => {
		const config: SshConfig = {
			host: "localhost",
			port: 22,
			username: "user",
			auth_method: { Password: "password" },
			timeout: 30,
		};

		try {
			setLoading(true);
			const sessionId = await sshService.createConnection(config);
			await sshService.connect(sessionId);
			await loadSessions();
			toast.success("SSH session created successfully");
		} catch (error) {
			console.error("Failed to create session:", error);
			toast.error("Failed to create SSH session");
		} finally {
			setLoading(false);
		}
	};

	// コマンドを実行
	const executeCommand = async () => {
		if (!selectedSession || !command.trim()) return;

		try {
			setLoading(true);
			const result = await sshService.executeCommand(selectedSession, command);
			setCommandResult(result);
			if (result.exit_code === 0) {
				toast.success(
					`Command executed successfully (Exit code: ${result.exit_code})`,
				);
				setCommand(""); // コマンド実行後は入力をクリア
			} else {
				toast.warning(
					`Command executed with errors (Exit code: ${result.exit_code})`,
				);
			}
		} catch (error) {
			console.error("Failed to execute command:", error);
			toast.error("Failed to execute command");
		} finally {
			setLoading(false);
		}
	};

	// セッションを切断
	const disconnectSession = async (sessionId: string) => {
		try {
			await sshService.disconnect(sessionId);
			await loadSessions();
			if (selectedSession === sessionId) {
				setSelectedSession(null);
			}
			toast.success("SSH session disconnected successfully");
		} catch (error) {
			console.error("Failed to disconnect session:", error);
			toast.error("Failed to disconnect session");
		}
	};

	// ターミナルセッションを開く
	const openTerminal = async (sshSessionId: string) => {
		try {
			// Generate a unique terminal session ID
			const terminalSessionId = `terminal-${Date.now()}`;
			setTerminalSessions((prev) =>
				new Map(prev).set(terminalSessionId, sshSessionId),
			);
			toast.success("Terminal session opened");
		} catch (error) {
			console.error("Failed to open terminal:", error);
			toast.error("Failed to open terminal");
		}
	};

	// ターミナルセッションを閉じる
	const closeTerminal = (terminalSessionId: string) => {
		setTerminalSessions((prev) => {
			const newMap = new Map(prev);
			newMap.delete(terminalSessionId);
			return newMap;
		});
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-semibold">SSH Manager</h2>
				<Button className="flex items-center gap-2" onClick={onCreateSession}>
					<Plus className="h-4 w-4" />
					Create Session
				</Button>
			</div>

			<div>
				<h3 className="text-lg font-medium mb-3">Sessions</h3>
				<div className="space-y-2">
					{sessions.map((session) => (
						<Card
							className={`cursor-pointer transition-colors ${
								selectedSession === session.id
									? "bg-blue-50 border-blue-200"
									: "hover:bg-gray-50"
							}`}
							key={session.id}
							onClick={() => setSelectedSession(session.id)}
						>
							<CardContent className="p-4">
								<div className="flex items-center justify-between">
									<div className="flex flex-col gap-2">
										<div className="flex items-center gap-3">
											<span className="font-medium">
												{session.config.host}:{session.config.port}
											</span>
											<span className="text-sm text-muted-foreground">
												({session.config.username})
											</span>
											<Badge
												variant={
													session.status === "Connected"
														? "default"
														: "destructive"
												}
											>
												{typeof session.status === "string"
													? session.status
													: "Failed"}
											</Badge>
										</div>
									</div>
									<div className="flex items-center gap-2">
										{session.status === "Connected" && (
											<Button
												className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
												onClick={(e) => {
													e.stopPropagation();
													openTerminal(session.id);
												}}
												size="sm"
											>
												<Terminal className="h-4 w-4" />
												Terminal
											</Button>
										)}
										<Button
											className="flex items-center gap-2"
											onClick={(e) => {
												e.stopPropagation();
												disconnectSession(session.id);
											}}
											size="sm"
											variant="destructive"
										>
											<X className="h-4 w-4" />
											Disconnect
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
					{sessions.length === 0 && (
						<p className="text-center text-muted-foreground py-8">
							No SSH sessions available. Create one to get started.
						</p>
					)}
				</div>
			</div>

			{selectedSession && (
				<div>
					<h3 className="text-lg font-medium mb-3">Execute Command</h3>
					<div className="flex gap-2">
						<div className="relative flex-1">
							<Terminal className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								className="pl-10"
								onChange={(e) => setCommand(e.currentTarget.value)}
								onKeyDown={(e) => e.key === "Enter" && executeCommand()}
								placeholder="Enter command..."
								value={command}
							/>
						</div>
						<Button
							className="bg-green-600 hover:bg-green-700"
							disabled={loading || !command.trim()}
							onClick={executeCommand}
						>
							{loading ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								"Execute"
							)}
						</Button>
					</div>
				</div>
			)}

			{commandResult && (
				<div>
					<h3 className="text-lg font-medium mb-3">Command Result</h3>
					<Card>
						<CardContent className="p-4">
							<div className="space-y-4">
								<div className="flex items-center gap-2">
									<span className="font-medium">Exit Code:</span>
									<Badge
										variant={
											commandResult.exit_code === 0 ? "default" : "destructive"
										}
									>
										{commandResult.exit_code}
									</Badge>
								</div>

								{commandResult.stdout && (
									<div>
										<h4 className="font-medium mb-2">STDOUT:</h4>
										<pre className="bg-black text-green-400 p-3 rounded text-sm whitespace-pre-wrap overflow-x-auto">
											{commandResult.stdout}
										</pre>
									</div>
								)}

								{commandResult.stderr && (
									<div>
										<h4 className="font-medium mb-2">STDERR:</h4>
										<pre className="bg-black text-red-400 p-3 rounded text-sm whitespace-pre-wrap overflow-x-auto">
											{commandResult.stderr}
										</pre>
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Terminal Sessions */}
			{terminalSessions.size > 0 && (
				<div>
					<h3 className="text-lg font-medium mb-3">Terminal Sessions</h3>
					<div className="space-y-4">
						{Array.from(terminalSessions.entries()).map(
							([terminalId, sshSessionId]) => (
								<TerminalComponent
									key={terminalId}
									onClose={() => closeTerminal(terminalId)}
									sessionId={terminalId}
									sshSessionId={sshSessionId}
								/>
							),
						)}
					</div>
				</div>
			)}
		</div>
	);
};
