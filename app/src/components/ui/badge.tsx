import { cn } from "@/lib/utils";

export function Badge({ className, variant = "default", ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "secondary" | "outline" }) {
  return <div className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[.12em]", variant === "default" && "bg-primary/12 text-primary", variant === "secondary" && "bg-secondary text-secondary-foreground", variant === "outline" && "border border-border text-muted-foreground", className)} {...props} />;
}
