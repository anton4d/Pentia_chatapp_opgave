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

const DATABASE_URL = 'https://pentiaopgavechatapp-default-rtdb.europe-west1.firebasedatabase.app/';
const db = getDatabase(undefined, DATABASE_URL);

export const DB = {
  async fetchChatRooms() {
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

  async fetchMessages(roomId, limit = 50, endTimestamp = null) {
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

    return Object.keys(data).map(key => ({
      id: key,
      text: data[key].text,
      timestamp: data[key].timestamp,
      senderId: data[key].senderId,
      senderName: data[key].senderName,
      senderPhotoURL: data[key].senderPhotoURL,
    }));
  },

  async sendMessage(roomId, text, UserAuth) {
    const timestamp = Date.now();

    await push(ref(db, `/messages/${roomId}`), {
      text,
      timestamp,
      senderId: UserAuth.uid,
      senderName: UserAuth.displayName,
      senderPhotoURL: UserAuth.photoURL,
    });

    await update(ref(db, `/chatrooms/${roomId}`), {
      lastMessageTimestamp: timestamp,
    });
  },


  subscribeToMessages(roomId, onMessageAdded, onMessageChanged, onMessageRemoved) {
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
      onMessageRemoved && onMessageRemoved(snapshot.key);
    });

    return () => {
      off(messagesRef, 'child_added', added);
      off(messagesRef, 'child_changed', changed);
      off(messagesRef, 'child_removed', removed);
    };
  },
};
