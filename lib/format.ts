const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const integer = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

export function formatInrFromPaise(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "--";
  return inr.format(value / 100);
}

export function formatInr(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "--";
  return inr.format(value);
}

export function formatInteger(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "--";
  return integer.format(value);
}

export function formatPercentFromBps(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "--";
  return `${(value / 100).toFixed(value % 100 === 0 ? 0 : 2)}%`;
}

export function shortenHex(value: string, head = 6, tail = 4) {
  if (!value || value.length <= head + tail + 1) return value || "--";
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

export function todayAsEpochDay() {
  return Math.floor(Date.now() / 86_400_000);
}

