import { MODES, type ModeId } from "@/lib/modes";
import { Crown, Sparkles, Zap, Bolt, Lock } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

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
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {MODES.map((m) => {
        const Icon = ICONS[m.id];
        const active = value === m.id;
        const locked = m.pro && !isPro;
        return (
          <button
            key={m.id}
            type="button"
            aria-disabled={locked}
            onClick={() => {
              if (locked) {
                toast.message(`${m.name} is Pro-only`, {
                  description:
                    "Upgrade to Genelo Pro for TSh 1,200/month to unlock.",
                  action: {
                    label: "Upgrade",
                    onClick: () => navigate({ to: "/pricing" }),
                  },
                });
                return;
              }
              onChange(m.id);
            }}
            className={`group rounded-xl border px-3 py-3 text-left transition-all ${
              active
                ? "border-foreground bg-foreground text-background shadow-sm"
                : locked
                  ? "border-border bg-card opacity-60 hover:opacity-80"
                  : "border-border bg-card hover:border-foreground/30"
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <span className="text-sm font-semibold">{m.name}</span>
              {locked && (
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-genelo-soft px-1.5 py-0.5 text-[10px] font-medium text-genelo">
                  <Lock className="h-2.5 w-2.5" /> PRO
                </span>
              )}
            </div>
            <div
              className={`mt-1 text-[11px] ${active ? "text-background/70" : "text-muted-foreground"}`}
            >
              {m.tag} ·{" "}
              {isPro || m.imageLimit >= 9999
                ? "Unlimited"
                : `${m.imageLimit}/day`}{" "}
              images
            </div>
          </button>
        );
      })}
    </div>
  );
}
