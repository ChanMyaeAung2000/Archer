import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Text } from 'react-native';
import { Button, Card, Notice, PageHeader, Screen, colors, ui } from '@/components/ui';
import { api, ApiError, type Proposal } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { formatMoney } from '../(tabs)';
import { useState } from 'react';
export default function ProposalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); const { user } = useAuth(); const router = useRouter(); const cache = useQueryClient(); const [error, setError] = useState('');
  const query = useQuery({ queryKey: ['proposal', id], queryFn: () => api.getProposal(id), enabled: !!id });
  const action = useMutation<Proposal | Awaited<ReturnType<typeof api.acceptProposal>>, Error, 'accept' | 'reject' | 'withdraw'>({ mutationFn: (choice) => choice === 'accept' ? api.acceptProposal(id) : choice === 'reject' ? api.rejectProposal(id) : api.withdrawProposal(id), onSuccess: async (result, choice) => { await Promise.all([cache.invalidateQueries({ queryKey: ['proposal', id] }), cache.invalidateQueries({ queryKey: ['proposals'] }), cache.invalidateQueries({ queryKey: ['projects'] })]); if (choice === 'accept' && 'project' in result) router.replace('/(tabs)/projects'); }, onError: (e) => setError(e instanceof ApiError ? e.message : 'The proposal could not be updated.') });
  if (query.isLoading) return <Screen><Text style={ui.small}>Loading proposal…</Text></Screen>;
  if (query.isError && !query.data) return <Screen><Card><Text style={{ color: colors.text, fontWeight: '800' }}>Couldn’t load this proposal</Text><Text style={ui.small}>Check your connection or try again.</Text><Button title="Retry" secondary onPress={() => void query.refetch()} /></Card></Screen>;
  const p = query.data; if (!p) return <Screen><Card><Text style={{ color: colors.text, fontWeight: '800' }}>Proposal not found</Text></Card></Screen>;
  const isClient = user?.role === 'CLIENT';
  return <Screen scroll><PageHeader eyebrow="Proposal details" title={p.job.title} subtitle={`From ${isClient ? p.freelancer.profile?.name ?? p.freelancer.email : p.job.client.profile?.name ?? p.job.client.email}`} /><Card><Text style={ui.small}>Proposed amount</Text><Text style={{ color: colors.text, fontSize: 24, fontWeight: '800' }}>{formatMoney(p.bidAmount, p.bidCurrency)}</Text><Text style={ui.tag}>{p.status}</Text></Card><Card><Text style={{ color: colors.text, fontWeight: '800' }}>Cover letter</Text><Text style={{ color: colors.muted, lineHeight: 23 }}>{p.coverLetter}</Text>{p.estimatedDays ? <Text style={ui.small}>Estimated delivery · {p.estimatedDays} days</Text> : null}</Card>{error ? <Notice>{error}</Notice> : null}{p.status === 'SUBMITTED' ? isClient ? <><Button title="Accept proposal" onPress={() => action.mutate('accept')} loading={action.isPending} /><Button title="Reject proposal" onPress={() => action.mutate('reject')} secondary disabled={action.isPending} /></> : <Button title="Withdraw proposal" onPress={() => action.mutate('withdraw')} loading={action.isPending} secondary /> : null}</Screen>;
}
