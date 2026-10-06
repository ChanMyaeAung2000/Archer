import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Text, View } from 'react-native';
import { Button, Card, PageHeader, Screen, colors, ui } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { formatMoney } from '../(tabs)';

export default function JobDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>(); const { user } = useAuth();
  const query = useQuery({ queryKey: ['job', id], queryFn: () => api.getJob(id), enabled: Boolean(id) });
  if (query.isLoading) return <Screen><Text style={ui.small}>Loading project brief…</Text></Screen>;
  if (query.isError && !query.data) return <Screen><Card><Text style={{ color: colors.text, fontWeight: '800' }}>Couldn’t load this brief</Text><Text style={ui.small}>Check your connection or try again.</Text><Button title="Retry" secondary onPress={() => void query.refetch()} /></Card></Screen>;
  if (!query.data) return <Screen><Card><Text style={{ color: colors.text, fontWeight: '800' }}>Project not found</Text><Text style={ui.small}>It may have been closed or removed.</Text></Card></Screen>;
  const job = query.data;
  return <Screen scroll><PageHeader eyebrow={job.category ?? 'Project brief'} title={job.title} subtitle={`Posted by ${job.client.profile?.name ?? 'Archer client'}`} /><Card><Text style={ui.small}>Budget</Text><Text style={{ color: colors.text, fontSize: 25, fontWeight: '800' }}>{formatMoney(job.budgetAmount, job.budgetCurrency)}</Text>{job.deadline ? <Text style={ui.small}>Target delivery · {new Date(job.deadline).toLocaleDateString()}</Text> : null}</Card><Card><Text style={{ color: colors.text, fontWeight: '800', fontSize: 16 }}>About this project</Text><Text style={{ color: colors.muted, lineHeight: 23 }}>{job.description}</Text></Card>{job.skills.length ? <Card><Text style={{ color: colors.text, fontWeight: '800' }}>Skills requested</Text><View style={{ flexDirection: 'row', gap: 7, flexWrap: 'wrap' }}>{job.skills.map(({ skill }) => <Text key={skill.id} style={ui.tag}>{skill.name}</Text>)}</View></Card> : null}
    {user?.role === 'FREELANCER' && job.status === 'PUBLISHED' ? <Button title="Send a proposal  →" onPress={() => router.push({ pathname: '/proposals/new', params: { jobId: job.id, title: job.title, budgetAmount: String(job.budgetAmount), budgetCurrency: job.budgetCurrency } })} /> : null}
  </Screen>;
}
