import { NewAppScreen } from '@react-native/new-app-screen';
import BootSplash from "react-native-bootsplash";
import { StatusBar, StyleSheet, useColorScheme, View,Text } from 'react-native';
import { useEffect } from "react";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

function ChatRoomScreen() {
  return (
    <>
        <SafeAreaProvider style={{
        flex: 1,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
        }}>
          <Text>ChatRoomScreen</Text>
        </SafeAreaProvider>
    </>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ChatRoomScreen;