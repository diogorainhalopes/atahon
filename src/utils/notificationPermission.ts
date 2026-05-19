import { Platform, PermissionsAndroid } from 'react-native';

/** Returns true if POST_NOTIFICATIONS is needed and not yet granted. */
export async function needsNotificationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android' || Platform.Version < 33) return false;
  const granted = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  );
  return !granted;
}

/** Triggers the system POST_NOTIFICATIONS permission dialog. */
export async function requestNotificationPermission(): Promise<void> {
  if (Platform.OS !== 'android' || Platform.Version < 33) return;
  await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
}
