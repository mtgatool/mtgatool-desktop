# NPM Scripts Reference

## Development

### Tauri (Desktop)
```bash
npm run dev
```
Runs the Tauri app in development mode with hot reload.
- Automatically builds workers via `beforeDevCommand` in Tauri config
- Starts React dev server at http://localhost:3001
- Starts Tauri app with hot reload
- **Open dev tools:** Press `Cmd + Option + I` (Mac) or `F12` (Windows/Linux)

### Web (Browser)
```bash
npm run dev:web
```
Runs the web version in development mode.
- Builds workers
- Starts webpack dev server
- Accessible at http://localhost:3001
- Memory reading features will be disabled

## Building

### Tauri (Desktop)
```bash
npm run build
```
Creates production build of the Tauri desktop app.
- Automatically builds workers via `beforeBuildCommand` in Tauri config
- Builds React app with Tauri config
- Compiles Rust backend
- Outputs to `src-tauri/target/release/bundle`

### Web (Browser)
```bash
npm run build:web
```
Creates production build of the web version.
- Builds workers
- Builds React app with web config
- Outputs to `./build`

## Testing

### Run All Tests
```bash
npm test
```
Runs both linting and unit tests (CI mode).

### Linting Only
```bash
npm run test:lint
```
Runs ESLint on all source files.

### Unit Tests Only
```bash
npm run test:unit
```
Runs Jest tests in CI mode (no watch).

### Interactive Test Mode
```bash
npm run test:watch
```
Runs Jest in watch mode for development.

## Workers

Web workers are automatically built by Tauri's `beforeDevCommand` and `beforeBuildCommand`.

### Build Workers Manually
```bash
npm run build:workers
```
Builds both the ToolDB and Cards web workers.

Individual worker builds:
- `npm run build:tooldb-worker` - Build ToolDB worker
- `npm run build:cards-worker` - Build Cards worker

## Internal Scripts

These scripts are called automatically by Tauri and shouldn't be run directly:

- `react-start:tauri` - Internal: Starts React dev server for Tauri (called by `beforeDevCommand`)
- `react-build:tauri` - Internal: Builds React app for Tauri (called by `beforeBuildCommand`)

## Protobuf

### Generate Protobuf Types
```bash
npm run proto
```
Regenerates TypeScript types from protobuf definitions.
- Compiles .proto files to JSON
- Generates TypeScript types
- Runs ESLint to fix formatting

## Environment-Specific Configs

The app uses different Craco configs for different environments:
- **Tauri**: `craco.tauri.config.js` - Desktop app with Tauri APIs
- **Web**: `craco.web.config.js` - Browser-only build

## Dev Tools Access

In Tauri development mode, open dev tools with:
- **macOS**: `Cmd + Option + I`
- **Windows/Linux**: `F12` or `Ctrl + Shift + I`

## Notes

- All builds automatically include worker compilation
- Memory reading features only work in Tauri/desktop mode
- Web mode gracefully handles missing desktop features
- First Rust compilation takes 1-2 minutes, subsequent builds are much faster (~10-20 seconds)
