import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressStats } from '../../components/ProgressStats';
import { type ProgressSummary } from '../../services/progress';

describe('ProgressStats', () => {
  it('renders all stat cards with correct values', () => {
    const summary: ProgressSummary = {
      totalResources: 10,
      completedCount: 5,
      inProgressCount: 3,
      notStartedCount: 2,
      totalTimeSpent: 120,
      completionPercentage: 50,
    };

    render(<ProgressStats summary={summary} />);

    expect(screen.getByText(/Completion/i)).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();

    expect(screen.getByText(/Completed/i)).toBeInTheDocument();
    expect(screen.getByText('5 / 10')).toBeInTheDocument();

    expect(screen.getByText(/In Progress/i)).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    expect(screen.getByText(/Time Spent/i)).toBeInTheDocument();
    expect(screen.getByText('2h')).toBeInTheDocument();
  });

  it('formats time correctly for various durations', () => {
    const testCases = [
      { minutes: 0, expected: '0h 0m' },
      { minutes: 30, expected: '30m' },
      { minutes: 60, expected: '1h' },
      { minutes: 90, expected: '1h 30m' },
      { minutes: 125, expected: '2h 5m' },
    ];

    testCases.forEach(({ minutes, expected }) => {
      const summary: ProgressSummary = {
        totalResources: 1,
        completedCount: 0,
        inProgressCount: 0,
        notStartedCount: 1,
        totalTimeSpent: minutes,
        completionPercentage: 0,
      };

      const { unmount } = render(<ProgressStats summary={summary} />);
      expect(screen.getByText(expected)).toBeInTheDocument();
      unmount();
    });
  });

  it('displays 0% completion when no resources completed', () => {
    const summary: ProgressSummary = {
      totalResources: 5,
      completedCount: 0,
      inProgressCount: 2,
      notStartedCount: 3,
      totalTimeSpent: 0,
      completionPercentage: 0,
    };

    render(<ProgressStats summary={summary} />);

    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('0 / 5')).toBeInTheDocument();
  });

  it('displays 100% completion when all resources completed', () => {
    const summary: ProgressSummary = {
      totalResources: 5,
      completedCount: 5,
      inProgressCount: 0,
      notStartedCount: 0,
      totalTimeSpent: 300,
      completionPercentage: 100,
    };

    render(<ProgressStats summary={summary} />);

    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('5 / 5')).toBeInTheDocument();
  });

  it('uses custom totalTimeSpent prop when provided', () => {
    const summary: ProgressSummary = {
      totalResources: 5,
      completedCount: 2,
      inProgressCount: 1,
      notStartedCount: 2,
      totalTimeSpent: 60, // This should be overridden
      completionPercentage: 40,
    };

    render(<ProgressStats summary={summary} totalTimeSpent={180} />);

    expect(screen.getByText('3h')).toBeInTheDocument();
  });
});
