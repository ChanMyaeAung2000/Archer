import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(amount: number, currency: "USD" | "MMK") {
  const value = currency === "USD" ? amount / 100 : amount;
  return new Intl.NumberFormat(currency === "USD" ? "en-US" : "my-MM", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "USD" ? 2 : 0
  }).format(value);
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "No deadline";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}
