import { Link } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import { Card, PageHeader, Screen, colors, ui } from '@/components/ui';
import { api } from '@/lib/api';
import { formatMoney } from './index';

export default function JobsScreen() {
  const [search, setSearch] = useState('');
  const query = useQuery({ queryKey: ['jobs', search], queryFn: () => api.getJobs(search.trim() || undefined) });
  const jobs = query.data ?? [];
  return <Screen style={{ flex: 1, paddingHorizontal: 0, paddingTop: 0, paddingBottom: 0, gap: 0 }}><View style={{ padding: 22, paddingBottom: 12, gap: 15 }}><PageHeader eyebrow="Marketplace" title="Explore good work." subtitle="Find projects with clear goals and room to do your best work." /><TextInput value={search} onChangeText={setSearch} placeholder="Search projects…" placeholderTextColor={colors.muted} accessibilityLabel="Search projects" returnKeyType="search" style={{ backgroundColor: colors.card, borderColor: colors.line, borderWidth: 1, borderRadius: 13, paddingHorizontal: 14, minHeight: 48, color: colors.text }} /></View>
    {query.isError ? <View style={{ paddingHorizontal: 22 }}><Card><Text style={{ color: colors.text, fontWeight: '700' }}>Couldn’t load projects</Text><Text style={ui.small}>Check your connection and try again.</Text><Pressable onPress={() => void query.refetch()}><Text style={{ color: colors.purple, fontWeight: '700' }}>Retry</Text></Pressable></Card></View> : null}
    <FlatList data={jobs} keyExtractor={(item) => item.id} contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 28, gap: 12, flexGrow: 1 }} refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.purple} />} ListEmptyComponent={!query.isLoading && !query.isError ? <Card><Text style={{ color: colors.text, fontWeight: '700' }}>No matching projects</Text><Text style={ui.small}>Try a different search.</Text></Card> : null} renderItem={({ item }) => <Link href={{ pathname: '/jobs/[id]', params: { id: item.id } }} asChild><Pressable accessibilityRole="button"><Card><View style={ui.row}><Text style={{ color: colors.text, fontSize: 16, lineHeight: 22, fontWeight: '800', flex: 1 }}>{item.title}</Text><Text style={ui.tag}>{item.status}</Text></View><Text numberOfLines={3} style={{ color: colors.muted, lineHeight: 21 }}>{item.description}</Text><View style={[ui.row, { marginTop: 2 }]}><Text style={{ color: colors.text, fontWeight: '800' }}>{formatMoney(item.budgetAmount, item.budgetCurrency)}</Text><Text style={ui.small}>{item.category ?? 'General'}</Text></View><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{item.skills.slice(0, 3).map(({ skill }) => <Text key={skill.id} style={{ color: colors.muted, backgroundColor: colors.cardAlt, paddingVertical: 5, paddingHorizontal: 8, borderRadius: 8, fontSize: 11 }}>{skill.name}</Text>)}</View></Card></Pressable></Link>} />
  </Screen>;
}
