import React, { useState } from 'react';
import { View, Button, Text } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { getAuth, signOut } from '@react-native-firebase/auth';

function MainScreen() {
 const [message, setMessage] = useState('');

   const handleSignOut = async () => {
     try {
       // Sign out from Firebase
       const auth = getAuth();
       await signOut(auth);
       setMessage('✅ Successfully signed out');
     } catch (err) {
       console.error('Sign out error:', err);
       setMessage('❌ Sign out failed');
     }
   };

   return (
     <View style={{ padding: 20 }}>
       <Button title="Sign Out" onPress={handleSignOut} />
       {message ? <Text style={{ marginTop: 10 }}>{message}</Text> : null}
     </View>
   );
}



export default MainScreen;