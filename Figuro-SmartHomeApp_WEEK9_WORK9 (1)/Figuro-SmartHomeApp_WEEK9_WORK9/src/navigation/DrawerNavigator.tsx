import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { Text, useWindowDimensions } from 'react-native';
import DashboardScreen from './screens/DashboardScreen';
import SensorsScreen from './screens/SensorsScreen';
import DevicesScreen from './screens/DevicesScreen';
import SettingsScreen from './screens/SettingsScreen';
import CustomDrawerContent from './CustomDrawerContent';
import { usePalette } from '../theme/theme';
import { useIoT } from '../context/IoTContext';
export type HomeRoutes = { Dashboard: undefined; Devices: undefined; Sensors: undefined; Settings: undefined };
const Drawer = createDrawerNavigator<HomeRoutes>();
export default function DrawerNavigator() {
  const p = usePalette(); const { width } = useWindowDimensions(); const h = useIoT();
  return <Drawer.Navigator drawerContent={props => <CustomDrawerContent {...props} />} screenOptions={{
    drawerType: width >= 1000 ? 'permanent' : 'front', drawerStyle: { backgroundColor: p.card, width: 250 },
    drawerActiveBackgroundColor: p.tint, drawerActiveTintColor: p.accent, drawerInactiveTintColor: p.muted,
    drawerLabelStyle: { fontSize: 14, fontWeight: '600', marginLeft: -8 },
    headerStyle: { backgroundColor: p.card }, headerTintColor: p.text, headerShadowVisible: false,
    headerTitle: 'Figuro', headerTitleStyle: { fontSize: 12, fontWeight: '700', letterSpacing: 0 },
    headerRight: () => <Text style={{ color: p.muted, fontSize: 11, marginRight: 22 }}>{h.isRefreshing ? 'Syncing…' : h.isGatewayConnected ? '● Connected' : '○ Offline'}</Text>,
  }}>
    <Drawer.Screen name="Dashboard" component={DashboardScreen} options={{ drawerLabel: 'Home', drawerIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} /> }} />
    <Drawer.Screen name="Devices" component={DevicesScreen} options={{ drawerIcon: ({ color, size }) => <Ionicons name="hardware-chip-outline" size={size} color={color} /> }} />
    <Drawer.Screen name="Sensors" component={SensorsScreen} options={{ drawerIcon: ({ color, size }) => <Ionicons name="analytics-outline" size={size} color={color} /> }} />
    <Drawer.Screen name="Settings" component={SettingsScreen} options={{ drawerIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} /> }} />
  </Drawer.Navigator>;
}
