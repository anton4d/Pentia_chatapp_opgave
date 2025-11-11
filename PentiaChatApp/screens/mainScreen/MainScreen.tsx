import { NewAppScreen } from '@react-native/new-app-screen';
import BootSplash from "react-native-bootsplash";
import { StatusBar, StyleSheet, useColorScheme, View,Text } from 'react-native';
import { useEffect } from "react";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

function MainScreen() {
  const isDarkMode = useColorScheme() === 'dark';
    useEffect(() => {
    const init = async () => {
        //await new Promise(resolve => setTimeout(resolve, 3000));
    };

    init().finally(async () => {
      await BootSplash.hide({ fade: true });
      console.log("BootSplash has been hidden successfully");
    });
  }, []);
  return (
    <>
        <SafeAreaProvider style={{
        flex: 1,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
        }}>
          <Text>Mainscreen</Text>
        </SafeAreaProvider>
    </>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default MainScreen;