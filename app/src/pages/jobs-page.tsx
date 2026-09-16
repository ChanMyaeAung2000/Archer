import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, BriefcaseBusiness, Filter, Search, SlidersHorizontal } from "lucide-react";
import { api, type Currency, type Job } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAuth } from "@/components/auth-provider";
import { useTranslation } from "react-i18next";

export function JobsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [currency, setCurrency] = useState<Currency | "">("");
  const { data, isLoading, isError } = useQuery({ queryKey: ["jobs", query, currency], queryFn: () => api.getJobs({ q: query, currency: currency || undefined, limit: 50 }) });
  const isClient = user?.role === "CLIENT";

  function submitSearch(event: React.FormEvent) { event.preventDefault(); setQuery(search.trim()); }

  return <div className="space-y-7"><section className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="mb-2 text-sm font-semibold text-primary">{t("jobs.marketplace")}</p><h1 className="text-3xl font-semibold tracking-[-.04em]">{t("jobs.exploreGoodWork")}<span className="text-primary">.</span></h1><p className="mt-2 text-sm text-muted-foreground">{t("jobs.findProjects")}</p></div>{isClient && <Link to="/jobs/new"><Button><BriefcaseBusiness className="h-4 w-4" />{t("common.postProject")}</Button></Link>}</section><div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-3 sm:flex-row"><form onSubmit={submitSearch} className="relative flex-1"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} className="border-transparent bg-secondary/70 pl-10 focus:border-primary" placeholder={t("jobs.searchPlaceholder")} /></form><div className="flex gap-3"><Select aria-label={t("jobs.allCurrencies")} value={currency} onChange={(event) => setCurrency(event.target.value as Currency | "")} className="min-w-32 bg-secondary/70"><option value="">{t("jobs.allCurrencies")}</option><option value="USD">USD</option><option value="MMK">MMK</option></Select><Button variant="outline" size="icon" aria-label="More filters"><SlidersHorizontal className="h-4 w-4" /></Button></div></div>{isLoading ? <div className="grid gap-4 lg:grid-cols-2">{[1,2,3,4].map((item) => <div key={item} className="h-56 animate-pulse rounded-2xl bg-secondary/70" />)}</div> : isError ? <Card className="p-10 text-center"><p className="font-semibold">{t("jobs.couldNotLoad")}</p><p className="mt-1 text-sm text-muted-foreground">{t("jobs.apiRunning")}</p></Card> : data?.items.length ? <div className="grid gap-4 lg:grid-cols-2">{data.items.map((job) => <JobCard key={job.id} job={job} />)}</div> : <Card className="p-12 text-center"><Filter className="mx-auto h-8 w-8 text-muted-foreground/50" /><p className="mt-4 font-semibold">{t("jobs.noMatching")}</p><p className="mt-1 text-sm text-muted-foreground">{t("jobs.widenSearch")}</p></Card>}</div>;
}

function JobCard({ job }: { job: Job }) { const { t } = useTranslation(); return <Link to={`/jobs/${job.id}`} className="group"><Card className="h-full p-6 transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_20px_60px_-30px_hsl(var(--primary)/.5)]"><div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-primary"><BriefcaseBusiness className="h-4 w-4" /></span><div><p className="text-xs text-muted-foreground">{job.client.profile?.name ?? "Archer client"}</p><p className="mt-0.5 text-xs text-muted-foreground">{t("jobs.posted")} {formatDate(job.publishedAt ?? job.createdAt)}</p></div></div><ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" /></div><h2 className="mt-6 text-lg font-semibold tracking-tight">{job.title}</h2><p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{job.description}</p><div className="mt-5 flex flex-wrap gap-2">{job.skills.slice(0, 3).map(({ skill }) => <Badge variant="outline" key={skill.id}>{skill.name}</Badge>)}{job.category && <Badge variant="secondary">{job.category}</Badge>}</div><div className="mt-6 flex items-end justify-between border-t border-border/70 pt-4"><div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-muted-foreground">{t("jobs.budget")}</p><p className="mt-1 text-base font-semibold">{formatMoney(job.budgetAmount, job.budgetCurrency)}</p></div><div className="text-right"><p className="text-[10px] font-bold uppercase tracking-[.15em] text-muted-foreground">{t("jobs.targetDeadline")}</p><p className="mt-1 text-sm font-medium">{formatDate(job.deadline)}</p></div></div></Card></Link>; }
