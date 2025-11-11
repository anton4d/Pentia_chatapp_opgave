import { NewAppScreen } from '@react-native/new-app-screen';
import BootSplash from "react-native-bootsplash";
import {  Button, StyleSheet, useColorScheme, View,Text } from 'react-native';
import { useEffect } from "react";
import { GoogleAuthProvider, getAuth, signInWithCredential } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: '948816102637-evq2t8i7k2evv3pgtj2esmisu414e80c.apps.googleusercontent.com',
});
async function onGoogleButtonPress() {BootSplash.hide({ fade: true });
  try {
      await GoogleSignin.hasPlayServices();
      const signInResult = await GoogleSignin.signIn();


      const idToken = signInResult.idToken ?? signInResult.data?.idToken;
      if (!idToken) throw new Error('No ID token returned');


      const credential = GoogleAuthProvider.credential(idToken);
      const auth = getAuth();
      const userCredential = await signInWithCredential(auth, credential);

      console.log('Firebase signed in as:', userCredential.user.email);
    } catch (err) {
      console.error('Sign-In failed:', err);
    }
}


function LoginScreen() {
  return (
      <>
          <View style= {styles.HeaderContainer}>
            <Text style={styles.HeaderText}>Sign in</Text>
          </View>
          <View style={styles.buttonContainer}>
            <Button
                  title="Google Sign-In"
                  onPress={() => onGoogleButtonPress().then(() => console.log('Signed in with Google!'))}
                />
          </View>
      </>
  );
}


const styles = StyleSheet.create({
  HeaderContainer: {
    height: "15%",
    justifyContent: 'center',
    padding: 5,
    marginHorizontal: 8,
    alignItems: "center",
  },
    HeaderText: {
      fontSize: 20,
      color:"#0000ff",
    },
    buttonContainer: {
        flex: 1,
        justifyContent: 'center',
        padding: 5,
        marginHorizontal: 8,
    }
});

export default LoginScreen;