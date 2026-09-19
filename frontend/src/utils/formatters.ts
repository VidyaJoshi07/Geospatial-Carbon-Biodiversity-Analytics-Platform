export function formatNumber(value: number | undefined | null, decimals: number = 0): string {
  if (value === undefined || value === null || isNaN(value)) return '0';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatHectares(ha: number | undefined | null): string {
  if (ha === undefined || ha === null || isNaN(ha)) return '0 ha';
  return `${formatNumber(ha, 2)} ha`;
}

export function formatCarbon(val: number | undefined | null): string {
  if (val === undefined || val === null || isNaN(val)) return '0 tCO₂e';
  return `${formatNumber(val, 1)} tCO₂e`;
}

export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}
