import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Download, Eye, Trash2, Info } from "lucide-react";
import { toast } from "sonner";
import { useData } from "@/store/data";
import { useAuth } from "@/store/auth";
import { PageHeader } from "@/components/medifood/PageHeader";
import { formatDate, formatKg } from "@/lib/format";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, BarChart, Bar,
} from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--info))", "hsl(var(--success))", "#A855F7", "#EC4899"];

function RegisterForm() {
  const { products, operators, addProduction } = useData();
  const user = useAuth((s) => s.user);
  const lockedProduct = user?.role === "Responsable Production" && user.assignedProducts?.length === 1
    ? products.find((p) => p.name === user.assignedProducts![0])
    : null;
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [productId, setProductId] = useState(lockedProduct?.id ?? products[0].id);
  const [produced, setProduced] = useState("");
  const [packaged, setPackaged] = useState("");
  const [lot, setLot] = useState("");
  const [operator, setOperator] = useState(operators[0]);
  const [notes, setNotes] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!produced || !packaged || !lot) return toast.error("Veuillez remplir tous les champs requis");
    addProduction({
      date: new Date(date).toISOString(),
      productId,
      produced: parseFloat(produced),
      packaged: parseFloat(packaged),
      lot,
      operator,
      notes,
    });
    toast.success("Production enregistrée avec succès");
    setProduced(""); setPackaged(""); setLot(""); setNotes("");
  };

  return (
    <Card className="card-soft border-0 max-w-3xl">
      <CardHeader>
        <CardTitle>Nouvelle entrée de production</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Produit</Label>
            {lockedProduct ? (
              <Input value={lockedProduct.name} readOnly disabled />
            ) : (
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {products.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Quantité produite (kg)</Label>
            <Input type="number" step="0.1" value={produced} onChange={(e) => setProduced(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Quantité conditionnée (kg)</Label>
            <Input type="number" step="0.1" value={packaged} onChange={(e) => setPackaged(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Lot / Référence</Label>
            <Input placeholder="Ex: L20260426-101" value={lot} onChange={(e) => setLot(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Opérateur responsable</Label>
            <Select value={operator} onValueChange={setOperator}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {operators.map((o) => (<SelectItem key={o} value={o}>{o}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Observations</Label>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" className="w-full md:w-auto">Enregistrer la production</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function HistoryTable() {
  const { production, products, deleteProduction } = useData();
  const user = useAuth((s) => s.user);
  const assignedIds = user?.role === "Responsable Production" && user.assignedProducts?.length
    ? products.filter((p) => user.assignedProducts!.includes(p.name)).map((p) => p.id)
    : undefined;
  const [search, setSearch] = useState("");
  const [productFilter, setProductFilter] = useState(assignedIds?.[0] ?? "all");
  const [viewing, setViewing] = useState<string | null>(null);

  const filtered = production.filter((p) => {
    if (assignedIds?.length && !assignedIds.includes(p.productId)) return false;
    if (productFilter !== "all" && p.productId !== productFilter) return false;
    if (search && !p.lot.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const view = production.find((p) => p.id === viewing);

  const exportCSV = () => {
    const rows = [["Date", "Produit", "Produite (kg)", "Conditionnée (kg)", "Lot", "Opérateur"]];
    filtered.forEach((p) => rows.push([
      formatDate(p.date), products.find((x) => x.id === p.productId)?.name ?? "", String(p.produced), String(p.packaged), p.lot, p.operator,
    ]));
    const csv = rows.map((r) => r.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "production.csv"; a.click();
    toast.success("Export généré");
  };

  return (
    <Card className="card-soft border-0">
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
        <CardTitle>Historique de production</CardTitle>
        <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-4 w-4 mr-2" />Exporter en Excel</Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-2">
          <Input placeholder="Rechercher par lot..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
          {!assignedId && (
            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les produits</SelectItem>
                {products.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
              </SelectContent>
            </Select>
          )}
        </div>
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">Aucun résultat</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Produit</TableHead>
                <TableHead className="text-right">Produite</TableHead>
                <TableHead className="text-right">Conditionnée</TableHead>
                <TableHead>Lot</TableHead>
                <TableHead>Opérateur</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{formatDate(p.date)}</TableCell>
                  <TableCell className="font-medium">{products.find((x) => x.id === p.productId)?.name}</TableCell>
                  <TableCell className="text-right">{formatKg(p.produced)}</TableCell>
                  <TableCell className="text-right">{formatKg(p.packaged)}</TableCell>
                  <TableCell className="font-mono text-xs">{p.lot}</TableCell>
                  <TableCell className="text-muted-foreground">{p.operator}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="icon" variant="ghost" onClick={() => setViewing(p.id)}><Eye className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer cette entrée ?</AlertDialogTitle>
                          <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={() => { deleteProduction(p.id); toast.success("Entrée supprimée"); }}>Supprimer</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Détails de la production</DialogTitle></DialogHeader>
            {view && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{formatDate(view.date)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Produit</span><span className="font-medium">{products.find((x) => x.id === view.productId)?.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Produite</span><span>{formatKg(view.produced)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Conditionnée</span><span>{formatKg(view.packaged)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Lot</span><span className="font-mono">{view.lot}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Opérateur</span><span>{view.operator}</span></div>
                {view.notes && <div className="pt-2 text-muted-foreground">{view.notes}</div>}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function Stats() {
  const { production: allProd, products: allProducts } = useData();
  const user = useAuth((s) => s.user);
  const products = user?.role === "Responsable Production" && user.assignedProducts?.length
    ? allProducts.filter((p) => user.assignedProducts!.includes(p.name))
    : allProducts;
  const productIds = new Set(products.map((p) => p.id));
  const production = user?.role === "Responsable Production"
    ? allProd.filter((p) => productIds.has(p.productId))
    : allProd;
  const lineData = useMemo(() => {
    const days: any[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const k = d.toDateString();
      const row: any = { day: `${d.getDate()}/${d.getMonth() + 1}` };
      products.forEach((p) => {
        row[p.name] = production.filter((x) => x.productId === p.id && new Date(x.date).toDateString() === k).reduce((s, x) => s + x.produced, 0);
      });
      days.push(row);
    }
    return days;
  }, [production, products]);

  const compareData = products.map((p) => {
    const all = production.filter((x) => x.productId === p.id);
    return { name: p.name, produced: all.reduce((s, x) => s + x.produced, 0), packaged: all.reduce((s, x) => s + x.packaged, 0) };
  });

  return (
    <div className="grid gap-4">
      <Card className="card-soft border-0">
        <CardHeader><CardTitle>Production par produit (14 derniers jours)</CardTitle></CardHeader>
        <CardContent className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
              {products.map((p, i) => (<Line key={p.id} type="monotone" dataKey={p.name} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card className="card-soft border-0">
        <CardHeader><CardTitle>Produit vs Conditionné</CardTitle></CardHeader>
        <CardContent className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={compareData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="produced" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Produite" />
              <Bar dataKey="packaged" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} name="Conditionnée" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Production() {
  const user = useAuth((s) => s.user);
  const isProdRole = user?.role === "Responsable Production";
  return (
    <div>
      <PageHeader title="Production" description="Suivi et enregistrement de la production journalière" />
      {isProdRole && user?.assignedProducts?.length ? (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
          <Info className="h-5 w-5 text-primary shrink-0" />
          <div className="text-sm">
            <span className="text-muted-foreground">Vous gérez la production : </span>
            <span className="font-semibold text-primary">{user.assignedProducts.join(", ")}</span>
          </div>
        </div>
      ) : null}
      <Tabs defaultValue="register">
        <TabsList>
          <TabsTrigger value="register">Enregistrer</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
          <TabsTrigger value="stats">Statistiques</TabsTrigger>
        </TabsList>
        <TabsContent value="register" className="mt-4"><RegisterForm /></TabsContent>
        <TabsContent value="history" className="mt-4"><HistoryTable /></TabsContent>
        <TabsContent value="stats" className="mt-4"><Stats /></TabsContent>
      </Tabs>
    </div>
  );
}