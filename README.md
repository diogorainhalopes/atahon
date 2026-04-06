<div align="center">

<img src="assets/icon.png" width="96" height="96" alt="Atahon icon" />

# Atahon

**A modern manga reader for Android — Tachiyomi-compatible extensions, powerful reader, offline-first.**

[![GitHub release](https://img.shields.io/github/v/release/diogorainhalopes/atahon?style=flat-square&color=7C6EF8)](https://github.com/diogorainhalopes/atahon/releases)
[![Platform](https://img.shields.io/badge/platform-Android-green?style=flat-square)](https://github.com/diogorainhalopes/atahon/releases)
[![Expo SDK](https://img.shields.io/badge/Expo-55-blue?style=flat-square)](https://expo.dev)
[![License](https://img.shields.io/badge/license-MIT-gray?style=flat-square)](LICENSE)

[Download APK](https://github.com/diogorainhalopes/atahon/releases) · [Documentation](https://diogorainhalopes.github.io/atahon/docs/)

</div>

---

## Features

- **Tachiyomi / Mihon extension support** — Install community APK extensions and browse hundreds of sources
- **4 reading modes** — Webtoon scroll, left-to-right, right-to-left, vertical paged
- **13+ reader settings** — Scale type, page layout, preload count, background color, fullscreen, and more
- **Smart downloads** — Auto-queue new chapters, background processing, configurable concurrency
- **Chapter compression** — WebP conversion with adjustable quality slider to save storage
- **Library management** — Custom categories, color-coded reading status, progress tracking
- **History & resume** — Timestamp-based history, resumes exactly where you left off
- **Privacy mode** — Anonymous reading that disables history tracking
- **Offline-first** — Everything lives in a local SQLite database; no account, no cloud

## Screenshots

| Library | Browse | Reader | Downloads | Details |
|---------|--------|--------|-----------|---------|
| ![Library](docs/src/screenshots/lib_page.jpg) | ![Browse](docs/src/screenshots/browse_page.jpg) | ![Reader](docs/src/screenshots/read_page.jpg) | ![Downloads](docs/src/screenshots/downloads_page.jpg) | ![Details](docs/src/screenshots/details_page.jpg) |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 55 + React Native 0.83 (New Architecture) |
| Language | TypeScript 5 |
| Navigation | Expo Router (file-based) |
| Styling | NativeWind v4 + Tailwind CSS v3 |
| Animations | Reanimated 4 + Gesture Handler |
| Database | expo-sqlite + Drizzle ORM |
| State | Zustand v5 (persisted with AsyncStorage) |
| Data fetching | TanStack Query v5 |
| Extension bridge | Custom Kotlin Expo Module (`modules/extension-bridge`) |
| Build | EAS Build — direct APK distribution |

## Getting Started

### Requirements

- Node.js 20+
- JDK 21 (via SDKMAN or similar)
- Android device or emulator

### Setup

```sh
# Install dependencies and fix Expo version constraints
make setup

# Run on Android
make android
```

Or without Make:

```sh
npm install
npx expo run:android
```

### All Make targets

```
make setup        Install deps, fix Expo versions, check environment
make android      Build and run on Android
make ios          Build and run on iOS simulator
make release      Trigger EAS production build
make prebuild     Generate native project files (expo prebuild)
make lint         Run ESLint + TypeScript type check
make test         Run Jest test suite
make clean        Clear all caches, node_modules, and build artifacts
make update-deps  Fix Expo version constraints + show outdated packages
```

## Project Structure

```
app/                    Expo Router screens
  (tabs)/library/       Library grid
  (tabs)/browse/        Source list + browse screen
  (tabs)/updates/       New chapters feed
  (tabs)/history/       Reading history
  (tabs)/more/          Extensions, Downloads, Settings
  manga/[mangaId]/      Manga detail + reader
modules/
  extension-bridge/     Kotlin native module — loads Tachiyomi APK extensions
src/
  db/                   Drizzle schema, migrations, client
  stores/               Zustand stores (reader, downloads, settings)
  types/                Tachiyomi extension type contracts
  theme/                Colors, typography, spacing
docs/                   Astro documentation site
```

## Extension Support

Atahon loads Mihon/Tachiyomi extension APKs natively via a Kotlin bridge module. Extensions are stored privately on-device and loaded with a `ChildFirstPathClassLoader` that matches Mihon's exact implementation, ensuring full ecosystem compatibility.

Default extension repository: [Keiyoushi](https://raw.githubusercontent.com/keiyoushi/extensions/repo)

## Building for Release

Atahon uses [EAS Build](https://expo.dev/eas) for production APKs and distributes them directly — no Google Play.

```sh
make release
# or
eas build --platform android --profile production
```

## Contributing

Issues and pull requests are welcome. The `android/` and `ios/` directories are gitignored and regenerated via `expo prebuild`.

## License

MIT
