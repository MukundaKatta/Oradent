export function toCSV(data: Record<string, unknown>[], columns?: { key: string; header: string }[]): string {
  if (data.length === 0) return '';
  const cols = columns || Object.keys(data[0]).map(k => ({ key: k, header: k }));
  const header = cols.map(c => `"${c.header}"`).join(',');
  const rows = data.map(row => cols.map(c => {
    const val = row[c.key];
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  }).join(','));
  return [header, ...rows].join('\n');
}
