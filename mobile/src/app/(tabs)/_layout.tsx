import { Tabs } from 'expo-router';
import { Text, type ColorValue } from 'react-native';
import { colors } from '@/components/ui';
export default function TabLayout() {
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.purple, tabBarInactiveTintColor: colors.muted, tabBarStyle: { backgroundColor: '#111725', borderTopColor: colors.line, height: 63, paddingTop: 6, paddingBottom: 8 }, tabBarLabelStyle: { fontSize: 10, fontWeight: '700' } }}>
    <Tabs.Screen name="index" options={{ title: 'Home', tabBarLabel: 'Home', tabBarIcon: ({ color }) => <TabIcon label="⌂" color={color} /> }} />
    <Tabs.Screen name="jobs" options={{ title: 'Explore', tabBarLabel: 'Explore', tabBarIcon: ({ color }) => <TabIcon label="⌕" color={color} /> }} />
    <Tabs.Screen name="proposals" options={{ title: 'Proposals', tabBarLabel: 'Proposals', tabBarIcon: ({ color }) => <TabIcon label="↗" color={color} /> }} />
    <Tabs.Screen name="projects" options={{ title: 'Projects', tabBarLabel: 'Projects', tabBarIcon: ({ color }) => <TabIcon label="▤" color={color} /> }} />
    <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarLabel: 'Profile', tabBarIcon: ({ color }) => <TabIcon label="◉" color={color} /> }} />
  </Tabs>;
}
function TabIcon({ label, color }: { label: string; color: ColorValue }) { return <Text style={{ color, fontSize: 22, fontWeight: '700', lineHeight: 24 }}>{label}</Text>; }
