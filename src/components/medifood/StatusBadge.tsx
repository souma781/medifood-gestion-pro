import { cn } from "@/lib/utils";

const orderColors: Record<string, string> = {
  // Production workflow statuses
  "En attente": "bg-warning/15 text-warning border-warning/30",
  "En cuisson": "bg-orange-500/15 text-orange-600 border-orange-500/30",
  "Cuit": "bg-amber-500/15 text-amber-700 border-amber-500/30",
  "En emballage": "bg-primary/10 text-primary border-primary/30",
  "Terminé": "bg-success/15 text-success border-success/30",
  "Refusé": "bg-destructive/15 text-destructive border-destructive/30",
  // Legacy / delivery
  "Brouillon": "bg-muted text-muted-foreground border-border",
  "Émis": "bg-info/15 text-info border-info/30",
  "Livré": "bg-success/15 text-success border-success/30",
  // Stock movements
  "Entrée": "bg-success/15 text-success border-success/30",
  "Sortie": "bg-destructive/15 text-destructive border-destructive/30",
  "Ajustement": "bg-info/15 text-info border-info/30",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        orderColors[status] ?? "bg-muted text-muted-foreground border-border",
      )}
    >
      {status}
    </span>
  );
}
