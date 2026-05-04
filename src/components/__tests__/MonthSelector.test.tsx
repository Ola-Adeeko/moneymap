import { fireEvent, render, screen } from '@testing-library/react-native';

import { MonthSelector } from '@/src/components/MonthSelector';

describe('MonthSelector', () => {
  it('calls onPrev and onNext', () => {
    const onPrev = jest.fn();
    const onNext = jest.fn();
    render(<MonthSelector monthKey="2026-01" onPrev={onPrev} onNext={onNext} />);
    fireEvent.press(screen.getByLabelText('Previous month'));
    fireEvent.press(screen.getByLabelText('Next month'));
    expect(onPrev).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
  });
});
