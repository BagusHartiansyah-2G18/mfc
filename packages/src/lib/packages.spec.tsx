import { render } from '@testing-library/react';

import OrgPackages from './packages';

describe('OrgPackages', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<OrgPackages />);
    expect(baseElement).toBeTruthy();
  });
});
