import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ErrorBoundary } from '../../components/ErrorBoundary';

// Component that throws on demand, controlled via a prop
function BrokenComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>Child content rendered successfully</div>;
}

// Simple component that renders normally
function WorkingComponent() {
  return <div>Working content</div>;
}

// Helper to render with MemoryRouter (ErrorBoundary uses Link from react-router-dom)
function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('ErrorBoundary', () => {
  // Suppress React's error output during tests that intentionally throw
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('normal rendering', () => {
    it('renders children when no error occurs', () => {
      renderWithRouter(
        <ErrorBoundary>
          <WorkingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Working content')).toBeInTheDocument();
    });

    it('does not show error UI when children render successfully', () => {
      renderWithRouter(
        <ErrorBoundary>
          <WorkingComponent />
        </ErrorBoundary>
      );

      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
    });
  });

  describe('error catching', () => {
    it('displays fallback UI when a child component throws', () => {
      renderWithRouter(
        <ErrorBoundary>
          <BrokenComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('shows the error message in the fallback UI', () => {
      renderWithRouter(
        <ErrorBoundary>
          <BrokenComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('shows a "Try Again" button in the fallback UI', () => {
      renderWithRouter(
        <ErrorBoundary>
          <BrokenComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('shows a "Go Home" link in the fallback UI', () => {
      renderWithRouter(
        <ErrorBoundary>
          <BrokenComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByRole('link', { name: /go home/i })).toBeInTheDocument();
    });

    it('"Go Home" link points to the root path', () => {
      renderWithRouter(
        <ErrorBoundary>
          <BrokenComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      const link = screen.getByRole('link', { name: /go home/i });
      expect(link).toHaveAttribute('href', '/');
    });

    it('hides children when in error state', () => {
      renderWithRouter(
        <ErrorBoundary>
          <BrokenComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.queryByText('Child content rendered successfully')).not.toBeInTheDocument();
    });

    it('logs the error to console.error', () => {
      renderWithRouter(
        <ErrorBoundary>
          <BrokenComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('"Try Again" button', () => {
    it('clears the error state and re-renders children when clicked', () => {
      // Use a module-level ref to control whether the child throws.
      // After the boundary catches the error, we flip the flag and click
      // "Try Again" — the boundary resets and the child renders normally.
      let shouldThrowRef = { current: true };

      function ControlledBrokenComponent() {
        if (shouldThrowRef.current) {
          throw new Error('Controlled error');
        }
        return <div>Recovered successfully</div>;
      }

      renderWithRouter(
        <ErrorBoundary>
          <ControlledBrokenComponent />
        </ErrorBoundary>
      );

      // Error UI is shown
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      // Stop the component from throwing before we reset
      shouldThrowRef.current = false;

      // Click "Try Again" to reset the error boundary
      fireEvent.click(screen.getByRole('button', { name: /try again/i }));

      expect(screen.getByText('Recovered successfully')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });

    it('shows error UI again if child throws again after reset', () => {
      renderWithRouter(
        <ErrorBoundary>
          <BrokenComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /try again/i }));

      // BrokenComponent still throws, so the boundary should catch again
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('custom fallback prop', () => {
    it('renders the custom fallback instead of default UI when provided', () => {
      const customFallback = <div>Custom error UI</div>;

      renderWithRouter(
        <ErrorBoundary fallback={customFallback}>
          <BrokenComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error UI')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });

    it('does not render custom fallback when children succeed', () => {
      const customFallback = <div>Custom error UI</div>;

      renderWithRouter(
        <ErrorBoundary fallback={customFallback}>
          <WorkingComponent />
        </ErrorBoundary>
      );

      expect(screen.queryByText('Custom error UI')).not.toBeInTheDocument();
      expect(screen.getByText('Working content')).toBeInTheDocument();
    });

    it('renders custom fallback for a null-ish but defined value', () => {
      renderWithRouter(
        <ErrorBoundary fallback={<span>Minimal fallback</span>}>
          <BrokenComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Minimal fallback')).toBeInTheDocument();
    });
  });
});
