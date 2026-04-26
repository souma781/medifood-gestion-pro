import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, Circle, LayoutGrid, List, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useData, OrderStatus, Order } from "@/store/data";
import { PageHeader } from "@/components/medifood/PageHeader";
import { StatusBadge } from "@/components/medifood/StatusBadge";
import { formatTND, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const KANBAN: OrderStatus[] = ["En attente", "Confirmée", "En préparation", "Livrée"];

function Kanban() {
  const { orders, clients, updateOrderStatus } = useData();
  const onDragStart = (e: React.DragEvent, id: string) => e.dataTransfer.setData("id", id);
  const onDrop = (e: React.DragEvent, status: OrderStatus) => {
    const id = e.dataTransfer.getData("id");
    if (id) { updateOrderStatus(id, status); toast.success("Statut mis à jour"); }
  };
  return (
    <div className="grid gap-4 lg:grid-cols-4">
      {KANBAN.map((status) => {
        const list = orders.filter((o) => o.status === status);
        return (
          <div key={status} className="rounded-lg bg-muted/40 p-3" onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDrop(e, status)}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">{status}</h3>
              <span className="rounded-full bg-card px-2 py-0.5 text-xs">{list.length}</span>
            </div>
            <div className="space-y-2">
              {list.map((o) => {
                const total = o.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
                return (
                  <div key={o.id} draggable onDragStart={(e) => onDragStart(e, o.id)} className="cursor-grab rounded-lg border border-border bg-card p-3 shadow-sm hover:shadow-md transition">
                    <div className="font-mono text-xs text-muted-foreground">{o.number}</div>
                    <div className="mt-1 font-medium text-sm">{clients.find((c) => c.id === o.clientId)?.company}</div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{o.items.length} produit(s)</span>
                      <span className="font-semibold text-primary">{formatTND(total)}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{formatDate(o.date)}</div>
                  </div>
                );
              })}
              {list.length === 0 && <div className="rounded border border-dashed border-border py-6 text-center text-xs text-muted-foreground">Aucune commande</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ListView() {
  const { orders, clients, updateOrderStatus } = useData();
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
              <TableHead>Actions</TableHead>
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
                  <TableCell><StatusBadge status={o.status} /></TableCell>
                  <TableCell>
                    <Select value={o.status} onValueChange={(v) => { updateOrderStatus(o.id, v as OrderStatus); toast.success("Statut mis à jour"); }}>
                      <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(["En attente", "Confirmée", "En préparation", "Livrée", "Annulée"] as OrderStatus[]).map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

function NewOrder() {
  const { clients, products, addOrder } = useData();
  const [step, setStep] = useState(1);
  const [clientId, setClientId] = useState("");
  const [items, setItems] = useState<{ productId: string; quantity: number; unitPrice: number }[]>([]);
  const [delivery, setDelivery] = useState(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const client = clients.find((c) => c.id === clientId);

  const reset = () => { setStep(1); setClientId(""); setItems([]); setNotes(""); };

  const submit = () => {
    addOrder({ clientId, date: new Date().toISOString(), deliveryDate: new Date(delivery).toISOString(), items, status: "En attente", notes });
    toast.success("Commande créée");
    reset();
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
            <Button variant="outline" size="sm" onClick={() => setItems([...items, { productId: products[0].id, quantity: 50, unitPrice: 30 }])}>
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

function Tracking() {
  const { orders, clients } = useData();
  const steps = ["En attente", "Confirmée", "En préparation", "Livrée"] as const;
  const idx = (s: Order["status"]) => steps.indexOf(s as any);
  return (
    <div className="space-y-3">
      {orders.slice(0, 6).map((o) => {
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
              <div className="flex items-center justify-between">
                {steps.map((s, i) => (
                  <div key={s} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center gap-1">
                      {i <= current ? <CheckCircle2 className="h-6 w-6 text-success" /> : <Circle className="h-6 w-6 text-muted-foreground" />}
                      <span className={cn("text-xs", i <= current ? "font-medium" : "text-muted-foreground")}>{s}</span>
                    </div>
                    {i < steps.length - 1 && <div className={cn("h-0.5 flex-1 mx-2", i < current ? "bg-success" : "bg-border")} />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function Commandes() {
  const [view, setView] = useState<"kanban" | "list">("kanban");
  return (
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
            <Button size="sm" variant={view === "kanban" ? "default" : "ghost"} onClick={() => setView("kanban")}><LayoutGrid className="h-4 w-4 mr-1" />Kanban</Button>
            <Button size="sm" variant={view === "list" ? "default" : "ghost"} onClick={() => setView("list")}><List className="h-4 w-4 mr-1" />Liste</Button>
          </div>
          {view === "kanban" ? <Kanban /> : <ListView />}
        </TabsContent>
        <TabsContent value="new" className="mt-4"><NewOrder /></TabsContent>
        <TabsContent value="track" className="mt-4"><Tracking /></TabsContent>
      </Tabs>
    </div>
  );
}