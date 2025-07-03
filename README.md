# Pardoroid SSH Client

A multiplatform SSH client application built with Tauri + React that supports Kitty Graphics Protocol.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run tauri dev

# Build for production
npm run tauri build
```

## Features

- **Cross-platform**: Desktop and mobile platform support
- **Modern UI**: React-based responsive interface
- **Secure SSH**: Rust-based implementation using russh
- **Multiple Authentication**: Password, public key, and SSH agent support
- **Session Management**: Multiple concurrent SSH sessions
- **Command Execution**: Real-time command execution with output

## Architecture

- **Backend**: Rust + Tauri 2.0 with russh library
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS (future)

## Documentation

- [Architecture Design](docs/architecture.md)
- [API Reference](docs/api.md)
- [Development Guide](docs/development.md)
- [Security Considerations](docs/security.md)

## License

MIT License
