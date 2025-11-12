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
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [initializing, setInitializing] = useState<boolean>(true);
  const [splashDone, setSplashDone] = useState<boolean>(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
          setUser(firebaseUser);
          setInitializing(false);

          if (firebaseUser) {
            console.log('User ID:', firebaseUser.uid);
            console.log('Name:', firebaseUser.displayName);
            console.log('Email:', firebaseUser.email);
            console.log('Photo:', firebaseUser.photoURL);
            console.log(
              'Provider(s):',
              firebaseUser.providerData.map((p) => p.providerId)
            );
          } else {
            console.log('No user signed in.');
          }
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
  UserAuth: FirebaseUser | null;
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
