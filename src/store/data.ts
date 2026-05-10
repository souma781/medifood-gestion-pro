import { create } from "zustand";

export type ProductCategory =
  | "Amandes"
  | "Pistaches"
  | "Graines de tournesol"
  | "Cacahuètes nature"
  | "Cacahuètes enrobées"
  | "Fruits enrobés chocolat";

export type Product = {
  id: string;
  name: ProductCategory;
  unit: "kg";
  minStock: number;
  maxCapacity: number;
  currentStock: number;
};

export type ProductionEntry = {
  id: string;
  date: string;
  productId: string;
  produced: number;
  packaged: number;
  lot: string;
  operator: string;
  notes?: string;
};

export type StockMovement = {
  id: string;
  date: string;
  productId: string;
  type: "Entrée" | "Sortie" | "Ajustement";
  quantity: number;
  reason: string;
  user: string;
};

export type Client = {
  id: string;
  clientNumber?: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  matriculeFiscale?: string;
  notes?: string;
  active: boolean;
};

export type OrderStatus =
  | "En attente"
  | "En cuisson"
  | "Cuit"
  | "En emballage"
  | "Terminé"
  | "Refusé";

export type OrderItem = { productId: string; quantity: number; unitPrice: number };

export type Order = {
  id: string;
  number: string;
  clientId: string;
  date: string;
  deliveryDate?: string;
  items: OrderItem[];
  status: OrderStatus;
  notes?: string;
  partialQuantities?: Record<string, number>;
  refusalReason?: string;
};

export type BonStatus = "Brouillon" | "Émis" | "Livré";

export type BonItem = {
  designation: string;
  quantity: number;
  unit: "Kg" | "1P";
  unitPrice: number;
  conditionnement: string;
  observations?: string;
};

export type BonLivraison = {
  id: string;
  number: string;
  clientId: string;
  orderId?: string;
  date: string;
  deliveryDate: string;
  items: BonItem[];
  status: BonStatus;
  notes?: string;
  chauffeur?: string;
  matriculeFiscale?: string;
};

export type NotificationType = "stock_insuffisant" | "panne_machine" | "commande_refusée" | "manque_ouvriers" | "autre";

export type AppNotification = {
  id: string;
  date: string;
  type: NotificationType;
  message: string;
  orderId?: string;
  read: boolean;
  recipientRole: "Responsable Commercial" | "Admin";
};

export type IncidentType = "panne_machine" | "stock_insuffisant" | "manque_ouvriers" | "autre";

export type Incident = {
  id: string;
  date: string;
  type: IncidentType;
  description: string;
  orderId?: string;
  productId?: string;
  reportedBy: string;
};

export type Operator = string;

const operators: Operator[] = ["Karim Bouzid", "Sami Hamdi", "Nadia Trabelsi", "Mohamed Ali"];

const products: Product[] = [
  { id: "p1", name: "Amandes", unit: "kg", minStock: 200, maxCapacity: 1500, currentStock: 820 },
  { id: "p2", name: "Pistaches", unit: "kg", minStock: 150, maxCapacity: 1000, currentStock: 145 },
  { id: "p3", name: "Graines de tournesol", unit: "kg", minStock: 300, maxCapacity: 2000, currentStock: 1340 },
  { id: "p4", name: "Cacahuètes nature", unit: "kg", minStock: 400, maxCapacity: 2500, currentStock: 1820 },
  { id: "p5", name: "Cacahuètes enrobées", unit: "kg", minStock: 250, maxCapacity: 1500, currentStock: 360 },
  { id: "p6", name: "Fruits enrobés chocolat", unit: "kg", minStock: 200, maxCapacity: 1200, currentStock: 95 },
];

