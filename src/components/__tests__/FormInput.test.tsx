import { render, screen } from '@testing-library/react-native';

import { FormInput } from '@/src/components/FormInput';

describe('FormInput', () => {
  it('renders label and error', () => {
    render(<FormInput label="Name" value="" onChangeText={() => {}} error="Required" />);
    expect(screen.getByText('Name')).toBeTruthy();
    expect(screen.getByText('Required')).toBeTruthy();
  });
});
