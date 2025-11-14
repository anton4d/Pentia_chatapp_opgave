import { AppRegistry, Linking } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { setBackgroundMessageHandler, getMessaging } from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType, Notification } from '@notifee/react-native';


async function createDefaultChannel() {
  await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
    importance: AndroidImportance.HIGH,
  });
}
createDefaultChannel();





setBackgroundMessageHandler(getMessaging(), async remoteMessage => {
  console.log('Background message:', remoteMessage);

  const roomId = remoteMessage.data?.roomId ?? '';
  const senderName = remoteMessage.data?.senderName ?? 'Unknown';

  const notification: Notification = {
    title: remoteMessage.notification?.title ?? 'New Message',
    body: remoteMessage.notification?.body ?? `${senderName} sent a message`,
    android: {
      channelId: 'default',
      importance: AndroidImportance.HIGH,
    },
    data: {
      roomId,
    },
  };
});

AppRegistry.registerComponent(appName, () => App);
