import { Pressable, PressableProps, ViewStyle, StyleProp } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { easing, duration } from '@theme/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PaperPressable({ style, onPressIn, onPressOut, ...rest }: PressableProps) {
  const opacity = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(e) => {
        opacity.value = withTiming(0.65, { duration: duration.micro, easing: easing.exit });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        opacity.value = withTiming(1, { duration: duration.short, easing: easing.enter });
        onPressOut?.(e);
      }}
      style={[animated, style as StyleProp<ViewStyle>]}
    />
  );
}
