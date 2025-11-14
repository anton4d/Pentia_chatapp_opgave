// TypeScript version with try/catch and strong typing
// NOTE: This is a skeleton/typesafe version. You must adjust imports/types
// based on your actual project structure.

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { DB } from '../../components/db';
import { StorageManager } from '../../components/storageManager';
import { NOTIFICATIONS } from '../../components/Notification';

interface ChatMessage {
  id: string;
  text: string;
  imageUrl?: string;
  senderId: string;
  senderName?: string;
  senderPhotoURL?: string;
  timestamp: number;
}

interface ChatRoom {
  id: string;
  name: string;
}

interface AuthUser {
  uid: string;
  displayName?: string;
  photoURL?: string;
}

interface ChatRoomScreenProps {
  navigation: any;
  route: any;
  UserAuth: AuthUser;
}

export default function ChatRoomScreen({ navigation, route, UserAuth }: ChatRoomScreenProps) {
  const [room, setRoom] = useState<ChatRoom | null>(route.params?.room ?? null);
  const roomIdFromLink: string | undefined = route.params?.roomId ?? route.params?.room?.id;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');

  const [loadingOlder, setLoadingOlder] = useState<boolean>(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);

  const flatListRef = useRef<FlatList>(null);



  const uploadImage = async (localUri: string, user: AuthUser): Promise<string> => {
    try {
      const filename = `${user.uid}_${Date.now()}.jpg`;
      return await StorageManager.uploadFile(localUri, filename);
    } catch (err) {
      console.error('Image upload failed:', err);
      throw err;
    }
  };



  useEffect(() => {
    if (!room && roomIdFromLink) {
      (async () => {
        try {
          const roomData = await DB.getRoom(roomIdFromLink);
          if (roomData) setRoom(roomData);
        } catch (err) {
          console.error('Failed to fetch room:', err);
        }
      })();
    }
  }, [room, roomIdFromLink]);



  useEffect(() => {
    if (!room || !UserAuth) return;

    const loadSetting = async () => {
      try {
        const enabled = await DB.getRoomNotificationSetting(UserAuth.uid, room.id);
        setNotificationsEnabled(!!enabled);
      } catch (err) {
        console.error('Failed to load notification status:', err);
      }
    };
    loadSetting();
  }, [room?.id, UserAuth]);



  useEffect(() => {
    if (!room) return;
    console.log("NOTIFICATION STATE = ", notificationsEnabled);
    navigation.setOptions({
      title: room.name,
      headerRight: () => (
        <TouchableOpacity
          onPress={async () => {
            try {
              const newState = !notificationsEnabled;
              setNotificationsEnabled(newState);

              await DB.setRoomNotifications(UserAuth.uid, room.id, newState);

              if (newState) {
                await NOTIFICATIONS.subscribeToRoom(room.id);
              } else {
                await NOTIFICATIONS.unsubscribeFromRoom(room.id);
              }
            } catch (err) {
              console.error('Failed to toggle notifications:', err);
            }
          }}
          style={{ marginRight: 12 }}
        >
          <Text style={{ fontSize: 22, color: notificationsEnabled ? 'gold' : '#999' }}>Bell</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, room, notificationsEnabled]);



  useEffect(() => {
    if (!room) return;

    const unsub = DB.subscribeToMessages(
      room.id,
      (msg: ChatMessage) => setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]),
      (msg: ChatMessage) => setMessages(prev => prev.map(m => m.id === msg.id ? msg : m)),
      (removedId: string) => setMessages(prev => prev.filter(m => m.id !== removedId)),
    );

    return unsub;
  }, [room?.id]);



  const handleFirstMessage = async (): Promise<void> => {
    try {
      const firstTime = await DB.markFirstMessageInRoom(UserAuth, room!.id);
      if (!firstTime) return;

      Alert.alert(
        'Notifications',
        'Do you want to be notified when new messages arrive in this room?',
        [
          { text: 'No' },
          {
            text: 'Yes',
            onPress: async () => {
              try {
                setNotificationsEnabled(true);
                await DB.setRoomNotifications(UserAuth.uid, room!.id, true);
                await NOTIFICATIONS.subscribeToRoom(room!.id);
              } catch (err) {
                console.error('Failed to enable notifications:', err);
              }
            },
          },
        ]
      );
    } catch (err) {
      console.error('Failed first-message logic:', err);
    }
  };



  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await handleFirstMessage();
      await DB.sendMessage(room!.id, newMessage, UserAuth);

      setNewMessage('');
      scrollToBottom();
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };



  const sendImageMessage = async () => {
    try {
      const result = await launchImageLibrary({ mediaType: 'photo' });
      if (!result.assets || result.assets.length === 0) return;

      await handleFirstMessage();

      const localUri = result.assets[0].uri;
      const url = await uploadImage(localUri!, UserAuth);

      await DB.sendMessage(room!.id, '', UserAuth, url);
      scrollToBottom();
    } catch (err) {
      console.error('Failed to send image message:', err);
    }
  };



  const scrollToBottom = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };



  const loadOlderMessages = async () => {
    if (loadingOlder || messages.length === 0) return;
    setLoadingOlder(true);

    try {
      const oldest = messages[0].timestamp;
      const older = await DB.fetchMessages(room!.id, 50, oldest);

      setMessages(prev => {
        const filtered = older.filter(o => !prev.some(m => m.id === o.id));
        return [...filtered, ...prev];
      });
    } catch (err) {
      console.error('Failed to load older messages:', err);
    } finally {
      setLoadingOlder(false);
    }
  };



  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    const isMine = item.senderId === UserAuth.uid;

    return (
      <View style={[styles.messageRow, isMine ? styles.myMessageRow : styles.otherMessageRow]}>
        {!isMine && item.senderPhotoURL && (
          <Image source={{ uri: item.senderPhotoURL }} style={styles.avatar} />
        )}

        <View style={[styles.messageBubble, isMine ? styles.myMessageBubble : styles.otherMessageBubble]}>
          {!isMine && item.senderName && <Text style={styles.senderName}>{item.senderName}</Text>}
          <Text style={styles.messageText}>{item.text}</Text>

          {item.imageUrl && (
            <Image
              source={{ uri: item.imageUrl }}
              style={{ width: 200, height: 200, borderRadius: 10, marginTop: 5 }}
            />
          )}

          <Text style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };


  if (!room) return <Text>Loading room...</Text>;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={{ flex: 1 }}>
        <FlatList
          ref={flatListRef}
          data={[...messages].reverse()}
          inverted
          renderItem={renderMessageItem}
          keyExtractor={item => item.id}
          onEndReached={loadOlderMessages}
          onEndReachedThreshold={0.1}
        />

        <View style={styles.inputContainer}>
          <TouchableOpacity onPress={sendImageMessage} style={{ justifyContent: 'center', paddingHorizontal: 8 }}>
            <Text style={{ fontSize: 24 }}>📎</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={newMessage}
            onChangeText={setNewMessage}
            onSubmitEditing={sendMessage}
            blurOnSubmit={false}
            returnKeyType="send"
          />

          <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}


// -------- STYLES -------- //
const styles = StyleSheet.create({
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 4,
    paddingHorizontal: 10,
  },
  myMessageRow: { justifyContent: 'flex-end' },
  otherMessageRow: { justifyContent: 'flex-start' },

  messageBubble: {
    maxWidth: '80%',
    borderRadius: 10,
    padding: 10,
  },
  myMessageBubble: { backgroundColor: '#DCF8C6' },
  otherMessageBubble: { backgroundColor: '#ECECEC' },

  avatar: { width: 32, height: 32, borderRadius: 16, marginRight: 8 },

  senderName: { fontSize: 12, fontWeight: 'bold', marginBottom: 2 },
  messageText: { fontSize: 16 },
  timestamp: { fontSize: 10, color: '#999', marginTop: 2, alignSelf: 'flex-end' },

  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    borderTopWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },

  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 10,
  },

  sendButton: { justifyContent: 'center', paddingHorizontal: 12 },
  sendButtonText: { color: '#007AFF', fontWeight: 'bold' },
});
