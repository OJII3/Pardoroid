# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pardoroid is a multiplatform SSH client application built with Tauri + React that supports Kitty Graphics Protocol. The application targets both desktop and mobile platforms.

## Architecture

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Rust with Tauri 2.0 framework
- **Build System**: Vite for frontend, Cargo for Rust backend
- **Code Quality**: Biome for linting and formatting

The project follows Tauri's standard structure:
- `src/` - React frontend code
- `src-tauri/` - Rust backend code and Tauri configuration
- `src-tauri/src/lib.rs` - Main Tauri application logic with command handlers
- `src-tauri/src/main.rs` - Entry point that calls the library

## Development Commands

### Frontend Development
- `npm run dev` - Start Vite development server
- `npm run build` - Build frontend for production (TypeScript compilation + Vite build)
- `npm run preview` - Preview production build

### Tauri Development
- `npm run tauri dev` - Start Tauri development mode (auto-starts frontend dev server)
- `npm run tauri build` - Build complete application for production

### Code Quality
- `npm run check` - Run Biome linter and formatter checks
- `npm run format` - Run Biome formatter with --write flag to fix issues

## Code Style

The project uses Biome with these configurations:
- Tab indentation
- Double quotes for JavaScript/TypeScript
- Automatic import organization
- Git integration enabled for VCS hooks

## Tauri Commands

Tauri commands are defined in `src-tauri/src/lib.rs` and invoked from React using `@tauri-apps/api/core`. The current example command is `greet` which demonstrates the Rust-frontend communication pattern.