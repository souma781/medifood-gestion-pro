import { useState, useEffect } from "react";
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
import { Pencil, Plus, Trash2, UserPlus } from "lucide-react";
import { useAuth, type ManagedUser, type Role, type ProductionRole } from "@/store/auth";
import { PageHeader } from "@/components/medifood/PageHeader";
import { formatKg } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ROLE_BADGE, ROLE_SHORT } from "@/lib/rbac";
import { api } from "@/lib/api";
import type { Product } from "@/store/data";

// ─── User dialog (create / edit) ─────────────────────────────────────────────

type UserDialogProps = {
  user: ManagedUser | null;
  products: Product[];
  onSave: (u: Omit<ManagedUser, "id"> | ManagedUser) => void;
  onClose: () => void;
};

function UserDialog({ user, products, onSave, onClose }: UserDialogProps) {
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Nom complet</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Prénom Nom" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@medifood.tn" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{isEdit ? "Nouveau mot de passe (vide = inchangé)" : "Mot de passe"}</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={isEdit ? "Laisser vide pour ne pas modifier" : "Mot de passe"} />
          </div>

          <div className="space-y-1.5">
            <Label>Rôle</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Responsable Commercial">Responsable Commercial</SelectItem>
                <SelectItem value="Responsable Production">Responsable Production</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
                    <label key={p.id} className="flex cursor-pointer items-center gap-2 text-sm select-none">
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
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cuisson">Cuisson (En attente → Cuit)</SelectItem>
                    <SelectItem value="emballage">Emballage (Cuit → Terminé)</SelectItem>
                    <SelectItem value="mixte">Mixte (tout le workflow)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {isEdit && (
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm font-medium">Compte actif</span>
              <Switch checked={active} onCheckedChange={setActive} />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button disabled={!canSave} onClick={submit}>
            {isEdit ? "Enregistrer" : "Créer l'utilisateur"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Product dialog (create / edit) ──────────────────────────────────────────

type ProductDialogProps = {
  product: Product | null;
  onSave: (data: Omit<Product, "id" | "unit"> | Product) => void;
  onClose: () => void;
};

function ProductDialog({ product, onSave, onClose }: ProductDialogProps) {
  const isEdit = product !== null;

  const [name, setName] = useState(product?.name ?? "");
  const [minStock, setMinStock] = useState(product != null ? String(product.minStock) : "");
  const [maxCapacity, setMaxCapacity] = useState(product != null ? String(product.maxCapacity) : "");
  const [currentStock, setCurrentStock] = useState(product != null ? String(product.currentStock) : "");

  const canSave = name.trim() && minStock !== "" && maxCapacity !== "";

  const submit = () => {
    const data = {
      name: name.trim(),
      minStock: Number(minStock),
      maxCapacity: Number(maxCapacity),
      currentStock: Number(currentStock || 0),
    };
    if (isEdit) {
      onSave({ ...product, ...data });
    } else {
      onSave(data as Omit<Product, "id" | "unit">);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le produit" : "Nouveau produit"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label>Nom du produit</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Couscous fin" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Stock minimum (kg)</Label>
              <Input type="number" min="0" value={minStock} onChange={(e) => setMinStock(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label>Capacité maximale (kg)</Label>
              <Input type="number" min="0" value={maxCapacity} onChange={(e) => setMaxCapacity(e.target.value)} placeholder="0" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Stock actuel (kg)</Label>
            <Input type="number" min="0" value={currentStock} onChange={(e) => setCurrentStock(e.target.value)} placeholder="0" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button disabled={!canSave} onClick={submit}>
            {isEdit ? "Enregistrer" : "Créer le produit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Users tab ────────────────────────────────────────────────────────────────

type UsersTabProps = {
  products: Product[];
};

function UsersTab({ products }: UsersTabProps) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogUser, setDialogUser] = useState<ManagedUser | null | "new">(undefined as any);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const reload = () => {
    api.users.getAll()
      .then((data) => setUsers(data as ManagedUser[]))
      .catch(() => toast.error("Erreur lors du chargement des utilisateurs"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, []);

  const openCreate = () => setDialogUser(null);
  const openEdit = (u: ManagedUser) => setDialogUser(u);
  const closeDialog = () => setDialogUser(undefined as any);

  const handleSave = async (data: Omit<ManagedUser, "id"> | ManagedUser) => {
    try {
      if ("id" in data) {
        await api.users.update((data as ManagedUser).id, data);
        toast.success("Utilisateur mis à jour");
      } else {
        await api.users.create(data);
        toast.success("Utilisateur créé");
      }
      reload();
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    }
    closeDialog();
  };

  const handleToggleActive = async (u: ManagedUser, active: boolean) => {
    try {
      await api.users.update(u.id, { ...u, active });
      toast.success(active ? "Compte activé" : "Compte désactivé");
      reload();
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.users.delete(deleteId);
      setDeleteId(null);
      toast.success("Utilisateur supprimé");
      reload();
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground animate-pulse">Chargement des utilisateurs...</p>
      </div>
    );
  }

  return (
    <>
      <Card className="card-soft border-0">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle>Utilisateurs ({users.length})</CardTitle>
          <Button size="sm" className="gap-1.5" onClick={openCreate}>
            <UserPlus className="h-4 w-4" />Ajouter un utilisateur
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
                    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", ROLE_BADGE[u.role])}>
                      {ROLE_SHORT[u.role]}
                    </span>
                  </TableCell>
                  <TableCell>
                    {u.role === "Responsable Production" && (
                      <div className="flex flex-wrap gap-1">
                        {u.assignedProducts?.map((p) => (
                          <Badge key={p} variant="outline" className="text-[10px] px-1.5 py-0">{p}</Badge>
                        ))}
                        {u.productionRole && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 capitalize">{u.productionRole}</Badge>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={u.active ?? true}
                      onCheckedChange={(v) => handleToggleActive(u, v)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(u)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(u.id)}>
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

      {dialogUser !== undefined && (
        <UserDialog user={dialogUser} products={products} onSave={handleSave} onClose={closeDialog} />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'utilisateur ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible. L'utilisateur ne pourra plus se connecter.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Products tab ─────────────────────────────────────────────────────────────

type ProductsTabProps = {
  products: Product[];
  loading: boolean;
  reload: () => void;
};

function ProductsTab({ products, loading, reload }: ProductsTabProps) {
  const [dialogProduct, setDialogProduct] = useState<Product | null | undefined>(undefined);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openCreate = () => setDialogProduct(null);
  const openEdit = (p: Product) => setDialogProduct(p);
  const closeDialog = () => setDialogProduct(undefined);

  const handleSave = async (data: Omit<Product, "id" | "unit"> | Product) => {
    try {
      if ("id" in data) {
        await api.products.update((data as Product).id, data);
        toast.success("Produit mis à jour");
      } else {
        await api.products.create(data);
        toast.success("Produit créé");
      }
      reload();
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    }
    closeDialog();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.products.delete(deleteId);
      setDeleteId(null);
      toast.success("Produit supprimé");
      reload();
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground animate-pulse">Chargement des produits...</p>
      </div>
    );
  }

  return (
    <>
      <Card className="card-soft border-0">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle>Catalogue produits ({products.length})</CardTitle>
          <Button size="sm" className="gap-1.5" onClick={openCreate}>
            <Plus className="h-4 w-4" />Nouveau produit
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Unité</TableHead>
                <TableHead className="text-right">Stock min</TableHead>
                <TableHead className="text-right">Capacité max</TableHead>
                <TableHead className="text-right">Stock actuel</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.unit}</TableCell>
                  <TableCell className="text-right">{formatKg(p.minStock)}</TableCell>
                  <TableCell className="text-right">{formatKg(p.maxCapacity)}</TableCell>
                  <TableCell className="text-right">{formatKg(p.currentStock)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(p)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(p.id)}>
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

      {dialogProduct !== undefined && (
        <ProductDialog product={dialogProduct} onSave={handleSave} onClose={closeDialog} />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le produit ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible. Le produit sera retiré du catalogue.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>
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
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const { user, updateProfile } = useAuth();
  const role = user?.role;
  const isAdmin = role === "Admin";
  const [notifs, setNotifs] = useState({ stock: true, order: true, late: true, daily: false });

  const [profileName, setProfileName] = useState(user?.name ?? "");
  const [profileEmail, setProfileEmail] = useState(user?.email ?? "");
  const [profilePassword, setProfilePassword] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  const handleProfileSave = async () => {
    const payload: { name?: string; email?: string; password?: string } = {};
    if (profileName.trim() && profileName.trim() !== user?.name) payload.name = profileName.trim();
    if (profileEmail.trim() && profileEmail.trim() !== user?.email) payload.email = profileEmail.trim();
    if (profilePassword.trim()) payload.password = profilePassword.trim();
    if (!Object.keys(payload).length) { toast.info("Aucune modification détectée"); return; }

    setProfileSaving(true);
    try {
      await api.auth.updateMe(payload);
      updateProfile({ name: payload.name ?? user?.name, email: payload.email ?? user?.email });
      setProfilePassword("");
      toast.success("Profil mis à jour");
    } catch (err: any) {
      toast.error(err.message ?? "Erreur lors de la mise à jour");
    } finally {
      setProfileSaving(false);
    }
  };

  const reloadProducts = () => {
    setProductsLoading(true);
    api.products.getAll()
      .then((data) => setProducts(data as Product[]))
      .catch(() => toast.error("Erreur lors du chargement des produits"))
      .finally(() => setProductsLoading(false));
  };

  useEffect(() => { reloadProducts(); }, []);

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
            <CardHeader><CardTitle>Mon profil</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>Nom</Label>
                <Input value={profileName} onChange={(e) => setProfileName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input type="email" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Nouveau mot de passe</Label>
                <Input type="password" value={profilePassword} onChange={(e) => setProfilePassword(e.target.value)} placeholder="Laisser vide pour ne pas modifier" />
              </div>
              <Button onClick={handleProfileSave} disabled={profileSaving}>
                {profileSaving ? "Enregistrement…" : "Enregistrer"}
              </Button>
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
          <UsersTab products={products} />
        </TabsContent>

        <TabsContent value="produits" className="mt-4">
          <ProductsTab products={products} loading={productsLoading} reload={reloadProducts} />
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
