export const formatTND = (n: number) =>
  new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .format(n)
    .replace(/\u202f/g, " ") + " TND";

export const formatKg = (n: number) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(n).replace(/\u202f/g, " ") + " kg";

export const formatNumber = (n: number) =>
  new Intl.NumberFormat("fr-FR").format(n).replace(/\u202f/g, " ");

export const formatDate = (d: Date | string) => {
  const date = typeof d === "string" ? new Date(d) : d;
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};