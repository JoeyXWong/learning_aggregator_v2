import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NotFoundPage } from '../../pages/NotFoundPage';

describe('NotFoundPage', () => {
  const renderWithRouter = () => {
    return render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>
    );
  };

  it('shows 404 message', () => {
    renderWithRouter();

    expect(screen.getByText(/404/i)).toBeInTheDocument();
    expect(screen.getByText(/Page Not Found/i)).toBeInTheDocument();
  });

  it('has link to home page', () => {
    renderWithRouter();

    const homeLink = screen.getByRole('link', { name: /Go Back Home/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });
});
