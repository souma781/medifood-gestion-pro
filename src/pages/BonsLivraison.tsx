import React, { useMemo, useState, useEffect, createContext, useContext } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Eye, Plus, Printer, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import elMadinaLogo from "@/assets/el-madina-logo.jpg";
import { type BonLivraison, type BonItem, type BonStatus, type Client, type Order, type Product } from "@/store/data";
import { useAuth } from "@/store/auth";
import { PageHeader } from "@/components/medifood/PageHeader";
import { StatusBadge } from "@/components/medifood/StatusBadge";
import { formatDate, formatPriceTND, numberToFrenchWords } from "@/lib/format";
import { api } from "@/lib/api";

// ─── Page-level context ───────────────────────────────────────────────────────

type BonsCtxValue = {
  bons: BonLivraison[];
  clients: Client[];
  orders: Order[];
  products: Product[];
  addBon: (b: Omit<BonLivraison, "id" | "number"> & { number?: string }) => Promise<string>;
  updateBonStatus: (id: string, status: BonStatus) => Promise<void>;
  reload: () => void;
};

const BonsCtx = createContext<BonsCtxValue>(null!);
const useBonsCtx = () => useContext(BonsCtx);

// ─── helpers ──────────────────────────────────────────────────────────────────

const MIN_ROWS = 15;

function blTotal(bon: BonLivraison) {
  return bon.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
}

// ─── print styles ─────────────────────────────────────────────────────────────

function PrintStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=swap');

      @media print {
        @page { size: A4 portrait; margin: 0; }
        body * { visibility: hidden !important; }
        #bl-print-container,
        #bl-print-container * { visibility: visible !important; }
        #bl-print-container {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 210mm !important;
          padding: 12mm 15mm !important;
          font-size: 10px !important;
          font-family: Arial, sans-serif !important;
          background: white !important;
          color: black !important;
          box-shadow: none !important;
        }
        .no-print { display: none !important; }
        table { page-break-inside: avoid; }
      }
    `}</style>
  );
}

// ─── BonPreview ───────────────────────────────────────────────────────────────

function BonPreview({ bon, onClose }: { bon: BonLivraison; onClose: () => void }) {
  const { clients } = useBonsCtx();
  const { user } = useAuth();
  const client = clients.find((c) => c.id === bon.clientId);

  const grandTotal = blTotal(bon);
  const dinars = Math.floor(grandTotal);
  const millimes = Math.round((grandTotal - dinars) * 1000);
  const amountWords =
    numberToFrenchWords(dinars) +
    " Dinars" +
    (millimes > 0 ? ` et ${numberToFrenchWords(millimes)} Millimes` : "") +
    ".";

  const clientNum = (client?.clientNumber ?? "0000").padStart(4, "0");
  const matricule = bon.matriculeFiscale || client?.matriculeFiscale || "";

  const rowCount = Math.max(MIN_ROWS, bon.items.length);

  const cell: React.CSSProperties = {
    border: "1px solid #333",
    padding: "3px 5px",
    fontSize: "10px",
    verticalAlign: "middle",
  };
  const hCell: React.CSSProperties = {
    ...cell,
    backgroundColor: "#f0f0f0",
    fontWeight: "bold",
    textAlign: "center",
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-[870px] max-h-[95vh] overflow-y-auto p-0"
        style={{ fontFamily: "Arial, sans-serif" }}
      >
        <PrintStyles />

        <div className="no-print flex items-center justify-between px-4 py-2 border-b" style={{ background: "#f8f8f8" }}>
          <span className="font-semibold text-sm">Aperçu — BL {bon.number}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>Fermer</Button>
            <Button size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-1" />Imprimer
            </Button>
          </div>
        </div>

        <div
          id="bl-print-container"
          style={{ fontFamily: "Arial, sans-serif", fontSize: "10px", color: "#000", padding: "12mm 15mm", maxWidth: "210mm", margin: "0 auto", background: "#fff" }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "6px" }}>
            <tbody>
              <tr>
                <td style={{ width: "36%", verticalAlign: "top", fontSize: "10px", lineHeight: "1.5" }}>
                  <strong>STE MEDIFOOD</strong><br />
                  Mediterranean Food Process &amp; Packing<br />
                  Route Gremda km 9 Z.I.<br />
                  Tanyour, BP. 147 – 3071 SFAX<br />
                  Tél.: 74 657 208 – Fax: 74 657 209<br />
                  MF : 1310342D/A/M/000<br />
                  RC : B81151862013
                </td>
                <td style={{ width: "28%", textAlign: "center", verticalAlign: "middle" }}>
                  <img src={elMadinaLogo} alt="EL MADINA – MEDIFOOD" style={{ maxHeight: "70px", maxWidth: "140px", objectFit: "contain" }} />
                </td>
                <td style={{ width: "36%", textAlign: "right", verticalAlign: "top", direction: "rtl", fontFamily: "'Noto Sans Arabic', Arial, sans-serif", fontSize: "10px", lineHeight: "1.6" }}>
                  <strong style={{ fontSize: "13px" }}>ماديفود</strong><br />
                  المتوسطية للتحويل الغذائي و التعليب<br />
                  طريق قرمدة كلم 9 المنطقة الصناعية<br />
                  قصاصر تنيور ص. ب 147 - 3071 صفاقس<br />
                  الهاتف : 74 657 208 / الفاكس : 74 657 209<br />
                  المعرف الجبائي : 1310342D/A/M/000<br />
                  السجل التجاري : B81151862013
                </td>
              </tr>
            </tbody>
          </table>

          <hr style={{ border: "none", borderTop: "1px solid #333", margin: "4px 0 8px 0" }} />

          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "6px" }}>
            <tbody>
              <tr style={{ verticalAlign: "top" }}>
                <td style={{ width: "38%", paddingRight: "12px" }}>
                  <div style={{ fontWeight: "bold", fontSize: "16px", textTransform: "uppercase", marginBottom: "6px", letterSpacing: "0.5px" }}>BON DE LIVRAISON</div>
                  <table style={{ borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={{ ...hCell, width: "90px" }}>Numéro</th>
                        <th style={{ ...hCell, width: "90px" }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ ...cell, textAlign: "center", fontWeight: "bold" }}>{bon.number}</td>
                        <td style={{ ...cell, textAlign: "center" }}>{formatDate(bon.date)}</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
                <td style={{ border: "1px solid #333", padding: "6px 10px", fontSize: "10px", lineHeight: "1.6" }}>
                  <div>Client N° : <strong style={{ fontSize: "11px" }}>{clientNum}</strong></div>
                  <div style={{ fontWeight: "bold", fontSize: "12px", textTransform: "uppercase", margin: "1px 0" }}>{client?.company}</div>
                  <div>{client?.address}</div>
                  <div>{client?.postalCode} {client?.city}</div>
                  <div>Tél.: {client?.phone} &nbsp;&nbsp; Fax :</div>
                  <div>Matricule fiscale : <span style={{ fontFamily: "monospace" }}>{matricule}</span></div>
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{ textAlign: "right", fontSize: "9px", marginBottom: "4px" }}>Page 1 / 1</div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px", marginBottom: "8px" }}>
            <thead>
              <tr>
                <th style={{ ...hCell, width: "4%" }}>N°</th>
                <th style={{ ...hCell, width: "46%", textAlign: "left", paddingLeft: "6px" }}>Désignation</th>
                <th style={{ ...hCell, width: "8%" }}>U.</th>
                <th style={{ ...hCell, width: "10%" }}>Qté</th>
                <th style={{ ...hCell, width: "16%" }}>Prix U.</th>
                <th style={{ ...hCell, width: "16%" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rowCount }).map((_, i) => {
                const item = bon.items[i] as BonItem | undefined;
                const lineTotal = item ? item.quantity * item.unitPrice : 0;
                return (
                  <tr key={i} style={{ height: "18px" }}>
                    <td style={{ ...cell, textAlign: "center" }}>{item ? i + 1 : ""}</td>
                    <td style={{ ...cell }}>{item?.designation ?? ""}</td>
                    <td style={{ ...cell, textAlign: "center" }}>{item?.unit ?? ""}</td>
                    <td style={{ ...cell, textAlign: "center" }}>{item ? item.quantity : ""}</td>
                    <td style={{ ...cell, textAlign: "right" }}>{item ? formatPriceTND(item.unitPrice) : ""}</td>
                    <td style={{ ...cell, textAlign: "right" }}>{item ? formatPriceTND(lineTotal) : ""}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} style={{ border: "1px solid #333", padding: "3px" }} />
                <td style={{ ...cell, textAlign: "right", fontWeight: "bold", backgroundColor: "#f0f0f0" }}>Total</td>
                <td style={{ ...cell, textAlign: "right", fontWeight: "bold" }}>{formatPriceTND(grandTotal)}</td>
              </tr>
            </tfoot>
          </table>

          <div style={{ fontSize: "10px", marginBottom: "14px", borderTop: "1px solid #ccc", paddingTop: "6px" }}>
            <div>Arrêté le présent bon de livraison à la somme de :</div>
            <div style={{ fontWeight: "bold", marginTop: "2px" }}>{amountWords}</div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: "8px" }}>
            <div style={{ fontSize: "10px", lineHeight: "2" }}>
              <div>Chauffeur : <span style={{ borderBottom: "1px solid #333", paddingRight: "80px" }}>{bon.chauffeur ?? ""}</span></div>
              <div style={{ marginTop: "10px" }}>BL Préparé par : <span style={{ borderBottom: "1px solid #333", paddingRight: "60px" }}>{user?.name ?? ""}</span></div>
            </div>
            <div style={{ border: "2px solid #333", width: "110px", height: "70px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", textAlign: "center", color: "#555", borderRadius: "4px", flexShrink: 0 }}>
              Cachet et<br />Signature
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── BonList ──────────────────────────────────────────────────────────────────

function BonList() {
  const { bons, clients, orders, updateBonStatus } = useBonsCtx();
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
              <TableHead className="text-right">Montant (TND)</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">Aucun bon</TableCell>
              </TableRow>
            )}
            {filtered.map((b) => {
              const total = blTotal(b);
              const order = orders.find((o) => o.id === b.orderId);
              return (
                <TableRow key={b.id}>
                  <TableCell className="font-mono text-xs">{b.number}</TableCell>
                  <TableCell className="font-medium">{clients.find((c) => c.id === b.clientId)?.company}</TableCell>
                  <TableCell>{formatDate(b.date)}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{order?.number ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{b.items.length} ligne(s)</TableCell>
                  <TableCell className="text-right font-semibold font-mono text-xs">{formatPriceTND(total)}</TableCell>
                  <TableCell><StatusBadge status={b.status} /></TableCell>
                  <TableCell className="space-x-1">
                    <Button size="icon" variant="ghost" title="Aperçu" onClick={() => setPreviewing(b.id)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" title="Imprimer" onClick={() => { setPreviewing(b.id); setTimeout(() => window.print(), 400); }}>
                      <Printer className="h-4 w-4" />
                    </Button>
                    {b.status !== "Livré" && (
                      <Button size="sm" variant="outline" onClick={async () => {
                        try {
                          await updateBonStatus(b.id, "Livré");
                          toast.success("Marqué comme livré");
                        } catch {
                          toast.error("Erreur lors de la mise à jour");
                        }
                      }}>
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

// ─── NewBon ───────────────────────────────────────────────────────────────────

function NewBon() {
  const { clients, orders, products, bons, addBon } = useBonsCtx();
  const { user } = useAuth();
  const year = new Date().getFullYear();

  const [blNumber, setBlNumber] = useState(`${String(bons.length + 1).padStart(4, "0")} / ${year}`);
  const [orderId, setOrderId] = useState<string>("");
  const [clientId, setClientId] = useState<string>("");
  const [chauffeur, setChauffeur] = useState("");
  const [matriculeFiscale, setMatriculeFiscale] = useState("");
  const [items, setItems] = useState<BonItem[]>([
    { designation: "", quantity: 0, unit: "Kg", unitPrice: 0, conditionnement: "", observations: "" },
  ]);
  const [notes, setNotes] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const [delivery, setDelivery] = useState(today);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const client = clients.find((c) => c.id === clientId);
  const grandTotal = items.reduce((s, i) => s + (i.quantity || 0) * (i.unitPrice || 0), 0);

  const onClientChange = (id: string) => {
    setClientId(id);
    const c = clients.find((x) => x.id === id);
    if (c?.matriculeFiscale) setMatriculeFiscale(c.matriculeFiscale);
  };

  const onPickOrder = (id: string) => {
    setOrderId(id);
    const o = orders.find((x) => x.id === id);
    if (!o) return;
    onClientChange(o.clientId);
    setItems(
      o.items.map((it) => {
        const p = products.find((pr) => pr.id === it.productId);
        return {
          designation: p?.name ?? "",
          quantity: it.quantity,
          unit: "Kg" as const,
          unitPrice: it.unitPrice,
          conditionnement: "Sac 25 kg",
          observations: "",
        };
      }),
    );
  };

  const updateItem = (idx: number, patch: Partial<BonItem>) =>
    setItems(items.map((x, i) => (i === idx ? { ...x, ...patch } : x)));

  const resetForm = () => {
    setItems([{ designation: "", quantity: 0, unit: "Kg", unitPrice: 0, conditionnement: "", observations: "" }]);
    setClientId("");
    setOrderId("");
    setNotes("");
    setChauffeur("");
    setMatriculeFiscale("");
  };

  const submit = async (status: BonStatus) => {
    if (!clientId) { toast.error("Sélectionner un client"); return; }
    if (items.some((i) => !i.designation || !i.quantity)) {
      toast.error("Compléter les lignes produits");
      return;
    }
    try {
      await addBon({
        number: blNumber,
        clientId,
        orderId: orderId || undefined,
        date: new Date(today).toISOString(),
        deliveryDate: new Date(delivery).toISOString(),
        items,
        status,
        notes,
        chauffeur: chauffeur || undefined,
        matriculeFiscale: matriculeFiscale || undefined,
      });
      toast.success(status === "Émis" ? "Bon émis" : "Brouillon enregistré");
      resetForm();
    } catch {
      toast.error("Erreur lors de la création du bon");
    }
  };

  const previewNow = async () => {
    if (!clientId) { toast.error("Sélectionner un client"); return; }
    try {
      const id = await addBon({
        number: blNumber,
        clientId,
        orderId: orderId || undefined,
        date: new Date(today).toISOString(),
        deliveryDate: new Date(delivery).toISOString(),
        items,
        status: "Brouillon",
        notes,
        chauffeur: chauffeur || undefined,
        matriculeFiscale: matriculeFiscale || undefined,
      });
      setPreviewId(id);
    } catch {
      toast.error("Erreur lors de la création du bon");
    }
  };

  const previewBon = bons.find((b) => b.id === previewId);

  return (
    <Card className="card-soft border-0 max-w-5xl">
      <CardHeader>
        <CardTitle>Nouveau bon de livraison</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-1.5">
            <Label>N° Bon</Label>
            <Input value={blNumber} onChange={(e) => setBlNumber(e.target.value)} className="font-mono" placeholder="0001 / 2026" />
          </div>
          <div className="space-y-1.5">
            <Label>Date d'émission</Label>
            <Input type="date" value={today} readOnly />
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
                {orders.map((o) => (<SelectItem key={o.id} value={o.id}>{o.number}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label>Client</Label>
            {!orderId && (
              <Select value={clientId} onValueChange={onClientChange}>
                <SelectTrigger className="w-64"><SelectValue placeholder="Sélectionner un client" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.clientNumber ? `[${c.clientNumber}] ` : ""}{c.company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          {client ? (
            <div className="text-sm">
              <div className="font-semibold">
                {client.company}
                {client.clientNumber && <span className="ml-2 text-xs text-muted-foreground font-mono">N° {client.clientNumber}</span>}
              </div>
              <div className="text-muted-foreground">{client.name} — {client.phone}</div>
              <div className="text-muted-foreground">{client.address}, {client.postalCode} {client.city}</div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Aucun client sélectionné</div>
          )}
          <div className="space-y-1.5">
            <Label>Matricule fiscale du client</Label>
            <Input value={matriculeFiscale} onChange={(e) => setMatriculeFiscale(e.target.value)} placeholder="ex: 1234567A/A/M/000" className="font-mono" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Chauffeur</Label>
          <Input value={chauffeur} onChange={(e) => setChauffeur(e.target.value)} placeholder="ex: BOUBAKER MBAREK 7823 TU 222" />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label>Produits</Label>
            <Button size="sm" variant="outline" onClick={() => setItems([...items, { designation: "", quantity: 0, unit: "Kg", unitPrice: 0, conditionnement: "", observations: "" }])}>
              <Plus className="h-4 w-4 mr-1" />Ajouter ligne
            </Button>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
              <div className="col-span-5">Désignation</div>
              <div className="col-span-2">Qté</div>
              <div className="col-span-2">Unité</div>
              <div className="col-span-2">Prix U. (TND)</div>
              <div className="col-span-1" />
            </div>

            {items.map((it, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2">
                <Input className="col-span-5" placeholder="Désignation du produit" value={it.designation} onChange={(e) => updateItem(idx, { designation: e.target.value })} />
                <Input className="col-span-2" type="number" min={0} value={it.quantity || ""} onChange={(e) => updateItem(idx, { quantity: parseFloat(e.target.value) || 0 })} />
                <Select value={it.unit} onValueChange={(v) => updateItem(idx, { unit: v as "Kg" | "1P" })}>
                  <SelectTrigger className="col-span-2"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Kg">Kg</SelectItem>
                    <SelectItem value="1P">1P (pièce)</SelectItem>
                  </SelectContent>
                </Select>
                <Input className="col-span-2" type="number" min={0} step={0.001} value={it.unitPrice || ""} onChange={(e) => updateItem(idx, { unitPrice: parseFloat(e.target.value) || 0 })} />
                <Button variant="ghost" size="icon" className="col-span-1 text-destructive" onClick={() => setItems(items.filter((_, i) => i !== idx))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-3 flex justify-end">
            <div className="rounded-lg border border-border px-4 py-2 text-sm font-mono">
              <span className="text-muted-foreground">Total : </span>
              <span className="font-bold text-primary">{formatPriceTND(grandTotal)} TND</span>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Notes / conditions</Label>
          <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Conditions de livraison, remarques…" />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => submit("Brouillon")}>Sauvegarder brouillon</Button>
          <Button variant="outline" onClick={previewNow}>
            <Eye className="h-4 w-4 mr-2" />Aperçu / Imprimer
          </Button>
          <Button onClick={() => submit("Émis")}>Émettre le bon</Button>
        </div>
      </CardContent>

      {previewBon && <BonPreview bon={previewBon} onClose={() => setPreviewId(null)} />}
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BonsLivraison() {
  const [bons, setBons] = useState<BonLivraison[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = () => {
    Promise.all([
      api.bons.getAll(),
      api.clients.getAll(),
      api.orders.getAll(),
      api.products.getAll(),
    ])
      .then(([b, cls, ords, prods]) => {
        setBons(b as BonLivraison[]);
        setClients(cls as Client[]);
        setOrders(ords as Order[]);
        setProducts(prods as Product[]);
      })
      .catch(() => toast.error("Erreur lors du chargement des données"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, []);

  const handleAddBon = async (b: Omit<BonLivraison, "id" | "number"> & { number?: string }): Promise<string> => {
    const created = await api.bons.create(b) as any;
    reload();
    return created.id ?? created._id ?? "";
  };

  const handleUpdateBonStatus = async (id: string, status: BonStatus) => {
    await api.bons.updateStatus(id, status);
    reload();
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Bons de livraison" description="Création et suivi des bons de livraison MEDIFOOD" />
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground animate-pulse">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <BonsCtx.Provider value={{ bons, clients, orders, products, addBon: handleAddBon, updateBonStatus: handleUpdateBonStatus, reload }}>
      <div>
        <PageHeader title="Bons de livraison" description="Création et suivi des bons de livraison MEDIFOOD" />
        <Tabs defaultValue="list">
          <TabsList>
            <TabsTrigger value="list">Liste des bons</TabsTrigger>
            <TabsTrigger value="new">Nouveau bon</TabsTrigger>
          </TabsList>
          <TabsContent value="list" className="mt-4"><BonList /></TabsContent>
          <TabsContent value="new" className="mt-4"><NewBon /></TabsContent>
        </Tabs>
      </div>
    </BonsCtx.Provider>
  );
}
