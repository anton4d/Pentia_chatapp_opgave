import { getStorage, ref, putFile, getDownloadURL } from '@react-native-firebase/storage';
import { getApp } from '@react-native-firebase/app';

const storage = getStorage(getApp());

export const StorageManager = {
  /**
   * Upload a local file to Firebase Storage
   * @param localPath string path to local file
   * @param filename string name to save in Storage
   * @returns public URL to the uploaded file
   */
  async uploadFile(localPath: string, filename: string) {
    try {
      const storageRef = ref(storage, `chat_images/${filename}`);
      // Pass the path as a string, not an object
      await putFile(storageRef, localPath);
      const url = await getDownloadURL(storageRef);
      return url;
    } catch (err) {
      console.error('Upload failed:', err);
      throw err;
    }
  },

  /**
   * Get a download URL for an existing file
   * @param filename string name of file in storage
   * @returns URL
   */
  async getFileUrl(filename: string) {
    try {
      const storageRef = ref(storage, `chat_images/${filename}`);
      const url = await getDownloadURL(storageRef);
      return url;
    } catch (err) {
      console.error('Get file failed:', err);
      throw err;
    }
  },
};
