import { MODES, type ModeId } from "@/lib/modes";
import { Crown, Sparkles, Zap, Bolt } from "lucide-react";

const ICONS: Record<ModeId, typeof Sparkles> = {
  gn2: Sparkles,
  gn35: Zap,
  "gn-flash": Bolt,
  "gn-pro": Crown,
};

export function ModeSelector({
  value,
  onChange,
  isPro,
}: {
  value: ModeId;
  onChange: (m: ModeId) => void;
  isPro: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {MODES.map((m) => {
        const Icon = ICONS[m.id];
        const active = value === m.id;
        const locked = m.pro && !isPro;
        return (
          <button
            key={m.id}
            onClick={() => onChange(m.id)}
            className={`group rounded-xl border px-3 py-3 text-left transition-all ${
              active
                ? "border-foreground bg-foreground text-background shadow-sm"
                : "border-border bg-card hover:border-foreground/30"
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <span className="text-sm font-semibold">{m.name}</span>
              {locked && (
                <span className="ml-auto rounded-full bg-genelo-soft px-1.5 py-0.5 text-[10px] font-medium text-genelo">
                  PRO
                </span>
              )}
            </div>
            <div
              className={`mt-1 text-[11px] ${active ? "text-background/70" : "text-muted-foreground"}`}
            >
              {m.tag} · {m.imageLimit >= 9999 ? "Unlimited" : `${m.imageLimit}/day`} images
            </div>
          </button>
        );
      })}
    </div>
  );
}
