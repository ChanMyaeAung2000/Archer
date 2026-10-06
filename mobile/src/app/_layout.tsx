import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { AuthProvider, useAuth } from '@/providers/auth-provider';
import { colors } from '@/components/ui';

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } } });
function NavigationGate() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const inAuth = segments[0] === '(auth)';
  useEffect(() => {
    if (isLoading) return;
    if (!user && !inAuth) router.replace('/(auth)/login');
    else if (user && inAuth) router.replace('/(tabs)');
  }, [inAuth, isLoading, router, user]);
  if (isLoading) return <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: 12 }}><ActivityIndicator color={colors.purple} /><Text style={{ color: colors.muted }}>Loading your workspace…</Text></View>;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'slide_from_right' }}><Stack.Screen name="(auth)" /><Stack.Screen name="(tabs)" /><Stack.Screen name="jobs/[id]" options={{ headerShown: true, headerTitle: 'Project brief', headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.text, headerTitleStyle: { color: colors.text } }} /><Stack.Screen name="jobs/new" options={{ headerShown: true, headerTitle: 'Post a project', headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.text, headerTitleStyle: { color: colors.text } }} /><Stack.Screen name="proposals/new" options={{ headerShown: true, headerTitle: 'Send a proposal', headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.text, headerTitleStyle: { color: colors.text } }} /><Stack.Screen name="proposals/[id]" options={{ headerShown: true, headerTitle: 'Proposal', headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.text, headerTitleStyle: { color: colors.text } }} /><Stack.Screen name="projects/[id]" options={{ headerShown: true, headerTitle: 'Project workspace', headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.text, headerTitleStyle: { color: colors.text } }} /><Stack.Screen name="notifications" options={{ headerShown: true, headerTitle: 'Notifications', headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.text, headerTitleStyle: { color: colors.text } }} /></Stack>;
}
export default function RootLayout() { return <QueryClientProvider client={queryClient}><AuthProvider><StatusBar style="light" /><NavigationGate /></AuthProvider></QueryClientProvider>; }
