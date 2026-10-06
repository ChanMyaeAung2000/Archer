import { ArrowDown, ArrowRight, ArrowUpRight, Check, ChevronRight, CircleCheck, Compass, Layers3, MessageCircle, Sparkles, Target, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";

const steps = [
  { number: "01", icon: Target, title: "Start with a clear brief", description: "Share the outcome you need, the skills that matter, and a budget that works for you." },
  { number: "02", icon: Users, title: "Find your people", description: "Freelancers bring their approach and proposal. Compare the fit, not just the numbers." },
  { number: "03", icon: Layers3, title: "Make good work happen", description: "Agree on milestones, keep decisions together, and move the project forward as a team." }
];

export function LandingPage() {
  return <main className="min-h-screen overflow-hidden bg-[#0d111c] text-[#f4f6fb]">
    <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
      <Brand />
      <nav className="hidden items-center gap-8 text-sm text-white/60 md:flex" aria-label="Main navigation">
        <a href="#how-it-works" className="transition hover:text-white">How it works</a>
        <a href="#built-for-both" className="transition hover:text-white">For clients & freelancers</a>
      </nav>
      <div className="flex items-center gap-2 sm:gap-3">
        <Link to="/login" className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-white/75 transition hover:bg-white/[.06] hover:text-white sm:inline-flex">Log in</Link>
        <Link to="/register"><Button size="sm" className="rounded-xl px-4">Get started <ArrowUpRight className="h-4 w-4" /></Button></Link>
      </div>
    </header>

    <section className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-24 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-[1.02fr_.98fr] lg:px-12 lg:pb-32 lg:pt-24">
      <div className="absolute -left-40 top-20 h-[28rem] w-[28rem] rounded-full bg-violet-600/10 blur-[120px]" />
      <div className="relative z-10">
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/[.07] px-3.5 py-2 text-xs font-semibold tracking-wide text-violet-200"><Sparkles className="h-3.5 w-3.5" /> A better way to work together</div>
        <h1 className="max-w-2xl text-[clamp(3.2rem,7vw,5.9rem)] font-semibold leading-[.99] tracking-[-.065em]">Good work<br /><span className="text-violet-300">starts with</span><br />the right people.</h1>
        <p className="mt-7 max-w-lg text-base leading-7 text-[#a5aec0] sm:text-lg sm:leading-8">A thoughtful place for clients and independent talent to find each other, agree on the work, and make something great.</p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link to="/register"><Button size="lg" className="group rounded-2xl px-6">Find your next collaboration <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Button></Link>
          <a href="#how-it-works"><Button size="lg" variant="outline" className="rounded-2xl border-white/10 px-6 text-white/85 hover:bg-white/[.06]"><ArrowDown className="h-4 w-4" /> See how it works</Button></a>
        </div>
        <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-medium text-white/50"><span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-emerald-300" /> Clear project expectations</span><span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-emerald-300" /> One shared workspace</span></div>
      </div>

      <div className="relative mx-auto w-full max-w-[540px] lg:ml-auto">
        <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-violet-500/15 via-transparent to-cyan-400/10 blur-2xl" />
        <div className="relative rounded-[2rem] border border-white/[.09] bg-[#141a28]/95 p-4 shadow-[0_40px_120px_-45px_rgba(0,0,0,.9)] sm:p-6">
          <div className="flex items-center justify-between border-b border-white/[.07] pb-5"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-violet-300">Project workspace</p><p className="mt-1 text-sm text-white/45">A good idea, moving forward.</p></div><span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Active</span></div>
          <div className="py-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-white/40">PROJECT BRIEF</p><h2 className="mt-2 text-xl font-semibold tracking-tight">A brand that feels like home</h2></div><span className="rounded-xl bg-violet-400/10 p-2.5 text-violet-200"><Compass className="h-5 w-5" /></span></div><p className="mt-2 max-w-sm text-sm leading-6 text-white/50">Visual identity and a welcoming digital home for a new neighborhood bakery.</p><div className="mt-5 flex flex-wrap gap-2"><span className="rounded-lg border border-white/[.07] px-2.5 py-1 text-xs text-white/55">Brand identity</span><span className="rounded-lg border border-white/[.07] px-2.5 py-1 text-xs text-white/55">Web design</span><span className="rounded-lg border border-white/[.07] px-2.5 py-1 text-xs text-white/55">Strategy</span></div></div>
          <div className="rounded-2xl border border-white/[.07] bg-[#0d111c]/65 p-4 sm:p-5"><div className="mb-4 flex items-center justify-between"><p className="text-sm font-semibold">Project milestones</p><button className="text-xs text-violet-300">View all</button></div><div className="space-y-4"><Milestone title="Creative direction" state="complete" label="Approved" progress={100} /><Milestone title="Identity concepts" state="active" label="In progress" progress={62} /><Milestone title="Website design" state="pending" label="Up next" progress={0} /></div></div>
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-violet-300/10 bg-violet-300/[.055] p-3.5"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-300 to-indigo-500 text-xs font-bold text-white">AM</div><div className="min-w-0 flex-1"><p className="text-xs font-semibold">Alex Morgan <span className="font-normal text-white/40">· Designer</span></p><p className="mt-0.5 truncate text-xs text-white/50">The first concepts are ready for your thoughts.</p></div><MessageCircle className="h-4 w-4 shrink-0 text-violet-300" /></div>
        </div>
        <div className="absolute -left-7 top-[27%] hidden items-center gap-3 rounded-2xl border border-white/10 bg-[#1a2131] p-3.5 shadow-xl sm:flex"><div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-300/10 text-emerald-300"><CircleCheck className="h-5 w-5" /></div><div><p className="text-xs font-semibold">Proposal accepted</p><p className="mt-0.5 text-[11px] text-white/45">Your project is ready</p></div></div>
        <div className="absolute -bottom-6 -right-3 hidden items-center gap-3 rounded-2xl border border-white/10 bg-[#1a2131] p-3.5 shadow-xl sm:flex"><div className="flex -space-x-2"><span className="grid h-8 w-8 place-items-center rounded-full border-2 border-[#1a2131] bg-orange-300 text-[10px] font-bold text-slate-900">JM</span><span className="grid h-8 w-8 place-items-center rounded-full border-2 border-[#1a2131] bg-violet-300 text-[10px] font-bold text-slate-900">AM</span></div><div><p className="text-xs font-semibold">A team of two</p><p className="mt-0.5 text-[11px] text-white/45">One shared goal</p></div></div>
      </div>
    </section>

    <section className="border-y border-white/[.06] bg-white/[.018]"><div className="mx-auto grid max-w-7xl gap-6 px-5 py-7 text-center sm:grid-cols-3 sm:px-8 lg:px-12"><p className="text-sm text-white/55"><span className="font-semibold text-white">Clients</span> with a clear vision</p><p className="text-sm text-white/55"><span className="font-semibold text-white">Freelancers</span> with room to do their best work</p><p className="text-sm text-white/55"><span className="font-semibold text-white">Projects</span> with a plan everyone can see</p></div></section>

    <section id="how-it-works" className="mx-auto max-w-7xl scroll-mt-12 px-5 py-24 sm:px-8 lg:px-12 lg:py-32"><div className="mx-auto max-w-2xl text-center"><p className="text-xs font-bold uppercase tracking-[.2em] text-violet-300">Simple by design</p><h2 className="mt-4 text-3xl font-semibold tracking-[-.04em] sm:text-5xl">From first hello to<br className="hidden sm:block" /> work well done.</h2><p className="mt-5 text-sm leading-7 text-white/50 sm:text-base">Good collaboration should feel clear from the start. Archer keeps the important parts in one place.</p></div><div className="mt-14 grid gap-4 md:grid-cols-3">{steps.map(({ number, icon: Icon, title, description }) => <article key={number} className="group rounded-3xl border border-white/[.07] bg-[#141a28]/55 p-6 transition hover:-translate-y-1 hover:border-violet-300/20 hover:bg-[#141a28] sm:p-8"><div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-300/10 text-violet-200"><Icon className="h-5 w-5" /></span><span className="font-display text-sm font-semibold text-white/25">{number}</span></div><h3 className="mt-8 text-xl font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-white/50">{description}</p><ChevronRight className="mt-7 h-4 w-4 text-violet-300 transition-transform group-hover:translate-x-1" /></article>)}</div></section>

    <section id="built-for-both" className="mx-auto max-w-7xl px-5 pb-24 sm:px-8 lg:px-12 lg:pb-32"><div className="relative overflow-hidden rounded-[2rem] border border-violet-300/15 bg-gradient-to-br from-[#1a1a2e] via-[#171a2b] to-[#11202a] px-6 py-12 sm:px-12 sm:py-16 lg:px-16"><div className="absolute -right-24 -top-36 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl"/><div className="relative grid items-center gap-10 md:grid-cols-[1fr_auto]"><div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[.2em] text-violet-300">Better work, together</p><h2 className="mt-4 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Your next great collaboration is one conversation away.</h2><p className="mt-4 max-w-xl text-sm leading-7 text-white/55">Join Archer to discover good projects, thoughtful people, and a clearer way to work together.</p><div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-xs text-white/50"><span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-emerald-300"/>Client and freelancer workspaces</span><span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-emerald-300"/>USD and MMK project budgets</span></div></div><Link to="/register" className="relative"><Button size="lg" className="w-full rounded-2xl px-7 sm:w-auto">Create your free account <ArrowRight className="h-4 w-4"/></Button></Link></div></div></section>

    <footer className="border-t border-white/[.06]"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-5 py-7 sm:flex-row sm:items-center sm:px-8 lg:px-12"><div className="flex items-center gap-3"><Brand compact /><span className="text-xs text-white/35">Built for people who make things.</span></div><p className="text-xs text-white/35">© 2026 Archer. Good work starts here.</p></div></footer>
  </main>;
}

function Milestone({ title, state, label, progress }: { title: string; state: "complete" | "active" | "pending"; label: string; progress: number }) {
  return <div className="flex items-center gap-3"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${state === "complete" ? "bg-emerald-400/10 text-emerald-300" : state === "active" ? "bg-violet-400/10 text-violet-200" : "bg-white/[.05] text-white/35"}`}>{state === "complete" ? <Check className="h-4 w-4"/> : <span className="h-2 w-2 rounded-full bg-current"/>}</span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="truncate text-xs font-medium">{title}</p><span className="shrink-0 text-[10px] text-white/40">{label}</span></div><div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[.07]"><div className={`h-full rounded-full ${state === "complete" ? "bg-emerald-300" : "bg-violet-300"}`} style={{ width: `${progress}%` }}/></div></div></div>;
}
