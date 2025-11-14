import { Platform, PermissionsAndroid } from 'react-native';
import { getMessaging, subscribeToTopic, unsubscribeFromTopic, onMessage } from '@react-native-firebase/messaging';

export const NOTIFICATIONS = {
  /**
   * Request notification permission for Android 13+
   */
  async requestAndroidPermission() {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        console.warn('Notification permission denied');
      } else {
        console.log('Notification permission granted');
      }
    }
  },

  /**
   * Subscribe to a Firebase topic
   * @param roomId string topic name
   */
  async subscribeToRoom(roomId: string) {
    if (!roomId) {
      console.warn('No roomId provided for subscription');
      return;
    }

    const messaging = getMessaging();
    try {
      await subscribeToTopic(messaging, roomId);
      console.log(`Subscribed to topic: ${roomId}`);
    } catch (err) {
      console.error('Topic subscription error:', err);
    }
  },

  /**
   * Unsubscribe from a Firebase topic
   * @param roomId string topic name
   */
  async unsubscribeFromRoom(roomId: string) {
    if (!roomId) {
      console.warn('No roomId provided for unsubscription');
      return;
    }

    const messaging = getMessaging();
    try {
      await unsubscribeFromTopic(messaging, roomId);
      console.log(`Unsubscribed from topic: ${roomId}`);
    } catch (err) {
      console.error('Topic unsubscription error:', err);
    }
  },

  /**
   * Listen for foreground messages
   * @param callback function called when a message arrives
   * @returns unsubscribe function
   */
  setupForegroundListener(callback: (msg: any) => void) {
    const messaging = getMessaging();
    const unsubscribe = onMessage(messaging, remoteMessage => {
      console.log('Foreground message received:', remoteMessage);
      callback && callback(remoteMessage);
    });
    return unsubscribe;
  },
};
