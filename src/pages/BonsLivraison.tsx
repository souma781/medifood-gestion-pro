import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, Plus, Printer, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useData, BonLivraison, BonItem, BonStatus } from "@/store/data";
import { PageHeader } from "@/components/medifood/PageHeader";
import { StatusBadge } from "@/components/medifood/StatusBadge";
import { formatKg, formatDate } from "@/lib/format";

function PrintStyles() {
  return (
    <style>{`
      @media print {
        body * { visibility: hidden !important; }
        #bl-print, #bl-print * { visibility: visible !important; }
        #bl-print { position: absolute; left: 0; top: 0; width: 100%; padding: 24px; }
        .no-print { display: none !important; }
      }
    `}</style>
  );
}

function BonPreview({ bon, onClose }: { bon: BonLivraison; onClose: () => void }) {
  const { clients } = useData();
  const client = clients.find((c) => c.id === bon.clientId);
  const totalQty = bon.items.reduce((s, i) => s + i.quantity, 0);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <PrintStyles />
        <DialogHeader className="no-print">
          <DialogTitle>Aperçu — {bon.number}</DialogTitle>
        </DialogHeader>
        <div id="bl-print" className="rounded-lg border border-border bg-card p-8 text-sm">
          <div className="flex items-start justify-between border-b-2 border-primary pb-6">
            <div>
              <div className="text-2xl font-bold text-primary">EL MADINA</div>
              <div className="text-xs text-muted-foreground mt-1">Production de fruits secs</div>
              <div className="text-xs text-muted-foreground mt-2">
                Zone Industrielle, Sfax 3000<br />Tunisie<br />Tél : +216 74 000 000
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold tracking-tight">BON DE LIVRAISON</div>
              <div className="font-mono text-sm text-muted-foreground mt-1">{bon.number}</div>
              <div className="mt-2 text-xs">Date d'émission : {formatDate(bon.date)}</div>
              <div className="text-xs">Date de livraison : {formatDate(bon.deliveryDate)}</div>
            </div>
          </div>

          <div className="my-6">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Livré à</div>
            <div className="font-semibold">{client?.company}</div>
            <div className="text-muted-foreground">{client?.name}</div>
            <div className="text-muted-foreground">{client?.address}, {client?.postalCode} {client?.city}</div>
            <div className="text-muted-foreground">Tél : {client?.phone}</div>
          </div>

          <table className="w-full text-sm">
            <thead className="border-y border-border bg-muted/50">
              <tr>
                <th className="py-2 px-3 text-left">Désignation</th>
                <th className="py-2 px-3 text-right">Qté (kg)</th>
                <th className="py-2 px-3 text-left">Conditionnement</th>
                <th className="py-2 px-3 text-left">Observations</th>
              </tr>
            </thead>
            <tbody>
              {bon.items.map((it, i) => (
                <tr key={i} className="border-b border-border">
                  <td className="py-2 px-3 font-medium">{it.designation}</td>
                  <td className="py-2 px-3 text-right">{it.quantity}</td>
                  <td className="py-2 px-3">{it.conditionnement}</td>
                  <td className="py-2 px-3 text-muted-foreground">{it.observations || "—"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-primary">
                <td className="py-2 px-3 font-bold">Total</td>
                <td className="py-2 px-3 text-right font-bold text-primary">{formatKg(totalQty)}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>

          {bon.notes && (
            <div className="mt-6 text-xs">
              <div className="text-muted-foreground uppercase tracking-wider mb-1">Notes / Conditions</div>
              <div>{bon.notes}</div>
            </div>
          )}

          <div className="mt-10 grid grid-cols-2 gap-8">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider mb-2">Signature livreur</div>
              <div className="h-20 border-b border-border"></div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider mb-2">Signature client</div>
              <div className="h-20 border-b border-border"></div>
            </div>
          </div>

          <div className="mt-8 border-t border-border pt-3 text-center text-xs text-muted-foreground italic">
            Document non fiscal — Bon de livraison
          </div>
        </div>
        <div className="flex justify-end gap-2 no-print">
          <Button variant="outline" onClick={onClose}>Fermer</Button>
          <Button onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />Imprimer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BonList() {
  const { bons, clients, orders, updateBonStatus } = useData();
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");

  const filtered = bons.filter((b) => {
    const c = clients.find((x) => x.id === b.clientId);
    if (search && !(c?.company.toLowerCase().includes(search.toLowerCase()) || c?.name.toLowerCase().includes(search.toLowerCase()))) return false;
    if (status !== "all" && b.status !== status) return false;
    if (from && new Date(b.date) < new Date(from)) return false;
    if (to && new Date(b.date) > new Date(to)) return false;
    return true;
  });

  const current = bons.find((b) => b.id === previewing);

  return (
    <Card className="card-soft border-0">
      <CardHeader className="space-y-3">
        <div className="grid gap-2 md:grid-cols-4">
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Du" />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} placeholder="Au" />
          <Input placeholder="Rechercher client…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              <SelectItem value="Brouillon">Brouillon</SelectItem>
              <SelectItem value="Émis">Émis</SelectItem>
              <SelectItem value="Livré">Livré</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N° Bon</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Commande liée</TableHead>
              <TableHead>Produits</TableHead>
              <TableHead className="text-right">Qté totale</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Aucun bon</TableCell></TableRow>
            )}
            {filtered.map((b) => {
              const total = b.items.reduce((s, i) => s + i.quantity, 0);
              const order = orders.find((o) => o.id === b.orderId);
              return (
                <TableRow key={b.id}>
                  <TableCell className="font-mono text-xs">{b.number}</TableCell>
                  <TableCell className="font-medium">{clients.find((c) => c.id === b.clientId)?.company}</TableCell>
                  <TableCell>{formatDate(b.date)}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{order?.number ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{b.items.length} produit(s)</TableCell>
                  <TableCell className="text-right font-semibold">{formatKg(total)}</TableCell>
                  <TableCell><StatusBadge status={b.status} /></TableCell>
                  <TableCell className="space-x-1">
                    <Button size="icon" variant="ghost" title="Aperçu" onClick={() => setPreviewing(b.id)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" title="Imprimer" onClick={() => { setPreviewing(b.id); setTimeout(() => window.print(), 300); }}>
                      <Printer className="h-4 w-4" />
                    </Button>
                    {b.status !== "Livré" && (
                      <Button size="sm" variant="outline" onClick={() => { updateBonStatus(b.id, "Livré"); toast.success("Marqué comme livré"); }}>
                        <CheckCircle2 className="h-4 w-4 mr-1" />Livré
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
      {current && <BonPreview bon={current} onClose={() => setPreviewing(null)} />}
    </Card>
  );
}

function NewBon() {
  const { clients, orders, products, bons, addBon, updateBonStatus } = useData();
  const [orderId, setOrderId] = useState<string>("");
  const [clientId, setClientId] = useState<string>("");
  const [items, setItems] = useState<BonItem[]>([
    { designation: "", quantity: 0, conditionnement: "Sac 25 kg", observations: "" },
  ]);
  const [notes, setNotes] = useState("");
  const date = new Date().toISOString().slice(0, 10);
  const [delivery, setDelivery] = useState(date);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const nextNumber = `BL-2026-${String(bons.length + 1).padStart(4, "0")}`;
  const totalQty = items.reduce((s, i) => s + (i.quantity || 0), 0);
  const client = clients.find((c) => c.id === clientId);

  const onPickOrder = (id: string) => {
    setOrderId(id);
    const o = orders.find((x) => x.id === id);
    if (!o) return;
    setClientId(o.clientId);
    setItems(
      o.items.map((it) => {
        const p = products.find((pr) => pr.id === it.productId);
        return { designation: p?.name ?? "", quantity: it.quantity, conditionnement: "Sac 25 kg", observations: "" };
      }),
    );
  };

  const submit = (status: BonStatus) => {
    if (!clientId) return toast.error("Sélectionner un client");
    if (items.some((i) => !i.designation || !i.quantity)) return toast.error("Compléter les lignes");
    const id = addBon({
      clientId,
      orderId: orderId || undefined,
      date: new Date(date).toISOString(),
      deliveryDate: new Date(delivery).toISOString(),
      items,
      status,
      notes,
    });
    toast.success(status === "Émis" ? "Bon émis" : "Brouillon enregistré");
    setItems([{ designation: "", quantity: 0, conditionnement: "Sac 25 kg", observations: "" }]);
    setClientId(""); setOrderId(""); setNotes("");
    return id;
  };

  const previewNow = () => {
    if (!clientId) return toast.error("Sélectionner un client");
    const id = addBon({
      clientId,
      orderId: orderId || undefined,
      date: new Date(date).toISOString(),
      deliveryDate: new Date(delivery).toISOString(),
      items,
      status: "Brouillon",
      notes,
    });
    setPreviewId(id);
  };

  const previewBon = bons.find((b) => b.id === previewId);

  return (
    <Card className="card-soft border-0 max-w-5xl">
      <CardHeader><CardTitle>Nouveau bon de livraison</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-1.5">
            <Label>N° Bon</Label>
            <Input value={nextNumber} readOnly className="font-mono" />
          </div>
          <div className="space-y-1.5">
            <Label>Date d'émission</Label>
            <Input type="date" value={date} readOnly />
          </div>
          <div className="space-y-1.5">
            <Label>Date de livraison</Label>
            <Input type="date" value={delivery} onChange={(e) => setDelivery(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Commande liée</Label>
            <Select value={orderId} onValueChange={onPickOrder}>
              <SelectTrigger><SelectValue placeholder="Aucune" /></SelectTrigger>
              <SelectContent>
                {orders.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.number}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="mb-2 flex items-center justify-between">
            <Label>Client</Label>
            {!orderId && (
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger className="w-64"><SelectValue placeholder="Sélectionner un client" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (<SelectItem key={c.id} value={c.id}>{c.company}</SelectItem>))}
                </SelectContent>
              </Select>
            )}
          </div>
          {client ? (
            <div className="text-sm">
              <div className="font-semibold">{client.company}</div>
              <div className="text-muted-foreground">{client.name} — {client.phone}</div>
              <div className="text-muted-foreground">{client.address}, {client.postalCode} {client.city}</div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Aucun client sélectionné</div>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label>Produits</Label>
            <Button size="sm" variant="outline" onClick={() => setItems([...items, { designation: "", quantity: 0, conditionnement: "Sac 25 kg", observations: "" }])}>
              <Plus className="h-4 w-4 mr-1" />Ajouter ligne
            </Button>
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
              <div className="col-span-4">Désignation</div>
              <div className="col-span-2">Qté (kg)</div>
              <div className="col-span-2">Conditionnement</div>
              <div className="col-span-3">Observations</div>
              <div className="col-span-1"></div>
            </div>
            {items.map((it, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2">
                <Input
                  className="col-span-4"
                  placeholder="Désignation"
                  value={it.designation}
                  onChange={(e) => setItems(items.map((x, i) => i === idx ? { ...x, designation: e.target.value } : x))}
                />
                <Input
                  className="col-span-2"
                  type="number"
                  value={it.quantity || ""}
                  onChange={(e) => setItems(items.map((x, i) => i === idx ? { ...x, quantity: parseFloat(e.target.value) || 0 } : x))}
                />
                <Input
                  className="col-span-2"
                  value={it.conditionnement}
                  onChange={(e) => setItems(items.map((x, i) => i === idx ? { ...x, conditionnement: e.target.value } : x))}
                />
                <Input
                  className="col-span-3"
                  value={it.observations || ""}
                  onChange={(e) => setItems(items.map((x, i) => i === idx ? { ...x, observations: e.target.value } : x))}
                />
                <Button variant="ghost" size="icon" className="col-span-1 text-destructive" onClick={() => setItems(items.filter((_, i) => i !== idx))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-end">
            <div className="rounded-lg border border-border px-4 py-2 text-sm">
              <span className="text-muted-foreground">Quantité totale : </span>
              <span className="font-bold text-primary">{formatKg(totalQty)}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Signature livreur</Label>
            <div className="mt-2 h-20 rounded-md border border-dashed border-border"></div>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Signature client</Label>
            <div className="mt-2 h-20 rounded-md border border-dashed border-border"></div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Notes / conditions</Label>
          <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Conditions de livraison, remarques…" />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => submit("Brouillon")}>Sauvegarder brouillon</Button>
          <Button variant="outline" onClick={previewNow}><Eye className="h-4 w-4 mr-2" />Aperçu impression</Button>
          <Button onClick={() => submit("Émis")}>Émettre le bon</Button>
        </div>
      </CardContent>
      {previewBon && <BonPreview bon={previewBon} onClose={() => setPreviewId(null)} />}
    </Card>
  );
}

export default function BonsLivraison() {
  return (
    <div>
      <PageHeader title="Bons de livraison" description="Création et suivi des bons de livraison" />
      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">Liste des bons</TabsTrigger>
          <TabsTrigger value="new">Nouveau bon</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="mt-4"><BonList /></TabsContent>
        <TabsContent value="new" className="mt-4"><NewBon /></TabsContent>
      </Tabs>
    </div>
  );
}