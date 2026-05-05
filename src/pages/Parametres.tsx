import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { useData } from "@/store/data";
import { PageHeader } from "@/components/medifood/PageHeader";
import { formatKg } from "@/lib/format";

const mockUsers = [
  { id: "u1", name: "Admin Principal", email: "admin@medifood.tn", role: "Admin", active: true },
  { id: "u2", name: "Karim Bouzid", email: "karim@medifood.tn", role: "Responsable production", active: true },
  { id: "u3", name: "Nadia Trabelsi", email: "nadia@medifood.tn", role: "Commercial", active: true },
  { id: "u4", name: "Sami Hamdi", email: "sami@medifood.tn", role: "Responsable production", active: false },
];

export default function Parametres() {
  const { products } = useData();
  const [users, setUsers] = useState(mockUsers);
  const [notifs, setNotifs] = useState({ stock: true, order: true, late: true, daily: false });

  return (
    <div>
      <PageHeader title="Paramètres" description="Configuration de la plateforme" />
      <Tabs defaultValue="profil">
        <TabsList>
          <TabsTrigger value="profil">Profil</TabsTrigger>
          <TabsTrigger value="entreprise">Entreprise</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="produits">Produits</TabsTrigger>
          <TabsTrigger value="notifs">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="profil" className="mt-4">
          <Card className="card-soft border-0 max-w-xl">
            <CardHeader><CardTitle>Mon profil</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1"><Label>Nom</Label><Input defaultValue="Admin" /></div>
              <div className="space-y-1"><Label>Email</Label><Input defaultValue="admin@medifood.tn" /></div>
              <div className="space-y-1"><Label>Nouveau mot de passe</Label><Input type="password" /></div>
              <Button onClick={() => toast.success("Profil mis à jour")}>Enregistrer</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entreprise" className="mt-4">
          <Card className="card-soft border-0 max-w-xl">
            <CardHeader><CardTitle>Informations entreprise</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1"><Label>Nom</Label><Input defaultValue="MEDIFOOD Tunisie" /></div>
              <div className="space-y-1"><Label>Adresse</Label><Input defaultValue="Zone Industrielle, Sfax 3000" /></div>
              <div className="space-y-1"><Label>Téléphone</Label><Input defaultValue="+216 74 000 000" /></div>
              <div className="space-y-1"><Label>Email</Label><Input defaultValue="contact@medifood.tn" /></div>
              <div className="space-y-1"><Label>Matricule fiscal</Label><Input defaultValue="1234567A" /></div>
              <Button onClick={() => toast.success("Entreprise mise à jour")}>Enregistrer</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <Card className="card-soft border-0">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Utilisateurs</CardTitle>
              <Button size="sm" onClick={() => toast.success("Fonctionnalité de démo")}>Ajouter un utilisateur</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Nom</TableHead><TableHead>Email</TableHead><TableHead>Rôle</TableHead><TableHead>Actif</TableHead></TableRow></TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>{u.role}</TableCell>
                      <TableCell><Switch checked={u.active} onCheckedChange={(v) => setUsers(users.map((x) => x.id === u.id ? { ...x, active: v } : x))} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="produits" className="mt-4">
          <Card className="card-soft border-0">
            <CardHeader><CardTitle>Catalogue produits</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Nom</TableHead><TableHead>Unité</TableHead><TableHead className="text-right">Stock min</TableHead><TableHead className="text-right">Capacité max</TableHead></TableRow></TableHeader>
                <TableBody>
                  {products.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.unit}</TableCell>
                      <TableCell className="text-right">{formatKg(p.minStock)}</TableCell>
                      <TableCell className="text-right">{formatKg(p.maxCapacity)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifs" className="mt-4">
          <Card className="card-soft border-0 max-w-xl">
            <CardHeader><CardTitle>Préférences de notification</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { k: "stock", label: "Stock bas" },
                { k: "order", label: "Nouvelle commande" },
                { k: "late", label: "Bon de livraison émis" },
                { k: "daily", label: "Rapport journalier" },
              ].map((n) => (
                <div key={n.k} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <span className="text-sm font-medium">{n.label}</span>
                  <Switch checked={(notifs as any)[n.k]} onCheckedChange={(v) => setNotifs({ ...notifs, [n.k]: v })} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}