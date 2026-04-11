# Building Atahon

This document covers building Atahon for development and production.

## Build Environment

### Requirements

- **Node.js:** v20+ (LTS recommended)
- **JDK:** 21 (JDK 17+ minimum; AGP 8.12 requires 17+)
- **Android SDK:** API level 24+ (target API 35+)
- **npm:** uses `legacy-peer-deps=true` in `.npmrc`

### Install JDK 21

Via [SDKMAN](https://sdkman.io/):
```sh
curl -s "https://get.sdkman.io" | bash
sdk install java 21.0.2-open
sdk use java 21.0.2-open
```

Verify:
```sh
java --version  # Should show Java 21
javac --version # Should show javac 21
```

### Android SDK

Set `ANDROID_HOME`:
```sh
# macOS / Linux
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools/bin

# Add to ~/.bashrc or ~/.zshrc for persistence
```

Install platform-tools and emulator:
```sh
sdkmanager "platform-tools" "emulators" "platforms;android-35"
```

## Development Build

### Quick Start

```sh
# Install dependencies
make setup

# Build and run on connected device or emulator
make android
```

### Detailed Steps

1. **Install dependencies:**
   ```sh
   npm install
   ```

2. **Fix Expo version constraints:**
   ```sh
   npx expo install --fix
   ```

3. **Start Metro bundler** (optional, for debugging):
   ```sh
   npx expo start
   ```

4. **Build and run on Android:**
   ```sh
   npx expo run:android
   ```

### Rebuilding Native Code

If you modify Kotlin code in `modules/extension-bridge/` or change native dependencies:

```sh
# Regenerate android/ directory
npx expo prebuild --clean

# Then rebuild
make android
```

### Clearing Caches

If you encounter build issues:

```sh
# Clear all caches (recommended)
make clean

# Or individual steps
npx expo start --clear          # Metro cache
rm -rf node_modules && npm i    # Dependencies
rm -rf android/.gradle android/build  # Gradle cache
```

## Release Build (Android APK)

### Local Release Build

Build a release APK locally without EAS:

```sh
# Build release APK
make android-prod

# Or manually:
cd android && ./gradlew assembleRelease
```

APK location: `android/app/build/outputs/apk/release/app-release.apk`

Install on device:
```sh
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

### Production Build (EAS)

Atahon uses [EAS Build](https://expo.dev/eas) for production distribution.

#### Setup EAS (one-time)

```sh
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Initialize EAS project
eas build:configure
```

#### Build for Release

```sh
# Trigger production build
make release

# Or:
eas build --platform android --profile production
```

The APK is available on EAS dashboard for download and distribution.

## Build Profiles

EAS is configured via `eas.json`:

- **preview** — Debug build with Expo dev client
- **production** — Release build (optimized, code minified)

## Gradle Configuration

Key Gradle settings in `android/build.gradle.kts`:

```gradle
android {
    compileSdk = 35
    defaultConfig {
        minSdk = 24
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
```

### Common Gradle Issues

**Issue:** `Unable to find a matching variant`
- **Solution:** Ensure JDK version is 17+: `java --version`

**Issue:** `Gradle sync failed — SDK location not found`
- **Solution:** Set `ANDROID_HOME` and run `sdkmanager` to install platforms

**Issue:** `Task failed with an exception` during `expo run:android`
- **Solution:** Run `make clean` and retry

## Testing the Build

### Quick Validation

```sh
# Type checking
npx tsc --noEmit

# Linting
make lint

# Unit tests
make test
```

### Manual Testing

After building:

1. **Test on device/emulator:**
   ```sh
   adb devices  # List connected devices
   make android # Run on connected device
   ```

2. **Test core features:**
   - Library: Add manga, browse sources
   - Reader: Open chapter, test gestures and settings
   - Downloads: Queue and download chapter
   - Settings: Change theme, reader settings
   - Extensions: Install and load extension APK

## Troubleshooting

### Metro Bundler Issues

```sh
# Clear and restart bundler
npx expo start --clear
```

### Java/Gradle Issues

```sh
# Check Java version
java --version
javac --version

# Use correct JDK if multiple installed
export JAVA_HOME=$HOME/.sdkman/candidates/java/21.0.2-open
```

### Native Module Issues

```sh
# Rebuild with clean prebuild
npx expo prebuild --clean
make android
```

### Emulator Issues

```sh
# List emulators
emulator -list-avds

# Launch emulator
emulator -avd Pixel_4_API_35

# Kill stuck emulator
adb emu kill
```

## Performance Optimization

### Build Speed

- **Parallel builds:** Gradle uses parallel compilation by default
- **Daemon:** Gradle daemon speeds up subsequent builds (auto-enabled)
- **Incremental compilation:** Only recompile changed files

### APK Size

Debug APK: ~201 MB (typical for Expo + new architecture)
Release APK: ~100 MB after minification and optimization

## CI/CD

The project uses GitHub Actions for CI. See `.github/workflows/` for current setup.

Typical CI flow:
1. `npm install` + `npx expo install --fix`
2. `make lint` (ESLint + TypeScript)
3. `make test` (Jest)
4. `make build-prod` (Gradle assembleRelease)

## Distribution

### GitHub Releases

APKs are distributed via [GitHub Releases](https://github.com/diogorainhalopes/atahon/releases):

```sh
# Create release tag
git tag v1.2.3
git push origin v1.2.3

# Upload APK to release manually or via CI
```

### Direct APK Distribution

Users can download and install APKs directly:

```sh
adb install atahon-v1.2.3.apk
```

## Notes

- `android/` and `ios/` directories are gitignored — regenerated by `expo prebuild`
- Build artifacts in `android/build/` can be safely deleted
- Node modules in `docs/` are separate from main app (Astro docs site)
- React Native New Architecture is **enabled** (Hermes + bridgeless mode)

## See Also

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Build Guide](https://reactnative.dev/docs/building-from-source)
- [Android Gradle Plugin Guide](https://developer.android.com/build)
