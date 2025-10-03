import { render, screen } from '@testing-library/react';
import RootLayout from '../layout';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

describe('RootLayout', () => {
  it('renders children correctly', () => {
    render(
      <RootLayout>
        <div>Test content</div>
      </RootLayout>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders with correct HTML structure', () => {
    render(
      <RootLayout>
        <div>Test content</div>
      </RootLayout>
    );

    // Check that the main element is present
    expect(screen.getByRole('main')).toBeInTheDocument();

    // Check that the main element has the correct classes
    const mainElement = screen.getByRole('main');
    expect(mainElement).toHaveClass('min-h-screen', 'bg-gradient-to-br');
  });
});
