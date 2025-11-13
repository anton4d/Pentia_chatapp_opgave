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

export default function ChatRoomScreen({ navigation, route, UserAuth }) {
  const { room } = route.params;


  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingOlder, setLoadingOlder] = useState(false);
  const flatListRef = useRef();


  const loadMessages = async (olderThan = null) => {
    const msgs = await DB.fetchMessages(room.id, 50, olderThan);
    if (olderThan) {
      setMessages(prev => [...msgs, ...prev]);
    } else {
      setMessages(msgs);
    }
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
    await loadMessages();
    setTimeout(() => scrollToBottom(), 100);
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  const loadOlderMessages = async () => {
    if (loadingOlder || messages.length === 0) return;
    setLoadingOlder(true);
    const oldestTimestamp = messages[0].timestamp;
    await loadMessages(oldestTimestamp);
    setLoadingOlder(false);
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
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessageItem}
          contentContainerStyle={{ paddingVertical: 10 }}
          onLayout={scrollToBottom}
          onEndReachedThreshold={0.1}
          onEndReached={loadOlderMessages}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={newMessage}
            onChangeText={setNewMessage}
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
