import { Terminal as XTerm } from "@xterm/xterm";
import { useEffect, useRef, useState } from "react";
import "@xterm/xterm/css/xterm.css";
import { invoke } from "@tauri-apps/api/core";
import type { TerminalData, TerminalSession } from "../types/ssh";

interface TerminalProps {
	sessionId: string;
	sshSessionId: string;
	onClose: () => void;
}

export function Terminal({ sessionId, sshSessionId, onClose }: TerminalProps) {
	const terminalRef = useRef<HTMLDivElement>(null);
	const xtermRef = useRef<XTerm | null>(null);
	const [terminalSession, setTerminalSession] =
		useState<TerminalSession | null>(null);

	useEffect(() => {
		if (!terminalRef.current) return;

		// Create xterm instance
		const xterm = new XTerm({
			cursorBlink: true,
			fontSize: 14,
			fontFamily: 'Menlo, Monaco, "Courier New", monospace',
			theme: {
				background: "#1e1e1e",
				foreground: "#d4d4d4",
				cursor: "#d4d4d4",
				selection: "#264f78",
			},
			cols: 80,
			rows: 24,
		});

		// Open terminal
		xterm.open(terminalRef.current);
		xtermRef.current = xterm;

		// Create terminal session
		const initTerminal = async () => {
			try {
				const terminalId: string = await invoke("terminal_create_session", {
					sshSessionId: sshSessionId,
				});

				const session: TerminalSession = await invoke("terminal_get_session", {
					terminalId: terminalId,
				});

				setTerminalSession(session);

				if (xtermRef.current) {
					xtermRef.current.write(
						"Terminal session created successfully.\r\n$ ",
					);
				}
			} catch (error) {
				console.error("Failed to create terminal session:", error);
				if (xtermRef.current) {
					xtermRef.current.write("Failed to create terminal session.\r\n");
				}
			}
		};

		initTerminal();

		// Handle input
		xterm.onData(async (data) => {
			try {
				await invoke("terminal_send_input", {
					terminalId: sessionId,
					input: data,
				});

				// Echo the input locally for now
				if (xtermRef.current) {
					if (data === "\r") {
						xtermRef.current.write("\r\n$ ");
					} else if (data === "\x7f") {
						// Backspace
						xtermRef.current.write("\b \b");
					} else {
						xtermRef.current.write(data);
					}
				}
			} catch (error) {
				console.error("Failed to send input:", error);
			}
		});

		// Cleanup
		return () => {
			if (xtermRef.current) {
				xtermRef.current.dispose();
			}
		};
	}, [sessionId, sshSessionId]);

	useEffect(() => {
		if (!terminalSession) return;

		// Poll for output data
		const pollOutput = async () => {
			try {
				const output: TerminalData | null = await invoke(
					"terminal_receive_output",
					{
						terminalId: sessionId,
					},
				);

				if (output && xtermRef.current) {
					xtermRef.current.write(output.data);
				}
			} catch (error) {
				console.error("Failed to receive terminal output:", error);
			}
		};

		const interval = setInterval(pollOutput, 100);
		return () => clearInterval(interval);
	}, [sessionId, terminalSession]);

	const handleClose = async () => {
		try {
			if (terminalSession) {
				await invoke("terminal_close_session", {
					terminalId: terminalSession.id,
				});
			}
		} catch (error) {
			console.error("Failed to close terminal session:", error);
		} finally {
			onClose();
		}
	};

	return (
		<div className="bg-gray-900 rounded-lg overflow-hidden">
			<div className="bg-gray-800 px-4 py-2 flex justify-between items-center">
				<h3 className="text-white text-sm font-medium">
					Terminal - {terminalSession?.ssh_session_id || sshSessionId}
				</h3>
				<button
					className="text-gray-400 hover:text-white text-sm"
					onClick={handleClose}
					type="button"
				>
					✕
				</button>
			</div>
			<div className="p-2" ref={terminalRef} style={{ height: "400px" }} />
		</div>
	);
}
