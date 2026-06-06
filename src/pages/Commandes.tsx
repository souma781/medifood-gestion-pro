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
  Ban,
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
      const prodName = products.find((p) => p.id === (it.product_id ?? it.productId))?.name;
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

function CommercialKanban({ onSelect }: { onSelect: (id: string) => void }) {
  const { orders, clients } = useCmdCtx();
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  return (
    <>
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
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const total = o.items.reduce((s, i) => s + parseFloat(String(i.quantity)) * parseFloat(String((i as any).unit_price ?? i.unitPrice ?? 0)), 0);
                  return (
                    <div key={o.id} className="rounded-lg border border-border bg-card p-3 shadow-sm cursor-pointer hover:shadow-md hover:border-primary/30 transition-all" onClick={() => onSelect(o.id)}>
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
                      {o.status === "En attente" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="mt-2 h-7 w-full gap-1 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={(e) => { e.stopPropagation(); setCancelTarget(o); }}
                        >
                          <Ban className="h-3 w-3" />Annuler
                        </Button>
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
      <CancelOrderDialog order={cancelTarget} onClose={() => setCancelTarget(null)} />
    </>
  );
}

function CommercialListView({ onSelect }: { onSelect: (id: string) => void }) {
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
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const total = o.items.reduce((s, i) => s + parseFloat(String(i.quantity)) * parseFloat(String((i as any).unit_price ?? i.unitPrice ?? 0)), 0);
              return (
                <TableRow key={o.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onSelect(o.id)}>
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

// ─── Order detail dialog ──────────────────────────────────────────────────────

function OrderDetailDialog({ orderId, onClose }: { orderId: string | null; onClose: () => void }) {
  const { orders, clients, products, updateOrderStatus } = useCmdCtx();
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const order = orders.find((o) => o.id === orderId);

  useEffect(() => { setCancelConfirm(false); }, [orderId]);

  const handleCancel = async () => {
    if (!order) return;
    setCancelling(true);
    try {
      await updateOrderStatus(order.id, "Refusé", undefined, "Annulée par l'utilisateur");
      toast.success("Commande annulée");
      onClose();
    } catch {
      toast.error("Erreur lors de l'annulation");
    } finally {
      setCancelling(false);
    }
  };

  if (!order) return null;

  const client = clients.find((c) => c.id === order.clientId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const total = order.items.reduce((s, i) => s + parseFloat(String(i.quantity)) * parseFloat(String((i as any).unit_price ?? i.unitPrice ?? 0)), 0);

  return (
    <Dialog open={!!orderId} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="font-mono text-base">{order.number}</span>
            <StatusBadge status={order.status} />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Client */}
          <div className="rounded-lg bg-muted/40 p-4 text-sm">
            <div className="text-xs text-muted-foreground mb-1">Client</div>
            <div className="font-semibold">{client?.company ?? "—"}</div>
            {client?.name && <div className="text-muted-foreground">{client.name}</div>}
            {client?.address && <div className="text-muted-foreground">{client.address}{client.city ? `, ${client.city}` : ""}</div>}
            {client?.phone && <div className="text-muted-foreground">{client.phone}</div>}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Date de commande</div>
              <div className="font-medium mt-0.5">{formatDate(order.date)}</div>
            </div>
            {order.deliveryDate && (
              <div>
                <div className="text-xs text-muted-foreground">Date de livraison</div>
                <div className="font-medium mt-0.5">{formatDate(order.deliveryDate)}</div>
              </div>
            )}
          </div>

          {/* Products table */}
          <div>
            <div className="text-xs text-muted-foreground mb-2">Produits commandés</div>
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead className="text-right">Quantité</TableHead>
                    <TableHead className="text-right">Prix unitaire</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((it, idx) => {
                    const prod = products.find((p) => p.id === it.productId);
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const unitPrice = parseFloat(String((it as any).unit_price ?? it.unitPrice ?? 0));
                    const qty = parseFloat(String(it.quantity));
                    const partial = order.partialQuantities?.[it.productId];
                    return (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{prod?.name ?? "—"}</TableCell>
                        <TableCell className="text-right">
                          {partial !== undefined ? (
                            <span>
                              <span className="text-warning font-semibold">{partial}</span>
                              <span className="text-muted-foreground"> / {qty} kg</span>
                            </span>
                          ) : (
                            `${qty} kg`
                          )}
                        </TableCell>
                        <TableCell className="text-right">{formatTND(unitPrice)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatTND(qty * unitPrice)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center border-t pt-3">
            <span className="font-semibold">Total</span>
            <span className="text-lg font-bold text-primary">{formatTND(total)}</span>
          </div>

          {/* Notes */}
          {order.notes && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Notes</div>
              <div className="rounded-lg bg-muted/40 p-3 text-sm">{order.notes}</div>
            </div>
          )}

          {/* Refusal reason */}
          {order.refusalReason && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <div className="text-xs font-medium mb-1">Motif du refus</div>
              {order.refusalReason}
            </div>
          )}
        </div>

        <DialogFooter>
          {cancelConfirm ? (
            <>
              <span className="mr-auto self-center text-sm text-destructive">Confirmer l'annulation de {order.number} ?</span>
              <Button variant="outline" onClick={() => setCancelConfirm(false)} disabled={cancelling}>Non</Button>
              <Button variant="destructive" onClick={handleCancel} disabled={cancelling}>
                {cancelling ? "Annulation..." : "Oui, annuler"}
              </Button>
            </>
          ) : (
            <>
              {order.status === "En attente" && (
                <Button variant="destructive" className="mr-auto" onClick={() => setCancelConfirm(true)}>
                  <Ban className="h-4 w-4 mr-1.5" />Annuler la commande
                </Button>
              )}
              <Button variant="outline" onClick={onClose}>Fermer</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Cancel order dialog (Kanban shortcut) ────────────────────────────────────

function CancelOrderDialog({ order, onClose }: { order: Order | null; onClose: () => void }) {
  const { updateOrderStatus } = useCmdCtx();
  const [loading, setLoading] = useState(false);

  const confirm = async () => {
    if (!order) return;
    setLoading(true);
    try {
      await updateOrderStatus(order.id, "Refusé", undefined, "Annulée par l'utilisateur");
      toast.success("Commande annulée");
      onClose();
    } catch {
      toast.error("Erreur lors de l'annulation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!order} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-destructive" />
            Annuler la commande
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground py-2">
          Voulez-vous annuler la commande <span className="font-mono font-semibold text-foreground">{order?.number}</span> ? Cette action est irréversible.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Non</Button>
          <Button variant="destructive" onClick={confirm} disabled={loading}>
            {loading ? "Annulation..." : "Oui, annuler"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
              <div key={idx} className="grid grid-cols-12 gap-2 items-start">
                <Select value={it.productId} onValueChange={(v) => setItems(items.map((x, i) => i === idx ? { ...x, productId: v } : x))}>
                  <SelectTrigger className="col-span-5"><SelectValue /></SelectTrigger>
                  <SelectContent>{products.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}</SelectContent>
                </Select>
                <div className="col-span-2">
                  <Input type="number" placeholder="Qté kg" value={it.quantity} className={it.quantity <= 0 ? "border-destructive" : ""} onChange={(e) => setItems(items.map((x, i) => i === idx ? { ...x, quantity: parseFloat(e.target.value) || 0 } : x))} />
                  {it.quantity <= 0 && <p className="mt-1 text-xs text-destructive">Quantité requise</p>}
                </div>
                <div className="col-span-2">
                  <Input type="number" placeholder="PU" value={it.unitPrice} className={it.unitPrice <= 0 ? "border-destructive" : ""} onChange={(e) => setItems(items.map((x, i) => i === idx ? { ...x, unitPrice: parseFloat(e.target.value) || 0 } : x))} />
                  {it.unitPrice <= 0 && <p className="mt-1 text-xs text-destructive">Prix requis</p>}
                </div>
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
              <Button disabled={items.length === 0 || items.some((it) => it.quantity <= 0 || it.unitPrice <= 0)} onClick={() => setStep(3)}>Suivant</Button>
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
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);

  const canAccessClients =
    user?.role === "Admin" || user?.role === "Responsable Commercial";

  const reload = () => {
    const clientsPromise = canAccessClients
      ? api.clients.getAll()
      : Promise.resolve([] as Client[]);

    Promise.all([
      api.orders.getAll(),
      clientsPromise,
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
            {view === "kanban" ? <CommercialKanban onSelect={setDetailOrderId} /> : <CommercialListView onSelect={setDetailOrderId} />}
            <OrderDetailDialog orderId={detailOrderId} onClose={() => setDetailOrderId(null)} />
          </TabsContent>
          <TabsContent value="new" className="mt-4"><NewOrder /></TabsContent>
          <TabsContent value="track" className="mt-4"><Tracking /></TabsContent>
        </Tabs>
      </div>
    </CmdCtx.Provider>
  );
}
