import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Package, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/medifood/PageHeader";
import { StatusBadge } from "@/components/medifood/StatusBadge";
import { formatDate, formatKg } from "@/lib/format";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import type { Product, StockMovement } from "@/store/data";

// ─── Sub-components ───────────────────────────────────────────────────────────

type StockCardProps = {
  product: Product;
  onAdjust: (m: Omit<StockMovement, "id">) => Promise<void>;
};

function StockCard({ product, onAdjust }: StockCardProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"Entrée" | "Sortie" | "Ajustement">("Entrée");
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState("");

  const pct = Math.min(100, (product.currentStock / product.maxCapacity) * 100);
  const color = pct > 50 ? "bg-success" : pct > 20 ? "bg-warning" : "bg-destructive";

  const submit = async () => {
    if (!qty) return toast.error("Quantité requise");
    try {
      await onAdjust({ date: new Date().toISOString(), productId: product.id, type, quantity: parseFloat(qty), reason: reason || "—", user: "Admin" });
      toast.success("Stock ajusté");
      setOpen(false); setQty(""); setReason("");
    } catch {
      toast.error("Erreur lors de l'ajustement");
    }
  };

  return (
    <Card className="card-soft border-0">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Package className="h-4 w-4 text-primary" />
          {product.name}
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-3xl font-bold text-foreground">{formatKg(product.currentStock)}</span>
          <span className="text-xs text-muted-foreground">/ {formatKg(product.maxCapacity)}</span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className={cn("h-full transition-all", color)} style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>Min: {formatKg(product.minStock)}</span>
          <span>{Math.round(pct)}%</span>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="mt-4 w-full">Ajuster le stock</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Ajuster — {product.name}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Type de mouvement</Label>
                <Select value={type} onValueChange={(v) => setType(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Entrée">Entrée</SelectItem>
                    <SelectItem value="Sortie">Sortie</SelectItem>
                    <SelectItem value="Ajustement">Ajustement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Quantité (kg)</Label>
                <Input type="number" step="0.1" value={qty} onChange={(e) => setQty(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Raison</Label>
                <Input value={reason} onChange={(e) => setReason(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button onClick={submit}>Confirmer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

type MovementsProps = {
  movements: StockMovement[];
  products: Product[];
};

function Movements({ movements, products }: MovementsProps) {
  return (
    <Card className="card-soft border-0">
      <CardHeader><CardTitle>Mouvements de stock</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Produit</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Quantité</TableHead>
              <TableHead>Raison</TableHead>
              <TableHead>Utilisateur</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.map((m) => (
              <TableRow key={m.id}>
                <TableCell>{formatDate(m.date)}</TableCell>
                <TableCell className="font-medium">{products.find((p) => p.id === m.productId)?.name}</TableCell>
                <TableCell><StatusBadge status={m.type} /></TableCell>
                <TableCell className="text-right">{formatKg(m.quantity)}</TableCell>
                <TableCell className="text-muted-foreground">{m.reason}</TableCell>
                <TableCell className="text-muted-foreground">{m.user}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

type AlertsProps = {
  products: Product[];
};

function Alerts({ products }: AlertsProps) {
  const low = products.filter((p) => p.currentStock < p.minStock);
  return (
    <Card className="card-soft border-0">
      <CardHeader><CardTitle>Alertes de stock</CardTitle></CardHeader>
      <CardContent>
        {low.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">Aucune alerte — tout est OK</div>
        ) : (
          <div className="space-y-3">
            {low.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/15 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{p.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Stock: <span className="text-destructive font-semibold">{formatKg(p.currentStock)}</span> · Seuil min: {formatKg(p.minStock)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-destructive px-2.5 py-0.5 text-xs font-medium text-destructive-foreground">Critique</span>
                  <Button size="sm" variant="outline"><ShoppingCart className="h-4 w-4 mr-2" />Commander</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Inventaire() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = () => {
    Promise.all([api.products.getAll(), api.stock.getMovements()])
      .then(([prods, movs]) => {
        setProducts(prods as Product[]);
        setMovements(movs as StockMovement[]);
      })
      .catch(() => toast.error("Erreur lors du chargement des données"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, []);

  const handleAddMovement = async (m: Omit<StockMovement, "id">) => {
    await api.stock.addMovement(m);
    reload();
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Inventaire" description="Gestion du stock et des mouvements" />
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground animate-pulse">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Inventaire" description="Gestion du stock et des mouvements" />
      <Tabs defaultValue="stock">
        <TabsList>
          <TabsTrigger value="stock">Stock actuel</TabsTrigger>
          <TabsTrigger value="moves">Mouvements</TabsTrigger>
          <TabsTrigger value="alerts">Alertes</TabsTrigger>
        </TabsList>
        <TabsContent value="stock" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (<StockCard key={p.id} product={p} onAdjust={handleAddMovement} />))}
          </div>
        </TabsContent>
        <TabsContent value="moves" className="mt-4">
          <Movements movements={movements} products={products} />
        </TabsContent>
        <TabsContent value="alerts" className="mt-4">
          <Alerts products={products} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
