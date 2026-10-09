import React from 'react';
import { Text, View } from 'react-native';
import { DrawerContentComponentProps, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { usePalette } from '../theme/theme';
import { useIoT } from '../context/IoTContext';
import { isDemoMode } from '../services/IoTService';
export default function CustomDrawerContent(props: DrawerContentComponentProps) {
  const p = usePalette(); const h = useIoT();
  return <DrawerContentScrollView {...props} contentContainerStyle={{ flexGrow: 1 }}>
    <View style={{ padding: 24, paddingTop: 28, paddingBottom: 34 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ backgroundColor: '#6550CE', borderRadius: 13, width: 42, height: 42, justifyContent: 'center', alignItems: 'center' }}><Ionicons name="layers-outline" size={23} color="#FFFFFF" /></View>
        <Text style={{ color: p.text, fontSize: 25, fontWeight: '700', letterSpacing: 0 }}>figuro<Text style={{ color: '#6550CE' }}>.</Text></Text>
      </View>
    </View>
    <DrawerItemList {...props} />
    <Text style={{ color: p.text, fontSize: 12, padding: 24 }}>{h.preferences.homeName}{isDemoMode ? ' · Demo data' : ''}</Text>
  </DrawerContentScrollView>;
}
