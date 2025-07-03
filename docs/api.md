# API Reference

## Tauri Commands

All SSH operations are exposed through Tauri commands that can be invoked from the frontend.

### ssh_create_connection

Creates a new SSH session with the provided configuration.

```rust
async fn ssh_create_connection(
    state: tauri::State<'_, AppState>,
    config: SshConfig,
) -> Result<String, String>
```

**Parameters:**
- `config: SshConfig` - SSH connection configuration

**Returns:**
- `Result<String, String>` - Session ID on success, error message on failure

**Example:**
```typescript
const config: SshConfig = {
  host: 'example.com',
  port: 22,
  username: 'user',
  auth_method: { Password: 'password' },
  timeout: 30,
};

const sessionId = await invoke('ssh_create_connection', { config });
```

### ssh_connect

Establishes connection for an existing session.

```rust
async fn ssh_connect(
    state: tauri::State<'_, AppState>,
    session_id: String,
) -> Result<(), String>
```

**Parameters:**
- `session_id: String` - Unique session identifier

**Returns:**
- `Result<(), String>` - Unit on success, error message on failure

### ssh_disconnect

Disconnects an active SSH session.

```rust
async fn ssh_disconnect(
    state: tauri::State<'_, AppState>,
    session_id: String,
) -> Result<(), String>
```

**Parameters:**
- `session_id: String` - Session to disconnect

**Returns:**
- `Result<(), String>` - Unit on success, error message on failure

### ssh_execute_command

Executes a command on the remote server.

```rust
async fn ssh_execute_command(
    state: tauri::State<'_, AppState>,
    session_id: String,
    command: String,
) -> Result<CommandResult, String>
```

**Parameters:**
- `session_id: String` - Target session
- `command: String` - Command to execute

**Returns:**
- `Result<CommandResult, String>` - Command result on success, error on failure

### ssh_get_session_info

Retrieves information about a specific session.

```rust
async fn ssh_get_session_info(
    state: tauri::State<'_, AppState>,
    session_id: String,
) -> Result<SshSessionInfo, String>
```

**Parameters:**
- `session_id: String` - Session to query

**Returns:**
- `Result<SshSessionInfo, String>` - Session information on success

### ssh_list_sessions

Lists all active sessions.

```rust
async fn ssh_list_sessions(
    state: tauri::State<'_, AppState>,
) -> Result<Vec<SshSessionInfo>, String>
```

**Returns:**
- `Result<Vec<SshSessionInfo>, String>` - Array of session information

### ssh_remove_session

Removes a session from the session manager.

```rust
async fn ssh_remove_session(
    state: tauri::State<'_, AppState>,
    session_id: String,
) -> Result<(), String>
```

**Parameters:**
- `session_id: String` - Session to remove

**Returns:**
- `Result<(), String>` - Unit on success, error message on failure

## Data Types

### SshConfig

Configuration for SSH connection.

```typescript
interface SshConfig {
  host: string;          // Target hostname or IP
  port: number;          // SSH port (usually 22)
  username: string;      // Username for authentication
  auth_method: AuthMethod; // Authentication method
  timeout?: number;      // Connection timeout in seconds
}
```

### AuthMethod

Authentication method for SSH connection.

```typescript
type AuthMethod =
  | { Password: string }                    // Password authentication
  | { PublicKey: {                         // Public key authentication
      private_key_path: string;
      passphrase?: string;
    }}
  | "Agent";                              // SSH agent authentication
```

### ConnectionStatus

Current status of SSH connection.

```typescript
type ConnectionStatus =
  | "Disconnected"      // Not connected
  | "Connecting"        // Connection in progress
  | "Connected"         // Successfully connected
  | { Failed: string }; // Connection failed with error
```

### SshSessionInfo

Information about an SSH session.

```typescript
interface SshSessionInfo {
  id: string;                    // Unique session identifier
  config: SshConfig;             // Connection configuration
  status: ConnectionStatus;      // Current connection status
  connected_at?: string;         // ISO 8601 connection timestamp
}
```

### CommandResult

Result of command execution.

```typescript
interface CommandResult {
  exit_code: number;    // Command exit code
  stdout: string;       // Standard output
  stderr: string;       // Standard error output
}
```

## Frontend Services

### SshService

TypeScript service class providing convenient access to SSH functionality.

```typescript
export class SshService {
  /**
   * Create new SSH connection
   */
  static async createConnection(config: SshConfig): Promise<string>;

  /**
   * Establish SSH connection
   */
  static async connect(sessionId: string): Promise<void>;

  /**
   * Disconnect SSH session
   */
  static async disconnect(sessionId: string): Promise<void>;

  /**
   * Execute command on remote server
   */
  static async executeCommand(
    sessionId: string, 
    command: string
  ): Promise<CommandResult>;

  /**
   * Get session information
   */
  static async getSessionInfo(sessionId: string): Promise<SshSessionInfo>;

  /**
   * List all sessions
   */
  static async listSessions(): Promise<SshSessionInfo[]>;

  /**
   * Remove session from manager
   */
  static async removeSession(sessionId: string): Promise<void>;
}
```

## Error Handling

### Error Types

All Tauri commands return `Result<T, String>` where the error case contains a human-readable error message.

Common error scenarios:
- **Connection Failed**: Network issues, wrong host/port
- **Authentication Failed**: Invalid credentials
- **Session Not Found**: Invalid session ID
- **Command Execution Failed**: Command failed on remote server

### Error Examples

```typescript
try {
  await SshService.connect(sessionId);
} catch (error) {
  // error is a string describing what went wrong
  if (error.includes('Authentication')) {
    // Handle authentication error
  } else if (error.includes('Connection')) {
    // Handle connection error  
  }
}
```

## Usage Patterns

### Basic Connection Flow

```typescript
// 1. Create configuration
const config: SshConfig = {
  host: 'server.example.com',
  port: 22,
  username: 'myuser',
  auth_method: { Password: 'mypassword' }
};

// 2. Create session
const sessionId = await SshService.createConnection(config);

// 3. Connect
await SshService.connect(sessionId);

// 4. Execute commands
const result = await SshService.executeCommand(sessionId, 'whoami');
console.log('Output:', result.stdout);

// 5. Disconnect when done
await SshService.disconnect(sessionId);
```

### Session Management

```typescript
// List all sessions
const sessions = await SshService.listSessions();

// Check session status
for (const session of sessions) {
  console.log(`${session.config.host}: ${session.status}`);
}

// Remove inactive sessions
const disconnectedSessions = sessions.filter(
  s => s.status === 'Disconnected'
);

for (const session of disconnectedSessions) {
  await SshService.removeSession(session.id);
}
```

