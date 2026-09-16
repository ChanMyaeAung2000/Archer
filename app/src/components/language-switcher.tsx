import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { i18n } = useTranslation();
  const isMyanmar = i18n.resolvedLanguage === "my";
  return <Button variant="outline" size={compact ? "sm" : "default"} onClick={() => void i18n.changeLanguage(isMyanmar ? "en" : "my")} aria-label={isMyanmar ? "Switch to English" : "မြန်မာဘာသာသို့ပြောင်းရန်"}><Languages className="h-4 w-4" />{compact ? (isMyanmar ? "EN" : "မြန်မာ") : isMyanmar ? "English" : "မြန်မာ"}</Button>;
}
