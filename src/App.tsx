import { useState } from "react";
import { ConnectionForm } from "./components/ConnectionForm";
import { SshManager } from "./components/SshManager";
import type { SshConfig } from "./types/ssh";

function App() {
	const [showConnectionForm, setShowConnectionForm] = useState(false);
	const [refreshSessions, setRefreshSessions] = useState(0);

	const handleCreateSession = () => {
		setShowConnectionForm(true);
	};

	const handleSaveConnection = async (_config: SshConfig) => {
		setShowConnectionForm(false);
		// Trigger refresh of sessions in SshManager
		setRefreshSessions((prev) => prev + 1);
	};

	const handleCancelConnection = () => {
		setShowConnectionForm(false);
	};

	return (
		<div className="container mx-auto p-6 max-w-4xl">
			{showConnectionForm ? (
				<ConnectionForm
					onCancel={handleCancelConnection}
					onSave={handleSaveConnection}
				/>
			) : (
				<SshManager
					onCreateSession={handleCreateSession}
					refreshTrigger={refreshSessions}
				/>
			)}
		</div>
	);
}

export default App;
