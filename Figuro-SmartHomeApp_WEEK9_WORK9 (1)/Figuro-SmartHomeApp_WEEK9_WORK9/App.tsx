import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import DrawerNavigator from './src/navigation/DrawerNavigator';
import { IoTProvider, useIoT } from './src/context/IoTContext';
import { usePalette } from './src/theme/theme';
function Home() {
  const h = useIoT(); const p = usePalette();
  if (!h.ready) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: p.bg }}><ActivityIndicator color={p.accent} /></View>;
  const base = h.preferences.darkMode ? DarkTheme : DefaultTheme;
  return <NavigationContainer theme={{ ...base, colors: { ...base.colors, primary: p.accent, background: p.bg, card: p.card, text: p.text, border: p.border } }}>
    <StatusBar style={h.preferences.darkMode ? 'light' : 'dark'} /><DrawerNavigator />
  </NavigationContainer>;
}
export default function App() {
  return <GestureHandlerRootView style={{ flex: 1 }}><SafeAreaProvider><IoTProvider><Home /></IoTProvider></SafeAreaProvider></GestureHandlerRootView>;
}
