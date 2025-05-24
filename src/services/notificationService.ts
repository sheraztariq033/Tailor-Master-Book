import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { Alert, Platform } from 'react-native';
import { t } from 'i18next'; // Assuming i18next is initialized and t can be imported directly

// --- Permission ---
export const requestUserPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'ios') {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Notification Authorization status (iOS):', authStatus);
      return true;
    }
    console.log('Notification Authorization status (iOS) - Denied:', authStatus);
    return false;
  } else { // Android
    // Android does not require explicit permission for FCM for API level 32 and below.
    // For API level 33+ (Android 13+), POST_NOTIFICATIONS permission is needed.
    // react-native-firebase handles this automatically if specified in AndroidManifest.xml
    // For now, we assume permissions are handled or not strictly required for basic FCM.
    // A more robust solution would use PermissionsAndroid for Android 13+.
    const enabled = messaging().isDeviceRegisteredForRemoteMessages;
    console.log('Notification status (Android): Registered for remote messages =', enabled);
    return enabled; // Or true if you assume setup is correct
  }
};

// --- FCM Token ---
export const getFCMToken = async (): Promise<string | null> => {
  try {
    // Check if saved token exists and is still valid (optional, for optimization)
    // const savedToken = await AsyncStorage.getItem('fcmToken');
    // if (savedToken) return savedToken;

    const token = await messaging().getToken();
    if (token) {
      console.log('FCM Token:', token);
      // await AsyncStorage.setItem('fcmToken', token); // Save new token
      return token;
    }
    console.warn('Failed to get FCM token.');
    return null;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

// --- Foreground Message Handling ---
export const onMessage = (
    callback: (message: FirebaseMessagingTypes.RemoteMessage) => void
): (() => void) => {
  const unsubscribe = messaging().onMessage(async remoteMessage => {
    console.log('Foreground Message Received:', remoteMessage);
    callback(remoteMessage);
    // Example: Display a simple alert for foreground messages
    // Alert.alert(
    //   remoteMessage.notification?.title || t('notifications.newMessageTitle', 'New Message'),
    //   remoteMessage.notification?.body || t('notifications.newMessageBody', 'You have a new message.'),
    // );
  });
  return unsubscribe;
};

// --- Background/Quit State Notification Opened App ---
export const onNotificationOpenedApp = (
    callback: (message: FirebaseMessagingTypes.RemoteMessage) => void
): (() => void) => {
  const unsubscribe = messaging().onNotificationOpenedApp(remoteMessage => {
    console.log('Notification caused app to open from background state:', remoteMessage);
    if (remoteMessage) {
        callback(remoteMessage);
        // Example: Navigate to a specific screen based on notification data
        // if (remoteMessage.data?.screen) {
        //   navigation.navigate(remoteMessage.data.screen, remoteMessage.data.params);
        // }
    }
  });
  return unsubscribe;
};

// --- Initial Notification (App opened from quit state by notification) ---
export const getInitialNotification = async (): Promise<FirebaseMessagingTypes.RemoteMessage | null> => {
  const remoteMessage = await messaging().getInitialNotification();
  if (remoteMessage) {
    console.log('Notification caused app to open from quit state:', remoteMessage);
  }
  return remoteMessage;
};


// --- Background Message Handler Setup ---
// This function itself doesn't "set up" the handler in the way `index.js` does,
// but it defines the logic that should be used.
// The actual call to messaging().setBackgroundMessageHandler() must be in index.js.
export const backgroundMessageHandler = async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
  console.log('Message handled in the background!', remoteMessage);
  // Here you can handle the message, e.g., by storing it, displaying a local notification (using a different library),
  // or updating some data. This handler must return a promise.
  // For P0, just logging is fine.
};

// --- Placeholder for saving FCM token to backend ---
// This would typically be in authService.ts or a dedicated userService.ts
// and call a Cloud Function.
export const saveFCMTokenToProfile = async (token: string): Promise<void> => {
    console.log(`(Placeholder) Saving FCM token to user profile: ${token}`);
    // try {
    //   const saveTokenCallable = functions().httpsCallable('saveUserFCMToken'); // Example CF name
    //   await saveTokenCallable({ token });
    //   console.log('FCM token saved to backend successfully.');
    // } catch (error) {
    //   console.error('Error saving FCM token to backend:', error);
    //   // Handle error appropriately (e.g., retry logic, logging)
    // }
};

/*
Conceptual Cloud Function: `saveUserFCMToken`
- Trigger: HTTPS Callable
- Input: `data: { token: string }`, `context: functions.https.CallableContext`
- Action:
  - Verify `context.auth` to ensure user is authenticated.
  - Get `userId` from `context.auth.uid`.
  - Access the user's document in Firestore: `db.collection('users').doc(userId)`.
  - Update the document with the new FCM token. Consider storing tokens in an array if users can have multiple devices.
    Or, have a field like `fcmTokens: admin.firestore.FieldValue.arrayUnion(token)`
    and another field `lastFCMToken: token` for the most recent one.
    Or simply overwrite if only one token per user is needed: `userRef.update({ fcmToken: token, fcmTokenLastUpdated: admin.firestore.FieldValue.serverTimestamp() });`
- Output: `{ success: true }` or `{ success: false, error: string }`
*/
