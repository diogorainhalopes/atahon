import { Easing } from 'react-native-reanimated';

export const easing = {
  paper: Easing.bezier(0.25, 0.1, 0.25, 1.0),
  enter: Easing.bezier(0.2, 0.0, 0.1, 1.0),
  exit: Easing.bezier(0.4, 0.0, 1.0, 1.0),
};

export const duration = {
  micro: 100,
  short: 180,
  medium: 320,
  long: 500,
  page: 400,
} as const;

export const pulseLoopMs = 1600;
