import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import { useData } from "@/store/data";
import { useAuth, type ManagedUser, type Role, type ProductionRole } from "@/store/auth";
import { PageHeader } from "@/components/medifood/PageHeader";
import { formatKg } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ROLE_BADGE, ROLE_SHORT } from "@/lib/rbac";

// ─── User dialog (create / edit) ─────────────────────────────────────────────

type UserDialogProps = {
  user: ManagedUser | null; // null = create mode
  onSave: (u: Omit<ManagedUser, "id"> | ManagedUser) => void;
  onClose: () => void;
};

function UserDialog({ user, onSave, onClose }: UserDialogProps) {
  const { products } = useData();
  const isEdit = user !== null;

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(user?.role ?? "Responsable Production");
  const [assignedProducts, setAssignedProducts] = useState<string[]>(user?.assignedProducts ?? []);
  const [productionRole, setProductionRole] = useState<ProductionRole>(user?.productionRole ?? "mixte");
  const [active, setActive] = useState(user?.active ?? true);

  const toggleProduct = (productName: string) => {
    setAssignedProducts((prev) =>
      prev.includes(productName) ? prev.filter((p) => p !== productName) : [...prev, productName],
    );
  };

  const canSave =
    name.trim() &&
    email.trim() &&
    (isEdit || password.trim()) &&
    (role !== "Responsable Production" || assignedProducts.length > 0);

  const submit = () => {
    const base = {
      name: name.trim(),
      email: email.trim(),
      role,
      active,
      ...(role === "Responsable Production"
        ? { assignedProducts, productionRole }
        : { assignedProducts: undefined, productionRole: undefined }),
    };
    if (isEdit) {
      onSave({ ...user, ...base, password: password.trim() || user.password });
    } else {
      onSave({ ...base, password: password.trim() });
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier l'utilisateur" : "Nouvel utilisateur"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Name + Email */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Nom complet</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Prénom Nom" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@medifood.tn"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label>{isEdit ? "Nouveau mot de passe (vide = inchangé)" : "Mot de passe"}</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isEdit ? "Laisser vide pour ne pas modifier" : "Mot de passe"}
            />
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <Label>Rôle</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Responsable Commercial">Responsable Commercial</SelectItem>
                <SelectItem value="Responsable Production">Responsable Production</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Production-specific fields */}
          {role === "Responsable Production" && (
            <>
              <div className="space-y-1.5">
                <Label>
                  Produits assignés
                  {assignedProducts.length === 0 && (
                    <span className="ml-2 text-xs text-destructive">Au moins un produit requis</span>
                  )}
                </Label>
                <div className="grid grid-cols-2 gap-2 rounded-lg border border-border p-3">
                  {products.map((p) => (
                    <label
                      key={p.id}
                      className="flex cursor-pointer items-center gap-2 text-sm select-none"
                    >
                      <input
                        type="checkbox"
                        checked={assignedProducts.includes(p.name)}
                        onChange={() => toggleProduct(p.name)}
                        className="h-4 w-4 rounded accent-primary"
                      />
                      {p.name}
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Rôle dans la production</Label>
                <Select value={productionRole} onValueChange={(v) => setProductionRole(v as ProductionRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cuisson">Cuisson (En attente → Cuit)</SelectItem>
                    <SelectItem value="emballage">Emballage (Cuit → Terminé)</SelectItem>
                    <SelectItem value="mixte">Mixte (tout le workflow)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Active toggle — edit only */}
          {isEdit && (
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm font-medium">Compte actif</span>
              <Switch checked={active} onCheckedChange={setActive} />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button disabled={!canSave} onClick={submit}>
            {isEdit ? "Enregistrer" : "Créer l'utilisateur"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Users tab ────────────────────────────────────────────────────────────────

function UsersTab() {
  const { users, addUser, updateUser, deleteUser } = useAuth();
  const [dialogUser, setDialogUser] = useState<ManagedUser | null | "new">(undefined as any);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openCreate = () => setDialogUser(null);
  const openEdit = (u: ManagedUser) => setDialogUser(u);
  const closeDialog = () => setDialogUser(undefined as any);

  const handleSave = (data: Omit<ManagedUser, "id"> | ManagedUser) => {
    if ("id" in data) {
      updateUser(data as ManagedUser);
      toast.success("Utilisateur mis à jour");
    } else {
      addUser(data as Omit<ManagedUser, "id">);
      toast.success("Utilisateur créé");
    }
    closeDialog();
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteUser(deleteId);
    setDeleteId(null);
    toast.success("Utilisateur supprimé");
  };

  return (
    <>
      <Card className="card-soft border-0">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle>Utilisateurs ({users.length})</CardTitle>
          <Button size="sm" className="gap-1.5" onClick={openCreate}>
            <UserPlus className="h-4 w-4" />
            Ajouter un utilisateur
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Produits / Sous-rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{u.email}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                        ROLE_BADGE[u.role],
                      )}
                    >
                      {ROLE_SHORT[u.role]}
                    </span>
                  </TableCell>
                  <TableCell>
                    {u.role === "Responsable Production" && (
                      <div className="flex flex-wrap gap-1">
                        {u.assignedProducts?.map((p) => (
                          <Badge key={p} variant="outline" className="text-[10px] px-1.5 py-0">
                            {p}
                          </Badge>
                        ))}
                        {u.productionRole && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 capitalize">
                            {u.productionRole}
                          </Badge>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={u.active ?? true}
                      onCheckedChange={(v) => {
                        updateUser({ ...u, active: v });
                        toast.success(v ? "Compte activé" : "Compte désactivé");
                      }}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => openEdit(u)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(u.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create / edit dialog */}
      {dialogUser !== undefined && (
        <UserDialog
          user={dialogUser}
          onSave={handleSave}
          onClose={closeDialog}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'utilisateur ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'utilisateur ne pourra plus se connecter.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Parametres() {
  const { products } = useData();
  const { user } = useAuth();
  const role = user?.role;
  const isAdmin = role === "Admin";
  const [notifs, setNotifs] = useState({ stock: true, order: true, late: true, daily: false });

  return (
    <div>
      <PageHeader title="Paramètres" description="Configuration de la plateforme" />
      <Tabs defaultValue="profil">
        <TabsList>
          <TabsTrigger value="profil">Profil</TabsTrigger>
          {isAdmin && <TabsTrigger value="entreprise">Entreprise</TabsTrigger>}
          {isAdmin && <TabsTrigger value="users">Utilisateurs</TabsTrigger>}
          {isAdmin && <TabsTrigger value="produits">Produits</TabsTrigger>}
          <TabsTrigger value="notifs">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="profil" className="mt-4">
          <Card className="card-soft border-0 max-w-xl">
            <CardHeader>
              <CardTitle>Mon profil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1"><Label>Nom</Label><Input defaultValue={user?.name ?? ""} /></div>
              <div className="space-y-1"><Label>Email</Label><Input defaultValue={user?.email ?? ""} /></div>
              <div className="space-y-1"><Label>Nouveau mot de passe</Label><Input type="password" /></div>
              <Button onClick={() => toast.success("Profil mis à jour")}>Enregistrer</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entreprise" className="mt-4">
          <Card className="card-soft border-0 max-w-xl">
            <CardHeader>
              <CardTitle>Informations entreprise</CardTitle>
            </CardHeader>
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
          <UsersTab />
        </TabsContent>

        <TabsContent value="produits" className="mt-4">
          <Card className="card-soft border-0">
            <CardHeader>
              <CardTitle>Catalogue produits</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Unité</TableHead>
                    <TableHead className="text-right">Stock min</TableHead>
                    <TableHead className="text-right">Capacité max</TableHead>
                  </TableRow>
                </TableHeader>
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
            <CardHeader>
              <CardTitle>Préférences de notification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { k: "stock", label: "Stock bas" },
                { k: "order", label: "Nouvelle commande" },
                { k: "late", label: "Bon de livraison émis" },
                { k: "daily", label: "Rapport journalier" },
              ].map((n) => (
                <div key={n.k} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <span className="text-sm font-medium">{n.label}</span>
                  <Switch
                    checked={(notifs as any)[n.k]}
                    onCheckedChange={(v) => setNotifs({ ...notifs, [n.k]: v })}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
