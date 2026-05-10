import React, { useState, useEffect, createContext, useContext } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  LayoutGrid,
  List,
  Plus,
  Trash2,
  Wrench,
  ChevronRight,
  PackageX,
  Users,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { type OrderStatus, type Order, type Incident } from "@/store/data";
import { useAuth, type ProductionRole } from "@/store/auth";
import { PageHeader } from "@/components/medifood/PageHeader";
import { StatusBadge } from "@/components/medifood/StatusBadge";
import { formatTND, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import type { Product, Client } from "@/store/data";

// ─── Page-level context ───────────────────────────────────────────────────────

type CmdCtxValue = {
  orders: Order[];
  clients: Client[];
  products: Product[];
  updateOrderStatus: (id: string, status: OrderStatus, partialQty?: Record<string, number>, refusalReason?: string) => Promise<void>;
  addOrder: (o: Omit<Order, "id" | "number">) => Promise<void>;
  addIncident: (i: Omit<Incident, "id">) => Promise<void>;
  reload: () => void;
};

const CmdCtx = createContext<CmdCtxValue>(null!);
const useCmdCtx = () => useContext(CmdCtx);

// ─── Role helpers ─────────────────────────────────────────────────────────────

const ALL_PROD_STATUSES: OrderStatus[] = [
  "En attente", "En cuisson", "Cuit", "En emballage", "Terminé", "Refusé",
];

function getAllowedStatuses(productionRole: ProductionRole): OrderStatus[] {
  switch (productionRole) {
    case "cuisson": return ["En attente", "En cuisson", "Cuit", "Refusé"];
    case "emballage": return ["En emballage", "Terminé", "Refusé"];
    case "mixte": return ALL_PROD_STATUSES;
  }
}

function getKanbanColumns(productionRole?: ProductionRole): OrderStatus[] {
  if (!productionRole) return ALL_PROD_STATUSES;
  switch (productionRole) {
    case "cuisson": return ["En attente", "En cuisson", "Cuit"];
    case "emballage": return ["Cuit", "En emballage", "Terminé", "Refusé"];
    case "mixte": return ALL_PROD_STATUSES;
  }
}

// ─── Status-change dialog ─────────────────────────────────────────────────────

type StatusDialogProps = {
  order: Order | null;
  productionRole: ProductionRole;
  onClose: () => void;
};

function StatusDialog({ order, productionRole, onClose }: StatusDialogProps) {
  const { updateOrderStatus, products } = useCmdCtx();
  const user = useAuth((s) => s.user);
  const [newStatus, setNewStatus] = useState<OrderStatus | "">("");
  const [mode, setMode] = useState<"total" | "partiel">("total");
  const [partialQty, setPartialQty] = useState<Record<string, number>>({});
  const [refusalReason, setRefusalReason] = useState("");

  if (!order) return null;

  const allowed = getAllowedStatuses(productionRole).filter((s) => s !== order.status);
  const myProductItems = order.items.filter((it) => {
    const prodName = products.find((p) => p.id === it.productId)?.name;
    return prodName && user?.assignedProducts?.includes(prodName);
  });

  const submit = async () => {
    if (!newStatus) return;
    try {
      const partial = mode === "partiel" ? partialQty : undefined;
      await updateOrderStatus(order.id, newStatus, partial, newStatus === "Refusé" ? refusalReason : undefined);
      toast.success(`Statut mis à jour : ${newStatus}`);
      onClose();
    } catch {
      toast.error("Erreur lors de la mise à jour du statut");
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Changer le statut — {order.number}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Nouveau statut</Label>
            <Select value={newStatus} onValueChange={(v) => setNewStatus(v as OrderStatus)}>
              <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
              <SelectContent>
                {allowed.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {newStatus && newStatus !== "Refusé" && (
            <div className="space-y-1.5">
              <Label>Traitement</Label>
              <div className="flex gap-2">
                <Button size="sm" variant={mode === "total" ? "default" : "outline"} onClick={() => setMode("total")}>En totalité</Button>
                <Button size="sm" variant={mode === "partiel" ? "default" : "outline"} onClick={() => setMode("partiel")}>En partie</Button>
              </div>
              {mode === "partiel" && myProductItems.length > 0 && (
                <div className="mt-2 space-y-2 rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Quantité traitée (kg)</p>
                  {myProductItems.map((it) => {
                    const prod = products.find((p) => p.id === it.productId);
                    return (
                      <div key={it.productId} className="flex items-center gap-3">
                        <span className="flex-1 text-sm">{prod?.name}</span>
                        <span className="text-xs text-muted-foreground">/ {it.quantity} kg</span>
                        <Input
                          type="number"
                          className="w-24"
                          placeholder="0"
                          max={it.quantity}
                          value={partialQty[it.productId] ?? ""}
                          onChange={(e) => setPartialQty({ ...partialQty, [it.productId]: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {newStatus === "Refusé" && (
            <div className="space-y-1.5">
              <Label>Motif du refus</Label>
              <Textarea rows={2} placeholder="Expliquer la raison du refus..." value={refusalReason} onChange={(e) => setRefusalReason(e.target.value)} />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button
            disabled={!newStatus || (newStatus === "Refusé" && !refusalReason.trim())}
            variant={newStatus === "Refusé" ? "destructive" : "default"}
            onClick={submit}
          >
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Incident dialog ──────────────────────────────────────────────────────────

type IncidentDialogProps = {
  order: Order | null;
  open: boolean;
  onClose: () => void;
};

type IncidentKind = "panne_machine" | "stock_insuffisant" | "manque_ouvriers" | "autre";

const INCIDENT_OPTIONS: { value: IncidentKind; label: string; icon: React.ReactNode }[] = [
  { value: "panne_machine", label: "Panne machine", icon: <Wrench className="h-3.5 w-3.5" /> },
  { value: "stock_insuffisant", label: "Stock insuffisant", icon: <PackageX className="h-3.5 w-3.5" /> },
  { value: "manque_ouvriers", label: "Manque d'ouvriers", icon: <Users className="h-3.5 w-3.5" /> },
  { value: "autre", label: "Autre", icon: <FileText className="h-3.5 w-3.5" /> },
];

function IncidentDialog({ order, open, onClose }: IncidentDialogProps) {
  const { addIncident, products } = useCmdCtx();
  const user = useAuth((s) => s.user);
  const [type, setType] = useState<IncidentKind>("panne_machine");
  const [description, setDescription] = useState("");

  const submit = async () => {
    try {
      await addIncident({
        date: new Date().toISOString(),
        type,
        description,
        orderId: order?.id,
        reportedBy: user?.name ?? "Production",
      });
      toast.success("Incident signalé");
      setDescription("");
      onClose();
    } catch {
      toast.error("Erreur lors du signalement");
    }
  };

  const orderProductNames = order?.items
    .map((it) => products.find((p) => p.id === it.productId)?.name)
    .filter(Boolean)
    .join(", ");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Signaler un incident
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {order && (
            <div className="rounded-lg bg-muted/40 p-3 text-sm">
              <span className="text-muted-foreground">Commande : </span>
              <span className="font-medium">{order.number}</span>
              {orderProductNames && (
                <span className="text-muted-foreground"> — {orderProductNames}</span>
              )}
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Type d'incident</Label>
            <div className="grid grid-cols-2 gap-2">
              {INCIDENT_OPTIONS.map((opt) => (
                <Button key={opt.value} size="sm" variant={type === opt.value ? "default" : "outline"} onClick={() => setType(opt.value)} className="gap-1.5 justify-start">
                  {opt.icon}{opt.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{type === "autre" ? "Description du problème" : "Description"}</Label>
            <Textarea
              rows={3}
              placeholder={
                type === "autre" ? "Décrivez le problème en détail..."
                  : type === "manque_ouvriers" ? "Nombre d'ouvriers manquants, poste concerné..."
                  : type === "panne_machine" ? "Machine concernée, nature de la panne..."
                  : "Produit concerné, quantité manquante..."
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button disabled={!description.trim()} onClick={submit} className="gap-1.5">
            <AlertTriangle className="h-4 w-4" />Signaler
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Production order card ────────────────────────────────────────────────────

type OrderCardProps = {
  order: Order;
  productionRole: ProductionRole;
};

function ProductionOrderCard({ order, productionRole }: OrderCardProps) {
  const { clients, products } = useCmdCtx();
  const [statusDialog, setStatusDialog] = useState(false);
  const [incidentDialog, setIncidentDialog] = useState(false);
  const client = clients.find((c) => c.id === order.clientId);
  const allowed = getAllowedStatuses(productionRole).filter((s) => s !== order.status);
  const canChange = allowed.length > 0 && order.status !== "Terminé" && order.status !== "Refusé";

  return (
    <>
      <Card className="card-soft border-0">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-mono text-xs text-muted-foreground">{order.number}</div>
              <div className="mt-0.5 font-semibold text-sm">{client?.company ?? "—"}</div>
            </div>
            <StatusBadge status={order.status} />
          </div>

          <div className="mt-3 space-y-1">
            {order.items.map((it, i) => {
              const prod = products.find((p) => p.id === it.productId);
              const partial = order.partialQuantities?.[it.productId];
              return (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span>{prod?.name}</span>
                  <span className="text-muted-foreground">
                    {partial !== undefined ? (
                      <span>
                        <span className="font-medium text-warning">{partial}</span>
                        <span> / {it.quantity} kg</span>
                        <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0 border-warning/40 text-warning">partiel</Badge>
                      </span>
                    ) : (
                      `${it.quantity} kg`
                    )}
                  </span>
                </div>
              );
            })}
          </div>

          {order.refusalReason && (
            <div className="mt-2 rounded bg-destructive/10 px-2 py-1 text-xs text-destructive">
              Refus : {order.refusalReason}
            </div>
          )}

          <div className="mt-3 text-xs text-muted-foreground">{formatDate(order.date)}</div>

          {order.status !== "Terminé" && order.status !== "Refusé" && (
            <div className="mt-3 flex flex-wrap gap-2">
              {canChange && (
                <Button size="sm" className="gap-1.5 h-8" onClick={() => setStatusDialog(true)}>
                  <ChevronRight className="h-3.5 w-3.5" />Changer statut
                </Button>
              )}
              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-warning border-warning/40 hover:bg-warning/10" onClick={() => setIncidentDialog(true)}>
                <AlertTriangle className="h-3.5 w-3.5" />Incident
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {statusDialog && (
        <StatusDialog order={order} productionRole={productionRole} onClose={() => setStatusDialog(false)} />
      )}
      <IncidentDialog order={order} open={incidentDialog} onClose={() => setIncidentDialog(false)} />
    </>
  );
}

// ─── Production view ──────────────────────────────────────────────────────────

function ProductionView() {
  const user = useAuth((s) => s.user);
  const { orders, products } = useCmdCtx();
  const productionRole = user?.productionRole ?? "mixte";

  const myOrders = orders.filter((o) =>
    !user?.assignedProducts?.length ||
    o.items.some((it) => {
      const prodName = products.find((p) => p.id === it.productId)?.name;
      return prodName && user.assignedProducts!.includes(prodName);
    }),
  );

  const columns = getKanbanColumns(productionRole);
  const [activeTab, setActiveTab] = useState<"kanban" | "liste">("kanban");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {user?.assignedProducts?.length
              ? `Commandes pour : ${user.assignedProducts.join(", ")}`
              : "Toutes les commandes de production"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 capitalize">Rôle : {productionRole}</p>
        </div>
        <div className="flex gap-1 rounded-md border border-border bg-card p-1">
          <Button size="sm" variant={activeTab === "kanban" ? "default" : "ghost"} onClick={() => setActiveTab("kanban")}>
            <LayoutGrid className="h-4 w-4 mr-1" />Kanban
          </Button>
          <Button size="sm" variant={activeTab === "liste" ? "default" : "ghost"} onClick={() => setActiveTab("liste")}>
            <List className="h-4 w-4 mr-1" />Liste
          </Button>
        </div>
      </div>

      {activeTab === "kanban" ? (
        <div className={cn("grid gap-4", columns.length <= 3 ? "md:grid-cols-3" : columns.length <= 4 ? "md:grid-cols-4" : "md:grid-cols-3 lg:grid-cols-6")}>
          {columns.map((col) => {
            const list = myOrders.filter((o) => o.status === col);
            return (
              <div key={col} className="rounded-lg bg-muted/40 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{col}</h3>
                  <span className="rounded-full bg-card px-2 py-0.5 text-xs">{list.length}</span>
                </div>
                <div className="space-y-2">
                  {list.map((o) => (
                    <ProductionOrderCard key={o.id} order={o} productionRole={productionRole} />
                  ))}
                  {list.length === 0 && (
                    <div className="rounded border border-dashed border-border py-6 text-center text-xs text-muted-foreground">Aucune commande</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {myOrders.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">Aucune commande assignée</div>
          )}
          {myOrders.map((o) => (
            <ProductionOrderCard key={o.id} order={o} productionRole={productionRole} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Commercial views ─────────────────────────────────────────────────────────

function CommercialKanban() {
  const { orders, clients } = useCmdCtx();
  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
      {ALL_PROD_STATUSES.map((status) => {
        const list = orders.filter((o) => o.status === status);
        return (
          <div key={status} className="rounded-lg bg-muted/40 p-3">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">{status}</h3>
              <span className="rounded-full bg-card px-2 py-0.5 text-xs">{list.length}</span>
            </div>
            <div className="space-y-2">
              {list.map((o) => {
                const total = o.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
                return (
                  <div key={o.id} className="rounded-lg border border-border bg-card p-3 shadow-sm">
                    <div className="font-mono text-xs text-muted-foreground">{o.number}</div>
                    <div className="mt-1 font-medium text-sm">{clients.find((c) => c.id === o.clientId)?.company}</div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{o.items.length} produit(s)</span>
                      <span className="font-semibold text-primary">{formatTND(total)}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{formatDate(o.date)}</div>
                    {o.refusalReason && (
                      <div className="mt-1.5 rounded bg-destructive/10 px-1.5 py-1 text-[10px] text-destructive leading-tight">{o.refusalReason}</div>
                    )}
                  </div>
                );
              })}
              {list.length === 0 && (
                <div className="rounded border border-dashed border-border py-6 text-center text-xs text-muted-foreground">Aucune commande</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CommercialListView() {
  const { orders, clients } = useCmdCtx();
  return (
    <Card className="card-soft border-0">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N°</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Produits</TableHead>
              <TableHead className="text-right">Montant</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((o) => {
              const total = o.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
              return (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">{o.number}</TableCell>
                  <TableCell className="font-medium">{clients.find((c) => c.id === o.clientId)?.company}</TableCell>
                  <TableCell>{formatDate(o.date)}</TableCell>
                  <TableCell className="text-right">{o.items.length}</TableCell>
                  <TableCell className="text-right font-semibold">{formatTND(total)}</TableCell>
                  <TableCell>
                    <StatusBadge status={o.status} />
                    {o.refusalReason && (
                      <div className="mt-1 text-xs text-muted-foreground max-w-48 truncate">{o.refusalReason}</div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ─── New Order wizard ─────────────────────────────────────────────────────────

function NewOrder() {
  const { clients, products, addOrder } = useCmdCtx();
  const [step, setStep] = useState(1);
  const [clientId, setClientId] = useState("");
  const [items, setItems] = useState<{ productId: string; quantity: number; unitPrice: number }[]>([]);
  const [delivery, setDelivery] = useState(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const client = clients.find((c) => c.id === clientId);

  const reset = () => { setStep(1); setClientId(""); setItems([]); setNotes(""); };

  const submit = async () => {
    try {
      await addOrder({ clientId, date: new Date().toISOString(), deliveryDate: new Date(delivery).toISOString(), items, status: "En attente", notes });
      toast.success("Commande créée");
      reset();
    } catch {
      toast.error("Erreur lors de la création de la commande");
    }
  };

  return (
    <Card className="card-soft border-0 max-w-4xl">
      <CardHeader>
        <CardTitle>Nouvelle commande</CardTitle>
        <div className="mt-3 flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold", step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{s}</div>
              {s < 3 && <div className={cn("h-0.5 w-12", step > s ? "bg-primary" : "bg-muted")} />}
            </div>
          ))}
          <span className="ml-3 text-sm text-muted-foreground">{step === 1 ? "Client" : step === 2 ? "Produits" : "Confirmation"}</span>
        </div>
      </CardHeader>
      <CardContent>
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Client</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un client" /></SelectTrigger>
                <SelectContent>
                  {clients.filter((c) => c.active).map((c) => (<SelectItem key={c.id} value={c.id}>{c.company} — {c.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            {client && (
              <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
                <div className="font-semibold">{client.company}</div>
                <div className="text-muted-foreground">{client.name}</div>
                <div className="text-muted-foreground">{client.address}, {client.city}</div>
                <div className="text-muted-foreground">{client.phone}</div>
              </div>
            )}
            <div className="flex justify-end"><Button disabled={!clientId} onClick={() => setStep(2)}>Suivant</Button></div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <Button variant="outline" size="sm" onClick={() => setItems([...items, { productId: products[0]?.id ?? "", quantity: 50, unitPrice: 30 }])}>
              <Plus className="h-4 w-4 mr-2" />Ajouter un produit
            </Button>
            {items.length === 0 && <div className="py-8 text-center text-muted-foreground text-sm">Aucun produit ajouté</div>}
            {items.map((it, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2">
                <Select value={it.productId} onValueChange={(v) => setItems(items.map((x, i) => i === idx ? { ...x, productId: v } : x))}>
                  <SelectTrigger className="col-span-5"><SelectValue /></SelectTrigger>
                  <SelectContent>{products.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}</SelectContent>
                </Select>
                <Input className="col-span-2" type="number" placeholder="Qté kg" value={it.quantity} onChange={(e) => setItems(items.map((x, i) => i === idx ? { ...x, quantity: parseFloat(e.target.value) || 0 } : x))} />
                <Input className="col-span-2" type="number" placeholder="PU" value={it.unitPrice} onChange={(e) => setItems(items.map((x, i) => i === idx ? { ...x, unitPrice: parseFloat(e.target.value) || 0 } : x))} />
                <div className="col-span-2 flex items-center text-sm font-semibold">{formatTND(it.quantity * it.unitPrice)}</div>
                <Button variant="ghost" size="icon" className="col-span-1 text-destructive" onClick={() => setItems(items.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            <div className="flex items-center justify-between border-t pt-3">
              <span className="font-semibold">Total</span>
              <span className="text-lg font-bold text-primary">{formatTND(total)}</span>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>Précédent</Button>
              <Button disabled={items.length === 0} onClick={() => setStep(3)}>Suivant</Button>
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border p-4">
              <div className="text-sm text-muted-foreground">Client</div>
              <div className="font-semibold">{client?.company}</div>
              <div className="mt-3 space-y-1 border-t pt-3 text-sm">
                {items.map((it, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{products.find((p) => p.id === it.productId)?.name} × {it.quantity} kg</span>
                    <span className="font-medium">{formatTND(it.quantity * it.unitPrice)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex justify-between border-t pt-3 font-bold">
                <span>Total</span><span className="text-primary">{formatTND(total)}</span>
              </div>
            </div>
            <div className="space-y-1.5"><Label>Date de livraison</Label><Input type="date" value={delivery} onChange={(e) => setDelivery(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Notes</Label><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>Précédent</Button>
              <Button onClick={submit}>Confirmer la commande</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Tracking ─────────────────────────────────────────────────────────────────

function Tracking() {
  const { orders, clients } = useCmdCtx();
  const steps = ALL_PROD_STATUSES;
  const idx = (s: OrderStatus) => steps.indexOf(s);

  return (
    <div className="space-y-3">
      {orders.filter((o) => o.status !== "Refusé").slice(0, 6).map((o) => {
        const current = idx(o.status);
        return (
          <Card key={o.id} className="card-soft border-0">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="font-mono text-xs text-muted-foreground">{o.number}</div>
                  <div className="font-semibold">{clients.find((c) => c.id === o.clientId)?.company}</div>
                </div>
                <StatusBadge status={o.status} />
              </div>
              <div className="flex items-center justify-between overflow-x-auto">
                {(["En attente", "En cuisson", "Cuit", "En emballage", "Terminé"] as OrderStatus[]).map((s, i) => {
                  const done = idx(s) <= current;
                  return (
                    <div key={s} className="flex flex-1 items-center min-w-0">
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        {done ? (
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                        <span className={cn("text-[10px] text-center leading-tight max-w-12", done ? "font-medium" : "text-muted-foreground")}>{s}</span>
                      </div>
                      {i < 4 && <div className={cn("h-0.5 flex-1 mx-1", done && idx(steps[i + 1]) <= current ? "bg-success" : "bg-border")} />}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Standalone incident report ───────────────────────────────────────────────

function IncidentReport() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Button variant="outline" className="gap-2 border-warning/40 text-warning hover:bg-warning/10" onClick={() => setOpen(true)}>
        <AlertTriangle className="h-4 w-4" />Signaler un incident général
      </Button>
      <IncidentDialog order={null} open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

// ─── Page root ────────────────────────────────────────────────────────────────

export default function Commandes() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuth((s) => s.user);
  const isProduction = user?.role === "Responsable Production";
  const [view, setView] = useState<"kanban" | "list">("kanban");

  const reload = () => {
    Promise.all([
      api.orders.getAll(),
      api.clients.getAll(),
      api.products.getAll(),
    ])
      .then(([ords, cls, prods]) => {
        setOrders(ords as Order[]);
        setClients(cls as Client[]);
        setProducts(prods as Product[]);
      })
      .catch(() => toast.error("Erreur lors du chargement des données"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, []);

  const handleUpdateOrderStatus = async (
    id: string,
    status: OrderStatus,
    partialQty?: Record<string, number>,
    refusalReason?: string,
  ) => {
    await api.orders.updateStatus(id, { status, partialQuantities: partialQty, refusalReason });
    reload();
  };

  const handleAddOrder = async (o: Omit<Order, "id" | "number">) => {
    await api.orders.create(o);
    reload();
  };

  const handleAddIncident = async (i: Omit<Incident, "id">) => {
    await api.incidents.create(i);
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Commandes" description="Gestion et suivi des commandes clients" />
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground animate-pulse">Chargement des données...</p>
        </div>
      </div>
    );
  }

  const ctxValue: CmdCtxValue = {
    orders,
    clients,
    products,
    updateOrderStatus: handleUpdateOrderStatus,
    addOrder: handleAddOrder,
    addIncident: handleAddIncident,
    reload,
  };

  if (isProduction) {
    return (
      <CmdCtx.Provider value={ctxValue}>
        <div>
          <PageHeader
            title="Mes Commandes"
            description={`Suivi de production${user?.assignedProducts?.length ? ` — ${user.assignedProducts.join(", ")}` : ""}`}
          />
          <div className="mb-4"><IncidentReport /></div>
          <ProductionView />
        </div>
      </CmdCtx.Provider>
    );
  }

  return (
    <CmdCtx.Provider value={ctxValue}>
      <div>
        <PageHeader title="Commandes" description="Gestion et suivi des commandes clients" />
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">Toutes</TabsTrigger>
            <TabsTrigger value="new">Nouvelle commande</TabsTrigger>
            <TabsTrigger value="track">Suivi</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4">
            <div className="mb-3 flex justify-end gap-1 rounded-md border border-border bg-card p-1 w-fit ml-auto">
              <Button size="sm" variant={view === "kanban" ? "default" : "ghost"} onClick={() => setView("kanban")}>
                <LayoutGrid className="h-4 w-4 mr-1" />Kanban
              </Button>
              <Button size="sm" variant={view === "list" ? "default" : "ghost"} onClick={() => setView("list")}>
                <List className="h-4 w-4 mr-1" />Liste
              </Button>
            </div>
            {view === "kanban" ? <CommercialKanban /> : <CommercialListView />}
          </TabsContent>
          <TabsContent value="new" className="mt-4"><NewOrder /></TabsContent>
          <TabsContent value="track" className="mt-4"><Tracking /></TabsContent>
        </Tabs>
      </div>
    </CmdCtx.Provider>
  );
}
