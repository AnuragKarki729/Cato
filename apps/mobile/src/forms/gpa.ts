export function normalizeGpaInput(value: string) {
  const cleaned = value.replace(/[^\d.]/g, '');
  const [wholePart = '', ...decimalParts] = cleaned.split('.');
  const normalizedWhole = wholePart.slice(0, 1);
  const normalizedDecimal = decimalParts.join('').slice(0, 2);
  const hasDecimal = cleaned.includes('.');
  const normalized = hasDecimal ? `${normalizedWhole || '0'}.${normalizedDecimal}` : normalizedWhole;
  const parsed = Number(normalized);

  if (Number.isFinite(parsed) && parsed > 4) {
    return '4.00';
  }

  return normalized;
}

export function formatGpaInput(value: string) {
  if (!value.trim()) {
    return '';
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return '';
  }

  return Math.min(4, Math.max(0, parsed)).toFixed(2);
}

export function parseGpaForSave(value: string) {
  const formatted = formatGpaInput(value);

  if (!formatted) {
    return undefined;
  }

  return Number(formatted);
}
