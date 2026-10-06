import { Link } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Pressable, Text } from 'react-native';
import { Card, PageHeader, Screen, colors, ui } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { formatMoney } from './index';
export default function ProposalsScreen() {
  const { user } = useAuth(); const client = user?.role === 'CLIENT';
  const query = useQuery({ queryKey: ['proposals', user?.role], queryFn: () => api.getProposals(user?.role ?? 'FREELANCER') });
  return <Screen scroll><PageHeader eyebrow={client ? 'Hiring inbox' : 'Your proposals'} title={client ? 'People ready to help.' : 'Keep good work moving.'} subtitle={client ? 'Review proposals and choose the right partner.' : 'Follow each proposal from send to decision.'} />{query.isLoading ? <Card><Text style={ui.small}>Loading proposals…</Text></Card> : null}{query.isError ? <Card><Text style={{ color: colors.text, fontWeight: '700' }}>Couldn’t load proposals</Text><Text style={ui.small}>Check your connection and try again.</Text></Card> : null}{!query.isLoading && !query.isError && !query.data?.length ? <Card><Text style={{ color: colors.text, fontWeight: '800' }}>No proposals yet</Text><Text style={ui.small}>{client ? 'Freelancer proposals for your projects will appear here.' : 'Explore projects and send a thoughtful proposal when one feels like a fit.'}</Text>{!client ? <Link href="/(tabs)/jobs" style={{ color: colors.purple, fontWeight: '800', marginTop: 5 }}>Explore projects →</Link> : null}</Card> : null}{query.data?.map((p) => <Link key={p.id} href={{ pathname: '/proposals/[id]', params: { id: p.id } }} asChild><Pressable><Card><Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>{p.job.title}</Text><Text style={ui.small}>{client ? p.freelancer.profile?.name ?? p.freelancer.email : p.job.client.profile?.name ?? p.job.client.email}</Text><Text style={{ color: colors.text, fontWeight: '700' }}>{formatMoney(p.bidAmount, p.bidCurrency)}</Text><Text style={ui.tag}>{p.status}</Text></Card></Pressable></Link>)}</Screen>;
}
