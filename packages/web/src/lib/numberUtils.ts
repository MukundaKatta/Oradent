export function formatCompactNumber(n: number): string {
  if (Math.abs(n) < 1000) return String(n);

  const tiers = [
    { threshold: 1e12, suffix: 'T' },
    { threshold: 1e9, suffix: 'B' },
    { threshold: 1e6, suffix: 'M' },
    { threshold: 1e3, suffix: 'K' },
  ];

  for (const tier of tiers) {
    if (Math.abs(n) >= tier.threshold) {
      const scaled = n / tier.threshold;
      const formatted = scaled % 1 === 0 ? String(scaled) : scaled.toFixed(1);
      return `${formatted}${tier.suffix}`;
    }
  }

  return String(n);
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
