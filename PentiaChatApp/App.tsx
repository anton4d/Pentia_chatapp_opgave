/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { NewAppScreen } from '@react-native/new-app-screen';
import BootSplash from "react-native-bootsplash";

import { StatusBar, StyleSheet, useColorScheme, View,Text,Image, PermissionsAndroid, Platform,Linking} from 'react-native';
import { useState,useEffect,useRef } from "react";
import { SafeAreaProvider,  useSafeAreaInsets} from 'react-native-safe-area-context';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer ,NavigationContainerRef} from '@react-navigation/native';
import { HeaderButton } from '@react-navigation/elements';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { Drawer } from 'react-native-drawer-layout';
import { getMessaging, subscribeToTopic, unsubscribeFromTopic, onMessage,getInitialNotification,onNotificationOpenedApp} from '@react-native-firebase/messaging';


import LoginScreen from "./screens/loginScreen/LoginScreen"
import MainScreen from "./screens/mainScreen/MainScreen"
import ChatRoomScreen from "./screens/chatRoomScreen/ChatRoomScreen"
import AnimatedSplash from "./components/animatedSplash/AnimatedSplash"
import SignOut from "./components/SignOutComponnet"
import {NOTIFICATIONS} from "./components/Notification"
import {DB} from "./components/db"
import { NOTIFICATION_LINKING } from './navigation/NotificationLinking';



function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const mess = getMessaging();
    NOTIFICATIONS.setupForegroundListener()
    NOTIFICATIONS.requestAndroidPermission()


    const unsubscribe = onAuthStateChanged(auth, firebaseUser => {
      setUser(firebaseUser);
      setInitializing(false);
      if (firebaseUser) {
          DB.createUserIfNotExists(firebaseUser);
          console.log("try to create user");
       }
    });

    const timer = setTimeout(() => setSplashDone(true), 1000);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const appReady = !initializing && splashDone;

  if (!appReady) {
    BootSplash.hide({ fade: true });
    return <AnimatedSplash />;
  }

  return (
    <>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <SafeAreaProvider>
        <AppContent UserAuth={user} />
      </SafeAreaProvider>
    </>
  );
}

type AppProps = {
  UserAuth: FirebaseUser | null;
};
const Stack = createNativeStackNavigator();



function AppContent(props: AppProps) {
  const isSignedIn = !!props.UserAuth;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!props.UserAuth) {
      setOpen(false);
    }
  }, [props.UserAuth]);

  return (
    <NavigationContainer linking={NOTIFICATION_LINKING}>
      {isSignedIn ? (
        <Drawer
          open={open}
          onOpen={() => setOpen(true)}
          onClose={() => setOpen(false)}
          renderDrawerContent={() => (
            <View style={{
              flex: 1,
              alignItems: "center",
              paddingTop: Platform.OS === 'android'
                ? StatusBar.currentHeight
                : 0,
            }}>
              <Image source={{uri: props.UserAuth.photoURL}} style={{width: 80, height: 80}} />
              <Text>{props.UserAuth.displayName}</Text>
              <Text>{props.UserAuth.email}</Text>
              <SignOut />
            </View>
          )}
        >
          <Stack.Navigator
            initialRouteName="Chat rooms"
            screenOptions={{
              headerRight: () => (
                <HeaderButton
                  accessibilityLabel="Toggle drawer"
                  onPress={() => setOpen(prev => !prev)}
                >
                  <MaterialDesignIcons name="menu" size={24} color="#000" />
                </HeaderButton>
              ),
            }}
          >
            <Stack.Screen
              name="ChatRoom"
              children={(stackProps) => (
                <ChatRoomScreen {...stackProps} UserAuth={props.UserAuth} />
              )}
            />
            <Stack.Screen
              name="Chat rooms"
              children={(stackProps) => (
                <MainScreen {...stackProps} UserAuth={props.UserAuth} />
              )}
            />
          </Stack.Navigator>
        </Drawer>
      ) : (
        <LoginScreen />
      )}
    </NavigationContainer>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
