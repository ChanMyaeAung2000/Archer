import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, BriefcaseBusiness, Check, Eye, EyeOff, Sparkles, UserRound } from "lucide-react";
import { Brand } from "@/components/brand";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ApiError } from "@/lib/api";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/language-switcher";

const demoAccounts = {
  CLIENT: { email: "client@archer.local", password: "Password123!" },
  FREELANCER: { email: "freelancer@archer.local", password: "Password123!" }
} as const;

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const isRegister = mode === "register";
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "FREELANCER" as "CLIENT" | "FREELANCER" });

  async function completeLogin() {
    const from = (location.state as { from?: string } | null)?.from ?? "/";
    navigate(from, { replace: true });
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      if (isRegister) await register(form);
      else await login({ email: form.email, password: form.password });
      await completeLogin();
    } catch (submissionError) {
      setError(submissionError instanceof ApiError ? submissionError.message : "Could not complete that request.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function loginAs(role: keyof typeof demoAccounts) {
    setError("");
    setIsSubmitting(true);
    try {
      await login(demoAccounts[role]);
      await completeLogin();
    } catch (submissionError) {
      setError(submissionError instanceof ApiError ? submissionError.message : "Could not complete that request.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return <div className="grid min-h-screen lg:grid-cols-[1.05fr_.95fr]">
    <section className="relative hidden overflow-hidden bg-sidebar p-12 lg:flex lg:flex-col lg:justify-between xl:p-16">
      <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" /><div className="absolute bottom-10 right-0 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
      <Brand />
      <div className="relative max-w-xl"><div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"><Sparkles className="h-3.5 w-3.5" />{t("auth.tagline")}</div><h1 className="max-w-lg text-5xl font-semibold leading-[1.05] tracking-[-.04em] text-white xl:text-6xl">{t("auth.heroTitle")}</h1><p className="mt-6 max-w-md text-base leading-7 text-white/55">{t("auth.heroDescription")}</p><div className="mt-10 space-y-4 text-sm text-white/75"><div className="flex items-center gap-3"><span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-400/15 text-emerald-300"><Check className="h-3.5 w-3.5" /></span>{t("auth.craft")}</div><div className="flex items-center gap-3"><span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-400/15 text-emerald-300"><Check className="h-3.5 w-3.5" /></span>{t("auth.collaboration")}</div><div className="flex items-center gap-3"><span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-400/15 text-emerald-300"><Check className="h-3.5 w-3.5" /></span>{t("auth.work")}</div></div></div>
      <p className="relative text-xs text-white/35">© 2026 Archer. Built for people who make things.</p>
    </section>
    <section className="flex min-h-screen items-center justify-center bg-background px-6 py-12 sm:px-12"><div className="w-full max-w-md"><div className="mb-10 flex items-center justify-between lg:hidden"><Brand /><LanguageSwitcher compact /></div><div className="mb-8"><p className="mb-3 text-sm font-semibold text-primary">{isRegister ? t("auth.startBuilding") : t("auth.welcomeBack")}</p><h2 className="text-3xl font-semibold tracking-[-.03em]">{isRegister ? t("auth.createAccountTitle") : t("auth.signInTitle")}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{isRegister ? t("auth.createAccountDescription") : t("auth.signInDescription")}</p></div><form onSubmit={submit} className="space-y-5">
      {isRegister && <div className="space-y-2"><Label htmlFor="name">{t("auth.name")}</Label><Input id="name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Ei Maung" /></div>}
      <div className="space-y-2"><Label htmlFor="email">{t("auth.email")}</Label><Input id="email" type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" /></div>
      {isRegister && <div className="space-y-2"><Label htmlFor="role">{t("auth.role")}</Label><Select id="role" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as "CLIENT" | "FREELANCER" })}><option value="FREELANCER">{t("auth.freelancerRole")}</option><option value="CLIENT">{t("auth.clientRole")}</option></Select></div>}
      <div className="space-y-2"><Label htmlFor="password">{t("auth.password")}</Label><div className="relative"><Input id="password" type={showPassword ? "text" : "password"} required minLength={8} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={t("auth.passwordHint")} className="pr-11" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
      {error && <p className="rounded-xl border border-destructive/25 bg-destructive/10 px-3.5 py-3 text-sm text-destructive">{error}</p>}
      <Button className="w-full" size="lg" disabled={isSubmitting}>{isSubmitting ? "Please wait…" : isRegister ? t("auth.createAccount") : t("auth.signIn")}<ArrowRight className="h-4 w-4" /></Button>
    </form>{!isRegister && <div className="mt-8 space-y-3"><div><p className="text-sm font-semibold">{t("auth.testLoginTitle")}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{t("auth.testLoginDescription")}</p></div><div className="grid gap-3 sm:grid-cols-2"><DemoLoginCard icon={BriefcaseBusiness} title={t("auth.testClient")} description={t("auth.testClientDescription")} onClick={() => void loginAs("CLIENT")} disabled={isSubmitting} /><DemoLoginCard icon={UserRound} title={t("auth.testFreelancer")} description={t("auth.testFreelancerDescription")} onClick={() => void loginAs("FREELANCER")} disabled={isSubmitting} /></div></div>}<p className="mt-8 text-center text-sm text-muted-foreground">{isRegister ? t("auth.alreadyAccount") : t("auth.newToArcher")} <Link to={isRegister ? "/login" : "/register"} className="font-semibold text-primary hover:underline">{isRegister ? t("auth.signIn") : t("auth.createLink")}</Link></p></div></section>
  </div>;
}

function DemoLoginCard({ icon: Icon, title, description, onClick, disabled }: { icon: typeof BriefcaseBusiness; title: string; description: string; onClick: () => void; disabled: boolean }) {
  return <Card className="transition hover:border-primary/40 hover:bg-accent/40"><CardContent className="p-0"><button type="button" onClick={onClick} disabled={disabled} className="flex h-full w-full items-start gap-3 p-4 text-left disabled:cursor-not-allowed disabled:opacity-60"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span><span className="min-w-0"><span className="block text-sm font-semibold">{title}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span></span></button></CardContent></Card>;
}
