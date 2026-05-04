export const toMonthKey = (date: string | Date) => {
  const parsed = typeof date === 'string' ? new Date(date) : date;
  return `${parsed.getFullYear()}-${`${parsed.getMonth() + 1}`.padStart(2, '0')}`;
};

export const monthLabel = (monthKey: string) => {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
};

export const currentMonthKey = () => toMonthKey(new Date());
