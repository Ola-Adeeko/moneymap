import { currentMonthKey, monthLabel, toMonthKey } from '@/src/utils/month';

describe('toMonthKey', () => {
  it('formats Date to YYYY-MM', () => {
    expect(toMonthKey(new Date(2026, 4, 3))).toBe('2026-05');
  });
});

describe('monthLabel', () => {
  it('returns a human label including the year', () => {
    const label = monthLabel('2026-03');
    expect(label).toMatch(/2026/);
  });
});

describe('currentMonthKey', () => {
  it('matches toMonthKey for now', () => {
    expect(currentMonthKey()).toBe(toMonthKey(new Date()));
  });
});