const clients: Client[] = [
  { id: "c1", clientNumber: "0001", name: "Hichem Mansouri", company: "Carrefour Sfax", phone: "74 123 456", email: "achats@carrefour-sfax.tn", address: "Avenue Habib Bourguiba", city: "Sfax", postalCode: "3000", matriculeFiscale: "0123456A/A/M/000", active: true },
  { id: "c2", clientNumber: "0002", name: "Leila Ben Salah", company: "Monoprix Tunis", phone: "71 987 654", email: "l.bensalah@monoprix.tn", address: "Rue de Marseille", city: "Tunis", postalCode: "1000", matriculeFiscale: "0234567B/A/M/000", active: true },
  { id: "c3", clientNumber: "0003", name: "Anis Khelifi", company: "MG Distribution Sousse", phone: "73 555 222", email: "anis@mg-dist.tn", address: "Zone Industrielle", city: "Sousse", postalCode: "4000", matriculeFiscale: "0345678C/A/M/000", active: true },
  { id: "c4", clientNumber: "0004", name: "Sonia Gharbi", company: "Géant Tunisia", phone: "71 444 333", email: "s.gharbi@geant.tn", address: "Lac 2, Berges du Lac", city: "Tunis", postalCode: "1053", matriculeFiscale: "0456789D/A/M/000", active: true },
  { id: "c5", clientNumber: "0005", name: "Fares Jebali", company: "Délice Pâtisserie", phone: "74 666 111", email: "contact@delice-patisserie.tn", address: "Rue Mongi Slim", city: "Sfax", postalCode: "3002", active: true },
  { id: "c6", clientNumber: "0006", name: "Maher Boukadi", company: "Aziza Supermarchés Monastir", phone: "73 333 999", email: "achats@aziza.tn", address: "Avenue de l'Environnement", city: "Monastir", postalCode: "5000", matriculeFiscale: "0567890E/A/M/000", active: true },
  { id: "c7", clientNumber: "0007", name: "Ines Lahmar", company: "Marché Centrale Gabès", phone: "75 222 444", email: "ines@centrale-gabes.tn", address: "Rue 18 Janvier", city: "Gabès", postalCode: "6000", active: true },
  { id: "c8", clientNumber: "0008", name: "Walid Cherif", company: "Magasin Général Tunis", phone: "71 888 222", email: "w.cherif@mg.tn", address: "Charguia 1", city: "Tunis", postalCode: "2035", matriculeFiscale: "0678901F/A/M/000", active: false },
];

function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick<T>(arr: T[]) { return arr[Math.floor(Math.random() * arr.length)]; }

function genProduction(): ProductionEntry[] {
  const out: ProductionEntry[] = [];
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    const entries = i === 0 ? 2 : Math.random() < 0.7 ? 1 : 0;
    for (let j = 0; j < entries; j++) {
      const product = pick(products);
      const produced = rand(80, 320);
      out.push({
        id: `pr-${i}-${j}-${product.id}`,
        date: day.toISOString(),
        productId: product.id,
        produced,
        packaged: produced - rand(0, 20),
        lot: `L${day.getFullYear()}${String(day.getMonth() + 1).padStart(2, "0")}${String(day.getDate()).padStart(2, "0")}-${rand(100, 999)}`,
        operator: pick(operators),
        notes: "",
      });
    }
  }
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

