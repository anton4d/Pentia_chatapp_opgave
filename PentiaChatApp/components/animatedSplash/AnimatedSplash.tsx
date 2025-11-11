import {View,Text,Animated, Easing } from 'react-native';
import {useEffect, useRef} from "react";

function AnimatedSplash() {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(spinAnim, { toValue: 1, duration: 1000, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(spinAnim, { toValue: 0, duration: 1000, easing: Easing.linear, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <Animated.Image
        source={require('../../assets/bootsplash/logo.png')}
        style={{ width: 120, height: 120, transform: [{ rotate: spin }], opacity: fadeAnim }}
      />
    </View>
  );
}
export default AnimatedSplash;