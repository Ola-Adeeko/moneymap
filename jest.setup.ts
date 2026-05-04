import '@testing-library/react-native/matchers';

jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('react-native-reanimated', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  },
  useRouter: () => ({
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: () => 'dark',
}));

jest.mock('@/src/hooks/use-app-theme', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ThemePalette } = require('./src/constants/colors');
  return {
    useAppTheme: () => ({
      themeMode: 'dark',
      effectiveScheme: 'dark',
      colors: ThemePalette.dark,
    }),
  };
});
