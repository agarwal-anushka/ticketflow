import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, test, expect } from 'vitest';
import TicketCard from '../components/tickets/TicketCard';

const ticket = {
  id: 1,
  title: 'Login page is broken',
  priority: 'high',
  assignee_name: 'Priya',
};

function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('TicketCard', () => {
  test('renders the ticket title as a link', () => {
    renderWithRouter(<TicketCard ticket={ticket} />);
    const link = screen.getByRole('link', { name: /login page is broken/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/tickets/1');
  });

    test('shows assignee name when present', () => {
    renderWithRouter(<TicketCard ticket={ticket} />);
    expect(screen.getByText('Priya')).toBeInTheDocument();
  });

  test('shows an em dash when no assignee', () => {
    renderWithRouter(<TicketCard ticket={{ ...ticket, assignee_name: null }} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
