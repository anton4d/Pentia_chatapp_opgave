import { NewAppScreen } from '@react-native/new-app-screen';
import BootSplash from "react-native-bootsplash";
import {  Button, StyleSheet, useColorScheme, View,Text,  Alert } from 'react-native';
import { useEffect } from "react";
import { FacebookAuthProvider, GoogleAuthProvider, getAuth, signInWithCredential, updateProfile } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { LoginManager, AccessToken } from 'react-native-fbsdk-next';

GoogleSignin.configure({
  webClientId: '948816102637-evq2t8i7k2evv3pgtj2esmisu414e80c.apps.googleusercontent.com',
});
export const showAlert = (title, message) => {
  Alert.alert(title, message, [{ text: 'OK' }], { cancelable: true });
};

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
      showAlert('Google Sign-In Failed', err.message ?? String(err));
    }
}

async function onFacebookButtonPress() {
    try {
      const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
      if (result.isCancelled) throw 'User cancelled the login process';


      const data = await AccessToken.getCurrentAccessToken();
      if (!data) throw 'Something went wrong obtaining access token';

      const accessToken = data.accessToken;


      const facebookCredential = FacebookAuthProvider.credential(accessToken);
      const userCredential = await signInWithCredential(getAuth(), facebookCredential);
      const user = userCredential.user;
      console.log('Firebase signed in as:', user.email);

    } catch (err) {
      console.error('Facebook Sign-In failed:', err);
      showAlert('Facebook Sign-In Failed', err.message ?? String(err));
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
             <Button
                  title="Facebook Sign-In"
                  onPress={() => onFacebookButtonPress().then(() => console.log('Signed in with Facebook!'))}
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