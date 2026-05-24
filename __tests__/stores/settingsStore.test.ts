import { useSettingsStore } from '../../src/stores/settingsStore';

// Mock extension-bridge
jest.mock('extension-bridge', () => ({
  __esModule: true,
  default: {
    scheduleLibraryUpdate: jest.fn().mockResolvedValue(undefined),
    cancelLibraryUpdate: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import ExtensionBridge from 'extension-bridge';

const mockSchedule = ExtensionBridge.scheduleLibraryUpdate as jest.Mock;
const mockCancel = ExtensionBridge.cancelLibraryUpdate as jest.Mock;

describe('settingsStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the store to initial state
    useSettingsStore.setState({
      libraryUpdateInterval: 12,
    });
  });

  describe('setLibraryUpdateInterval', () => {
    it('updates the store state with the new interval', () => {
      useSettingsStore.getState().setLibraryUpdateInterval(24);
      expect(useSettingsStore.getState().libraryUpdateInterval).toBe(24);
    });

    it('calls scheduleLibraryUpdate on the bridge when hours > 0', async () => {
      useSettingsStore.getState().setLibraryUpdateInterval(12);
      // Let microtasks flush
      await Promise.resolve();
      expect(mockSchedule).toHaveBeenCalledWith(12);
      expect(mockCancel).not.toHaveBeenCalled();
    });

    it('calls cancelLibraryUpdate on the bridge when hours is 0', async () => {
      useSettingsStore.getState().setLibraryUpdateInterval(0);
      await Promise.resolve();
      expect(mockCancel).toHaveBeenCalled();
      expect(mockSchedule).not.toHaveBeenCalled();
    });

    it('updates state to 0 (manual only)', () => {
      useSettingsStore.getState().setLibraryUpdateInterval(0);
      expect(useSettingsStore.getState().libraryUpdateInterval).toBe(0);
    });

    it('uses the provided hours value when scheduling', async () => {
      useSettingsStore.getState().setLibraryUpdateInterval(6);
      await Promise.resolve();
      expect(mockSchedule).toHaveBeenCalledWith(6);
    });
  });
});