function genOrders(): Order[] {
  const statuses: OrderStatus[] = ["En attente", "En cuisson", "Cuit", "En emballage", "Terminé", "En attente", "Terminé", "Refusé", "En cuisson"];
  const out: Order[] = [];
  for (let i = 0; i < 15; i++) {
    const date = new Date();
    date.setDate(date.getDate() - rand(0, 25));
    const itemCount = rand(1, 4);
    const items: OrderItem[] = [];
    for (let k = 0; k < itemCount; k++) {
      const p = pick(products);
      items.push({ productId: p.id, quantity: rand(20, 200), unitPrice: rand(15, 60) });
    }
    const status = statuses[i % statuses.length];
    out.push({
      id: `o${i + 1}`,
      number: `CMD-${2026}-${String(i + 1).padStart(4, "0")}`,
      clientId: pick(clients).id,
      date: date.toISOString(),
      deliveryDate: new Date(date.getTime() + 7 * 86400000).toISOString(),
      items,
      status,
      refusalReason: status === "Refusé" ? "Stock insuffisant pour traiter la commande" : undefined,
    });
  }
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

type MediProduct = { name: string; unit: "Kg" | "1P"; prices: number[] };

const mediProducts: MediProduct[] = [
  { name: "Grains de tournesols blanc et noir grillés 700gr", unit: "1P", prices: [2.500, 2.750, 3.000, 3.250] },
  { name: "Grain de tournesol noir et blanc grillées 3kg", unit: "Kg", prices: [8.000, 9.500, 10.000, 11.000] },
  { name: "Pistache en coque grillées salées 1kg", unit: "Kg", prices: [22.000, 24.000, 25.000, 27.000] },
  { name: "Cacahuète rouge grillé salé seau 1.8kg", unit: "1P", prices: [12.000, 13.500, 14.000, 15.000] },
  { name: "Cacahuète blanc grillées salées 1kg", unit: "Kg", prices: [6.000, 7.000, 7.500, 8.500] },
  { name: "Cacahuète chip nuts fromage sachet 800grs", unit: "1P", prices: [3.000, 3.500, 3.800, 4.000] },
];

const chauffeurs = [
  "BOUBAKER MBAREK 7823 TU 222",
  "SALAH HAMDI 4521 TN 133",
  "RIDHA GHARBI 1092 SX 048",
  "NOUREDDINE FEKI 2233 MS 077",
];

function genBons(): BonLivraison[] {
  const statuses: BonStatus[] = ["Livré", "Livré", "Émis", "Brouillon", "Livré", "Émis", "Livré", "Émis"];
  const clientIds = ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"];

  const out: BonLivraison[] = [];
  for (let i = 0; i < 8; i++) {
    const date = new Date();
    date.setDate(date.getDate() - rand(0, 45));
    const delivery = new Date(date);
    delivery.setDate(delivery.getDate() + rand(1, 5));

    const itemCount = rand(2, 4);
    const usedIdx = new Set<number>();
    const items: BonItem[] = [];
    for (let k = 0; k < itemCount; k++) {
      let pIdx: number;
      do { pIdx = rand(0, mediProducts.length - 1); } while (usedIdx.has(pIdx));
      usedIdx.add(pIdx);
      const p = mediProducts[pIdx];
      const qty = p.unit === "1P" ? rand(50, 300) : rand(20, 120);
      const price = pick(p.prices);
      items.push({
        designation: p.name,
        quantity: qty,
        unit: p.unit,
        unitPrice: price,
        conditionnement: p.unit === "1P" ? "Carton" : "Sac 25 kg",
        observations: "",
      });
    }

    const client = clients.find((c) => c.id === clientIds[i]);
    out.push({
      id: `bl${i + 1}`,
      number: `${String(i + 1).padStart(4, "0")} / 2026`,
      clientId: clientIds[i],
      date: date.toISOString(),
      deliveryDate: delivery.toISOString(),
      items,
      status: statuses[i],
      chauffeur: pick(chauffeurs),
      matriculeFiscale: client?.matriculeFiscale,
    });
  }
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

function genMovements(): StockMovement[] {
  const out: StockMovement[] = [];
  const types: StockMovement["type"][] = ["Entrée", "Sortie", "Ajustement"];
  for (let i = 0; i < 18; i++) {
    const d = new Date(); d.setDate(d.getDate() - rand(0, 20));
    out.push({
      id: `m${i}`,
      date: d.toISOString(),
      productId: pick(products).id,
      type: pick(types),
      quantity: rand(20, 250),
      reason: pick(["Livraison fournisseur", "Commande client", "Inventaire", "Production interne", "Réajustement"]),
      user: pick(operators),
    });
  }
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

function genInitialNotifications(): AppNotification[] {
  return [
    {
      id: "n1",
      date: new Date(Date.now() - 2 * 3600000).toISOString(),
      type: "stock_insuffisant",
      message: "Stock Pistaches insuffisant (145 kg < seuil 150 kg). Réapprovisionnement requis.",
      read: false,
      recipientRole: "Responsable Commercial",
    },
    {
      id: "n2",
      date: new Date(Date.now() - 5 * 3600000).toISOString(),
      type: "stock_insuffisant",
      message: "Stock Fruits enrobés chocolat critique (95 kg < seuil 200 kg).",
      read: false,
      recipientRole: "Responsable Commercial",
    },
  ];
}

type DataState = {
  products: Product[];
  clients: Client[];
  operators: Operator[];
  production: ProductionEntry[];
  orders: Order[];
  bons: BonLivraison[];
  movements: StockMovement[];
  notifications: AppNotification[];
  incidents: Incident[];

  addProduction: (e: Omit<ProductionEntry, "id">) => void;
  deleteProduction: (id: string) => void;
  addMovement: (m: Omit<StockMovement, "id">) => void;
  addOrder: (o: Omit<Order, "id" | "number">) => void;
  updateOrderStatus: (
    id: string,
    status: OrderStatus,
    partialQuantities?: Record<string, number>,
    refusalReason?: string,
  ) => void;
  addClient: (c: Omit<Client, "id" | "active">) => void;
  updateClient: (c: Client) => void;
  addBon: (b: Omit<BonLivraison, "id" | "number"> & { number?: string }) => string;
  updateBonStatus: (id: string, status: BonStatus) => void;
  addNotification: (n: Omit<AppNotification, "id" | "read">) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (role: "Responsable Commercial" | "Admin") => void;
  addIncident: (i: Omit<Incident, "id">) => void;
};

export const useData = create<DataState>((set) => ({
  products,
  clients,
  operators,
  production: genProduction(),
  orders: genOrders(),
  bons: genBons(),
  movements: genMovements(),
  notifications: genInitialNotifications(),
  incidents: [],

  addProduction: (e) =>
    set((s) => ({
      production: [{ ...e, id: `pr-${Date.now()}` }, ...s.production],
      products: s.products.map((p) => (p.id === e.productId ? { ...p, currentStock: p.currentStock + e.packaged } : p)),
    })),
  deleteProduction: (id) => set((s) => ({ production: s.production.filter((p) => p.id !== id) })),
  addMovement: (m) =>
    set((s) => ({
      movements: [{ ...m, id: `m-${Date.now()}` }, ...s.movements],
      products: s.products.map((p) => {
        if (p.id !== m.productId) return p;
        const delta = m.type === "Entrée" ? m.quantity : m.type === "Sortie" ? -m.quantity : m.quantity;
        return { ...p, currentStock: Math.max(0, p.currentStock + delta) };
      }),
    })),
  addOrder: (o) =>
    set((s) => ({
      orders: [
        { ...o, id: `o-${Date.now()}`, number: `CMD-2026-${String(s.orders.length + 1).padStart(4, "0")}` },
        ...s.orders,
      ],
    })),
  updateOrderStatus: (id, status, partialQuantities, refusalReason) =>
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === id
          ? {
            ...o,
            status,
            partialQuantities: partialQuantities ?? (status === "Terminé" ? undefined : o.partialQuantities),
            refusalReason: refusalReason ?? o.refusalReason,
          }
          : o,
      ),
    })),
  addClient: (c) => set((s) => ({ clients: [...s.clients, { ...c, id: `c-${Date.now()}`, active: true }] })),
  updateClient: (c) => set((s) => ({ clients: s.clients.map((x) => (x.id === c.id ? c : x)) })),
  addBon: (b) => {
    const id = `bl-${Date.now()}`;
    set((s) => {
      const number = b.number || `${String(s.bons.length + 1).padStart(4, "0")} / ${new Date().getFullYear()}`;
      return { bons: [{ ...b, id, number }, ...s.bons] };
    });
    return id;
  },
  updateBonStatus: (id, status) => set((s) => ({ bons: s.bons.map((b) => (b.id === id ? { ...b, status } : b)) })),
  addNotification: (n) =>
    set((s) => ({
      notifications: [{ ...n, id: `notif-${Date.now()}`, read: false }, ...s.notifications],
    })),
  markNotificationRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),
  markAllNotificationsRead: (role) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.recipientRole === role ? { ...n, read: true } : n,
      ),
    })),
  addIncident: (i) =>
    set((s) => ({ incidents: [{ ...i, id: `inc-${Date.now()}` }, ...s.incidents] })),
}));
