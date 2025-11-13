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
} from 'react-native';
import { DB } from '../../components/db';
import { StorageManager } from '../../components/storageManager';
import { launchImageLibrary } from 'react-native-image-picker';
import { v4 as uuidv4 } from 'uuid';



export default function ChatRoomScreen({ navigation, route, UserAuth }) {
  const { room } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingOlder, setLoadingOlder] = useState(false);
  const flatListRef = useRef();

    const uploadImage = async (localUri, UserAuth) => {
      const filename = `${UserAuth.uid}_${Date.now()}.jpg`;
      const url = await StorageManager.uploadFile(localUri, filename);
      return url;
    };


  useEffect(() => {
    navigation.setOptions({ title: room.name });

    const subscribe = DB.subscribeToMessages(
      room.id,
      msg => {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      },
      msg => {
        setMessages(prev => prev.map(m => (m.id === msg.id ? msg : m)));
      },
      removedId => {
        setMessages(prev => prev.filter(m => m.id !== removedId));
      }
    );

    return subscribe;
  }, [room.id]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    await DB.sendMessage(room.id, newMessage, UserAuth);
    setNewMessage('');
    setTimeout(() => scrollToBottom(), 50);
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const loadOlderMessages = async () => {
    if (loadingOlder || messages.length === 0) return;
    setLoadingOlder(true);

    try {
      const oldestTimestamp = messages[0].timestamp;
      const olderMsgs = await DB.fetchMessages(room.id, 50, oldestTimestamp);

      if (olderMsgs.length > 0) {
        setMessages(prev => {
          // Remove any messages that are already in state
          const newOlder = olderMsgs.filter(
            om => !prev.some(m => m.id === om.id)
          );
          return [...newOlder, ...prev];
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingOlder(false);
    }
  };

  const renderMessageItem = ({ item }) => {
    const isMyMessage = item.senderId === UserAuth.uid;
    return (
      <View
        style={[
          styles.messageRow,
          isMyMessage ? styles.myMessageRow : styles.otherMessageRow,
        ]}
      >
        {!isMyMessage && item.senderPhotoURL && (
          <Image source={{ uri: item.senderPhotoURL }} style={styles.avatar} />
        )}

        <View
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
          ]}
        >
          {!isMyMessage && item.senderName && (
            <Text style={styles.senderName}>{item.senderName}</Text>
          )}
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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={{ flex: 1 }}>
       <FlatList
         ref={flatListRef}
         data={[...messages].reverse()} // oldest → newest
         inverted
         renderItem={renderMessageItem}
         keyExtractor={item => item.id}
         onEndReached={loadOlderMessages}
         onEndReachedThreshold={0.1}
       />

        <View style={styles.inputContainer}>
          <TouchableOpacity
            onPress={async () => {
              const result = await launchImageLibrary({ mediaType: 'photo' });
              if (result.assets && result.assets.length > 0) {
                const localUri = result.assets[0].uri;
                const imageUrl = await uploadImage(localUri, UserAuth);
                await DB.sendMessage(room.id, '', UserAuth, imageUrl);
              }
            }}
            style={{ justifyContent: 'center', paddingHorizontal: 8 }}
          >
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
            multiline={false}
          />
          <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

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
  messageText: { fontSize: 16 },
  senderName: { fontSize: 12, fontWeight: 'bold', marginBottom: 2 },
  timestamp: { fontSize: 10, color: '#999', marginTop: 2, alignSelf: 'flex-end' },
  avatar: { width: 32, height: 32, borderRadius: 16, marginRight: 8 },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    borderTopWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 20, paddingHorizontal: 10 },
  sendButton: { justifyContent: 'center', paddingHorizontal: 12 },
  sendButtonText: { color: '#007AFF', fontWeight: 'bold' },
});
