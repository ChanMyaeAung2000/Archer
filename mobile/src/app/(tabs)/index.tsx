import { Link, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Pressable, Text, View } from 'react-native';
import { Card, PageHeader, Screen, colors, ui } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const jobs = useQuery({ queryKey: ['jobs', 'home'], queryFn: () => api.getJobs() });
  const projects = useQuery({ queryKey: ['projects'], queryFn: api.getProjects });
  const proposals = useQuery({ queryKey: ['proposals', user?.role], queryFn: () => api.getProposals(user?.role ?? 'FREELANCER') });
  const firstName = user?.profile?.name?.split(' ')[0] ?? user?.email.split('@')[0] ?? 'there';
  return <Screen scroll><PageHeader eyebrow="Your workspace" title={`Good work ahead, ${firstName}.`} subtitle={user?.role === 'CLIENT' ? 'Bring your next idea to life with the right people.' : 'Find a project that deserves your best work.'} />
    <Pressable accessibilityRole="button" onPress={() => router.push('/notifications')} style={{ alignSelf: 'flex-end', paddingHorizontal: 12, paddingVertical: 8, marginTop: -8, marginBottom: -8 }}><Text style={{ color: colors.purple, fontWeight: '700' }}>Notifications  →</Text></Pressable>
    {user?.role === 'CLIENT' ? <Pressable accessibilityRole="button" onPress={() => router.push('/jobs/new')} style={{ backgroundColor: colors.purple, padding: 18, borderRadius: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><View><Text style={{ color: colors.bg, fontWeight: '800', fontSize: 16 }}>Post a project</Text><Text style={{ color: '#221c42', marginTop: 4, fontSize: 12 }}>Write a brief and meet your next collaborator</Text></View><Text style={{ color: colors.bg, fontSize: 22 }}>↗</Text></Pressable> : <Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)/jobs')} style={{ backgroundColor: colors.purple, padding: 16, borderRadius: 15, alignItems: 'center' }}><Text style={{ color: colors.bg, fontWeight: '800' }}>Explore open projects  →</Text></Pressable>}
    <View style={{ flexDirection: 'row', gap: 10 }}><Metric label={user?.role === 'CLIENT' ? 'Requests' : 'Proposals'} value={proposals.data?.length} loading={proposals.isLoading} /><Metric label="Projects" value={projects.data?.length} loading={projects.isLoading} /></View>
    <View style={ui.row}><Text style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>Fresh opportunities</Text><Link href="/(tabs)/jobs" style={{ color: colors.purple, fontSize: 13, fontWeight: '700' }}>Explore all</Link></View>
    {jobs.isLoading ? <Card><Text style={ui.small}>Loading projects…</Text></Card> : jobs.isError ? <Card><Text style={{ color: colors.text, fontWeight: '700' }}>Couldn’t load projects</Text><Text style={ui.small}>Check your connection and try again.</Text><Pressable onPress={() => void jobs.refetch()}><Text style={{ color: colors.purple, fontWeight: '700' }}>Retry</Text></Pressable></Card> : jobs.data?.slice(0, 3).map((job) => <Link key={job.id} href={{ pathname: '/jobs/[id]', params: { id: job.id } }} asChild><Pressable><Card><Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>{job.title}</Text><Text numberOfLines={2} style={{ color: colors.muted, lineHeight: 20 }}>{job.description}</Text><View style={ui.row}><Text style={ui.tag}>{job.budgetCurrency} {formatMoney(job.budgetAmount, job.budgetCurrency)}</Text><Text style={ui.small}>{job.category ?? 'Project'}</Text></View></Card></Pressable></Link>)}
  </Screen>;
}
function Metric({ label, value, loading }: { label: string; value?: number; loading: boolean }) { return <Card style={{ flex: 1 }}><Text style={ui.small}>{label}</Text><Text style={{ color: colors.text, fontSize: 26, fontWeight: '800' }}>{loading ? '—' : value ?? 0}</Text></Card>; }
export function formatMoney(amount: number, currency: 'USD' | 'MMK') { return currency === 'USD' ? `USD $${(amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `${amount.toLocaleString('en-US')} MMK`; }
