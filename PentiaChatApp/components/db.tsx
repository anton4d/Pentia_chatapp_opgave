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
   * @returns array of chat rooms with id, lastMessageTimestamp, etc.
   */
  async fetchChatRooms() {
    // Get a snapshot of the /chatrooms node
    const snapshot = await get(ref(db, '/chatrooms'));
    const data = snapshot.val();
    if (!data) return [];

    // Convert the object to an array with id included
    const roomsArray = Object.keys(data).map(key => ({
      id: key,
      ...data[key],
    }));

    // Sort by lastMessageTimestamp descending
    roomsArray.sort((a, b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0));

    return roomsArray;
  },

  /**
   * Fetch messages from a specific chat room
   * @param roomId string ID of the chat room
   * @param limit number max number of messages to fetch (default 50)
   * @param endTimestamp number fetch messages older than this timestamp (optional)
   * @returns array of messages with id, text, timestamp, sender info
   */
  async fetchMessages(roomId: string, limit = 50, endTimestamp: number | null = null): Promise<Message[]> {
    // Base query: order messages by timestamp, limit to last `limit` messages
    let messagesRef = query(
      ref(db, `/messages/${roomId}`),
      orderByChild('timestamp'),
      limitToLast(limit)
    );

    // If an endTimestamp is provided, fetch messages older than that
    if (endTimestamp) {
      messagesRef = query(
        ref(db, `/messages/${roomId}`),
        orderByChild('timestamp'),
        endAt(endTimestamp - 1),
        limitToLast(limit)
      );
    }

    // Execute the query and get data
    const snapshot = await get(messagesRef);
    const data = snapshot.val();
    if (!data) return [];

    // Convert object to array with id included
    const messagesArray= Object.keys(data).map(key => ({
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
   * @param User object containing user info (uid, displayName, photoURL)
   * @param imageUrl string optional URL of image to include
   */
  async sendMessage(roomId: string, text: string, user: User, imageUrl: string | null = null): Promise<void> {
    const timestamp = Date.now();
    // Push new message to /messages/<roomId>
    await push(ref(db, `/messages/${roomId}`), {
      text: text || '',
      imageUrl,
      timestamp,
      senderId: user.uid,
      senderName: user.displayName,
      senderPhotoURL: user.photoURL,
    });

    // Update lastMessageTimestamp in the chat room
    await update(ref(db, `/chatrooms/${roomId}`), { lastMessageTimestamp: timestamp });
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
    // Query the last 50 messages ordered by timestamp
    const messagesRef = query(
      ref(db, `/messages/${roomId}`),
      orderByChild('timestamp'),
      limitToLast(50)
    );

    // Listen for new messages
    const added = onChildAdded(messagesRef, snapshot => {
      const msg = { id: snapshot.key, ...snapshot.val() };
      onMessageAdded && onMessageAdded(msg);
    });

    // Listen for changed messages
    const changed = onChildChanged(messagesRef, snapshot => {
      const msg = { id: snapshot.key, ...snapshot.val() };
      onMessageChanged && onMessageChanged(msg);
    });

    // Listen for removed messages
    const removed = onChildRemoved(messagesRef, snapshot => {
      onMessageRemoved && onMessageRemoved(snapshot.key!);
    });

    // Return unsubscribe function
    return () => {
      added();
      changed();
      removed();
    };
  },
};
