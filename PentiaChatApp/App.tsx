/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { NewAppScreen } from '@react-native/new-app-screen';
import BootSplash from "react-native-bootsplash";
import { StatusBar, StyleSheet, useColorScheme, View,Text} from 'react-native';
import { useState,useEffect,useRef } from "react";
import { SafeAreaProvider,  useSafeAreaInsets} from 'react-native-safe-area-context';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import LoginScreen from "./screens/loginScreen/LoginScreen"
import MainScreen from "./screens/mainScreen/MainScreen"
import AnimatedSplash from "./components/animatedSplash/AnimatedSplash"


function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [user, setUser] = useState();
  const [initializing, setInitializing] = useState(true);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setInitializing(false);
    });
    const timer = setTimeout(() => setSplashDone(true), 1000);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  if (initializing || !splashDone) {
    // Hide native splash immediately when React mounts, then show animated splash
    BootSplash.hide({ fade: true });
    return <AnimatedSplash />;
  }

  return (
    <>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <SafeAreaProvider
        style={{
          flex: 1,
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
        }}
      >
        <AppContent UserAuth={user} />
      </SafeAreaProvider>
    </>
  );
}

type AppProps = {
  UserAuth: user;
};
function AppContent(props: AppProps) {
  const safeAreaInsets = useSafeAreaInsets();

  if (!props.UserAuth) {
      return (
          <LoginScreen/>

      );
    }

    return (
        <MainScreen/>

    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
