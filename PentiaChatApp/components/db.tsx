import {
  getDatabase,
  ref,
  get,
  push,
  query,
  orderByChild,
  limitToLast,
  endAt,
  onChildAdded,
  onChildChanged,
  onChildRemoved,
  off,
  update,
  set,
} from '@react-native-firebase/database';

// URL for the Firebase Realtime Database
const DATABASE_URL = 'https://pentiaopgavechatapp-default-rtdb.europe-west1.firebasedatabase.app/';
// Initialize the database instance
const db = getDatabase(undefined, DATABASE_URL);

interface User {
  uid: string;
  displayName: string;
  photoURL: string | null;
}

interface Message {
  id: string;
  text: string;
  timestamp: number;
  senderId: string;
  senderName: string;
  senderPhotoURL: string | null;
  imageUrl?: string | null;
}

interface ChatRoom {
  id: string;
  name?: string;
  description?: string;
  lastMessageTimestamp?: number;
}

export const DB = {
  /**
   * Fetch all chat rooms from the database
   * @returns Promise<ChatRoom[]> array of chat rooms with id, lastMessageTimestamp, etc.
   */
  async fetchChatRooms(): Promise<ChatRoom[]> {
    const snapshot = await get(ref(db, '/chatrooms'));
    const data = snapshot.val();
    if (!data) return [];

    const roomsArray = Object.keys(data).map(key => ({
      id: key,
      ...data[key],
    }));

    roomsArray.sort((a, b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0));

    return roomsArray;
  },

  /**
   * Fast fetch a single chat room by ID
   * @param roomId string ID of the chat room
   * @returns Promise<ChatRoom | null> ChatRoom object or null if not found
   */
  async getRoom(roomId: string): Promise<ChatRoom | null> {
    try {
      const snapshot = await get(ref(db, `/chatrooms/${roomId}`));
      const data = snapshot.val();
      if (!data) return null;
      return { id: roomId, ...data };
    } catch (err) {
      console.error('Failed to fetch room', err);
      return null;
    }
  },

  /**
   * Fetch messages from a specific chat room
   * @param roomId string ID of the chat room
   * @param limit number max number of messages to fetch (default 50)
   * @param endTimestamp number fetch messages older than this timestamp (optional)
   * @returns Promise<Message[]> array of messages with id, text, timestamp, sender info
   */
  async fetchMessages(roomId: string, limit = 50, endTimestamp: number | null = null): Promise<Message[]> {
    let messagesRef = query(
      ref(db, `/messages/${roomId}`),
      orderByChild('timestamp'),
      limitToLast(limit)
    );

    if (endTimestamp) {
      messagesRef = query(
        ref(db, `/messages/${roomId}`),
        orderByChild('timestamp'),
        endAt(endTimestamp - 1),
        limitToLast(limit)
      );
    }

    const snapshot = await get(messagesRef);
    const data = snapshot.val();
    if (!data) return [];

    const messagesArray = Object.keys(data).map(key => ({
      id: key,
      text: data[key].text,
      timestamp: data[key].timestamp,
      senderId: data[key].senderId,
      senderName: data[key].senderName,
      senderPhotoURL: data[key].senderPhotoURL,
    }));

    messagesArray.sort((a, b) => a.timestamp - b.timestamp);

    return messagesArray;
  },

  /**
   * Send a message to a chat room
   * @param roomId string ID of the chat room
   * @param text string message text
   * @param user User object containing user info (uid, displayName, photoURL)
   * @param imageUrl string optional URL of image to include
   */
  async sendMessage(roomId: string, text: string, user: User, imageUrl: string | null = null): Promise<void> {
    const timestamp = Date.now();
    await push(ref(db, `/messages/${roomId}`), {
      text: text || '',
      imageUrl,
      timestamp,
      senderId: user.uid,
      senderName: user.displayName,
      senderPhotoURL: user.photoURL,
    });

    await update(ref(db, `/chatrooms/${roomId}`), { lastMessageTimestamp: timestamp });
  },

  /**
   * Create a user in the database if they do not already exist
   * @param user User object containing uid, displayName, photoURL
   */
  async createUserIfNotExists(user: User): Promise<void> {
    if (!user?.uid) {
      console.warn('No UID provided for creating user');
      return;
    }
    const userRef = ref(db, `/users/${user.uid}`);
    try {
      const snapshot = await get(userRef);
      if (!snapshot.exists()) {
        await set(userRef, {
          displayName: user.displayName || 'Unknown',
          photoURL: user.photoURL || null,
          createdAt: Date.now(),
          rooms: {},
        });
        console.log(`User ${user.uid} created successfully`);
      } else {
        console.log(`User ${user.uid} already exists`);
      }
    } catch (err) {
      console.error('Failed to create user:', err);
    }
  },

  /**
   * Get the notification setting for a user in a specific chat room
   * @param userId string UID of the user
   * @param roomId string ID of the chat room
   * @returns Promise<boolean> true if notifications are enabled, false otherwise
   */
  async getRoomNotificationSetting(userId: string, roomId: string): Promise<boolean> {
    try {
      const snapshot = await get(ref(db, `/users/${userId}/rooms/${roomId}/notificationsEnabled`));
      return snapshot.exists() ? snapshot.val() === true : false;
    } catch (err) {
      console.error("Failed to load notification status:", err);
      return false;
    }
  },

  /**
   * Mark that a user has sent their first message in a room
   * @param user User object
   * @param roomId string ID of the chat room
   * @returns Promise<boolean> true if this was the first message, false otherwise
   */
  async markFirstMessageInRoom(user: User, roomId: string): Promise<boolean> {
    const userRoomRef = ref(db, `/users/${user.uid}/rooms/${roomId}`);
    const snapshot = await get(userRoomRef);
    const data = snapshot.val();

    if (!data?.hasSentMessage) {
      await update(userRoomRef, { hasSentMessage: true });
      return true;
    }
    return false;
  },

  /**
   * Set whether a user wants notifications for a specific room
   * @param userId string UID of the user
   * @param roomId string ID of the chat room
   * @param enabled boolean true to enable, false to disable
   */
  async setRoomNotifications(userId: string, roomId: string, enabled: boolean): Promise<void> {
    if (!userId || !roomId) {
      console.warn('Missing userId or roomId for setting notifications');
      return;
    }

    const userRoomRef = ref(db, `/users/${userId}/rooms/${roomId}`);
    try {
      await update(userRoomRef, { notificationsEnabled: enabled });
      console.log(`Notifications for user ${userId} in room ${roomId} set to ${enabled}`);
    } catch (err) {
      console.error('Failed to update notifications:', err);
    }
  },

  /**
   * Subscribe to real-time updates for messages in a room
   * @param roomId string ID of the chat room
   * @param onMessageAdded callback for new messages
   * @param onMessageChanged callback for updated messages
   * @param onMessageRemoved callback for removed messages
   * @returns unsubscribe function
   */
  subscribeToMessages(
    roomId: string,
    onMessageAdded?: (msg: Message) => void,
    onMessageChanged?: (msg: Message) => void,
    onMessageRemoved?: (msgId: string) => void
  ): () => void {
    const messagesRef = query(
      ref(db, `/messages/${roomId}`),
      orderByChild('timestamp'),
      limitToLast(50)
    );

    const added = onChildAdded(messagesRef, snapshot => {
      const msg = { id: snapshot.key, ...snapshot.val() };
      onMessageAdded && onMessageAdded(msg);
    });

    const changed = onChildChanged(messagesRef, snapshot => {
      const msg = { id: snapshot.key, ...snapshot.val() };
      onMessageChanged && onMessageChanged(msg);
    });

    const removed = onChildRemoved(messagesRef, snapshot => {
      onMessageRemoved && onMessageRemoved(snapshot.key!);
    });

    return () => {
      added();
      changed();
      removed();
    };
  },
};
