# Development Guide

## Development Environment Setup

### Prerequisites

- **Rust**: Install latest stable version from [rustup.rs](https://rustup.rs/)
- **Node.js**: Version 18 or higher
- **Platform Dependencies**: Follow [Tauri prerequisites](https://tauri.app/start/prerequisites/)

### Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd pardoroid

# Install frontend dependencies
npm install

# Install Rust dependencies (handled automatically by Cargo)
cd src-tauri
cargo check
```

## Development Commands

### Frontend Development

```bash
# Start Vite development server (frontend only)
npm run dev

# Build frontend for production
npm run build

# Preview production build
npm run preview
```

### Tauri Development

```bash
# Start Tauri development mode (includes frontend)
npm run tauri dev

# Build complete application
npm run tauri build
```

### Code Quality

```bash
# Check code formatting and linting
npm run check

# Auto-fix formatting issues
npm run format
```

## Project Structure

```
pardoroid/
├── src/                          # React frontend
│   ├── components/              # React components
│   │   └── SshManager.tsx       # SSH management UI
│   ├── services/               # Frontend services
│   │   └── ssh.ts              # SSH service wrapper
│   ├── types/                  # TypeScript type definitions
│   │   └── ssh.ts              # SSH-related types
│   ├── App.tsx                 # Main application component
│   └── main.tsx                # React entry point
├── src-tauri/                   # Rust backend
│   ├── src/                    # Rust source code
│   │   ├── ssh/                # SSH implementation
│   │   │   ├── client.rs       # SSH client facade
│   │   │   ├── session.rs      # SSH session handling
│   │   │   ├── manager.rs      # Session manager
│   │   │   ├── types.rs        # Rust type definitions
│   │   │   └── mod.rs          # Module exports
│   │   ├── lib.rs              # Main library with Tauri commands
│   │   └── main.rs             # Application entry point
│   ├── Cargo.toml              # Rust dependencies
│   └── tauri.conf.json         # Tauri configuration
├── docs/                        # Documentation
│   ├── architecture.md         # Architecture documentation
│   ├── api.md                  # API reference
│   └── security.md             # Security considerations
├── package.json                # Node.js dependencies and scripts
├── biome.json                  # Code formatting configuration
└── README.md                   # Project overview
```

## Development Workflow

### Adding New Features

1. **Design Phase**
   - Update architecture documentation if needed
   - Define new types in `src/types/` and `src-tauri/src/ssh/types.rs`
   - Update API documentation

2. **Backend Implementation**
   - Add new functionality to SSH modules
   - Create Tauri commands in `lib.rs`
   - Add error handling and validation

3. **Frontend Integration**
   - Add service methods to `SshService`
   - Update React components
   - Add TypeScript types

4. **Testing**
   - Test Rust code with `cargo test`
   - Test integration with `npm run tauri dev`
   - Manual testing of new features

### Code Style Guidelines

#### Rust Code Style
- Follow standard Rust formatting (`cargo fmt`)
- Use `rustc` linting recommendations
- Prefer explicit error handling with `Result<T, E>`
- Use `Arc<Mutex<T>>` for shared state
- Document public APIs with `///` comments

```rust
/// Creates a new SSH connection with the provided configuration.
/// 
/// # Arguments
/// * `config` - SSH connection configuration
/// 
/// # Returns
/// * `Ok(String)` - Unique session identifier
/// * `Err(SshError)` - Connection creation error
pub async fn create_connection(&self, config: SshConfig) -> Result<String, SshError> {
    // Implementation
}
```

#### TypeScript Code Style
- Use Biome for formatting and linting
- Prefer explicit types over `any`
- Use async/await for asynchronous operations
- Follow React hooks best practices

```typescript
// Good: Explicit types
interface Props {
  sessionId: string;
  onConnect: (id: string) => void;
}

// Good: Proper error handling
const connectToServer = async (config: SshConfig): Promise<void> => {
  try {
    const sessionId = await SshService.createConnection(config);
    await SshService.connect(sessionId);
  } catch (error) {
    console.error('Connection failed:', error);
    throw error;
  }
};
```

## Debugging

### Rust Backend Debugging

#### Enable Debug Logging
```rust
// Add to lib.rs or main.rs
use tracing::info;

#[tauri::command]
async fn ssh_connect(session_id: String) -> Result<(), String> {
    info!("Connecting to session: {}", session_id);
    // ... implementation
}
```

#### View Logs
```bash
# Run with debug logging
RUST_LOG=debug npm run tauri dev
```

#### Using Rust Debugger
```bash
# Build with debug symbols
cargo build

# Run with debugger (adjust path as needed)
rust-gdb target/debug/pardoroid
```

### Frontend Debugging

#### Browser Developer Tools
- Open DevTools in the Tauri webview
- Use React Developer Tools extension
- Monitor network requests and console logs

#### Debug Tauri Commands
```typescript
// Log Tauri command calls
const result = await invoke('ssh_connect', { sessionId });
console.log('Command result:', result);
```

## Testing

### Unit Testing (Rust)

```bash
# Run all tests
cargo test

# Run specific test
cargo test test_ssh_connection

# Run with output
cargo test -- --nocapture
```

### Integration Testing

```bash
# Test full application
npm run tauri dev

# Manual testing checklist:
# - Create SSH connection
# - Execute commands
# - Manage multiple sessions
# - Handle connection errors
```

## Common Development Issues

### Build Issues

**Issue**: Rust compilation errors
```bash
# Solution: Update dependencies
cargo update

# Clean build cache
cargo clean
```

**Issue**: Frontend build failures
```bash
# Solution: Clear node modules
rm -rf node_modules package-lock.json
npm install
```

### Runtime Issues

**Issue**: Tauri commands not found
```rust
// Solution: Ensure command is registered in lib.rs
.invoke_handler(tauri::generate_handler![
    ssh_create_connection,  // Add your command here
])
```

**Issue**: Type mismatches between Rust and TypeScript
- Update both type definitions
- Ensure Rust structs derive `serde::Serialize`
- Check TypeScript interfaces match Rust structs

## Performance Optimization

### Rust Backend
- Use `Arc<T>` for shared data instead of cloning
- Implement proper connection pooling
- Use async operations for I/O bound tasks

### Frontend
- Implement proper React component memoization
- Use React hooks efficiently
- Avoid unnecessary re-renders

## Contributing

### Pull Request Process

1. **Fork and Branch**
   ```bash
   git checkout -b feature/new-ssh-feature
   ```

2. **Implement Changes**
   - Follow coding standards
   - Add tests where appropriate
   - Update documentation

3. **Code Quality Check**
   ```bash
   npm run check  # Frontend linting
   cargo fmt     # Rust formatting
   cargo test    # Run tests
   ```

4. **Submit PR**
   - Clear description of changes
   - Link to relevant issues
   - Include testing instructions

### Code Review Guidelines

- Check for security implications
- Verify error handling
- Ensure documentation is updated
- Test on multiple platforms if possible

## Release Process

### Version Bumping

1. Update version in `package.json`
2. Update version in `src-tauri/Cargo.toml`
3. Update version in `src-tauri/tauri.conf.json`

### Building Releases

```bash
# Build for current platform
npm run tauri build

# Generated files will be in src-tauri/target/release/
```

### Platform-Specific Builds

Follow Tauri documentation for cross-compilation and platform-specific packaging.

