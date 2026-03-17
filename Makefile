# Atahon — Developer Makefile
# Run `make help` to see all available targets

.DEFAULT_GOAL := help
.PHONY: help setup android ios release clean lint test update-deps prebuild

# Show this help message
help:
	@echo "Atahon build targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

# Install all JS dependencies, fix Expo version constraints, and verify environment
setup: ## Install deps, fix Expo versions, check Node and Java versions
	@echo "→ Checking environment..."
	@node --version | grep -qE 'v2[0-9]' || (echo "⚠ Node.js LTS v20+ recommended"; true)
	@java --version 2>&1 | grep -qE '(17|21|22|23|24|25)' || (echo "⚠ JDK 17+ required for AGP 8.x + Gradle 9 (JDK 21 LTS recommended)"; true)
	@echo "→ Installing JS dependencies..."
	npm install
	@echo "→ Fixing Expo version constraints..."
	npx expo install --fix
	@echo "✓ Setup complete"

# Build and launch on connected Android device or emulator
android: ## Build and run on Android (npx expo run:android)
	npx expo run:android

android-prod:
	cd android && ./gradlew assembleRelease
	adb install -r android/app/build/outputs/apk/release/app-release.apk

# Build and launch on iOS simulator
ios: ## Build and run on iOS simulator
	npx expo run:ios

# Trigger EAS production build for Android
release: ## Trigger EAS production build (eas build --platform android)
	eas build --platform android --profile production

# Generate native Android/iOS project files without building
prebuild: ## Run expo prebuild to generate native project files
	npx expo prebuild --clean

# Clear Metro cache, Gradle cache, node_modules, and build artifacts
clean: ## Clear all caches, node_modules, and build artifacts
	@echo "→ Clearing Metro bundler cache..."
	npx expo start --clear --non-interactive &
	@sleep 2 && kill %1 2>/dev/null; true
	@echo "→ Clearing node_modules..."
	rm -rf node_modules
	@echo "→ Clearing Gradle build cache..."
	rm -rf android/.gradle android/build android/app/build 2>/dev/null; true
	@echo "→ Clearing iOS build artifacts..."
	rm -rf ios/build ios/Pods 2>/dev/null; true
	@echo "→ Clearing Expo .cache..."
	rm -rf .expo 2>/dev/null; true
	@echo "✓ Clean complete — run 'make setup' to reinstall"

# Run ESLint and TypeScript type check
lint: ## Run ESLint + TypeScript type check
	npx eslint . --ext .ts,.tsx
	npx tsc --noEmit

# Run the test suite
test: ## Run Jest test suite
	npx jest --passWithNoTests

# Update Expo-managed deps to latest compatible versions
update-deps: ## Run expo install --fix and show outdated packages
	@echo "→ Fixing Expo version constraints..."
	npx expo install --fix
	@echo "→ Outdated packages:"
	npm outdated || true
