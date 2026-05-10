export const formatTND = (n: number) =>
  new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .format(n)
    .replace(/ /g, " ") + " TND";

export const formatKg = (n: number) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(n).replace(/ /g, " ") + " kg";

export const formatNumber = (n: number) =>
  new Intl.NumberFormat("fr-FR").format(n).replace(/ /g, " ");

export const formatDate = (d: Date | string) => {
  const date = typeof d === "string" ? new Date(d) : d;
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

// Format a TND amount: 3 decimal places with space thousands separator
// e.g. 12704.5 → "12 704.500"
export const formatPriceTND = (n: number): string => {
  const [ip, dp] = Math.abs(n).toFixed(3).split(".");
  const formatted = ip.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${formatted}.${dp}`;
};

export function numberToFrenchWords(n: number): string {
  const intN = Math.floor(Math.abs(n));

  const ones = [
    "", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf",
    "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize",
    "dix-sept", "dix-huit", "dix-neuf",
  ];

  function below100(x: number): string {
    if (x < 20) return ones[x];
    const d = Math.floor(x / 10), u = x % 10;
    const t: Record<number, string> = { 2: "vingt", 3: "trente", 4: "quarante", 5: "cinquante", 6: "soixante" };
    if (d <= 6) return u === 0 ? t[d] : u === 1 ? `${t[d]}-et-un` : `${t[d]}-${ones[u]}`;
    if (d === 7) return u === 0 ? "soixante-dix" : u === 1 ? "soixante-et-onze" : `soixante-${ones[10 + u]}`;
    if (d === 8) return u === 0 ? "quatre-vingts" : `quatre-vingt-${ones[u]}`;
    return `quatre-vingt-${ones[10 + u]}`;
  }

  function below1000(x: number): string {
    if (x === 0) return "";
    if (x < 100) return below100(x);
    const h = Math.floor(x / 100), r = x % 100;
    if (r === 0) return h === 1 ? "cent" : `${ones[h]} cents`;
    return (h === 1 ? "cent" : `${ones[h]} cent`) + " " + below100(r);
  }

  function convert(x: number): string {
    if (x === 0) return "zéro";
    if (x >= 1_000_000) {
      const m = Math.floor(x / 1_000_000), r = x % 1_000_000;
      const mw = m === 1 ? "un million" : `${below1000(m)} millions`;
      return r > 0 ? `${mw} ${convert(r)}` : mw;
    }
    if (x >= 1000) {
      const k = Math.floor(x / 1000), r = x % 1000;
      const kw = k === 1 ? "mille" : `${below1000(k)} mille`;
      return r > 0 ? `${kw} ${below1000(r)}` : kw;
    }
    return below1000(x);
  }

  if (intN === 0) return "Zéro";
  const w = convert(intN);
  return w.charAt(0).toUpperCase() + w.slice(1);
}
