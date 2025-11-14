import { Linking } from 'react-native';
import React from 'react';
import { getMessaging, getInitialNotification, onNotificationOpenedApp } from '@react-native-firebase/messaging';
import type { NavigationContainerRef } from '@react-navigation/native';

/**
 * Reference to the root navigation container
 */
export const navigationRef = React.createRef<NavigationContainerRef>();

/**
 * Helper function to build a deep link URL from notification data
 * @param data object containing notification data
 * @returns string | null deep link URL or null if it cannot be built
 */
function buildDeepLinkFromNotificationData(data: any): string | null {
  if (data?.roomId) {
    return `myapp://chat/${data.roomId}`;
  }
  if (data?.navigationId === 'chatRooms') {
    return 'myapp://rooms';
  }
  console.warn('Cannot build deep link, missing roomId or navigationId', data);
  return null;
}

/**
 * Handles app linking and navigation based on notification deep links
 */
export const NOTIFICATION_LINKING = {
  /**
   * URL prefixes handled by the app
   */
  prefixes: ['myapp://'],

  /**
   * Deep link configuration for navigation
   */
  config: {
    screens: {
      ChatRoom: 'chat/:roomId',
      'Chat rooms': 'rooms',
    },
  },

  /**
   * Get the initial URL that opened the app, either from Linking or a Firebase notification
   * @returns Promise<string | null> deep link URL or null if handled by navigation
   */
  async getInitialURL(): Promise<string | null> {
    const url = await Linking.getInitialURL();
    if (typeof url === 'string') return url;

    const message = await getInitialNotification(getMessaging());
    console.log('getInitialNotification:', message);

    const roomId = message?.data?.roomId;
    if (roomId && navigationRef.current) {
      // Reset navigation stack to show the chat room
      navigationRef.current.reset({
        index: 1,
        routes: [
          { name: 'Chat rooms' },
          { name: 'ChatRoom', params: { roomId } },
        ],
      });
      return null;
    }

    const deeplinkURL = buildDeepLinkFromNotificationData(message?.data);
    if (typeof deeplinkURL === 'string') return deeplinkURL;

    return null;
  },

  /**
   * Subscribe to URL and notification events
   * @param listener function called with a deep link URL when received
   * @returns () => void unsubscribe function to stop listening
   */
  subscribe(listener: (url: string) => void): () => void {
    // Listen for deep links from Linking
    const onReceiveURL = ({ url }: { url: string }) => listener(url);
    const linkingSubscription = Linking.addEventListener('url', onReceiveURL);

    // Listen for Firebase notifications that open the app
    const unsubscribeFirebase = onNotificationOpenedApp(getMessaging(), remoteMessage => {
      const roomId = remoteMessage?.data?.roomId;

      if (roomId && navigationRef.current) {
        navigationRef.current.reset({
          index: 1,
          routes: [
            { name: 'Chat rooms' },
            { name: 'ChatRoom', params: { roomId } },
          ],
        });
      } else {
        const url = buildDeepLinkFromNotificationData(remoteMessage?.data);
        if (typeof url === 'string') listener(url);
      }

      console.log('onNotificationOpenedApp:', remoteMessage);
    });

    // Return unsubscribe function to clean up listeners
    return () => {
      linkingSubscription.remove();
      unsubscribeFirebase();
    };
  },
};
