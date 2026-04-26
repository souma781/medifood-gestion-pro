import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Edit, Plus } from "lucide-react";
import { toast } from "sonner";
import { useData, Client } from "@/store/data";
import { PageHeader } from "@/components/medifood/PageHeader";
import { StatusBadge } from "@/components/medifood/StatusBadge";
import { formatTND, formatDate } from "@/lib/format";

function ClientForm({ client, onSave, onClose }: { client?: Client; onSave: (c: any) => void; onClose: () => void }) {
  const [f, setF] = useState({
    name: client?.name ?? "",
    company: client?.company ?? "",
    phone: client?.phone ?? "",
    email: client?.email ?? "",
    address: client?.address ?? "",
    city: client?.city ?? "",
    postalCode: client?.postalCode ?? "",
    notes: client?.notes ?? "",
  });
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{client ? "Modifier" : "Nouveau"} client</DialogTitle></DialogHeader>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1"><Label>Nom complet</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div className="space-y-1"><Label>Entreprise</Label><Input value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} /></div>
        <div className="space-y-1"><Label>Téléphone</Label><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
        <div className="space-y-1"><Label>Email</Label><Input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
        <div className="space-y-1 md:col-span-2"><Label>Adresse</Label><Input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></div>
        <div className="space-y-1"><Label>Ville</Label><Input value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} /></div>
        <div className="space-y-1"><Label>Code postal</Label><Input value={f.postalCode} onChange={(e) => setF({ ...f, postalCode: e.target.value })} /></div>
        <div className="space-y-1 md:col-span-2"><Label>Notes</Label><Textarea rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Annuler</Button>
        <Button onClick={() => { onSave(f); onClose(); }}>Enregistrer</Button>
      </DialogFooter>
    </DialogContent>
  );
}

export default function Clients() {
  const { clients, orders, invoices, addClient, updateClient } = useData();
  const [search, setSearch] = useState("");
  const [openNew, setOpenNew] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const navigate = useNavigate();

  const filtered = clients.filter((c) =>
    [c.name, c.company, c.city, c.email].some((v) => v.toLowerCase().includes(search.toLowerCase())),
  );

  const stats = (id: string) => {
    const ords = orders.filter((o) => o.clientId === id);
    const ca = invoices.filter((i) => i.clientId === id).reduce((s, inv) => s + inv.items.reduce((a, it) => a + it.quantity * it.unitPrice * 1.19, 0), 0);
    return { count: ords.length, ca };
  };

  return (
    <div>
      <PageHeader
        title="Clients"
        description="Gestion du portefeuille clients"
        actions={
          <Dialog open={openNew} onOpenChange={setOpenNew}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Nouveau client</Button></DialogTrigger>
            <ClientForm onSave={(f) => { addClient(f); toast.success("Client ajouté"); }} onClose={() => setOpenNew(false)} />
          </Dialog>
        }
      />

      <Card className="card-soft border-0">
        <CardHeader><Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" /></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Entreprise</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Ville</TableHead>
                <TableHead className="text-right">Commandes</TableHead>
                <TableHead className="text-right">CA total</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Aucun résultat</TableCell></TableRow>}
              {filtered.map((c) => {
                const s = stats(c.id);
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.company}</TableCell>
                    <TableCell className="text-muted-foreground">{c.phone}</TableCell>
                    <TableCell>{c.city}</TableCell>
                    <TableCell className="text-right">{s.count}</TableCell>
                    <TableCell className="text-right font-semibold">{formatTND(s.ca)}</TableCell>
                    <TableCell className="space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => navigate(`/clients/${c.id}`)}>Voir</Button>
                      <Dialog open={editing?.id === c.id} onOpenChange={(o) => !o && setEditing(null)}>
                        <DialogTrigger asChild><Button size="icon" variant="ghost" onClick={() => setEditing(c)}><Edit className="h-4 w-4" /></Button></DialogTrigger>
                        {editing?.id === c.id && (
                          <ClientForm client={c} onSave={(f) => { updateClient({ ...c, ...f }); toast.success("Client modifié"); }} onClose={() => setEditing(null)} />
                        )}
                      </Dialog>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export function ClientProfile() {
  const { id } = useParams();
  const { clients, orders, invoices } = useData();
  const navigate = useNavigate();
  const c = clients.find((x) => x.id === id);
  if (!c) return <div className="p-6">Client introuvable</div>;
  const cOrders = orders.filter((o) => o.clientId === c.id);
  const cInvoices = invoices.filter((i) => i.clientId === c.id);
  const ca = cInvoices.reduce((s, inv) => s + inv.items.reduce((a, it) => a + it.quantity * it.unitPrice * 1.19, 0), 0);

  return (
    <div>
      <Button variant="ghost" className="mb-3" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4 mr-2" />Retour</Button>
      <PageHeader title={c.company} description={c.name} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="card-soft border-0 lg:col-span-1">
          <CardHeader><CardTitle>Informations</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><span className="text-muted-foreground">Tél:</span> {c.phone}</div>
            <div><span className="text-muted-foreground">Email:</span> {c.email}</div>
            <div><span className="text-muted-foreground">Adresse:</span> {c.address}</div>
            <div><span className="text-muted-foreground">Ville:</span> {c.postalCode} {c.city}</div>
          </CardContent>
        </Card>
        <Card className="card-elevated border-0"><CardContent className="p-5"><p className="text-sm text-muted-foreground">CA total</p><p className="mt-2 text-2xl font-bold text-primary">{formatTND(ca)}</p></CardContent></Card>
        <Card className="card-elevated border-0"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Commandes</p><p className="mt-2 text-2xl font-bold">{cOrders.length}</p></CardContent></Card>
      </div>
      <Card className="mt-4 card-soft border-0">
        <CardHeader><CardTitle>Historique commandes</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>N°</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Montant</TableHead><TableHead>Statut</TableHead></TableRow></TableHeader>
            <TableBody>
              {cOrders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">{o.number}</TableCell>
                  <TableCell>{formatDate(o.date)}</TableCell>
                  <TableCell className="text-right">{formatTND(o.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0))}</TableCell>
                  <TableCell><StatusBadge status={o.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}