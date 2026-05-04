import { formatCurrency } from '@/src/utils/currency';

describe('formatCurrency', () => {
  it('formats finite amounts', () => {
    const s = formatCurrency(1500, 'NGN');
    expect(s.replace(/\D/g, '')).toMatch(/1500/);
  });

  it('treats non-finite as zero', () => {
    expect(formatCurrency(Number.NaN)).toMatch(/0/);
    expect(formatCurrency(Number.POSITIVE_INFINITY)).toMatch(/0/);
  });
});
