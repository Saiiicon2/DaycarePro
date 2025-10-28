export function formatCurrency(value: number | string | undefined | null) {
  const n = Number(value ?? 0);
  try {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 2 }).format(n);
  } catch (e) {
    return `R${n.toFixed(2)}`;
  }
}
