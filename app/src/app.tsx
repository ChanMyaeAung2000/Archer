import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/components/auth-provider";
import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/require-auth";
import { AuthPage } from "@/pages/auth-page";
import { DashboardPage } from "@/pages/dashboard-page";
import { JobDetailPage } from "@/pages/job-detail-page";
import { JobsPage } from "@/pages/jobs-page";
import { NewJobPage } from "@/pages/new-job-page";
import { ProfilePage } from "@/pages/profile-page";
import { ProposalsPage } from "@/pages/proposals-page";
import { ProposalDetailPage } from "@/pages/proposal-detail-page";
import { SubmitProposalPage } from "@/pages/submit-proposal-page";
import { ProjectsPage } from "@/pages/projects-page";
import { ProjectDetailPage } from "@/pages/project-detail-page";

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } });

export function App() { return <QueryClientProvider client={queryClient}><BrowserRouter><AuthProvider><Routes><Route path="/login" element={<AuthPage mode="login" />} /><Route path="/register" element={<AuthPage mode="register" />} /><Route element={<RequireAuth />}><Route element={<AppShell />}><Route index element={<DashboardPage />} /><Route path="jobs" element={<JobsPage />} /><Route path="jobs/new" element={<NewJobPage />} /><Route path="jobs/:id/propose" element={<SubmitProposalPage />} /><Route path="jobs/:id" element={<JobDetailPage />} /><Route path="proposals" element={<ProposalsPage />} /><Route path="proposals/:id" element={<ProposalDetailPage />} /><Route path="projects" element={<ProjectsPage />} /><Route path="projects/:id" element={<ProjectDetailPage />} /><Route path="profile" element={<ProfilePage />} /></Route></Route><Route path="*" element={<Navigate to="/" replace />} /></Routes></AuthProvider></BrowserRouter></QueryClientProvider>; }
