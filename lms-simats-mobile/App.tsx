import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation';
import { colors } from './src/theme';

export default function App() {
  console.log('[DEBUG] App.tsx Mounted');
  return (
    <SafeAreaProvider>
      <RootNavigator />
      <StatusBar style="dark" backgroundColor={colors.background} />
    </SafeAreaProvider>
  );
}
