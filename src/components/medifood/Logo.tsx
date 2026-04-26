import { Sprout } from "lucide-react";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground shadow-sm">
        <Sprout className="h-5 w-5" strokeWidth={2.5} />
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="text-base font-bold tracking-tight text-sidebar-foreground">MEDIFOOD</div>
          <div className="text-[10px] uppercase tracking-widest text-sidebar-foreground/60">Tunisie</div>
        </div>
      )}
    </div>
  );
}