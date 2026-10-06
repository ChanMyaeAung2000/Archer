import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { Button, Card, Field, Notice, Screen, colors } from '@/components/ui';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function submit() { setError(''); setBusy(true); try { await signIn(email.trim(), password); } catch (e) { setError(e instanceof ApiError ? e.message : 'Could not sign in. Please try again.'); } finally { setBusy(false); } }
  return <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><Screen scroll style={{ flexGrow: 1, justifyContent: 'center', paddingTop: 44, paddingBottom: 44 }}><View style={{ gap: 8, marginBottom: 12 }}><Text style={{ color: colors.purple, fontWeight: '900', fontSize: 17, letterSpacing: 1 }}>archer.</Text><Text style={{ color: colors.text, fontSize: 34, lineHeight: 40, fontWeight: '800', letterSpacing: -1 }}>Good work starts with the right people.</Text><Text style={{ color: colors.muted, fontSize: 15, lineHeight: 23 }}>Sign in to pick up where you left off.</Text></View><Card><Field label="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" placeholder="you@example.com" returnKeyType="next" /><Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" textContentType="password" placeholder="Your password" onSubmitEditing={() => void submit()} returnKeyType="go" /></Card>{error ? <Notice>{error}</Notice> : null}<Button title="Sign in" onPress={() => void submit()} loading={busy} disabled={!email || !password} /><View style={{ flexDirection: 'row', justifyContent: 'center', gap: 5, paddingTop: 5 }}><Text style={{ color: colors.muted }}>New to Archer?</Text><Link href="/(auth)/register" style={{ color: colors.purple, fontWeight: '700' }}>Create account</Link></View></Screen></KeyboardAvoidingView>;
}
