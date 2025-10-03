import { render, screen } from '@testing-library/react';
import Home from '../page';

describe('Home Page', () => {
  it('renders the main heading', () => {
    render(<Home />);

    const heading = screen.getByRole('heading', {
      name: /welcome to next\.js/i,
    });

    expect(heading).toBeInTheDocument();
  });

  it('renders the hero description', () => {
    render(<Home />);

    const description = screen.getByText(/a modern, full-stack template/i);

    expect(description).toBeInTheDocument();
  });

  it('renders all feature cards', () => {
    render(<Home />);

    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Testing Ready')).toBeInTheDocument();
    expect(screen.getByText('Modern UI')).toBeInTheDocument();
  });

  it('renders CTA buttons', () => {
    render(<Home />);

    expect(
      screen.getByRole('button', { name: 'Get Started' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'View Documentation' })
    ).toBeInTheDocument();
  });
});
