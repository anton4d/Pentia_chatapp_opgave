import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { DB } from '../../components/db';


export default function ChatRoomsScreen({  navigation, route, UserAuth }) {
  const [chatRooms, setChatRooms] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadRooms = async () => {
    try {
      const rooms = await DB.fetchChatRooms();
      setChatRooms(rooms);
    } catch (err) {
      console.error('Error loading chat rooms:', err);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRooms();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {chatRooms.map(room => (
        <TouchableOpacity
          key={room.id}
          style={styles.roomItem}
          onPress={() => navigation.navigate('ChatRoom', { room })}
        >
          <View style={styles.roomRow}>
            <View>
              <Text style={styles.roomName}>{room.name}</Text>
              {room.description && (
                <Text style={styles.roomDescription}>{room.description}</Text>
              )}
              {room.lastMessageTimestamp && (
                <Text style={styles.timestamp}>
                  {new Date(room.lastMessageTimestamp).toLocaleString()}
                </Text>
              )}
            </View>


            <MaterialDesignIcons name="chevron-right" size={24} color="#999" />
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  roomItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  roomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomName: { fontSize: 18, fontWeight: 'bold' },
  roomDescription: { fontSize: 14, color: '#666', marginTop: 2 },
  timestamp: { fontSize: 12, color: '#999', marginTop: 4 },
});
