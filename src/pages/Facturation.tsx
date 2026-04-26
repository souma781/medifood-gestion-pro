import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, Mail, Plus, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useData, Invoice } from "@/store/data";
import { PageHeader } from "@/components/medifood/PageHeader";
import { StatusBadge } from "@/components/medifood/StatusBadge";
import { formatTND, formatDate } from "@/lib/format";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["hsl(var(--success))", "hsl(var(--info))", "hsl(var(--destructive))"];

function invoiceTotals(inv: Invoice) {
  const ht = inv.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const tva = ht * 0.19;
  return { ht, tva, ttc: ht + tva };
}

function Preview({ inv, onClose }: { inv: Invoice; onClose: () => void }) {
  const { clients } = useData();
  const client = clients.find((c) => c.id === inv.clientId);
  const { ht, tva, ttc } = invoiceTotals(inv);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>Aperçu facture {inv.number}</DialogTitle></DialogHeader>
        <div className="rounded-lg border border-border bg-card p-8 text-sm">
          <div className="flex items-start justify-between border-b border-border pb-6">
            <div>
              <div className="text-2xl font-bold text-primary">MEDIFOOD</div>
              <div className="text-xs text-muted-foreground mt-1">Société de production de fruits secs</div>
              <div className="text-xs text-muted-foreground mt-2">Zone Industrielle, Sfax 3000<br />Tunisie<br />Tél: +216 74 000 000<br />MF: 1234567A</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold tracking-tight">FACTURE</div>
              <div className="font-mono text-sm text-muted-foreground">{inv.number}</div>
              <div className="mt-2 text-xs">Date : {formatDate(inv.date)}</div>
              <div className="text-xs">Échéance : {formatDate(inv.dueDate)}</div>
            </div>
          </div>
          <div className="my-6 grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Facturé à</div>
              <div className="font-semibold">{client?.company}</div>
              <div className="text-muted-foreground">{client?.name}</div>
              <div className="text-muted-foreground">{client?.address}, {client?.city}</div>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead className="border-y border-border bg-muted/50">
              <tr>
                <th className="py-2 px-3 text-left">Description</th>
                <th className="py-2 px-3 text-right">Qté</th>
                <th className="py-2 px-3 text-right">PU</th>
                <th className="py-2 px-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {inv.items.map((it, i) => (
                <tr key={i} className="border-b border-border">
                  <td className="py-2 px-3">{it.description}</td>
                  <td className="py-2 px-3 text-right">{it.quantity} kg</td>
                  <td className="py-2 px-3 text-right">{formatTND(it.unitPrice)}</td>
                  <td className="py-2 px-3 text-right font-medium">{formatTND(it.quantity * it.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="ml-auto mt-4 w-72 space-y-1.5">
            <div className="flex justify-between"><span>Total HT</span><span>{formatTND(ht)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>TVA (19%)</span><span>{formatTND(tva)}</span></div>
            <div className="flex justify-between border-t border-border pt-1.5 text-base font-bold text-primary"><span>Total TTC</span><span>{formatTND(ttc)}</span></div>
          </div>
          <div className="mt-8 border-t border-border pt-4 text-xs text-muted-foreground">
            Conditions de paiement : 30 jours nets. Paiement par virement bancaire.<br />
            Merci de votre confiance.
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4 mr-2" />Imprimer</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InvoiceList() {
  const { invoices, clients, updateInvoiceStatus } = useData();
  const [previewing, setPreviewing] = useState<string | null>(null);
  const inv = invoices.find((i) => i.id === previewing);
  return (
    <Card className="card-soft border-0">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N°</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">HT</TableHead>
              <TableHead className="text-right">TVA</TableHead>
              <TableHead className="text-right">TTC</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((i) => {
              const t = invoiceTotals(i);
              return (
                <TableRow key={i.id}>
                  <TableCell className="font-mono text-xs">{i.number}</TableCell>
                  <TableCell className="font-medium">{clients.find((c) => c.id === i.clientId)?.company}</TableCell>
                  <TableCell>{formatDate(i.date)}</TableCell>
                  <TableCell className="text-right">{formatTND(t.ht)}</TableCell>
                  <TableCell className="text-right">{formatTND(t.tva)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatTND(t.ttc)}</TableCell>
                  <TableCell><StatusBadge status={i.status} /></TableCell>
                  <TableCell className="space-x-1">
                    <Button size="icon" variant="ghost" onClick={() => setPreviewing(i.id)}><Eye className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => toast.success("Email envoyé")}><Mail className="h-4 w-4" /></Button>
                    {i.status !== "Payée" && <Button size="sm" variant="outline" onClick={() => { updateInvoiceStatus(i.id, "Payée"); toast.success("Marquée payée"); }}>Marquer payée</Button>}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
      {inv && <Preview inv={inv} onClose={() => setPreviewing(null)} />}
    </Card>
  );
}

function NewInvoice() {
  const { clients, addInvoice } = useData();
  const [clientId, setClientId] = useState("");
  const [items, setItems] = useState<{ description: string; quantity: number; unitPrice: number }[]>([
    { description: "", quantity: 1, unitPrice: 0 },
  ]);
  const [notes, setNotes] = useState("Conditions de paiement : 30 jours nets.");
  const date = new Date().toISOString().slice(0, 10);
  const due = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const ht = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const tva = ht * 0.19;
  const ttc = ht + tva;

  const submit = (status: "Brouillon" | "Émise") => {
    if (!clientId) return toast.error("Sélectionner un client");
    addInvoice({ clientId, date: new Date(date).toISOString(), dueDate: new Date(due).toISOString(), items, status, notes });
    toast.success(status === "Émise" ? "Facture émise" : "Brouillon enregistré");
    setItems([{ description: "", quantity: 1, unitPrice: 0 }]); setClientId("");
  };

  return (
    <Card className="card-soft border-0 max-w-4xl">
      <CardHeader><CardTitle>Nouvelle facture</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={date} readOnly /></div>
          <div className="space-y-1.5"><Label>Échéance</Label><Input type="date" value={due} readOnly /></div>
          <div className="space-y-1.5">
            <Label>Client</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
              <SelectContent>{clients.map((c) => (<SelectItem key={c.id} value={c.id}>{c.company}</SelectItem>))}</SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label>Lignes</Label>
            <Button size="sm" variant="outline" onClick={() => setItems([...items, { description: "", quantity: 1, unitPrice: 0 }])}><Plus className="h-4 w-4 mr-1" />Ajouter</Button>
          </div>
          <div className="space-y-2">
            {items.map((it, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2">
                <Input className="col-span-6" placeholder="Description" value={it.description} onChange={(e) => setItems(items.map((x, i) => i === idx ? { ...x, description: e.target.value } : x))} />
                <Input className="col-span-2" type="number" placeholder="Qté" value={it.quantity} onChange={(e) => setItems(items.map((x, i) => i === idx ? { ...x, quantity: parseFloat(e.target.value) || 0 } : x))} />
                <Input className="col-span-2" type="number" placeholder="PU" value={it.unitPrice} onChange={(e) => setItems(items.map((x, i) => i === idx ? { ...x, unitPrice: parseFloat(e.target.value) || 0 } : x))} />
                <div className="col-span-1 flex items-center text-sm font-semibold">{formatTND(it.quantity * it.unitPrice)}</div>
                <Button variant="ghost" size="icon" className="col-span-1 text-destructive" onClick={() => setItems(items.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        </div>

        <div className="ml-auto w-72 space-y-1 rounded-lg border border-border p-4">
          <div className="flex justify-between"><span>Total HT</span><span>{formatTND(ht)}</span></div>
          <div className="flex justify-between text-muted-foreground"><span>TVA 19%</span><span>{formatTND(tva)}</span></div>
          <div className="flex justify-between border-t pt-1 font-bold text-primary"><span>TTC</span><span>{formatTND(ttc)}</span></div>
        </div>

        <div className="space-y-1.5"><Label>Notes / conditions</Label><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => submit("Brouillon")}>Sauvegarder brouillon</Button>
          <Button onClick={() => submit("Émise")}>Émettre la facture</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function InvoiceStats() {
  const { invoices, clients } = useData();
  const byMonth = Array.from({ length: 12 }).map((_, i) => {
    const m = ["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Août","Sep","Oct","Nov","Déc"][i];
    const total = invoices.filter((inv) => new Date(inv.date).getMonth() === i)
      .reduce((s, inv) => s + invoiceTotals(inv).ttc, 0);
    return { month: m, revenue: total };
  });
  const statusData = [
    { name: "Payée", value: invoices.filter((i) => i.status === "Payée").length },
    { name: "Émise", value: invoices.filter((i) => i.status === "Émise").length },
    { name: "En retard", value: invoices.filter((i) => i.status === "En retard").length },
  ];
  const topClients = clients.map((c) => ({
    name: c.company,
    total: invoices.filter((i) => i.clientId === c.id).reduce((s, i) => s + invoiceTotals(i).ttc, 0),
  })).sort((a, b) => b.total - a.total).slice(0, 5);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="card-soft border-0 lg:col-span-2">
        <CardHeader><CardTitle>Chiffre d'affaires mensuel</CardTitle></CardHeader>
        <CardContent className="h-[280px]">
          <ResponsiveContainer><BarChart data={byMonth}><CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" /><XAxis dataKey="month" fontSize={11} stroke="hsl(var(--muted-foreground))" /><YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" /><Tooltip formatter={(v: any) => formatTND(Number(v))} /><Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
        </CardContent>
      </Card>
      <Card className="card-soft border-0">
        <CardHeader><CardTitle>Statut des factures</CardTitle></CardHeader>
        <CardContent className="h-[280px]">
          <ResponsiveContainer><PieChart><Pie data={statusData} dataKey="value" nameKey="name" outerRadius={90}>{statusData.map((_, i) => (<Cell key={i} fill={COLORS[i]} />))}</Pie><Legend wrapperStyle={{ fontSize: 12 }} /><Tooltip /></PieChart></ResponsiveContainer>
        </CardContent>
      </Card>
      <Card className="card-soft border-0">
        <CardHeader><CardTitle>Top 5 clients</CardTitle></CardHeader>
        <CardContent className="h-[280px]">
          <ResponsiveContainer><BarChart data={topClients} layout="vertical"><CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" /><XAxis type="number" fontSize={11} stroke="hsl(var(--muted-foreground))" /><YAxis type="category" dataKey="name" fontSize={10} width={110} stroke="hsl(var(--muted-foreground))" /><Tooltip formatter={(v: any) => formatTND(Number(v))} /><Bar dataKey="total" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Facturation() {
  return (
    <div>
      <PageHeader title="Facturation" description="Création et suivi des factures" />
      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">Factures</TabsTrigger>
          <TabsTrigger value="new">Nouvelle facture</TabsTrigger>
          <TabsTrigger value="stats">Statistiques</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="mt-4"><InvoiceList /></TabsContent>
        <TabsContent value="new" className="mt-4"><NewInvoice /></TabsContent>
        <TabsContent value="stats" className="mt-4"><InvoiceStats /></TabsContent>
      </Tabs>
    </div>
  );
}