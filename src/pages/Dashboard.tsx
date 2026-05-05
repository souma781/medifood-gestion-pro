import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, ArrowUp, Factory, Package, ShoppingCart, Wallet } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useData } from "@/store/data";
import { useAuth } from "@/store/auth";
import { PageHeader } from "@/components/medifood/PageHeader";
import { StatusBadge } from "@/components/medifood/StatusBadge";
import { formatTND, formatKg, formatDate, formatNumber } from "@/lib/format";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--info))", "hsl(var(--success))", "#A855F7", "#EC4899"];

function KpiCard({ icon: Icon, label, value, trend, accent }: any) {
  return (
    <Card className="card-elevated border-0">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
            {trend && (
              <div className={`mt-1 flex items-center gap-1 text-xs font-medium ${trend.up ? "text-success" : "text-destructive"}`}>
                {trend.up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                {trend.value} vs hier
              </div>
            )}
          </div>
          <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${accent}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { production, products, orders } = useData();
  const user = useAuth((s) => s.user);
  const role = user?.role;
  const isCommercial = role === "Responsable Commercial";
  const isProd = role === "Responsable Production";
  const assignedProductIds = isProd && user?.assignedProducts?.length
    ? products.filter((p) => user.assignedProducts!.includes(p.name)).map((p) => p.id)
    : undefined;

  const today = new Date();
  const todayKey = today.toDateString();
  const yesterdayKey = new Date(today.getTime() - 86400000).toDateString();

  const filteredProd = assignedProductIds?.length ? production.filter((p) => assignedProductIds.includes(p.productId)) : production;
  const todayProd = filteredProd.filter((p) => new Date(p.date).toDateString() === todayKey).reduce((s, p) => s + p.produced, 0);
  const yProd = filteredProd.filter((p) => new Date(p.date).toDateString() === yesterdayKey).reduce((s, p) => s + p.produced, 0);
  const totalStock = (assignedProductIds?.length ? products.filter((p) => assignedProductIds.includes(p.id)) : products).reduce((s, p) => s + p.currentStock, 0);
  const pending = orders.filter((o) => o.status === "En attente" || o.status === "Confirmée").length;
  const monthRevenue = orders
    .filter((o) => o.status === "Livrée" && new Date(o.date).getMonth() === today.getMonth())
    .reduce((s, o) => s + o.items.reduce((a, it) => a + it.quantity * it.unitPrice, 0), 0);

  // Daily production line chart for last 30 days, by category
  const lineData = useMemo(() => {
    const days: any[] = [];
    const cats = ["Amandes", "Pistaches", "Cacahuètes nature", "Fruits enrobés chocolat"];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const k = d.toDateString();
      const row: any = { day: `${d.getDate()}/${d.getMonth() + 1}` };
      cats.forEach((c) => {
        row[c] = production
          .filter((p) => new Date(p.date).toDateString() === k && products.find((pr) => pr.id === p.productId)?.name === c)
          .reduce((s, p) => s + p.produced, 0);
      });
      days.push(row);
    }
    return days;
  }, [production, products]);

  const monthlyRevenue = useMemo(() => {
    const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
    return months.map((m, i) => ({
      month: m,
      revenue: Math.round(15000 + Math.random() * 35000 + i * 800),
    }));
  }, []);

  const stockDist = products.map((p) => ({ name: p.name, value: p.currentStock }));

  const recentProd = production.slice(0, 5);
  const recentOrders = orders.slice(0, 5);
  const { clients } = useData();

  const trendUp = todayProd >= yProd;
  const trendVal = yProd === 0 ? "—" : `${Math.round(((todayProd - yProd) / yProd) * 100)}%`;

  return (
    <div>
      <PageHeader title="Tableau de bord" description="Vue d'ensemble de l'activité — MEDIFOOD Tunisie" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isCommercial ? (
          <>
            <KpiCard icon={ShoppingCart} label="Commandes en cours" value={formatNumber(pending)} accent="bg-info/15 text-info" />
            <KpiCard icon={Wallet} label="Chiffre d'affaires (mois)" value={formatTND(monthRevenue)} accent="bg-success/15 text-success" />
          </>
        ) : isProd ? (
          <>
            <KpiCard icon={Factory} label={`Production du jour — ${user?.assignedProducts?.join(", ") ?? ""}`} value={formatKg(todayProd)} trend={{ up: trendUp, value: trendVal }} accent="bg-primary/10 text-primary" />
            <KpiCard icon={Package} label="Stock produit assigné" value={formatKg(totalStock)} accent="bg-accent/15 text-accent" />
          </>
        ) : (
          <>
            <KpiCard icon={Factory} label="Production du jour" value={formatKg(todayProd)} trend={{ up: trendUp, value: trendVal }} accent="bg-primary/10 text-primary" />
            <KpiCard icon={Package} label="Stock total" value={formatKg(totalStock)} accent="bg-accent/15 text-accent" />
            <KpiCard icon={ShoppingCart} label="Commandes en cours" value={formatNumber(pending)} accent="bg-info/15 text-info" />
            <KpiCard icon={Wallet} label="Chiffre d'affaires (mois)" value={formatTND(monthRevenue)} accent="bg-success/15 text-success" />
          </>
        )}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="card-soft border-0 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Production quotidienne (30 derniers jours)</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="Amandes" stroke={COLORS[0]} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Pistaches" stroke={COLORS[1]} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Cacahuètes nature" stroke={COLORS[2]} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Fruits enrobés chocolat" stroke={COLORS[3]} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="card-soft border-0">
          <CardHeader>
            <CardTitle className="text-base">Distribution du stock</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stockDist} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {stockDist.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => formatKg(Number(v))} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 card-soft border-0">
        <CardHeader>
          <CardTitle className="text-base">Chiffre d'affaires mensuel — 2026</CardTitle>
        </CardHeader>
        <CardContent className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip formatter={(v: any) => formatTND(Number(v))} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="card-soft border-0">
          <CardHeader>
            <CardTitle className="text-base">Dernières productions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead className="text-right">Quantité</TableHead>
                  <TableHead>Opérateur</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentProd.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{formatDate(p.date)}</TableCell>
                    <TableCell className="font-medium">{products.find((x) => x.id === p.productId)?.name}</TableCell>
                    <TableCell className="text-right">{formatKg(p.produced)}</TableCell>
                    <TableCell className="text-muted-foreground">{p.operator}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="card-soft border-0">
          <CardHeader>
            <CardTitle className="text-base">Dernières commandes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N°</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((o) => {
                  const total = o.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
                  return (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs">{o.number}</TableCell>
                      <TableCell className="font-medium">{clients.find((c) => c.id === o.clientId)?.company}</TableCell>
                      <TableCell className="text-right">{formatTND(total)}</TableCell>
                      <TableCell><StatusBadge status={o.status} /></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}