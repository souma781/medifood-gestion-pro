import { cn } from "@/lib/utils";

const orderColors: Record<string, string> = {
  "En attente": "bg-warning/15 text-warning border-warning/30",
  "Confirmée": "bg-info/15 text-info border-info/30",
  "En préparation": "bg-primary/10 text-primary border-primary/30",
  "Livrée": "bg-success/15 text-success border-success/30",
  "Annulée": "bg-destructive/15 text-destructive border-destructive/30",
  "Brouillon": "bg-muted text-muted-foreground border-border",
  "Émise": "bg-info/15 text-info border-info/30",
  "Payée": "bg-success/15 text-success border-success/30",
  "En retard": "bg-destructive/15 text-destructive border-destructive/30",
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