# Architecture Design

## Overview

Pardoroid SSH Client follows a clean architecture pattern with clear separation between frontend and backend concerns.

## System Architecture

```
┌─────────────────────────────────────┐
│           Frontend (React)          │
├─────────────────────────────────────┤
│  Components  │  Services  │  Types  │
│  - SshManager│  - SshService       │
│  - Terminal  │  - ConfigService    │
│  - Settings  │                     │
├─────────────────────────────────────┤
│         Tauri Bridge (IPC)          │
├─────────────────────────────────────┤
│            Backend (Rust)           │
├─────────────────────────────────────┤
│  SSH Client  │  Session Manager    │
│  - russh     │  - Arc<Mutex>       │
│  - tokio     │  - Connection Pool  │
└─────────────────────────────────────┘
```

## Component Design

### Backend Components

#### 1. SshClient (Facade)
The main entry point for all SSH operations.

```rust
pub struct SshClient {
    session_manager: Arc<SshSessionManager>,
}
```

**Responsibilities:**
- Provide simple API for frontend
- Coordinate between session manager and individual sessions
- Handle error conversion for Tauri

#### 2. SshSessionManager
Manages multiple SSH sessions concurrently.

```rust
pub struct SshSessionManager {
    sessions: Arc<Mutex<HashMap<String, Arc<SshSession>>>>,
}
```

**Responsibilities:**
- Create and destroy SSH sessions
- Track session lifecycle
- Provide thread-safe access to sessions
- Generate unique session IDs

#### 3. SshSession
Represents individual SSH connection.

```rust
pub struct SshSession {
    config: SshConfig,
    status: Arc<Mutex<ConnectionStatus>>,
    connection: Arc<Mutex<Option<SshConnection>>>,
}
```

**Responsibilities:**
- Manage single SSH connection lifecycle
- Handle authentication
- Execute commands
- Maintain connection state

### Frontend Components

#### 1. SshService (API Layer)
TypeScript wrapper for Tauri commands.

```typescript
export class SshService {
  static async createConnection(config: SshConfig): Promise<string>
  static async connect(sessionId: string): Promise<void>
  // ... other methods
}
```

#### 2. SshManager (UI Component)
React component for SSH session management.

```typescript
export const SshManager: React.FC = () => {
  // Session management UI
  // Command execution interface
  // Real-time output display
}
```

## Data Flow

### Connection Creation Flow
1. User inputs connection details in UI
2. Frontend calls `SshService.createConnection()`
3. Tauri invokes `ssh_create_connection` command
4. Backend creates new `SshSession` with config
5. Session Manager assigns unique ID
6. Session ID returned to frontend

### Command Execution Flow
1. User enters command in UI
2. Frontend calls `SshService.executeCommand()`
3. Tauri invokes `ssh_execute_command` command
4. Backend retrieves session by ID
5. Session executes command via russh
6. Command result returned through Tauri bridge
7. Frontend displays output in UI

## Concurrency Model

### Thread Safety
- **Session Manager**: Uses `Arc<Mutex<HashMap>>` for thread-safe session storage
- **Individual Sessions**: Each session wrapped in `Arc` for shared ownership
- **Connection State**: Protected by `Mutex` for safe state transitions

### Async Operations
- All SSH operations are async using Tokio runtime
- Tauri commands marked as `async` for non-blocking execution
- Frontend uses React hooks for async state management

## Error Handling

### Error Propagation
```rust
// Backend error types
#[derive(Debug, thiserror::Error)]
pub enum SshError {
    #[error("Connection failed: {0}")]
    ConnectionFailed(String),
    #[error("Authentication failed")]
    AuthenticationFailed,
    #[error("Session not found: {0}")]
    SessionNotFound(String),
}

// Tauri command error handling
async fn ssh_connect(session_id: String) -> Result<(), String> {
    client.connect(&session_id)
        .await
        .map_err(|e| e.to_string()) // Convert to String for Tauri
}
```

### Frontend Error Handling
```typescript
try {
  await SshService.connect(sessionId);
} catch (error) {
  console.error('Connection failed:', error);
  // Show user-friendly error message
}
```

## Security Architecture

### Authentication Flow
1. User provides credentials (password/key)
2. Credentials validated on Rust side
3. SSH handshake performed using russh
4. Connection established with server verification
5. Credentials cleared from memory after use

### Host Key Management
- Currently accepts all host keys (development mode)
- Future: Implement proper host key verification
- Store known hosts in secure location

## Performance Considerations

### Connection Pooling
- Multiple sessions managed concurrently
- Each session maintains persistent connection
- Connection reuse for multiple commands

### Memory Management
- Sessions cleaned up on disconnect
- Rust's ownership system prevents memory leaks
- Frontend components properly unmount

## Extensibility

### Plugin Architecture (Future)
```rust
pub trait SshPlugin {
    fn on_connect(&self, session: &SshSession);
    fn on_command(&self, session: &SshSession, command: &str);
    fn on_disconnect(&self, session: &SshSession);
}
```

### Protocol Support
- Base SSH protocol via russh
- Future: SFTP support via russh-sftp
- Future: Port forwarding capabilities
- Future: Kitty Graphics Protocol integration

