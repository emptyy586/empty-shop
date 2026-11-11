const intFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const decimalFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function formatMoney(value) {
  const amount = Number(value);
  const num = Number.isFinite(amount) ? amount : 0;
  return Number.isInteger(num) ? intFormatter.format(num) : decimalFormatter.format(num);
}
