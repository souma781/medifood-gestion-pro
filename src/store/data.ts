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
  date: string; // ISO
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
  name: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  notes?: string;
  active: boolean;
};

export type OrderStatus = "En attente" | "Confirmée" | "En préparation" | "Livrée" | "Annulée";

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
};

export type BonStatus = "Brouillon" | "Émis" | "Livré";

export type BonItem = {
  designation: string;
  quantity: number;
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
  { id: "c1", name: "Hichem Mansouri", company: "Carrefour Sfax", phone: "+216 74 123 456", email: "achats@carrefour-sfax.tn", address: "Avenue Habib Bourguiba", city: "Sfax", postalCode: "3000", active: true },
  { id: "c2", name: "Leila Ben Salah", company: "Monoprix Tunis", phone: "+216 71 987 654", email: "l.bensalah@monoprix.tn", address: "Rue de Marseille", city: "Tunis", postalCode: "1000", active: true },
  { id: "c3", name: "Anis Khelifi", company: "MG Distribution", phone: "+216 73 555 222", email: "anis@mg-dist.tn", address: "Zone Industrielle", city: "Sousse", postalCode: "4000", active: true },
  { id: "c4", name: "Sonia Gharbi", company: "Géant Tunisia", phone: "+216 71 444 333", email: "s.gharbi@geant.tn", address: "Lac 2", city: "Tunis", postalCode: "1053", active: true },
  { id: "c5", name: "Fares Jebali", company: "Délice Pâtisserie", phone: "+216 74 666 111", email: "contact@delice-patisserie.tn", address: "Rue Mongi Slim", city: "Sfax", postalCode: "3002", active: true },
  { id: "c6", name: "Maher Boukadi", company: "Aziza Markets", phone: "+216 72 333 999", email: "achats@aziza.tn", address: "Avenue de la République", city: "Bizerte", postalCode: "7000", active: true },
  { id: "c7", name: "Ines Lahmar", company: "Pâtisserie Royale", phone: "+216 75 222 444", email: "ines@royale.tn", address: "Rue 18 Janvier", city: "Gabès", postalCode: "6000", active: true },
  { id: "c8", name: "Walid Cherif", company: "Magasin Général", phone: "+216 71 888 222", email: "w.cherif@mg.tn", address: "Charguia 1", city: "Tunis", postalCode: "2035", active: false },
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
  const statuses: OrderStatus[] = ["En attente", "Confirmée", "En préparation", "Livrée", "En attente", "Confirmée", "Livrée"];
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
    out.push({
      id: `o${i + 1}`,
      number: `CMD-${2026}-${String(i + 1).padStart(4, "0")}`,
      clientId: pick(clients).id,
      date: date.toISOString(),
      deliveryDate: new Date(date.getTime() + 7 * 86400000).toISOString(),
      items,
      status: statuses[i % statuses.length],
    });
  }
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

function genBons(): BonLivraison[] {
  const statuses: BonStatus[] = ["Livré", "Livré", "Émis", "Brouillon", "Livré", "Émis", "Livré", "Émis"];
  const conditionnements = ["Sac 25 kg", "Carton 10 kg", "Sachet 5 kg", "Vrac"];
  const out: BonLivraison[] = [];
  for (let i = 0; i < 8; i++) {
    const date = new Date();
    date.setDate(date.getDate() - rand(0, 45));
    const delivery = new Date(date); delivery.setDate(delivery.getDate() + rand(1, 5));
    const itemCount = rand(2, 4);
    const items: BonItem[] = Array.from({ length: itemCount }, () => {
      const p = pick(products);
      return {
        designation: p.name,
        quantity: rand(25, 250),
        conditionnement: pick(conditionnements),
        observations: "",
      };
    });
    out.push({
      id: `bl${i + 1}`,
      number: `BL-2026-${String(i + 1).padStart(4, "0")}`,
      clientId: pick(clients).id,
      date: date.toISOString(),
      deliveryDate: delivery.toISOString(),
      items,
      status: statuses[i],
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

type DataState = {
  products: Product[];
  clients: Client[];
  operators: Operator[];
  production: ProductionEntry[];
  orders: Order[];
  bons: BonLivraison[];
  movements: StockMovement[];

  addProduction: (e: Omit<ProductionEntry, "id">) => void;
  deleteProduction: (id: string) => void;
  addMovement: (m: Omit<StockMovement, "id">) => void;
  addOrder: (o: Omit<Order, "id" | "number">) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  addClient: (c: Omit<Client, "id" | "active">) => void;
  updateClient: (c: Client) => void;
  addBon: (b: Omit<BonLivraison, "id" | "number">) => string;
  updateBonStatus: (id: string, status: BonStatus) => void;
};

export const useData = create<DataState>((set) => ({
  products,
  clients,
  operators,
  production: genProduction(),
  orders: genOrders(),
  bons: genBons(),
  movements: genMovements(),

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
  updateOrderStatus: (id, status) => set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)) })),
  addClient: (c) => set((s) => ({ clients: [...s.clients, { ...c, id: `c-${Date.now()}`, active: true }] })),
  updateClient: (c) => set((s) => ({ clients: s.clients.map((x) => (x.id === c.id ? c : x)) })),
  addBon: (b) => {
    const id = `bl-${Date.now()}`;
    set((s) => ({
      bons: [
        { ...b, id, number: `BL-2026-${String(s.bons.length + 1).padStart(4, "0")}` },
        ...s.bons,
      ],
    }));
    return id;
  },
  updateBonStatus: (id, status) => set((s) => ({ bons: s.bons.map((b) => (b.id === id ? { ...b, status } : b)) })),
}));