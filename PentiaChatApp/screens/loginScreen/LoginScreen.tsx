import { NewAppScreen } from '@react-native/new-app-screen';
import BootSplash from "react-native-bootsplash";
import { StatusBar, StyleSheet, useColorScheme, View,Text } from 'react-native';
import { useEffect } from "react";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

function LoginScreen() {
  return (
          <Text>Loginscreen dingy</Text>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default LoginScreen;