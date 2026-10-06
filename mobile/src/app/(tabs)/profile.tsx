import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Text } from 'react-native';
import { Button, Card, Field, Notice, PageHeader, Screen, colors, ui } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
export default function ProfileScreen() {
  const { user, signOut, syncUser } = useAuth(); const cache = useQueryClient(); const [name, setName] = useState(user?.profile?.name ?? ''); const [headline, setHeadline] = useState(user?.profile?.headline ?? ''); const [bio, setBio] = useState(user?.profile?.bio ?? ''); const [message, setMessage] = useState(''); const [error, setError] = useState('');
  const save = useMutation({ mutationFn: () => api.updateProfile({ name: name.trim(), headline: headline.trim() || null, bio: bio.trim() || null }), onSuccess: async () => { await syncUser(); setMessage('Profile saved.'); setError(''); await cache.invalidateQueries(); }, onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not save your profile.') });
  return <Screen scroll><PageHeader eyebrow={user?.role.toLowerCase()} title="Your profile." subtitle="Keep your introduction clear and up to date." /><Card><Text style={{ color: colors.text, fontWeight: '800' }}>{user?.email}</Text><Text style={ui.small}>Archer account · {user?.role.toLowerCase()}</Text></Card><Field label="Name" value={name} onChangeText={setName} placeholder="Your name" /><Field label="Headline" value={headline} onChangeText={setHeadline} placeholder="What do you do?" /><Field label="About you" value={bio} onChangeText={setBio} multiline textAlignVertical="top" placeholder="Share a little about your work…" style={{ minHeight: 130 }} />{message ? <Notice tone="success">{message}</Notice> : null}{error ? <Notice>{error}</Notice> : null}<Button title="Save profile" onPress={() => save.mutate()} loading={save.isPending} disabled={!name.trim()} /><Button title="Sign out" onPress={() => { void cache.clear(); void signOut(); }} secondary /></Screen>;
}
