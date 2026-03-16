import { useEffect } from 'react';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

const READER_TAG = 'reader';

export function useKeepScreenOn(enabled: boolean) {
  useEffect(() => {
    if (enabled) {
      activateKeepAwakeAsync(READER_TAG).catch(() => {});
    } else {
      deactivateKeepAwake(READER_TAG);
    }
    return () => {
      deactivateKeepAwake(READER_TAG);
    };
  }, [enabled]);
}
