import { render } from '@testing-library/react-native';

import { ProgressBar } from '@/src/components/ProgressBar';

describe('ProgressBar', () => {
  it('renders without throwing', () => {
    const { toJSON } = render(<ProgressBar value={30} max={100} />);
    expect(toJSON()).toBeTruthy();
  });
});
