function toNum(v) {
  return Number(v || 0);
}

function round(v, digits = 2) {
  const n = toNum(v);
  return Math.round(n * Math.pow(10, digits)) / Math.pow(10, digits);
}

// Prisma returns Decimal objects -> convert to plain numbers in JSON
// Keys are converted to snake_case to match the legacy Flask API + frontend.
function snake(key) {
  return key.replace(/[A-Z]/g, (m) => '_' + m.toLowerCase());
}

function serialize(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return Number(obj);
  if (typeof obj === 'object') {
    if (typeof obj.toNumber === 'function') return toNum(obj);
    if (obj instanceof Date) return obj.toISOString();
    if (Array.isArray(obj)) return obj.map(serialize);
    const out = {};
    for (const key of Object.keys(obj)) out[snake(key)] = serialize(obj[key]);
    return out;
  }
  return obj;
}

function todayDate() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function monthStart() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function toISO(d) {
  if (!d) return null;
  if (typeof d === 'string') return d;
  return d.toISOString();
}

module.exports = { toNum, round, serialize, todayDate, monthStart, toISO };
