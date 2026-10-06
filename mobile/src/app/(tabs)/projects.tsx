import { Link } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Pressable, Text } from 'react-native';
import { Card, PageHeader, Screen, colors, ui } from '@/components/ui';
import { api } from '@/lib/api';
import { formatMoney } from './index';
export default function ProjectsScreen() {
  const query = useQuery({ queryKey: ['projects'], queryFn: api.getProjects });
  return <Screen scroll><PageHeader eyebrow="Your workspace" title="Projects in motion." subtitle="Keep the brief, milestones, and conversation together." />{query.isLoading ? <Card><Text style={ui.small}>Loading projects…</Text></Card> : null}{query.isError ? <Card><Text style={{ color: colors.text, fontWeight: '800' }}>Couldn’t load your projects</Text><Text style={ui.small}>Check your connection and try again.</Text></Card> : null}{!query.isLoading && !query.isError && !query.data?.length ? <Card><Text style={{ color: colors.text, fontWeight: '800' }}>No active workspaces yet</Text><Text style={ui.small}>When a proposal is accepted, the project workspace will appear here.</Text></Card> : null}{query.data?.map((project) => <Link key={project.id} href={{ pathname: '/projects/[id]', params: { id: project.id } }} asChild><Pressable><Card><Text style={ui.tag}>{project.status.replace('_', ' ')}</Text><Text style={{ color: colors.text, fontSize: 17, fontWeight: '800' }}>{project.job.title}</Text><Text style={ui.small}>{formatMoney(project.agreedAmount, project.agreedCurrency)} · {project.milestones.filter((m) => m.status === 'COMPLETED').length}/{project.milestones.length} milestones complete</Text></Card></Pressable></Link>)}</Screen>;
}
