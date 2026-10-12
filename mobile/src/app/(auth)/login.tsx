import { Link } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import { Button, Card, Field, Notice, Screen, colors } from '@/components/ui';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [demoRole, setDemoRole] = useState<'CLIENT' | 'FREELANCER' | null>(null);
  async function submit() { setError(''); setBusy(true); try { await signIn(email.trim(), password); } catch (e) { setError(e instanceof ApiError ? e.message : 'Could not sign in. Please try again.'); } finally { setBusy(false); } }
  async function loginAs(role: 'CLIENT' | 'FREELANCER') {
    const credentials = role === 'CLIENT'
      ? { email: 'client@archer.local', password: 'Password123!' }
      : { email: 'freelancer@archer.local', password: 'Password123!' };
    setError(''); setBusy(true); setDemoRole(role);
    try { await signIn(credentials.email, credentials.password); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Could not sign in. Please try again.'); }
    finally { setBusy(false); setDemoRole(null); }
  }
  return <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><Screen scroll style={{ flexGrow: 1, justifyContent: 'center', paddingTop: 44, paddingBottom: 44 }}><View style={{ gap: 8, marginBottom: 12 }}><Text style={{ color: colors.purple, fontWeight: '900', fontSize: 17, letterSpacing: 1 }}>archer.</Text><Text style={{ color: colors.text, fontSize: 34, lineHeight: 40, fontWeight: '800', letterSpacing: -1 }}>Good work starts with the right people.</Text><Text style={{ color: colors.muted, fontSize: 15, lineHeight: 23 }}>Sign in to pick up where you left off.</Text></View><Card><Field label="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" placeholder="you@example.com" returnKeyType="next" /><Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" textContentType="password" placeholder="Your password" onSubmitEditing={() => void submit()} returnKeyType="go" /></Card>{error ? <Notice>{error}</Notice> : null}<Button title="Sign in" onPress={() => void submit()} loading={busy && !demoRole} disabled={!email || !password || busy} /><View style={{ gap: 10, marginTop: 6 }}><View style={{ gap: 3 }}><Text style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>Quick test login</Text><Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18 }}>Explore Archer with a demo client or freelancer account.</Text></View><View style={{ flexDirection: 'row', gap: 10 }}><DemoLoginCard title="Test as client" description="Review projects and proposal requests." loading={demoRole === 'CLIENT'} disabled={busy} onPress={() => void loginAs('CLIENT')} /><DemoLoginCard title="Test as freelancer" description="Explore jobs and send proposals." loading={demoRole === 'FREELANCER'} disabled={busy} onPress={() => void loginAs('FREELANCER')} /></View></View><View style={{ flexDirection: 'row', justifyContent: 'center', gap: 5, paddingTop: 5 }}><Text style={{ color: colors.muted }}>New to Archer?</Text><Link href="/(auth)/register" style={{ color: colors.purple, fontWeight: '700' }}>Create account</Link></View></Screen></KeyboardAvoidingView>;
}

function DemoLoginCard({ title, description, loading, disabled, onPress }: { title: string; description: string; loading: boolean; disabled: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`${title}. ${description}`} onPress={onPress} disabled={disabled} style={({ pressed }) => ({ flex: 1, opacity: disabled ? 0.55 : pressed ? 0.82 : 1 })}><Card style={{ flex: 1, minHeight: 112, justifyContent: 'space-between', padding: 13 }}><Text style={{ color: colors.text, fontSize: 13, fontWeight: '800' }}>{title}</Text><Text style={{ color: colors.muted, fontSize: 11, lineHeight: 16 }}>{description}</Text>{loading ? <ActivityIndicator size="small" color={colors.purple} /> : <Text style={{ color: colors.purple, fontSize: 11, fontWeight: '800' }}>Continue →</Text>}</Card></Pressable>;
}
